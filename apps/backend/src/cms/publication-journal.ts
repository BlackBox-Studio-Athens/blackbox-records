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
  stage: z.string().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  requestedAt: z.number().int().nonnegative(),
  completedAt: z.number().int().nonnegative().nullable().optional(),
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
    requested_revision AS requestedRevision, requested_at AS requestedAt, completed_at AS completedAt, status, stage, failure_code AS failureReason,
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
      'SELECT id, status, requested_at AS requestedAt, completed_at AS completedAt, stage, failure_code AS failureReason FROM _blackbox_publications WHERE environment = ? ORDER BY rowid DESC LIMIT 10',
    )
    .bind(environment)
    .all();
  const summary = publicationSchema
    .pick({ id: true, status: true, requestedAt: true, completedAt: true })
    .extend({ stage: z.string().nullable(), failureReason: z.string().nullable() });
  return results.map((item) => publicationSummary(summary.parse(item)));
}

export const publicationHistoryQuery = z
  .object({
    cursor: z.coerce.number().int().positive().optional(),
    collection: z
      .string()
      .regex(/^[a-z_]+$/)
      .optional(),
    recordId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .optional(),
  })
  .strict()
  .refine((q) => Boolean(q.collection) === Boolean(q.recordId));

export async function readPublicationHistory(
  db: D1Database,
  environment: 'local' | 'uat' | 'prd',
  query: z.infer<typeof publicationHistoryQuery>,
) {
  const { results } = await db
    .prepare(
      `SELECT rowid AS cursor, id, actor_email AS actorEmail,
    requested_at AS requestedAt, completed_at AS completedAt, status, stage, failure_code AS failureReason, request_json AS requestJson
    FROM _blackbox_publications WHERE environment = ? AND (? IS NULL OR rowid < ?)
    AND (? IS NULL OR EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(request_json, '$.records') = 'array'
      THEN json_extract(request_json, '$.records') ELSE json_array(json(request_json)) END)
      WHERE json_extract(value, '$.collection') = ? AND json_extract(value, '$.recordId') = ?))
    ORDER BY rowid DESC LIMIT 21`,
    )
    .bind(
      environment,
      query.cursor ?? null,
      query.cursor ?? null,
      query.collection ?? null,
      query.collection ?? null,
      query.recordId ?? null,
    )
    .all<{
      cursor: number;
      id: string;
      actorEmail: string;
      requestedAt: number;
      completedAt: number | null;
      status: 'pending' | 'live' | 'failed';
      stage: string | null;
      failureReason: string | null;
      requestJson: string | null;
    }>();
  const items = results.slice(0, 20).map((row) => {
    const intent = row.requestJson ? JSON.parse(row.requestJson) : null;
    const entries = intent
      ? (intent.records ?? [intent]).map((entry: { collection?: string; recordId?: string; title?: string }) => ({
          collection: entry.collection,
          recordId: entry.recordId,
          title: entry.title ?? 'Title unavailable for this earlier update',
        }))
      : [];
    return {
      ...publicationSummary(row),
      actorEmail: row.actorEmail,
      environment,
      entries,
      action: intent?.action === 'withdraw' ? ('withdraw' as const) : ('publish' as const),
    };
  });
  return { items, ...(results.length > 20 ? { nextCursor: String(results[19].cursor) } : {}) };
}

export function publicationSummary(item: {
  id: string;
  status: 'pending' | 'live' | 'failed';
  requestedAt: number;
  completedAt?: number | null;
  stage?: string | null;
  failureReason?: string | null;
}) {
  return {
    id: item.id,
    status: item.status,
    requestedAt: item.requestedAt,
    ...(typeof item.completedAt === 'number' ? { completedAt: item.completedAt } : {}),
    ...(item.stage ? { stage: item.stage } : {}),
    ...(item.status === 'failed'
      ? {
          failureReason:
            item.failureReason ??
            'Publication did not finish. Ask a label administrator to check the publication before trying again.',
        }
      : {}),
  };
}

export async function readNextLocalPublication(db: D1Database) {
  const row = await db
    .prepare(
      "SELECT id, requested_revision AS revision FROM _blackbox_publications WHERE environment = 'local' AND status = 'pending' ORDER BY rowid DESC LIMIT 1",
    )
    .first();
  return row
    ? requestSchema.pick({ id: true }).extend({ revision: requestSchema.shape.requestedRevision }).parse(row)
    : null;
}

export async function acknowledgeLocalPublication(db: D1Database, id: string, snapshotSha256?: string) {
  z.uuid().parse(id);
  if (snapshotSha256 !== undefined) {
    z.string()
      .regex(/^[a-f0-9]{64}$/)
      .parse(snapshotSha256);
    await db.batch([
      db
        .prepare(
          `UPDATE _blackbox_publications SET status = 'live', completed_at = COALESCE(completed_at, ?), snapshot_sha256 = ?
        WHERE id = ? AND environment = 'local' AND status = 'pending'
        AND NOT EXISTS (SELECT 1 FROM _blackbox_publications newer WHERE newer.environment = 'local'
          AND newer.status = 'live' AND newer.rowid > (SELECT rowid FROM _blackbox_publications WHERE id = ?))`,
        )
        .bind(Date.now(), snapshotSha256, id, id),
      db
        .prepare(
          `UPDATE _blackbox_publications SET status = 'failed'
        WHERE environment = 'local' AND status = 'pending' AND rowid <
          (SELECT rowid FROM _blackbox_publications WHERE id = ? AND environment = 'local'
            AND status = 'live' AND snapshot_sha256 = ?)`,
        )
        .bind(id, snapshotSha256),
    ]);
  } else {
    await db
      .prepare(
        "UPDATE _blackbox_publications SET status = 'failed' WHERE id = ? AND environment = 'local' AND status = 'pending'",
      )
      .bind(id)
      .run();
  }
  const item = await readPublication(db, 'local', id);
  return snapshotSha256 === undefined
    ? item?.status === 'failed'
    : item?.status === 'live' && item.snapshotSha256 === snapshotSha256;
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
