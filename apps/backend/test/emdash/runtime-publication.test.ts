import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import type { EmDashRuntime } from 'emdash/middleware';
import { acceptSelectedPublication, processRuntimePublication } from '../../src/cms/runtime-publication';
import {
  activatePublication,
  currentPublicationKey,
  readPublicationPointer,
  readPublishedSnapshot,
} from '../../src/cms/published-storage';
import { completeSnapshot, storeSnapshotMedia } from '../../src/cms/snapshot-storage';
import { createPrismaClient } from '../../src/infrastructure/persistence/prisma';
import { readPublication } from '../../src/cms/publication-journal';
import { readPublicationHistory } from '../../src/cms/publication-journal';
import { reviewPublication, publicationPreviewContext } from '../../src/cms/publication-review';

beforeAll(() => applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS));
beforeEach(async () => {
  await env.TEST_CMS_DB.prepare('DELETE FROM _blackbox_publications').run();
  await env.TEST_SNAPSHOTS.delete(currentPublicationKey('local'));
});

async function setup() {
  const bytes = Uint8Array.from(
    atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII='),
    (c) => c.charCodeAt(0),
  );
  const stored = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes);
  const data = {
    title: 'Published title',
    date: '2026-09-14',
    summary: 'Public copy',
    image: { id: 'image' },
    image_alt: 'Cover',
  };
  const old = { collection: 'news', id: 'news', slug: 'news', revisionId: 'old', data };
  const snapshot = {
    schemaVersion: 1,
    environment: 'local',
    records: [old, { ...old, id: 'other', slug: 'other', revisionId: 'other-old' }],
    media: [{ id: 'image', ...stored, filename: 'cover.png', mimeType: 'image/png', width: 1, height: 1 }],
  };
  const { key: _key, ...media } = snapshot.media[0];
  const baseline = await completeSnapshot(env.TEST_SNAPSHOTS, 'local', JSON.stringify({ ...snapshot, media: [media] }));
  const pointer = { id: crypto.randomUUID(), snapshotSha256: baseline.sha256, generation: 0 };
  await activatePublication(env.TEST_SNAPSHOTS, 'local', pointer);
  let live = 'old';
  const runtime = {
    handleContentGet: vi.fn(async () => ({
      success: true,
      data: {
        _rev: 'version-1',
        item: { id: 'news', slug: 'news', status: 'published', draftRevisionId: 'selected', liveRevisionId: live },
      },
    })),
    handleContentPublish: vi.fn(async () => {
      live = 'selected';
      return { success: true, data: {} };
    }),
    handleRevisionGet: vi.fn(async () => ({
      success: true,
      data: {
        item: {
          id: 'selected',
          collection: 'news',
          entryId: 'news',
          data: { ...data, title: 'Selected title' } as Record<string, unknown>,
        },
      },
    })),
    handleMediaGet: vi.fn(),
  };
  const renderer = {
    fetch: vi.fn(async (request: Request) => {
      if (request.method === 'POST')
        return Response.json({
          sha: 'c'.repeat(40),
          snapshotSha256: ((await request.json()) as typeof pointer).snapshotSha256,
        });
      const current = (await readPublicationPointer(env.TEST_SNAPSHOTS, 'local'))!.pointer;
      return Response.json({
        sha: 'c'.repeat(40),
        content: { publicationId: current.id, snapshotSha256: current.snapshotSha256 },
      });
    }),
  };
  const deps = {
    db: env.TEST_CMS_DB,
    commerce: env.COMMERCE_DB,
    bucket: env.TEST_SNAPSHOTS,
    environment: 'local' as const,
    runtime: runtime as unknown as EmDashRuntime,
    renderer: renderer as unknown as Fetcher,
    publicOrigin: 'http://localhost',
  };
  const input = {
    id: crypto.randomUUID(),
    collection: 'news' as const,
    recordId: 'news',
    expectedRevision: 'version-1',
  };
  return { deps, runtime, renderer, input, pointer };
}

