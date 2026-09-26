import { applyD1Migrations, env } from 'cloudflare:test';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { ContentRepository } from 'emdash';
import { DISTRO_GROUP_VALUES, sourceCollectionNames } from '@blackbox/content-model';
import type { EmDashRuntime } from 'emdash/middleware';
import { readStaffWorkspace, type StaffSnapshotCache } from '../../src/cms/staff-workspace';
import { activatePublication, currentPublicationKey } from '../../src/cms/published-storage';
import { completeSnapshot } from '../../src/cms/snapshot-storage';

beforeAll(() => applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS));
afterEach(() => vi.restoreAllMocks());
test('catalog forwards native filters, ordering and opaque cursors without truncating editorial entries', async () => {
  await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
  const entries = Array.from({ length: 251 }, (_, index) => ({
    id: `paging-${index}`,
    slug: `paging-${index}`,
    data: { title: `Title ${Math.floor(index / 3)}`, group: DISTRO_GROUP_VALUES[index % DISTRO_GROUP_VALUES.length] },
    updatedAt: '2026-09-22T00:00:00Z',
  }));
  // This proves adapter forwarding only. content-smoke exercises real native cursors.
  const list = vi.fn();
  const deps = {
    runtime: { handleContentList: list } as unknown as EmDashRuntime,
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local' as const,
  };
  for (const sort of ['title', 'updated']) {
    for (const area of ['all', 'distro', 'merch']) {
      for (const format of ['', ...DISTRO_GROUP_VALUES]) {
        const groups = DISTRO_GROUP_VALUES.filter(
          (group) => (!format || group === format) && (area === 'all' || (area === 'merch') === (group === 'Clothes')),
        );
        const matching = entries.filter((item) => groups.includes(item.data.group));
        const seen: string[] = [];
        let cursor: string | undefined;
        let offset = 0;
        do {
          const nextCursor = offset + 25 < matching.length ? `opaque/+${offset + 25}==` : undefined;
          list.mockResolvedValueOnce({
            success: true,
            data: { items: matching.slice(offset, offset + 25), nextCursor },
          });
          const params = new URLSearchParams({ collection: 'distro', q: 'Title', area, sort, limit: '25' });
          if (format) params.set('format', format);
          if (cursor) params.set('cursor', cursor);
          const response = await readStaffWorkspace(new Request(`https://staff.invalid/?${params}`), deps);
          const page = (await response.json()) as {
            data: { items: { id: string; selling: unknown }[]; nextCursor?: string };
          };
          expect(response.status).toBe(200);
          if (groups.length) {
            expect(list).toHaveBeenLastCalledWith('distro', {
              limit: 25,
              cursor,
              q: 'Title',
              orderBy: sort === 'title' ? 'title' : 'updatedAt',
              order: sort === 'title' ? 'asc' : 'desc',
              ...(format || area !== 'all' ? { fieldFilters: { group: { in: groups } } } : {}),
            });
            expect(page.data.nextCursor).toBe(nextCursor);
          } else list.mockReset();
          expect(page.data.items.every((item) => item.selling === null)).toBe(true);
          seen.push(...page.data.items.map((item) => item.id));
          cursor = page.data.nextCursor;
          offset += 25;
        } while (cursor);
        expect(seen).toEqual(matching.map((item) => item.id));
        expect(new Set(seen).size).toBe(seen.length);
      }
    }
  }
});
test('Overview keeps bounded recent publication truth without list enrichment or commerce', async () => {
  await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
  const sections = Object.keys(sourceCollectionNames);
  const entries = Array.from({ length: 5 }, (_, i) => ({
    id: `overview-${i}`,
    slug: `overview-${i}`,
    data: i ? { title: `Work ${i}` } : {},
    updatedAt: `2026-09-22T00:00:0${i}Z`,
    draftRevisionId: i ? `draft-${i}` : null,
    liveRevisionId: null,
  }));
  const recent = vi.spyOn(ContentRepository.prototype, 'findMany').mockImplementation(
    async () =>
      ({
        items: entries,
        nextCursor: 'unused',
      }) as never,
  );
  const list = vi.fn(() => {
    throw new Error('Unused list enrichment');
  });
  const commerce = vi.spyOn(env.COMMERCE_DB, 'prepare').mockImplementation(() => {
    throw new Error('Commerce unavailable');
  });
  const deps = {
    runtime: { db: {}, handleContentList: list } as unknown as EmDashRuntime,
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local' as const,
    snapshotCache: {} as StaffSnapshotCache,
  };
  const publish = async (revisionId: string) => {
    const snapshot = await completeSnapshot(
      env.TEST_SNAPSHOTS,
      'local',
      JSON.stringify({
        schemaVersion: 1,
        environment: 'local',
        media: [],
        records: [
          {
            collection: 'socials',
            id: 'overview-1',
            slug: 'overview-1',
            revisionId,
            data: { title: 'Work 1', url: 'https://example.com', order: 1 },
          },
        ],
      }),
    );
    await env.TEST_SNAPSHOTS.put(
      currentPublicationKey('local'),
      JSON.stringify({
        id: crypto.randomUUID(),
        snapshotSha256: snapshot.sha256,
        generation: 0,
      }),
    );
  };
  const read = async () => {
    const response = await readStaffWorkspace(new Request('https://staff.invalid/?view=overview'), deps);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    return (
      (await response.json()) as {
        data: { items: { id: string; collection: string; publicationState: string; updatedAt: string }[] };
      }
    ).data.items;
  };
  const full = await read();
  expect(full).toHaveLength(20);
  expect(full.map((item) => item.updatedAt)).toEqual(
    full
      .map((item) => item.updatedAt)
      .sort()
      .reverse(),
  );
  expect(recent.mock.calls).toEqual(
    sections.map((section) => [
      section,
      {
        limit: 5,
        orderBy: { field: 'updatedAt', direction: 'desc' },
      },
    ]),
  );
  // Narrow the fixture, not the endpoint: enough room to compare every visible state.
  recent.mockImplementation(async (section) => ({ items: section === 'socials' ? entries : [] }) as never);
  await publish('draft-1');
  const reads = vi.spyOn(env.TEST_SNAPSHOTS, 'get');
  const accepted = await read();
  expect(accepted.map((item) => item.id)).toEqual(['overview-4', 'overview-3', 'overview-2', 'overview-0']);
  expect(accepted.at(-1)?.publicationState).toBe('draft');
  await env.TEST_CMS_DB.prepare(
    `INSERT INTO _blackbox_publications
    (id, environment, actor_email, requested_revision, requested_at, request_json)
    VALUES (?, 'local', 'fixture@example.com', 'draft-4', 1, ?)`,
  )
    .bind(crypto.randomUUID(), JSON.stringify({ collection: 'socials', recordId: 'overview-3' }))
    .run();
  await publish('older');
  const changed = await read();
  expect(changed.map((item) => item.publicationState)).toEqual(['pending', 'pending', 'draft', 'changes', 'draft']);
  await read();
  expect(reads.mock.calls.filter(([key]) => key.endsWith('/current.json'))).toHaveLength(3);
  expect(reads.mock.calls.filter(([key]) => key.includes('/manifest/'))).toHaveLength(2);
  recent.mockResolvedValue({ items: [] } as never);
  expect(await read()).toEqual([]);
  expect(list).not.toHaveBeenCalled();
  expect(commerce).not.toHaveBeenCalled();
  recent.mockRejectedValueOnce(new Error('Recent content unavailable'));
  await expect(read()).rejects.toThrow('Recent content unavailable');
  reads.mockRejectedValueOnce(new Error('Pointer unavailable'));
  await expect(read()).rejects.toThrow('Pointer unavailable');
});

