import { z } from 'zod';
import type { EmDashRuntime } from 'emdash/middleware';
import {
  contentMediaIds,
  isCmsCollection,
  validateCmsRevisionContent,
  replacePublishedRecord,
  type ContentSnapshot,
  publicationRecordSchema,
  publicationReviewSchema,
} from '@blackbox/content-model';
import {
  activatePublication,
  readPublicationPointer,
  readPublishedSnapshot,
  type PublicationEnvironment,
} from './published-storage';
import { storeSnapshotMedia } from './snapshot-storage';
import { validateImage } from './media-upload';
import { readPublicationCatalog } from './item-publication-recovery';
import { publicationSummary, readPublication } from './publication-journal';
import { reviewPublication } from './publication-review';
import { projectPublicationStoreItems, readPublicationMedia } from './publication-projection';

const identifier = publicationRecordSchema.shape.recordId;
const selectedRecordSchema = publicationRecordSchema;
const baselineSchema = publicationReviewSchema.shape.baseline;
const batchSchema = z
  .object({ id: z.uuid(), records: z.array(selectedRecordSchema).min(1).max(20), baseline: baselineSchema })
  .strict();
export const selectedPublicationSchema = z
  .union([
    batchSchema,
    selectedRecordSchema.extend({ id: z.uuid() }).transform(({ id, ...record }) => ({ id, records: [record] })),
  ])
  .refine(
    ({ records }) =>
      new Set(records.map((record) => `${record.collection}/${record.recordId}`)).size === records.length,
    'Select each record once.',
  );
const intentSchema = z.union([
  z.object({
    id: z.uuid(),
    baseline: baselineSchema,
    records: z
      .array(selectedRecordSchema.extend({ revisionId: identifier, title: z.string().optional() }))
      .min(1)
      .max(20),
  }),
  selectedRecordSchema
    .extend({ id: z.uuid(), revisionId: identifier })
    .transform(({ id, ...record }) => ({ id, records: [record] })),
]);
type Dependencies = {
  db: D1Database;
  bucket: R2Bucket;
  commerce: D1Database;
  environment: PublicationEnvironment;
  renderer: Fetcher;
  runtime: EmDashRuntime;
  publicOrigin: string;
};
export class InvalidPublication extends Error {}

function successful<T>(result: { success: true; data: T } | { success: false; error: unknown }): T {
  if (!result.success) throw new InvalidPublication('Saved content is unavailable or has changed.');
  return result.data;
}