test('durably deduplicates selected revisions before native mutation and preserves other records', async () => {
  const { deps, runtime, input, pointer: originalPointer } = await setup();
  const accepted = await Promise.all([1, 2].map(() => acceptSelectedPublication(input, 'editor@example.com', deps)));
  expect(accepted[0]).toEqual(accepted[1]);
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  await expect(acceptSelectedPublication(input, 'other@example.com', deps)).rejects.toThrow('conflicts');
  await expect(acceptSelectedPublication(input, 'editor@example.com', { ...deps, environment: 'uat' })).rejects.toThrow(
    'conflicts',
  );
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  const pointer = (await readPublicationPointer(deps.bucket, 'local'))!.pointer;
  const snapshot = await readPublishedSnapshot(deps.bucket, 'local', pointer.snapshotSha256);
  expect(snapshot.records.find((record) => record.id === 'news')?.data.title).toBe('Selected title');
  expect(snapshot.records.find((record) => record.id === 'other')?.revisionId).toBe('other-old');
  expect(runtime.handleMediaGet).not.toHaveBeenCalled();
  expect(runtime.handleContentPublish).toHaveBeenCalledTimes(1);
  expect(await deps.bucket.head(`snapshots/local/accepted/${originalPointer.snapshotSha256}`)).not.toBeNull();
  expect(await processRuntimePublication(deps)).toBe(false);
  expect((await acceptSelectedPublication(input, 'editor@example.com', deps)).status).toBe('live');
});

test('recovers a lost post-activation response without republishing and never replaces the last valid site on verification failure', async () => {
  const { deps, runtime, renderer, input, pointer } = await setup();
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  renderer.fetch.mockRejectedValueOnce(new Error('renderer unavailable'));
  await processRuntimePublication(deps);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(pointer);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('pending');
  renderer.fetch.mockImplementationOnce(async (request) =>
    Response.json({ sha: 'c'.repeat(40), snapshotSha256: ((await request.json()) as typeof pointer).snapshotSha256 }),
  );
  renderer.fetch.mockRejectedValueOnce(new Error('lost confirmation'));
  await processRuntimePublication(deps);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer.id).toBe(input.id);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('pending');
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  expect(runtime.handleContentPublish).toHaveBeenCalledTimes(1);
  expect(await activatePublication(deps.bucket, 'local', pointer, 'stale-etag')).toBeNull();
});

test('activates a selected batch together and rejects stale selections before mutation', async () => {
  const { deps, runtime, renderer, input, pointer } = await setup();
  const live = new Map<string, string>();
  runtime.handleContentGet.mockImplementation(async (...args: unknown[]) => {
    const id = String(args[1]);
    return {
      success: true,
      data: {
        _rev: 'version-1',
        item: {
          id,
          slug: id,
          status: 'published',
          draftRevisionId: `selected-${id}`,
          liveRevisionId: live.get(id) ?? 'old',
        },
      },
    };
  });
  runtime.handleContentPublish.mockImplementation(async (...args: unknown[]) => {
    const id = String(args[1]);
    live.set(id, `selected-${id}`);
    return { success: true, data: {} };
  });
  runtime.handleRevisionGet.mockImplementation(async (...args: unknown[]) => {
    const revision = String(args[0]);
    const id = revision.replace('selected-', '');
    return {
      success: true,
      data: {
        item: {
          id: revision,
          collection: 'news',
          entryId: id,
          data: {
            title: `Batch ${id}`,
            date: '2026-09-14',
            summary: 'Public copy',
            image: { id: 'image' },
            image_alt: 'Cover',
          },
        },
      },
    };
  });
  const records = ['news', 'other'].map((recordId) => ({
    collection: 'news',
    recordId,
    expectedRevision: 'version-1',
  }));
  await expect(
    acceptSelectedPublication(
      { id: input.id, records: [records[0], { ...records[1], expectedRevision: 'stale' }] },
      'editor@example.com',
      deps,
    ),
  ).rejects.toThrow('saved version');
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  await acceptSelectedPublication({ id: input.id, records }, 'editor@example.com', deps);
  renderer.fetch.mockRejectedValueOnce(new Error('candidate verification interrupted'));
  await processRuntimePublication(deps);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(pointer);
  await processRuntimePublication(deps);
  const active = (await readPublicationPointer(deps.bucket, 'local'))!.pointer;
  const snapshot = await readPublishedSnapshot(deps.bucket, 'local', active.snapshotSha256);
  expect(snapshot.records.map((record) => record.data.title).sort()).toEqual(['Batch news', 'Batch other']);
  expect(runtime.handleContentPublish).toHaveBeenCalledTimes(2);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
});

test('rejects an incomplete selected draft before publication or native transitions', async () => {
  const { deps, runtime, input } = await setup();
  const revision = await runtime.handleRevisionGet();
  runtime.handleRevisionGet.mockResolvedValue({
    ...revision,
    data: { item: { ...revision.data.item, data: { ...revision.data.item.data, title: '' } } },
  });
  await expect(acceptSelectedPublication(input, 'editor@example.com', deps)).rejects.toThrow('Complete');
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect(await readPublication(deps.db, 'local', input.id)).toBeNull();
});

