import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, test } from 'vitest';
import {
  publicationCalendarQuery,
  publicationMonthRange,
  readPublicationCalendar,
  readPublicationDetails,
} from './publication-history';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});

test('Athens calendar boundaries include both daylight-saving offsets and reject unsafe cursors', () => {
  for (const [month, from, to] of [
    ['2026-03', '2026-02-28T22:00:00Z', '2026-03-31T21:00:00Z'],
    ['2026-10', '2026-09-30T21:00:00Z', '2026-10-31T22:00:00Z'],
  ])
    expect(publicationMonthRange(month!)).toEqual({ from: Date.parse(from!), to: Date.parse(to!) });
  for (const cursor of ['9007199254740992_' + crypto.randomUUID(), '1_' + '-'.repeat(36), '../private'])
    expect(publicationCalendarQuery.safeParse({ month: '2026-10', cursor }).success).toBe(false);
});

test('calendar pages retain repeated updates, removals and legacy request times while isolating environments', async () => {
  const at = Date.parse('2026-10-25T01:30:00Z');
  const ids = Array.from({ length: 103 }, () => crypto.randomUUID());
  const insert = (
    id: string,
    environment: string,
    requested: number,
    completed: number | null,
    collection = 'news',
    status = 'live',
  ) =>
    env.TEST_CMS_DB.prepare(
      `INSERT INTO _blackbox_publications
      (id, environment, actor_email, requested_revision, requested_at, completed_at, status, snapshot_sha256, code_sha, ci_run_id, deployment_id, request_json)
      VALUES (?, ?, 'editor@example.com', 'revision', ?, ?, ?, ?, ?, 'test', 'test', ?)`,
    ).bind(
      id,
      environment,
      requested,
      completed,
      status,
      'a'.repeat(64),
      'b'.repeat(40),
      JSON.stringify({
        action: id === ids[0] ? 'withdraw' : 'publish',
        records: [{ collection, recordId: 'same-entry', title: 'Repeated update' }],
      }),
    );
  await env.TEST_CMS_DB.batch(ids.map((id) => insert(id, 'local', at - 1000, at)));
  const legacyId = crypto.randomUUID();
  await env.TEST_CMS_DB.batch([
    insert(legacyId, 'local', at + 1000, null),
    insert(crypto.randomUUID(), 'uat', at, at),
    insert(crypto.randomUUID(), 'local', at, at, 'artists'),
    insert(crypto.randomUUID(), 'local', at, at, 'news', 'failed'),
    insert(crypto.randomUUID(), 'local', at, Date.parse('2026-10-31T22:00:00Z')),
  ]);
  const first = await readPublicationCalendar(env.TEST_CMS_DB, 'local', { month: '2026-10', collection: 'news' });
  expect(first.items).toHaveLength(100);
  expect(first.items[0]?.id).toBe(legacyId);
  expect(first.items[0]?.completedAt).toBeUndefined();
  const second = await readPublicationCalendar(env.TEST_CMS_DB, 'local', {
    month: '2026-10',
    collection: 'news',
    cursor: first.nextCursor!,
  });
  expect(second.items).toHaveLength(4);
  expect(second.nextCursor).toBeUndefined();
  const all = [...first.items, ...second.items];
  expect(new Set(all.map((item) => item.id)).size).toBe(104);
  expect(all.find((item) => item.id === ids[0])?.action).toBe('withdraw');
  expect(all.every((item) => item.environment === 'local' && item.entries[0]?.collection === 'news')).toBe(true);
  const unavailable = await readPublicationDetails(env.TEST_CMS_DB, env.TEST_SNAPSHOTS, 'local', legacyId);
  expect(unavailable?.comparison).toBeNull();
  expect(unavailable && 'reason' in unavailable && unavailable.reason).toMatch(/Comparison unavailable/);
});
