import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, test, vi } from 'vitest';
import type { EmDashRuntime } from 'emdash/middleware';
import { readStaffWorkspace } from '../../src/cms/staff-workspace';
import { activatePublication, currentPublicationKey } from '../../src/cms/published-storage';
import { completeSnapshot } from '../../src/cms/snapshot-storage';

beforeAll(() => applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS));
test('bounded review continues past 250 published entries without losing later drafts', async () => {
  await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
  const entries = Array.from({ length: 275 }, (_, i) => ({
    id: `social-${i}`,
    slug: `social-${i}`,
    data: { title: `Link ${i}`, url: 'https://example.com', order: i },
    draftRevisionId: `new-${i}`,
    liveRevisionId: `old-${i}`,
  }));
  const records = entries.slice(0, 250).map((item) => ({
    collection: 'socials',
    id: item.id,
    slug: item.slug,
    revisionId: item.draftRevisionId,
    data: item.data,
  }));
  const snapshot = await completeSnapshot(
    env.TEST_SNAPSHOTS,
    'local',
    JSON.stringify({ schemaVersion: 1, environment: 'local', records, media: [] }),
  );
  await activatePublication(env.TEST_SNAPSHOTS, 'local', {
    id: crypto.randomUUID(),
    snapshotSha256: snapshot.sha256,
    generation: 0,
  });
  const list = vi.fn(async (_section: string, params: { cursor?: string; limit: number }) => {
    const offset = Number(params.cursor ?? 0);
    const end = offset + params.limit;
    return {
      success: true,
      data: { items: entries.slice(offset, end), nextCursor: end < entries.length ? String(end) : undefined },
    };
  });
  const runtime = { handleContentList: list } as unknown as EmDashRuntime;
  const found = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const query = new URLSearchParams({ view: 'changes', collection: 'socials', limit: '25' });
    if (cursor) query.set('cursor', cursor);
    const before = list.mock.calls.length;
    const response = await readStaffWorkspace(new Request(`https://staff.invalid/?${query}`), {
      runtime,
      db: env.TEST_CMS_DB,
      commerce: env.COMMERCE_DB,
      bucket: env.TEST_SNAPSHOTS,
      environment: 'local',
    });
    expect(response.status).toBe(200);
    const { data } = (await response.json()) as { data: { items: { id: string }[]; nextCursor?: string } };
    expect(list.mock.calls.length - before).toBeLessThanOrEqual(4);
    expect(data.items.length).toBeLessThanOrEqual(25);
    found.push(...data.items.map((item) => item.id));
    cursor = data.nextCursor;
    expect(++pages).toBeLessThan(10);
  } while (cursor);
  expect(found).toEqual(entries.slice(250).map((item) => item.id));
  expect(list).toHaveBeenCalledTimes(11);
});