test('a different operation cannot publish an entry already pending', async () => {
  const { deps, input } = await setup();
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  await expect(
    acceptSelectedPublication({ ...input, id: crypto.randomUUID() }, 'editor@example.com', deps),
  ).rejects.toThrow('already updating');
  expect((await acceptSelectedPublication(input, 'editor@example.com', deps)).id).toBe(input.id);
});

test('publishes selling-linked editorial details without changing price, stock or shop activation', async () => {
  const { deps, runtime, input } = await setup();
  const db = createPrismaClient(env);
  const variantId = 'variant_review-editorial-only';
  await db.storeItemOption.create({
    data: {
      variantId,
      storeItemSlug: 'review-editorial-only',
      sourceKind: 'distro',
      sourceId: 'news',
      cmsSourceId: 'news',
      catalogRevision: 1,
      catalogAvailability: 'withheld',
    },
  });
  await db.stock.create({ data: { variantId, quantity: 12, onlineQuantity: 7 } });
  await db.variantStripeMapping.create({
    data: { variantId, stripeProductId: 'prod_review', stripePriceId: 'price_review' },
  });
  const before = await Promise.all([
    db.storeItemOption.findUnique({ where: { variantId } }),
    db.stock.findUnique({ where: { variantId } }),
    db.variantStripeMapping.findUnique({ where: { variantId } }),
  ]);
  runtime.handleRevisionGet.mockResolvedValue({
    success: true,
    data: {
      item: {
        id: 'selected',
        collection: 'distro',
        entryId: 'news',
        data: {
          title: 'Reviewed distro title',
          artist_or_label: 'Other label',
          group: 'CDs',
          image: { id: 'image' },
          image_alt: 'Sleeve',
          summary: 'Updated website details',
          gallery: [],
          order: 0,
        },
      },
    },
  });
  try {
    await acceptSelectedPublication({ ...input, collection: 'distro' }, 'editor@example.com', deps);
    await processRuntimePublication(deps);
    expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
    expect(
      await Promise.all([
        db.storeItemOption.findUnique({ where: { variantId } }),
        db.stock.findUnique({ where: { variantId } }),
        db.variantStripeMapping.findUnique({ where: { variantId } }),
      ]),
    ).toEqual(before);
  } finally {
    await db.variantStripeMapping.delete({ where: { variantId } });
    await db.stock.delete({ where: { variantId } });
    await db.storeItemOption.delete({ where: { variantId } });
  }
});

test('concurrent different identities cannot create two pending publications for the same entry', async () => {
  const { deps, input } = await setup();
  const results = await Promise.allSettled(
    [input, { ...input, id: crypto.randomUUID() }].map((request) =>
      acceptSelectedPublication(request, 'editor@example.com', deps),
    ),
  );
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
});

test('review and combined preview read saved revisions over the accepted website without mutations', async () => {
  const { deps, runtime, pointer } = await setup();
  const { review, candidate } = await reviewPublication({ records: [{ collection: 'news', recordId: 'news' }] }, deps);
  expect(review.entries[0]).toMatchObject({
    before: { title: 'Published title' },
    after: { title: 'Selected title' },
    expectedRevision: 'version-1',
    issues: [],
  });
  expect(review.baseline).toBe(pointer.snapshotSha256);
  expect(review.destinations).toContainEqual({
    collection: 'news',
    recordId: 'news',
    slug: 'news',
    title: 'Selected title',
  });
  expect(() => publicationPreviewContext(review, candidate, 'other', 'news')).toThrow('highlighted');
  const context = publicationPreviewContext(review, candidate, 'news', 'news');
  expect((await context.getEntry('news', 'news'))?.data.title).toBe('Selected title');
  expect((await context.getEntry('news', 'other'))?.data.title).toBe('Published title');
  expect(review.media.image.src).toContain(`/review-media/${pointer.snapshotSha256}/`);
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect((await deps.db.prepare('SELECT COUNT(*) AS count FROM _blackbox_publications').first())?.count).toBe(0);
  expect((await readPublicationPointer(deps.bucket, 'local'))?.pointer).toEqual(pointer);
});

