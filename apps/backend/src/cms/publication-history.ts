import { z } from 'zod';
import { isCmsCollection, type PublicationComparisonData } from '@blackbox/content-model';
import { publicationSummary } from './publication-journal';
import { readPublishedSnapshot, type PublicationEnvironment } from './published-storage';

type HistoryRow = {
  id: string;
  actorEmail: string;
  requestedAt: number;
  completedAt: number | null;
  status: 'pending' | 'live' | 'failed';
  stage: string | null;
  failureReason: string | null;
  requestJson: string | null;
  snapshotSha256: string | null;
  beforeSnapshotSha256: string | null;
  ciRunId: string | null;
};
const columns = `id, actor_email AS actorEmail, requested_at AS requestedAt, completed_at AS completedAt,
  status, stage, failure_code AS failureReason, request_json AS requestJson,
  snapshot_sha256 AS snapshotSha256, before_snapshot_sha256 AS beforeSnapshotSha256, ci_run_id AS ciRunId`;
const checksum = z.string().regex(/^[a-f0-9]{64}$/);
const intentSchema = z.object({
  action: z.enum(['publish', 'withdraw']).optional(),
  baseline: checksum.optional(),
  records: z
    .array(
      z.object({
        collection: z.string().refine(isCmsCollection),
        recordId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
        title: z.string().optional(),
        revisionId: z.string().optional(),
      }),
    )
    .max(20)
    .optional(),
  collection: z.string().optional(),
  recordId: z.string().optional(),
  title: z.string().optional(),
});
function retained(row: HistoryRow) {
  try {
    return row.requestJson ? intentSchema.parse(JSON.parse(row.requestJson)) : null;
  } catch {
    return null;
  }
}
function summary(row: HistoryRow, environment: PublicationEnvironment) {
  const intent = retained(row);
  const records = intent?.records ?? (intent?.collection && intent.recordId ? [intent] : []);
  return {
    ...publicationSummary(row),
    actorEmail: row.actorEmail,
    environment,
    action: intent?.action ?? 'publish',
    entries: records.map((record) => ({
      collection: record.collection!,
      recordId: record.recordId!,
      title: record.title ?? 'Title unavailable for this earlier update',
    })),
  };
}

export const publicationCalendarQuery = z
  .object({
    month: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/),
    collection: z.string().refine(isCmsCollection).optional(),
    cursor: z
      .string()
      .max(160)
      .regex(/^\d{1,16}_[a-f0-9-]{36}$/)
      .refine((cursor) => {
        const [at, id] = cursor.split('_');
        return Number.isSafeInteger(Number(at)) && z.uuid().safeParse(id).success;
      })
      .optional(),
  })
  .strict();

/** Calendar months start at midnight in Athens, including its DST offset. */
export function publicationMonthRange(month: string) {
  publicationCalendarQuery.shape.month.parse(month);
  const first = new Date(`${month}-01T00:00:00.000Z`);
  const next = new Date(first);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const midnight = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Athens',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    return date.getTime() - (value('hour') * 3600 + value('minute') * 60 + value('second')) * 1000;
  };
  return { from: midnight(first), to: midnight(next) };
}

export async function readPublicationCalendar(
  db: D1Database,
  environment: PublicationEnvironment,
  input: z.infer<typeof publicationCalendarQuery>,
) {
  const query = publicationCalendarQuery.parse(input);
  const { from, to } = publicationMonthRange(query.month);
  const [cursorAt, cursorId] = query.cursor?.split('_') ?? [];
  const { results } = await db
    .prepare(
      `SELECT ${columns}, COALESCE(completed_at, requested_at) AS eventAt
    FROM _blackbox_publications WHERE environment = ? AND status = 'live'
    AND COALESCE(completed_at, requested_at) >= ? AND COALESCE(completed_at, requested_at) < ?
    AND (? IS NULL OR COALESCE(completed_at, requested_at) < ? OR (COALESCE(completed_at, requested_at) = ? AND id < ?))
    AND (? IS NULL OR EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(request_json, '$.records') = 'array'
      THEN json_extract(request_json, '$.records') ELSE json_array(json(request_json)) END)
      WHERE json_extract(value, '$.collection') = ?))
    ORDER BY COALESCE(completed_at, requested_at) DESC, id DESC LIMIT 101`,
    )
    .bind(
      environment,
      from,
      to,
      cursorAt ?? null,
      cursorAt ? Number(cursorAt) : null,
      cursorAt ? Number(cursorAt) : null,
      cursorId ?? null,
      query.collection ?? null,
      query.collection ?? null,
    )
    .all<HistoryRow & { eventAt: number }>();
  const last = results[99];
  return {
    items: results.slice(0, 100).map((row) => summary(row, environment)),
    ...(results.length > 100 && last ? { nextCursor: `${last.eventAt}_${last.id}` } : {}),
  };
}

export async function readPublicationDetails(
  db: D1Database,
  bucket: R2Bucket,
  environment: PublicationEnvironment,
  id: string,
) {
  z.uuid().parse(id);
  const row = await db
    .prepare(`SELECT ${columns} FROM _blackbox_publications WHERE id = ? AND environment = ?`)
    .bind(id, environment)
    .first<HistoryRow>();
  if (!row) return null;
  const publication = summary(row, environment);
  const intent = retained(row);
  const beforeHash = row.beforeSnapshotSha256 ?? (row.ciRunId === 'runtime' ? intent?.baseline : undefined);
  const unavailable = { publication, comparison: null, reason: 'Comparison unavailable for this update.' };
  if (row.status !== 'live' || !row.snapshotSha256 || !beforeHash || !publication.entries.length) return unavailable;
  let before, after;
  try {
    [before, after] = await Promise.all([
      readPublishedSnapshot(bucket, environment, beforeHash),
      readPublishedSnapshot(bucket, environment, row.snapshotSha256),
    ]);
  } catch (error) {
    if (row.beforeSnapshotSha256) throw error;
    return unavailable;
  }
  const references = (snapshot: typeof before) =>
    Object.fromEntries(
      snapshot.records
        .filter((record) => record.collection === 'artists')
        .map((record) => [record.id, String(record.data.title ?? record.slug)]),
    );
  const media = (snapshot: typeof before, hash: string) =>
    Object.fromEntries(
      snapshot.media.map((item) => [
        item.id,
        {
          src: `/_emdash/api/blackbox/review-media/${hash}/${item.sha256}`,
          width: item.width,
          height: item.height,
          format: item.mimeType === 'image/jpeg' ? 'jpg' : item.mimeType.slice(6),
        },
      ]),
    );
  const comparison: PublicationComparisonData = {
    entries: publication.entries.map((entry) => {
      const previous = before.records.find(
        (record) => record.collection === entry.collection && record.id === entry.recordId,
      );
      const next = after.records.find(
        (record) => record.collection === entry.collection && record.id === entry.recordId,
      );
      return {
        ...entry,
        title: String(next?.data.title ?? previous?.data.title ?? entry.title),
        slug: next?.slug ?? previous?.slug ?? '',
        expectedRevision: next?.revisionId ?? previous?.revisionId ?? '',
        action: publication.action,
        before: previous?.data ?? null,
        after: next?.data ?? {},
        issues: [],
      };
    }),
    media: media(after, row.snapshotSha256),
    baselineMedia: media(before, beforeHash),
    referenceTitles: references(after),
    baselineReferenceTitles: references(before),
  };
  return { publication, comparison };
}
