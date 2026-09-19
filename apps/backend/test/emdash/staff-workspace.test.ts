import { applyD1Migrations, env } from 'cloudflare:test';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import type { EmDashRuntime } from 'emdash/middleware';
import { readStaffWorkspace, type StaffSnapshotCache } from '../../src/cms/staff-workspace';
import { activatePublication, currentPublicationKey } from '../../src/cms/published-storage';
import { completeSnapshot } from '../../src/cms/snapshot-storage';

beforeAll(() => applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS));
afterEach(() => vi.restoreAllMocks());
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
  const snapshotCache: StaffSnapshotCache = {};
  const reads = vi.spyOn(env.TEST_SNAPSHOTS, 'get');
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
      snapshotCache,
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
  expect(reads.mock.calls.filter(([key]) => key.includes('/manifest/'))).toHaveLength(1);
  expect(reads.mock.calls.filter(([key]) => key.endsWith('/current.json'))).toHaveLength(pages);
});

test('workspace reuse follows fresh pointers, isolates targets, and never hides drafts or read failures', async () => {
  const item = {
    id: 'link',
    slug: 'link',
    draftRevisionId: 'one',
    liveRevisionId: 'one',
    data: { title: 'Link', url: 'https://example.com', order: 1 },
  };
  const runtime = {
    handleContentList: vi.fn(async () => ({ success: true, data: { items: [item] } })),
  } as unknown as EmDashRuntime;
  const snapshotCache: StaffSnapshotCache = {};
  const deps = {
    runtime,
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local' as const,
    snapshotCache,
  };
  const request = () => new Request('https://staff.invalid/?collection=socials');
  const state = async () => {
    const response = await readStaffWorkspace(request(), deps);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    return ((await response.json()) as { data: { items: { publicationState: string }[] } }).data.items[0]
      .publicationState;
  };
  const publish = async (revisionId: string) => {
    const snapshot = await completeSnapshot(
      env.TEST_SNAPSHOTS,
      'local',
      JSON.stringify({
        schemaVersion: 1,
        environment: 'local',
        records: [{ collection: 'socials', id: item.id, slug: item.slug, revisionId, data: item.data }],
        media: [],
      }),
    );
    await env.TEST_SNAPSHOTS.put(
      currentPublicationKey('local'),
      JSON.stringify({ id: crypto.randomUUID(), snapshotSha256: snapshot.sha256, generation: 0 }),
    );
    return snapshot.sha256;
  };
  await publish('one');
  const reads = vi.spyOn(env.TEST_SNAPSHOTS, 'get');
  expect(await state()).toBe('published');
  expect(await state()).toBe('published');
  expect(reads.mock.calls.filter(([key]) => key.includes('/manifest/'))).toHaveLength(1);
  item.draftRevisionId = 'two';
  expect(await state()).toBe('changes');
  const next = await publish('two');
  expect(await state()).toBe('published');
  expect(snapshotCache.current?.sha256).toBe(next);
  expect(reads.mock.calls.filter(([key]) => key.includes('/manifest/'))).toHaveLength(2);

  // A different bucket binding must read and verify even when its pointer has the same SHA.
  const otherBucket = new Proxy(env.TEST_SNAPSHOTS, {
    get: (target, key) => {
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  await readStaffWorkspace(request(), { ...deps, bucket: otherBucket });
  expect(reads.mock.calls.filter(([key]) => key.includes('/manifest/'))).toHaveLength(3);
  await env.TEST_SNAPSHOTS.put(
    currentPublicationKey('uat'),
    JSON.stringify({ id: crypto.randomUUID(), snapshotSha256: next, generation: 0 }),
  );
  await expect(readStaffWorkspace(request(), { ...deps, environment: 'uat' })).rejects.toThrow('unavailable');
  reads.mockRejectedValueOnce(new Error('pointer unavailable'));
  await expect(state()).rejects.toThrow('pointer unavailable');
  await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
  expect(await state()).toBe('draft');
  expect(snapshotCache.current).toBeUndefined();
  await publish('two');
  await env.TEST_SNAPSHOTS.put(`snapshots/local/manifest/${next}`, '{}');
  await expect(state()).rejects.toThrow('unavailable');
  expect(snapshotCache.current).toBeUndefined();
});