test('reviewed publications reject baseline changes before acceptance and processing', async () => {
  const { deps, input, pointer, runtime } = await setup();
  const selected = {
    id: input.id,
    baseline: pointer.snapshotSha256,
    records: [{ collection: input.collection, recordId: input.recordId, expectedRevision: input.expectedRevision }],
  };
  await expect(
    acceptSelectedPublication({ ...selected, baseline: 'b'.repeat(64) }, 'editor@example.com', deps),
  ).rejects.toThrow('website changed');
  await acceptSelectedPublication(selected, 'editor@example.com', deps);
  await deps.bucket.put(currentPublicationKey('local'), JSON.stringify({ ...pointer, snapshotSha256: 'b'.repeat(64) }));
  // A valid replacement manifest is required before baseline comparison.
  const oldManifest = await deps.bucket.get(`snapshots/local/manifest/${pointer.snapshotSha256}`);
  const updated = JSON.parse(await oldManifest!.text());
  updated.records[1].data.title = 'Another editor published';
  const next = await completeSnapshot(deps.bucket, 'local', JSON.stringify(updated));
  await deps.bucket.put(currentPublicationKey('local'), JSON.stringify({ ...pointer, snapshotSha256: next.sha256 }));
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('failed');
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect((await readPublicationPointer(deps.bucket, 'local'))?.pointer.snapshotSha256).toBe(next.sha256);
});

test('a reviewed baseline remains bound across lost responses and confirmation recovery', async () => {
  const { deps, input, pointer, renderer, runtime } = await setup();
  const selected = {
    id: input.id,
    baseline: pointer.snapshotSha256,
    records: [{ collection: input.collection, recordId: input.recordId, expectedRevision: input.expectedRevision }],
  };
  await acceptSelectedPublication(selected, 'editor@example.com', deps);
  renderer.fetch.mockImplementationOnce(async (request) =>
    Response.json({ sha: 'c'.repeat(40), snapshotSha256: ((await request.json()) as typeof pointer).snapshotSha256 }),
  );
  renderer.fetch.mockRejectedValueOnce(new Error('lost confirmation'));
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.stage).toBe('confirming');
  expect((await acceptSelectedPublication(selected, 'editor@example.com', deps)).status).toBe('pending');
  await expect(
    acceptSelectedPublication({ ...selected, baseline: 'c'.repeat(64) }, 'editor@example.com', deps),
  ).rejects.toThrow('conflicts');
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  expect(runtime.handleContentPublish).toHaveBeenCalledTimes(1);
  const history = await readPublicationHistory(deps.db, 'local', { collection: 'news', recordId: 'news' });
  expect(history.items[0]).toMatchObject({
    actorEmail: 'editor@example.com',
    environment: 'local',
    entries: [{ title: 'Selected title', collection: 'news', recordId: 'news' }],
  });
  expect((await readPublicationHistory(deps.db, 'local', { collection: 'news', recordId: 'other' })).items).toEqual([]);
});

test('rejects a saved revision changed after review and rechecks after renderer validation', async () => {
  const { deps, runtime, input, renderer, pointer } = await setup();
  await expect(
    reviewPublication({ records: [{ collection: 'news', recordId: 'news', expectedRevision: 'stale' }] }, deps),
  ).rejects.toThrow('draft changed');
  const selected = {
    id: input.id,
    baseline: pointer.snapshotSha256,
    records: [{ collection: input.collection, recordId: input.recordId, expectedRevision: input.expectedRevision }],
  };
  await acceptSelectedPublication(selected, 'editor@example.com', deps);
  renderer.fetch.mockImplementationOnce(async (request) => {
    runtime.handleContentGet.mockResolvedValue({
      success: true,
      data: {
        _rev: 'new',
        item: {
          id: 'news',
          slug: 'news',
          status: 'published',
          draftRevisionId: 'new-draft',
          liveRevisionId: 'selected',
        },
      },
    });
    return Response.json({
      sha: 'c'.repeat(40),
      snapshotSha256: ((await request.json()) as typeof pointer).snapshotSha256,
    });
  });
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('failed');
  expect((await readPublicationPointer(deps.bucket, 'local'))?.pointer).toEqual(pointer);
});

