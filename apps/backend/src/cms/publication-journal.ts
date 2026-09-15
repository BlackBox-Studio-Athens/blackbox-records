import { z } from 'zod';

export class PublicationRequestConflictError extends Error {
  constructor() {
    super('Publication request conflicts with an existing request.');
  }
}

const environmentSchema = z.enum(['local', 'uat', 'prd']);
const requestSchema = z
  .object({
    id: z.uuid(),
    environment: environmentSchema,
    actorEmail: z.email().max(254),
    requestedRevision: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  })
  .strict();
const publicationSchema = requestSchema.extend({
  requestedAt: z.number().int().nonnegative(),
  status: z.enum(['pending', 'live', 'failed']),
  snapshotSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
  codeSha: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .nullable(),
  ciRunId: z.string().min(1).nullable(),
  deploymentId: z.string().min(1).nullable(),
});

export async function readPublication(db: D1Database, environment: 'local' | 'uat' | 'prd', id: string) {
  environmentSchema.parse(environment);
  z.uuid().parse(id);
  const row = await db
    .prepare(
      `SELECT id, environment, actor_email AS actorEmail,
    requested_revision AS requestedRevision, requested_at AS requestedAt, status,
    snapshot_sha256 AS snapshotSha256, code_sha AS codeSha, ci_run_id AS ciRunId, deployment_id AS deploymentId
    FROM _blackbox_publications WHERE id = ? AND environment = ?`,
    )
    .bind(id, environment)
    .first();
  return row ? publicationSchema.parse(row) : null;
}

export async function readRecentPublications(db: D1Database, environment: 'local' | 'uat' | 'prd') {
  environmentSchema.parse(environment);
  const { results } = await db
    .prepare(
      'SELECT id, status, requested_at AS requestedAt FROM _blackbox_publications WHERE environment = ? ORDER BY rowid DESC LIMIT 10',
    )
    .bind(environment)
    .all();
  const summary = publicationSchema.pick({ id: true, status: true, requestedAt: true });
  return results.map((item) => summary.parse(item));
}

// Callers supply verified actor/target/revision identities, never an unchecked browser payload.
export async function requestPublication(db: D1Database, input: z.input<typeof requestSchema>) {
  const request = requestSchema.parse(input);
  await db
    .prepare(
      `INSERT INTO _blackbox_publications
    (id, environment, actor_email, requested_revision, requested_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`,
    )
    .bind(request.id, request.environment, request.actorEmail, request.requestedRevision, Date.now())
    .run();
  const saved = await readPublication(db, request.environment, request.id);
  if (!saved || saved.actorEmail !== request.actorEmail || saved.requestedRevision !== request.requestedRevision)
    throw new PublicationRequestConflictError();
  return saved;
}

// One attempt per target every five minutes. A lost dispatch response leaves the request pending.
export async function claimPublicationDispatch(db: D1Database, environment: 'local' | 'uat' | 'prd', now = Date.now()) {
  environmentSchema.parse(environment);
  z.number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER - 300_000)
    .parse(now);
  const row = await db
    .prepare(
      `UPDATE _blackbox_publications SET dispatch_token = ?, dispatch_after = ?
      WHERE id = (SELECT id FROM _blackbox_publications WHERE environment = ? ORDER BY rowid DESC LIMIT 1)
      AND environment = ? AND status = 'pending' AND ci_run_id IS NULL AND dispatch_after <= ?
      AND NOT EXISTS (SELECT 1 FROM _blackbox_publications
        WHERE environment = ? AND status = 'pending' AND dispatch_after > ?)
      RETURNING id, environment, requested_revision AS requestedRevision, dispatch_token AS dispatchToken`,
    )
    .bind(crypto.randomUUID(), now + 300_000, environment, environment, now, environment, now)
    .first();
  if (row)
    await db
      .prepare(
        `UPDATE _blackbox_publications SET status = 'failed'
    WHERE environment = ? AND status = 'pending' AND ci_run_id IS NULL
    AND rowid < (SELECT rowid FROM _blackbox_publications WHERE id = ? AND environment = ?)`,
      )
      .bind(environment, (row as { id: string }).id, environment)
      .run();
  return row ? requestSchema.omit({ actorEmail: true }).extend({ dispatchToken: z.uuid() }).parse(row) : null;
}