test('Overview rejects selection, filter and paging combinations before any I/O', async () => {
  for (const extra of [
    'collection=artists',
    'id=a',
    'variantId=a',
    'cursor=',
    'q=',
    'scope=all',
    'area=all',
    'format=Vinyl',
    'sort=title',
    'limit=5',
  ]) {
    const response = await readStaffWorkspace(
      new Request(`https://staff.invalid/?view=overview&${extra}`),
      {} as never,
    );
    expect(response.status).toBe(400);
  }
});

test('Overview starts native pages and pending lookup while the accepted pointer is pending', async () => {
  const pointer = Promise.withResolvers<null>();
  vi.spyOn(env.TEST_SNAPSHOTS, 'get').mockReturnValue(pointer.promise as never);
  const recent = vi.spyOn(ContentRepository.prototype, 'findMany').mockResolvedValue({ items: [] } as never);
  const pending = vi.spyOn(env.TEST_CMS_DB, 'prepare');
  const response = readStaffWorkspace(new Request('https://staff.invalid/?view=overview'), {
    runtime: { db: {} } as EmDashRuntime,
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local',
  });
  try {
    await vi.waitFor(() => expect(pending).toHaveBeenCalled());
    expect(recent).toHaveBeenCalledTimes(Object.keys(sourceCollectionNames).length);
  } finally {
    pointer.resolve(null);
  }
  expect((await response).status).toBe(200);
});
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
    handleContentGet: vi.fn(async () => ({ success: true, data: { _rev: 'version', item } })),
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
  const comparison = await readStaffWorkspace(new Request('https://staff.invalid/?collection=socials&id=link'), deps);
  const comparisonData = (await comparison.json()) as {
    data: { items: { acceptedData: Record<string, unknown> | null }[] };
  };
  expect(comparisonData.data.items[0]?.acceptedData).toEqual({ ...item.data, slug: item.slug });
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