test.each(['artist-first', 'release-first'])(
  'publishes a new Artist and Release together (%s) with explicit dependency review',
  async (order) => {
    const { deps, pointer } = await setup();
    const content: Record<string, Record<string, unknown>> = {
      artists: {
        title: 'New artist',
        genre: 'Noise rock',
        image: { id: 'image' },
        image_alt: 'Portrait',
        bio: 'Music from Athens.',
        profile_links: [],
        videos: [],
      },
      releases: {
        title: 'New release',
        artist: 'new-artist',
        release_date: '2026-09-19',
        cover_image: { id: 'image' },
        cover_image_alt: 'Sleeve',
        formats: ['Vinyl'],
        credits: [],
      },
    };
    const ids: Record<string, string> = { artists: 'new-artist', releases: 'new-release' };
    const live = new Set<string>();
    const runtime = {
      handleContentGet: vi.fn(async (collection: string) => ({
        success: true,
        data: {
          _rev: 'v1',
          item: {
            id: ids[collection],
            slug: ids[collection],
            status: live.has(collection) ? 'published' : 'draft',
            draftRevisionId: `revision-${collection}`,
            liveRevisionId: live.has(collection) ? `revision-${collection}` : null,
            data: content[collection],
          },
        },
      })),
      handleRevisionGet: vi.fn(async (revision: string) => {
        const collection = revision.slice('revision-'.length);
        return {
          success: true,
          data: { item: { id: revision, collection, entryId: ids[collection], data: content[collection] } },
        };
      }),
      handleContentPublish: vi.fn(async (collection: string) => {
        live.add(collection);
        return { success: true, data: {} };
      }),
      handleMediaGet: vi.fn(),
    };
    deps.runtime = runtime as unknown as EmDashRuntime;
    const release = { collection: 'releases', recordId: ids.releases, expectedRevision: 'v1' };
    const artist = { collection: 'artists', recordId: ids.artists, expectedRevision: 'v1' };
    const alone = await reviewPublication({ records: [release] }, deps);
    expect(alone.review.dependencies).toEqual([
      {
        collection: 'artists',
        recordId: 'new-artist',
        title: 'New artist',
        requiredBy: 'New release',
        available: true,
      },
    ]);
    expect(() => publicationPreviewContext(alone.review, alone.candidate, ids.releases, 'releases')).toThrow('Resolve');
    const selected = order === 'artist-first' ? [artist, release] : [release, artist];
    const { review, candidate } = await reviewPublication({ records: selected }, deps);
    expect(review.entries.map((e) => e.issues)).toEqual([[], []]);
    expect(review.dependencies).toEqual([]);
    const context = publicationPreviewContext(review, candidate, ids.releases, 'releases');
    expect((await context.getEntry('releases', 'new-release'))?.data.artist).toEqual({
      collection: 'artists',
      id: 'new-artist',
    });
    expect((await context.getEntry('artists', 'new-artist'))?.data.title).toBe('New artist');
    const id = crypto.randomUUID();
    await acceptSelectedPublication(
      { id, baseline: pointer.snapshotSha256, records: selected },
      'editor@example.com',
      deps,
    );
    await processRuntimePublication(deps);
    expect((await readPublication(deps.db, 'local', id))?.status).toBe('live');
    expect(runtime.handleContentPublish.mock.calls.map((call) => call[0])).toEqual(['artists', 'releases']);
    // A later unrelated Artist draft must neither become a dependency nor leak into the Release preview.
    content.artists.title = 'Private artist edit';
    runtime.handleContentGet.mockClear();
    const later = await reviewPublication({ records: [release] }, deps);
    expect(later.review.dependencies).toEqual([]);
    expect(
      (
        await publicationPreviewContext(later.review, later.candidate, ids.releases, 'releases').getEntry(
          'artists',
          'new-artist',
        )
      )?.data.title,
    ).toBe('New artist');
    expect(runtime.handleContentGet.mock.calls.map((call) => call[0])).toEqual(['releases']);
  },
);

test('history is cursor-paginated, filtered and honest about legacy metadata', async () => {
  const { deps } = await setup();
  for (let i = 0; i < 23; i++)
    await deps.db
      .prepare(
        `INSERT INTO _blackbox_publications
    (id, environment, actor_email, requested_revision, requested_at, request_json) VALUES (?, 'local', 'editor@example.com', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        `rev-${i}`,
        i,
        i === 0 ? null : JSON.stringify({ records: [{ collection: 'news', recordId: 'news', title: `Update ${i}` }] }),
      )
      .run();
  const first = await readPublicationHistory(deps.db, 'local', {});
  expect(first.items).toHaveLength(20);
  expect(first.nextCursor).toBeDefined();
  const next = await readPublicationHistory(deps.db, 'local', { cursor: Number(first.nextCursor) });
  expect(next.items).toHaveLength(3);
  expect(next.items[2].entries).toEqual([]);
  expect(new Set([...first.items, ...next.items].map((item) => item.id)).size).toBe(23);
});