export async function acceptSelectedPublication(
  input: z.input<typeof selectedPublicationSchema>,
  actorEmail: string,
  deps: Pick<Dependencies, 'runtime' | 'db' | 'environment' | 'commerce'> & { bucket?: R2Bucket },
) {
  const selected = selectedPublicationSchema.parse(input);
  const existing = await deps.db
    .prepare('SELECT actor_email, request_json, environment FROM _blackbox_publications WHERE id = ?')
    .bind(selected.id)
    .first<{ actor_email: string; request_json: string | null; environment: string }>();
  if (existing) {
    if (existing.environment !== deps.environment || !existing.request_json)
      throw new InvalidPublication('Publication request conflicts with an existing request.');
    const retained = intentSchema.parse(JSON.parse(existing.request_json ?? 'null'));
    if (
      existing.actor_email !== actorEmail ||
      ('baseline' in selected ? selected.baseline : undefined) !==
        ('baseline' in retained ? retained.baseline : undefined) ||
      JSON.stringify(selected.records) !==
        JSON.stringify(
          retained.records.map(({ collection, recordId, expectedRevision }) => ({
            collection,
            recordId,
            expectedRevision,
          })),
        )
    )
      throw new InvalidPublication('Publication request conflicts with an existing request.');
    return publicationSummary((await readPublication(deps.db, deps.environment, selected.id))!);
  }
  const reviewedBaseline = 'baseline' in selected ? selected.baseline : undefined;
  if (reviewedBaseline) {
    if (!deps.bucket) throw new InvalidPublication('Publication review is unavailable.');
    try {
      const { review } = await reviewPublication(
        { records: selected.records, baseline: reviewedBaseline },
        { ...deps, bucket: deps.bucket },
      );
      if (review.dependencies.length || review.entries.some((entry) => entry.issues.length))
        throw new Error('Resolve publication issues and required drafts before publishing.');
    } catch (error) {
      throw new InvalidPublication(error instanceof Error ? error.message : 'Review changed.');
    }
  }
  const records = [];
  for (const record of selected.records) {
    const current = successful(await deps.runtime.handleContentGet(record.collection, record.recordId));
    if (current._rev !== record.expectedRevision)
      throw new InvalidPublication('Load the saved version before publishing.');
    const revisionId = current.item.draftRevisionId ?? current.item.liveRevisionId;
    if (!revisionId) throw new InvalidPublication('Save content before publishing.');
    const revision = successful(await deps.runtime.handleRevisionGet(revisionId)).item;
    const { _slug: _slug, ...content } = revision.data;
    if (!isCmsCollection(record.collection) || validateCmsRevisionContent(record.collection, content).length)
      throw new InvalidPublication('Complete the highlighted fields before publishing.');
    records.push({ ...record, revisionId, title: String(content.title ?? content.label_name ?? current.item.slug) });
  }
  const intent = { id: selected.id, records, ...(reviewedBaseline ? { baseline: reviewedBaseline } : {}) };
  const inserted = await deps.db
    .prepare(
      `INSERT INTO _blackbox_publications
      (id, environment, actor_email, requested_revision, requested_at, request_json, stage, ci_run_id)
      SELECT ?, ?, ?, ?, ?, ?, 'queued', 'runtime'
      WHERE NOT EXISTS (SELECT 1 FROM _blackbox_publications p
        WHERE p.environment = ? AND p.status = 'pending' AND p.request_json IS NOT NULL
        AND EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(p.request_json, '$.records') = 'array'
          THEN json_extract(p.request_json, '$.records') ELSE json_array(json(p.request_json)) END) r
          JOIN json_each(?) selected ON json_extract(selected.value, '$.collection') = json_extract(r.value, '$.collection')
          AND json_extract(selected.value, '$.recordId') = json_extract(r.value, '$.recordId')))
      ON CONFLICT(id) DO NOTHING`,
    )
    .bind(
      selected.id,
      deps.environment,
      actorEmail,
      records[0].revisionId,
      Date.now(),
      JSON.stringify(intent),
      deps.environment,
      JSON.stringify(selected.records),
    )
    .run();
  if (!inserted.meta.changes && !(await readPublication(deps.db, deps.environment, selected.id)))
    throw new InvalidPublication('These changes are already updating the website. Check status.');
  // Re-read the winning row, including when simultaneous callers used the same id.
  return acceptSelectedPublication(selected, actorEmail, deps);
}

async function baseline(deps: Dependencies) {
  const current = await readPublicationPointer(deps.bucket, deps.environment);
  if (current)
    return {
      ...current,
      snapshot: await readPublishedSnapshot(deps.bucket, deps.environment, current.pointer.snapshotSha256),
    };
  const prior = await deps.db
    .prepare(
      "SELECT id, snapshot_sha256 AS sha256, rowid AS generation FROM _blackbox_publications WHERE environment = ? AND status = 'live' ORDER BY rowid DESC LIMIT 1",
    )
    .bind(deps.environment)
    .first<{ id: string; sha256: string; generation: number }>();
  if (!prior) throw new InvalidPublication('Initialize published content before publishing.');
  return {
    pointer: { id: prior.id, snapshotSha256: prior.sha256, generation: prior.generation },
    etag: undefined,
    snapshot: await readPublishedSnapshot(deps.bucket, deps.environment, prior.sha256),
  };
}