test('review discovery compares saved revisions rather than published list values and includes incomplete entries', async () => {
  await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
  const entries = [
    {
      id: 'unchanged',
      slug: 'unchanged',
      data: { title: 'Unchanged', url: 'https://example.com', order: 1 },
      draftRevisionId: 'unchanged-draft',
      liveRevisionId: 'unchanged-live',
    },
    {
      id: 'changed',
      slug: 'changed',
      data: { title: 'Changed', url: 'https://example.com', order: 2 },
      draftRevisionId: 'changed-draft',
      liveRevisionId: 'changed-live',
    },
    {
      id: 'incomplete',
      slug: 'incomplete',
      data: {},
      draftRevisionId: 'incomplete-draft',
      liveRevisionId: null,
    },
  ];
  const snapshot = await completeSnapshot(
    env.TEST_SNAPSHOTS,
    'local',
    JSON.stringify({
      schemaVersion: 1,
      environment: 'local',
      records: [
        {
          collection: 'socials',
          id: 'unchanged',
          slug: 'unchanged',
          revisionId: 'unchanged-live',
          data: entries[0]!.data,
        },
        {
          collection: 'socials',
          id: 'changed',
          slug: 'changed',
          revisionId: 'changed-live',
          data: { title: 'Changed', url: 'https://example.com', order: 2 },
        },
      ],
      media: [],
    }),
  );
  await activatePublication(env.TEST_SNAPSHOTS, 'local', {
    id: crypto.randomUUID(),
    snapshotSha256: snapshot.sha256,
    generation: 0,
  });
  const response = await readStaffWorkspace(new Request('https://staff.invalid/?view=changes&collection=socials'), {
    runtime: {
      handleContentList: vi.fn(async () => ({ success: true, data: { items: entries } })),
      handleRevisionGet: vi.fn(async (revisionId: string) => {
        const item = entries.find((entry) => entry.draftRevisionId === revisionId)!;
        return {
          success: true,
          data: {
            item: {
              entryId: item.id,
              collection: 'socials',
              data: { ...item.data, ...(item.id === 'changed' ? { url: 'https://new.example.com' } : {}) },
            },
          },
        };
      }),
    } as unknown as EmDashRuntime,
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local',
  });
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as { data: { items: { id: string; data: { url?: string } }[] } };
  expect(data.items.map((item) => item.id)).toEqual(['changed', 'incomplete']);
  expect(data.items[0].data.url).toBe('https://new.example.com');
});