// Acknowledged dispatches get one hour for CI to start; this never marks the publication Live.
export async function acknowledgePublicationDispatch(
  db: D1Database,
  claim: { id: string; environment: 'local' | 'uat' | 'prd'; dispatchToken: string },
  now = Date.now(),
) {
  const value = requestSchema.pick({ id: true, environment: true }).extend({ dispatchToken: z.uuid() }).parse({
    id: claim.id,
    environment: claim.environment,
    dispatchToken: claim.dispatchToken,
  });
  z.number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER - 3_600_000)
    .parse(now);
  await db
    .prepare(
      `UPDATE _blackbox_publications SET dispatch_after = ?
    WHERE id = ? AND environment = ? AND dispatch_token = ? AND status = 'pending'
    AND ci_run_id IS NULL AND dispatch_after > ?`,
    )
    .bind(now + 3_600_000, value.id, value.environment, value.dispatchToken, now)
    .run();
}

// Only a verified workflow identity may call this; a dispatch token is not authentication.
export async function bindPublicationRun(
  db: D1Database,
  input: { id: string; environment: 'local' | 'uat' | 'prd'; dispatchToken: string; ciRunId: string; codeSha: string },
  now = Date.now(),
) {
  const value = requestSchema
    .pick({ id: true, environment: true })
    .extend({
      dispatchToken: z.uuid(),
      ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/),
      codeSha: z.string().regex(/^[a-f0-9]{40}$/),
    })
    .parse(input);
  z.number().int().nonnegative().safe().parse(now);
  const result = await db
    .prepare(
      `UPDATE _blackbox_publications SET ci_run_id = ?, code_sha = ?, dispatch_after = ?
      WHERE id = ? AND environment = ? AND dispatch_token = ? AND status = 'pending'
      AND ((ci_run_id = ? AND code_sha = ?) OR (ci_run_id IS NULL AND code_sha IS NULL AND dispatch_after > ?))`,
    )
    .bind(
      value.ciRunId,
      value.codeSha,
      now,
      value.id,
      value.environment,
      value.dispatchToken,
      value.ciRunId,
      value.codeSha,
      now,
    )
    .run();
  return result.meta.changes === 1;
}

// Bind only after completeSnapshot has verified and stored the immutable manifest.
export async function bindPublicationSnapshot(
  db: D1Database,
  input: { id: string; environment: 'local' | 'uat' | 'prd'; ciRunId: string; snapshotSha256: string },
) {
  const value = publicationSchema
    .pick({ id: true, environment: true })
    .extend({
      ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/),
      snapshotSha256: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .parse(input);
  const result = await db
    .prepare(
      `UPDATE _blackbox_publications SET snapshot_sha256 = ?
    WHERE id = ? AND environment = ? AND ci_run_id = ? AND status = 'pending'
    AND (snapshot_sha256 IS NULL OR snapshot_sha256 = ?)`,
    )
    .bind(value.snapshotSha256, value.id, value.environment, value.ciRunId, value.snapshotSha256)
    .run();
  return result.meta.changes === 1;
}

export const publicationCompletionSchema = requestSchema.pick({ id: true, environment: true }).extend({
  ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/),
  codeSha: z.string().regex(/^[a-f0-9]{40}$/),
  snapshotSha256: z.string().regex(/^[a-f0-9]{64}$/),
  deploymentId: z.uuid(),
});