export async function processRuntimePublication(deps: Dependencies) {
  const job = await deps.db
    .prepare(
      `SELECT id, requested_revision AS revisionId, request_json AS requestJson, rowid AS generation, attempts, snapshot_sha256 AS snapshotSha256, code_sha AS codeSha
    FROM _blackbox_publications WHERE environment = ? AND status = 'pending' AND (ci_run_id IS NULL OR ci_run_id = 'runtime')
    ORDER BY rowid LIMIT 1`,
    )
    .bind(deps.environment)
    .first<{
      id: string;
      revisionId: string;
      requestJson: string | null;
      generation: number;
      attempts: number;
      snapshotSha256: string | null;
      codeSha: string | null;
    }>();
  if (!job) return false;
  const updateStage = (stage: string) =>
    deps.db
      .prepare(
        "UPDATE _blackbox_publications SET stage = ?, ci_run_id = 'runtime' WHERE id = ? AND environment = ? AND status = 'pending'",
      )
      .bind(stage, job.id, deps.environment)
      .run();
  try {
    const current = await baseline(deps);
    let pointer = current.pointer;
    let codeSha = job.codeSha;
    if (pointer.id !== job.id) {
      if (pointer.generation >= job.generation) throw new InvalidPublication('A newer publication is already active.');
      await updateStage('preparing');
      const retained = job.requestJson ? intentSchema.parse(JSON.parse(job.requestJson)) : undefined;
      const reviewedBaseline = retained && 'baseline' in retained ? retained.baseline : undefined;
      if (reviewedBaseline && reviewedBaseline !== current.pointer.snapshotSha256)
        throw new InvalidPublication('The website changed. Review the latest comparison before publishing.');
      const selections = [...(retained?.records ?? [])].sort(
        (a, b) => Number(b.collection === 'artists') - Number(a.collection === 'artists'),
      );
      // Check the whole batch before any native transition. Public activation remains atomic.
      for (const intent of selections) {
        const record = successful(await deps.runtime.handleContentGet(intent.collection, intent.recordId));
        if (record.item.liveRevisionId !== intent.revisionId && record._rev !== intent.expectedRevision)
          throw new InvalidPublication('A selected saved version changed. Review the batch before publishing.');
      }
      let candidate = current.snapshot;
      const changedRecords: { collection: string; slug: string }[] = [];
      let publicationCatalog: Awaited<ReturnType<typeof readPublicationCatalog>> | undefined;
      for (const intent of selections.length ? selections : [{ revisionId: job.revisionId }]) {
        const revision = successful(await deps.runtime.handleRevisionGet(intent.revisionId)).item;
        if (!isCmsCollection(revision.collection)) throw new InvalidPublication('Unsupported collection.');
        const { _slug: _validationSlug, ...publicationData } = revision.data;
        if (validateCmsRevisionContent(revision.collection, publicationData).length)
          throw new InvalidPublication('Incomplete drafts cannot be published.');
        if ('collection' in intent) {
          const record = successful(await deps.runtime.handleContentGet(intent.collection, intent.recordId));
          if (record.item.liveRevisionId !== intent.revisionId)
            successful(
              await deps.runtime.handleContentPublish(intent.collection, intent.recordId, {
                _rev: intent.expectedRevision,
              }),
            );
        }
        const recordState = successful(await deps.runtime.handleContentGet(revision.collection, revision.entryId));
        if (recordState.item.liveRevisionId !== revision.id || recordState.item.status !== 'published')
          throw new InvalidPublication('Selected revision is not published.');
        const { _slug, ...data } = revision.data;
        if (revision.collection === 'navigation')
          for (const key of ['show_in_header', 'show_in_footer'])
            if (data[key] === 0 || data[key] === 1) data[key] = data[key] === 1;
        const record: ContentSnapshot['records'][number] = {
          collection: revision.collection,
          id: revision.entryId,
          revisionId: revision.id,
          slug: String(_slug ?? recordState.item.slug),
          data: z.record(z.string(), z.json()).parse(data),
        };
        const addedMedia: ContentSnapshot['media'] = [];
        for (const id of contentMediaIds(data)) {
          if (candidate.media.some((item) => item.id === id)) continue;
          const media = await readPublicationMedia(deps.runtime, id);
          const object = await deps.bucket.get(media.storageKey);
          if (!object || object.size > 20 * 1024 * 1024 || object.size !== media.size) {
            await object?.body.cancel();
            throw new InvalidPublication('Selected image is unavailable.');
          }
          const bytes = new Uint8Array(await object.arrayBuffer());
          const dimensions = await validateImage(new File([bytes], media.filename, { type: media.mimeType }));
          const stored = await storeSnapshotMedia(deps.bucket, deps.environment, bytes);
          addedMedia.push({
            id,
            filename: media.filename,
            sha256: stored.sha256,
            size: stored.size,
            mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']).parse(media.mimeType),
            width: dimensions.width!,
            height: dimensions.height!,
          });
        }
        let identities = candidate.storeItems;
        if (['releases', 'distro'].includes(record.collection)) {
          publicationCatalog ??= await readPublicationCatalog(deps.commerce);
          identities = projectPublicationStoreItems(identities, record, publicationCatalog);
        }
        candidate = replacePublishedRecord(candidate, record, addedMedia, identities);
        changedRecords.push({ collection: record.collection, slug: record.slug });
      }
      const json = JSON.stringify(candidate);
      const bytes = new TextEncoder().encode(json);
      const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      await deps.bucket.put(`snapshots/${deps.environment}/manifest/${sha256}`, bytes, {
        sha256,
        onlyIf: { etagDoesNotMatch: '*' },
        httpMetadata: { contentType: 'application/json', cacheControl: 'private, no-store' },
      });
      pointer = { id: job.id, generation: job.generation, snapshotSha256: sha256 };
      await updateStage('verifying');
      const validation = await deps.renderer.fetch(
        new Request(new URL('/__publication/validate', deps.publicOrigin), {
          method: 'POST',
          body: JSON.stringify({ ...pointer, records: changedRecords }),
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      if (!validation.ok) {
        await validation.body?.cancel();
        throw new Error('Renderer unavailable.');
      }
      const proof = z
        .object({ sha: z.string().regex(/^[a-f0-9]{40}$/), snapshotSha256: z.literal(sha256) })
        .parse(await validation.json());
      codeSha = proof.sha;
      await deps.db
        .prepare(
          "UPDATE _blackbox_publications SET snapshot_sha256 = ?, code_sha = ? WHERE id = ? AND environment = ? AND status = 'pending'",
        )
        .bind(sha256, codeSha, job.id, deps.environment)
        .run();
      // Keep media from already-open pages available after the first runtime cutover.
      await deps.bucket.put(
        `snapshots/${deps.environment}/accepted/${current.pointer.snapshotSha256}`,
        current.pointer.id,
        { onlyIf: { etagDoesNotMatch: '*' } },
      );
      // Recheck the reviewed versions after rendering, before exposing the candidate.
      for (const intent of selections) {
        const fresh = successful(await deps.runtime.handleContentGet(intent.collection, intent.recordId));
        if (
          fresh.item.liveRevisionId !== intent.revisionId ||
          (fresh.item.draftRevisionId && fresh.item.draftRevisionId !== intent.revisionId)
        )
          throw new InvalidPublication('A selected draft changed. Review again before publishing.');
      }
      if (!(await activatePublication(deps.bucket, deps.environment, pointer, current.etag))) {
        if (reviewedBaseline) throw new InvalidPublication('The website changed. Review again before publishing.');
        throw new Error('Publication activation must be retried.');
      }
    }
    await updateStage('confirming');
    await deps.bucket.put(`snapshots/${deps.environment}/accepted/${pointer.snapshotSha256}`, job.id, {
      onlyIf: { etagDoesNotMatch: '*' },
    });
    const confirmation = new Request(new URL('/content-version.json', deps.publicOrigin), {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const response = await (deps.environment === 'local' ? deps.renderer.fetch(confirmation) : fetch(confirmation));
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('Public confirmation unavailable.');
    }
    const live = z
      .object({
        sha: z.string().regex(/^[a-f0-9]{40}$/),
        content: z.object({ publicationId: z.literal(job.id), snapshotSha256: z.literal(pointer.snapshotSha256) }),
      })
      .parse(await response.json());
    await deps.db
      .prepare(
        `UPDATE _blackbox_publications SET status = 'live', stage = 'live', completed_at = ?, snapshot_sha256 = ?, code_sha = ?, ci_run_id = 'runtime', deployment_id = ?, failure_code = NULL WHERE id = ? AND environment = ? AND status = 'pending'`,
      )
      .bind(Date.now(), pointer.snapshotSha256, codeSha ?? live.sha, job.id, job.id, deps.environment)
      .run();
  } catch (error) {
    const current = await readPublicationPointer(deps.bucket, deps.environment).catch(() => undefined);
    const activated = current?.pointer.id === job.id;
    // An activated publication must be reconciled, never reported as a pre-activation failure.
    const failed =
      current !== undefined &&
      !activated &&
      (error instanceof InvalidPublication || error instanceof z.ZodError || job.attempts >= 5);
    await deps.db
      .prepare(
        `UPDATE _blackbox_publications SET attempts = attempts + 1, status = ?, stage = ?, failure_code = ? WHERE id = ? AND environment = ? AND status = 'pending'`,
      )
      .bind(
        failed ? 'failed' : 'pending',
        failed ? 'failed' : activated ? 'confirming' : 'retrying',
        error instanceof InvalidPublication
          ? error.message
          : 'Publication could not finish. Retry or ask an administrator to check service availability.',
        job.id,
        deps.environment,
      )
      .run();
    return failed ? true : Math.min(300000, 1000 * 2 ** Math.min(job.attempts + 1, 9));
  }
  return true;
}