// Preserve the authenticated workflow receipt before checking edge propagation so the scheduler can retry.
export async function recordPublicationDeployment(db: D1Database, input: z.input<typeof publicationCompletionSchema>) {
  const value = publicationCompletionSchema.parse(input);
  const result = await db
    .prepare(
      `UPDATE _blackbox_publications SET deployment_id = ?
    WHERE id = ? AND environment = ? AND status = 'pending' AND ci_run_id = ? AND code_sha = ?
    AND snapshot_sha256 = ? AND (deployment_id IS NULL OR deployment_id = ?)`,
    )
    .bind(
      value.deploymentId,
      value.id,
      value.environment,
      value.ciRunId,
      value.codeSha,
      value.snapshotSha256,
      value.deploymentId,
    )
    .run();
  return result.meta.changes === 1;
}

export async function claimPublicationReconciliation(
  db: D1Database,
  environment: 'local' | 'uat' | 'prd',
  now = Date.now(),
) {
  environmentSchema.parse(environment);
  z.number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER - 300_000)
    .parse(now);
  const row = await db
    .prepare(
      `UPDATE _blackbox_publications SET dispatch_after = ?
    WHERE id = (SELECT id FROM _blackbox_publications WHERE environment = ? AND status = 'pending'
      AND ci_run_id IS NOT NULL AND dispatch_after <= ? ORDER BY rowid LIMIT 1)
    AND environment = ? AND status = 'pending' AND dispatch_after <= ? RETURNING id`,
    )
    .bind(now + 300_000, environment, now, environment, now)
    .first<{ id: string }>();
  return row ? readPublication(db, environment, row.id) : null;
}

export async function failPublicationRun(
  db: D1Database,
  environment: 'local' | 'uat' | 'prd',
  id: string,
  ciRunId: string,
) {
  const value = publicationCompletionSchema
    .pick({ environment: true, id: true, ciRunId: true })
    .parse({ environment, id, ciRunId });
  await db
    .prepare(
      `UPDATE _blackbox_publications SET status = 'failed'
    WHERE id = ? AND environment = ? AND ci_run_id = ? AND status = 'pending'`,
    )
    .bind(value.id, value.environment, value.ciRunId)
    .run();
}

// The caller verifies the public deployment first. Older acknowledgements cannot replace a newer Live record.
export async function completePublication(
  db: D1Database,
  input: z.input<typeof publicationCompletionSchema>,
  coveredRevisions: string[] = [],
) {
  const value = publicationCompletionSchema.parse(input);
  const revisions = z.array(z.string().min(1).max(128)).max(1000).parse(coveredRevisions);
  const selected = db
    .prepare(
      `UPDATE _blackbox_publications SET status = 'live', deployment_id = ?
    WHERE id = ? AND environment = ? AND status = 'pending'
    AND ci_run_id = ? AND code_sha = ? AND snapshot_sha256 = ?
    AND NOT EXISTS (SELECT 1 FROM _blackbox_publications AS newer
      WHERE newer.environment = ? AND newer.status = 'live'
      AND newer.rowid > _blackbox_publications.rowid)`,
    )
    .bind(
      value.deploymentId,
      value.id,
      value.environment,
      value.ciRunId,
      value.codeSha,
      value.snapshotSha256,
      value.environment,
    );
  const covered = db
    .prepare(
      `UPDATE _blackbox_publications
    SET status = 'live', deployment_id = ?, ci_run_id = ?, code_sha = ?, snapshot_sha256 = ?
    WHERE environment = ? AND status IN ('pending', 'failed') AND (ci_run_id IS NULL OR status = 'failed')
    AND requested_revision IN (SELECT value FROM json_each(?))
    AND rowid < (SELECT rowid FROM _blackbox_publications AS selected WHERE id = ? AND environment = ?
      AND status = 'live' AND deployment_id = ?
      AND NOT EXISTS (SELECT 1 FROM _blackbox_publications AS newer
        WHERE newer.environment = selected.environment AND newer.status = 'live' AND newer.rowid > selected.rowid))`,
    )
    .bind(
      value.deploymentId,
      value.ciRunId,
      value.codeSha,
      value.snapshotSha256,
      value.environment,
      JSON.stringify(revisions),
      value.id,
      value.environment,
      value.deploymentId,
    );
  const [result] = await db.batch([selected, covered]);
  return result.meta.changes === 1;
}
