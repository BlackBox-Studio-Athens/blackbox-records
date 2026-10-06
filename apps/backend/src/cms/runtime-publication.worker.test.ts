import { applyD1Migrations, env } from 'cloudflare:test';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { ContentRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { acceptSelectedPublication, processRuntimePublication, selectedPublicationSchema } from './runtime-publication';
import {
  activatePublication,
  currentPublicationKey,
  readPublicationPointer,
  readPublishedSnapshot,
  PublicSnapshotSelection,
} from './published-storage';
import { invalidatePublicPublication, publicInvalidationPath } from './public-publication-cache';
import { completeSnapshot, storeSnapshotMedia } from './snapshot-storage';
import { createPrismaClient } from '../infrastructure/persistence/prisma';
import { readPublication } from './publication-journal';
import { readPublicationHistory } from './publication-journal';
import { readPublicationDetails } from './publication-history';
import { reviewPublication } from './publication-review';
import { publishedCollection, parseContentSnapshot, publicationReviewSchema } from '@blackbox/content-model';
import { selectPreviewContent, previewDestination } from './preview-selection';
import { projectArtistReference, readRevisionContent } from './publication-projection';

afterEach(() => vi.restoreAllMocks());

async function withdrawalFixture() {
  const fixture = await setup();
  const { deps, runtime } = fixture;
  const snapshot = await readPublishedSnapshot(deps.bucket, 'local', fixture.pointer.snapshotSha256);
  const data = {
    title: 'Withdraw vinyl',
    artist_or_label: 'Test band',
    format: 'Vinyl',
    group: 'Vinyl 12-inch',
    image: { id: 'withdraw-image' },
    image_alt: 'Cover',
    summary: 'Public copy',
    order: 1,
  };
  const records = ['linked', 'unlinked'].map((id) => ({
    collection: 'distro',
    id,
    slug: id,
    revisionId: `${id}-live`,
    data,
  }));
  const storeItems = [
    { sourceKind: 'distro', sourceId: 'linked', storeItemSlug: 'linked-vinyl', variantId: 'variant_withdrawal' },
  ];
  const stored = await completeSnapshot(
    deps.bucket,
    'local',
    JSON.stringify({
      ...snapshot,
      records: [...snapshot.records, ...records],
      media: [...snapshot.media, { ...snapshot.media[0], id: 'withdraw-image' }],
      storeItems,
    }),
  );
  const pointer = { ...fixture.pointer, snapshotSha256: stored.sha256 };
  await deps.bucket.delete(currentPublicationKey('local'));
  await activatePublication(deps.bucket, 'local', pointer);
  const items = new Map(
    records.map(({ id, slug, revisionId }) => [
      id,
      {
        id,
        slug,
        version: 1,
        status: 'published',
        liveRevisionId: revisionId as string | null,
        draftRevisionId: `${id}-draft`,
      },
    ]),
  );
  runtime.handleContentGet.mockImplementation(async (_collection?: string, id = 'linked') => {
    const item = items.get(id)!;
    return {
      success: true,
      data: { _rev: `version-${item.version}`, item: { ...item, liveRevisionId: item.liveRevisionId ?? '' } },
    };
  });
  runtime.handleRevisionGet.mockImplementation(async (id = 'linked-draft') => ({
    success: true,
    data: {
      item: {
        id,
        collection: 'distro',
        entryId: id?.split('-')[0],
        data: { ...data, title: 'Private incomplete draft', artist_or_label: '', _slug: id?.split('-')[0] },
      },
    },
  }));
  const unpublish = vi.fn(async (_collection: string, id: string) => {
    const item = items.get(id)!;
    item.status = 'draft';
    item.liveRevisionId = null;
    item.version++;
    return { success: true, data: { item: { ...item }, _rev: `version-${item.version}` } };
  });
  deps.runtime = { ...runtime, handleContentUnpublish: unpublish } as unknown as EmDashRuntime;
  const db = createPrismaClient(env);
  const where = { variantId: 'variant_withdrawal' };
  await db.stock.deleteMany({ where });
  await db.variantStripeMapping.deleteMany({ where });
  await db.itemAvailability.deleteMany({ where });
  await db.storeItemOption.deleteMany({ where });
  await db.storeItemOption.create({
    data: {
      variantId: 'variant_withdrawal',
      sourceKind: 'distro',
      sourceId: 'linked',
      cmsSourceId: 'linked',
      storeItemSlug: 'linked-vinyl',
      catalogRevision: 0,
      catalogAvailability: 'published',
    },
  });
  await db.itemAvailability.create({ data: { variantId: 'variant_withdrawal', canBuy: true, status: 'available' } });
  await db.stock.create({ data: { variantId: 'variant_withdrawal', quantity: 9, onlineQuantity: 7 } });
  await db.variantStripeMapping.create({
    data: { variantId: 'variant_withdrawal', stripeProductId: 'prod_withdrawal', stripePriceId: 'price_withdrawal' },
  });
  const input = {
    id: crypto.randomUUID(),
    action: 'withdraw' as const,
    baseline: pointer.snapshotSha256,
    records: records.map(({ id }) => ({ collection: 'distro', recordId: id, expectedRevision: 'version-1' })),
  };
  return { ...fixture, pointer, items, unpublish, db, input };
}

test('withdraws linked and unlinked Distro without publishing incomplete drafts or changing stock and prices', async () => {
  const { deps, input, db, runtime, unpublish } = await withdrawalFixture();
  const stock = await db.stock.findUnique({ where: { variantId: 'variant_withdrawal' } });
  const mapping = await db.variantStripeMapping.findUnique({ where: { variantId: 'variant_withdrawal' } });
  const { review, candidate } = await reviewPublication(
    { action: input.action, records: input.records, baseline: input.baseline },
    deps,
  );
  expect(
    review.entries.every(
      (entry) => entry.action === 'withdraw' && entry.issues.length === 0 && Object.keys(entry.after).length === 0,
    ),
  ).toBe(true);
  expect(candidate.records.filter((record) => record.collection === 'distro')).toEqual([]);
  expect(candidate.storeItems).toEqual([]);
  expect(candidate.media.map((item) => item.id)).toEqual(['image']);
  expect(() => parseContentSnapshot(JSON.stringify(candidate), 'local')).not.toThrow();
  expect(() =>
    parseContentSnapshot(
      JSON.stringify({
        ...candidate,
        storeItems: [
          { sourceKind: 'distro', sourceId: 'linked', storeItemSlug: 'linked-vinyl', variantId: 'variant_withdrawal' },
        ],
      }),
      'local',
    ),
  ).toThrow('no published source');
  expect(unpublish).not.toHaveBeenCalled();
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  await expect(acceptSelectedPublication({ ...input, action: 'publish' }, 'editor@example.com', deps)).rejects.toThrow(
    'conflicts',
  );
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  const pointer = (await readPublicationPointer(deps.bucket, 'local'))!.pointer;
  const accepted = await readPublishedSnapshot(deps.bucket, 'local', pointer.snapshotSha256);
  expect(accepted.records.map((record) => record.id)).toEqual(['news', 'other']);
  expect(accepted.storeItems).toEqual([]);
  expect(accepted.media).toEqual(candidate.media);
  expect(await deps.bucket.head(`snapshots/local/accepted/${input.baseline}`)).not.toBeNull();
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect(unpublish).toHaveBeenCalledTimes(2);
  expect(await db.stock.findUnique({ where: { variantId: 'variant_withdrawal' } })).toEqual(stock);
  expect(await db.variantStripeMapping.findUnique({ where: { variantId: 'variant_withdrawal' } })).toEqual(mapping);
  expect(await db.itemAvailability.findUnique({ where: { variantId: 'variant_withdrawal' } })).toMatchObject({
    canBuy: false,
  });
  expect(await db.storeItemOption.findUnique({ where: { variantId: 'variant_withdrawal' } })).toMatchObject({
    catalogAvailability: 'withheld',
  });
  expect((await acceptSelectedPublication(input, 'editor@example.com', deps)).status).toBe('live');
  await db.$disconnect();
});

test.each(['renderer', 'native response', 'confirmation'])('recovers withdrawal after lost %s', async (failure) => {
  const { deps, input, renderer, unpublish, db } = await withdrawalFixture();
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  if (failure === 'renderer') renderer.fetch.mockRejectedValueOnce(new Error('renderer unavailable'));
  if (failure === 'native response') {
    const transition = unpublish.getMockImplementation()!;
    unpublish.mockImplementationOnce(async (...args) => {
      await transition(...args);
      throw new Error('lost native response');
    });
  }
  if (failure === 'confirmation') {
    const send = renderer.fetch.getMockImplementation()!;
    renderer.fetch.mockImplementationOnce(async (request) =>
      Response.json({
        sha: 'c'.repeat(40),
        snapshotSha256: ((await request.json()) as { snapshotSha256: string }).snapshotSha256,
      }),
    );
    renderer.fetch.mockImplementationOnce(send);
    renderer.fetch.mockRejectedValueOnce(new Error('lost confirmation'));
  }
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('pending');
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  expect(unpublish).toHaveBeenCalledTimes(2);
  expect(await db.storeItemOption.findUnique({ where: { variantId: 'variant_withdrawal' } })).toMatchObject({
    catalogRevision: 1,
  });
  await db.$disconnect();
});

test.each(['revision', 'baseline', 'newer draft'])('rejects changed %s during withdrawal', async (conflict) => {
  const { deps, input, items, renderer, pointer, unpublish, db } = await withdrawalFixture();
  if (conflict === 'revision') {
    items.get('unlinked')!.version++;
    await expect(acceptSelectedPublication(input, 'editor@example.com', deps)).rejects.toThrow('changed');
    expect(unpublish).not.toHaveBeenCalled();
  } else {
    await acceptSelectedPublication(input, 'editor@example.com', deps);
    if (conflict === 'baseline') {
      const current = (await readPublicationPointer(deps.bucket, 'local'))!;
      await activatePublication(
        deps.bucket,
        'local',
        { ...pointer, id: crypto.randomUUID(), generation: 100 },
        current.etag,
      );
    } else
      renderer.fetch.mockImplementationOnce(async (request) => {
        items.get('linked')!.version++;
        return Response.json({
          sha: 'c'.repeat(40),
          snapshotSha256: ((await request.json()) as { snapshotSha256: string }).snapshotSha256,
        });
      });
    await processRuntimePublication(deps);
    expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('failed');
    expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer.id).not.toBe(input.id);
  }
  await db.$disconnect();
});

test('withdrawal requires Distro and a reviewed baseline', () => {
  const records = [{ collection: 'news', recordId: 'news', expectedRevision: 'v1' }];
  expect(publicationReviewSchema.safeParse({ action: 'withdraw', records }).success).toBe(false);
  expect(
    selectedPublicationSchema.safeParse({
      id: crypto.randomUUID(),
      action: 'withdraw',
      records: [{ ...records[0], collection: 'distro' }],
    }).success,
  ).toBe(false);
});

test.each(['releases', 'news'])(
  'native %s Artist references override stale columns without reading a newer draft selection',
  async (collection) => {
    const item = { data: { artist: 'stale', title: 'LOTUS' }, references: { artist: { children: [{ id: 'sidus' }] } } };
    expect(projectArtistReference(item).data.artist).toBe('sidus');
    expect(item.data.artist).toBe('stale');
    const find = vi.spyOn(ContentRepository.prototype, 'findById').mockResolvedValue({ locale: 'en' } as never);
    const translations = vi.spyOn(ContentRepository.prototype, 'findTranslations').mockResolvedValue([
      { id: 'sidus', locale: 'en' },
      { id: 'sidus-el', locale: 'el' },
    ] as never);
    const runtime = { db: {} } as EmDashRuntime;
    const revision = {
      collection,
      entryId: 'lotus',
      data: {
        artist: 'stale',
        title: 'LOTUS',
        _references: { artist: ['sidus-group'] },
        _referencesBaseline: { artist: ['previous-artist-group'] },
      },
    };
    expect(await readRevisionContent(runtime, revision)).toEqual({ artist: 'sidus', title: 'LOTUS' });
    expect(translations).toHaveBeenCalledWith('artists', 'sidus-group');
    expect(find).toHaveBeenCalledWith(collection, 'lotus');
    expect(await readRevisionContent(runtime, { ...revision, data: { _references: { artist: [] } } })).toEqual({
      artist: '',
    });
    await expect(
      readRevisionContent(runtime, { ...revision, data: { _references: { artist: ['one', 'two'] } } }),
    ).rejects.toThrow();
    const legacy = { collection, entryId: 'legacy', data: { artist: 'legacy-artist' } };
    expect(await readRevisionContent(runtime, legacy)).toBe(legacy.data);
  },
);

test('News review requires its unpublished Artist instead of exposing an unrelated draft genre', async () => {
  const { deps, runtime, pointer } = await setup();
  const baseline = await readPublishedSnapshot(deps.bucket, 'local', pointer.snapshotSha256);
  const news = baseline.records.find((record) => record.id === 'news')!;
  runtime.handleRevisionGet.mockResolvedValue({
    success: true,
    data: {
      item: { id: 'selected', collection: 'news', entryId: 'news', data: { ...news.data, artist: 'private-artist' } },
    },
  });
  runtime.handleContentGet.mockImplementation(async (collection?: string) => ({
    success: true,
    data: {
      _rev: 'version-1',
      item:
        collection === 'artists'
          ? {
              id: 'private-artist',
              slug: 'private-artist',
              status: 'draft',
              draftRevisionId: 'artist-draft',
              liveRevisionId: '',
              data: { title: 'Private artist', genre: 'Private genre' },
            }
          : { id: 'news', slug: 'news', status: 'published', draftRevisionId: 'selected', liveRevisionId: 'old' },
    },
  }));
  const records = [{ collection: 'news', recordId: 'news' }];
  const { review, candidate } = await reviewPublication({ records }, deps);
  expect(review.dependencies).toEqual([
    {
      collection: 'artists',
      recordId: 'private-artist',
      title: 'Private artist',
      requiredBy: 'Published title',
      available: true,
    },
  ]);
  expect(candidate.records.some((record) => record.collection === 'artists')).toBe(false);
  await expect(
    selectPreviewContent(
      { collection: 'news', id: 'news', publication: { records, baseline: pointer.snapshotSha256 } },
      deps,
    ),
  ).rejects.toThrow('Resolve');
  await expect(completeSnapshot(deps.bucket, 'local', JSON.stringify(candidate))).rejects.toThrow(
    'Missing published Artist',
  );
  runtime.handleRevisionGet.mockResolvedValue({
    success: true,
    data: { item: { id: 'selected', collection: 'news', entryId: 'news', data: { ...news.data, artist: '' } } },
  });
  expect((await reviewPublication({ records }, deps)).review.dependencies).toEqual([]);
});

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
      if (new URL(request.url).pathname === publicInvalidationPath)
        return invalidatePublicPublication(request, (pointer) => selection.invalidate(pointer), cache);
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
  const selection = new PublicSnapshotSelection(env.TEST_SNAPSHOTS, 'local', null);
  await selection.selected();
  const cache = { purge: vi.fn(async () => ({ success: true, errors: [] })) };
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
  return { deps, runtime, renderer, input, pointer, selection, cache };
}

test('activation refreshes warm public selection then purges through the private service before becoming live', async () => {
  const { deps, runtime, renderer, input, pointer, selection, cache } = await setup();
  expect((await selection.selected()).pointer).toEqual(pointer);
  cache.purge.mockImplementation(async () => {
    const active = (await readPublicationPointer(deps.bucket, 'local'))!.pointer;
    expect(active.id).toBe(input.id);
    expect((await selection.selected()).pointer).toEqual(active);
    expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('pending');
    return { success: true, errors: [] };
  });
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  expect(await processRuntimePublication(deps)).toBe(true);
  expect(cache.purge).toHaveBeenCalledExactlyOnceWith({ tags: ['blackbox-publication'] });
  expect(renderer.fetch.mock.calls.map(([request]) => new URL(request.url).pathname)).toEqual([
    '/__publication/validate',
    publicInvalidationPath,
    '/content-version.json',
  ]);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  expect(runtime.handleContentPublish).toHaveBeenCalledTimes(1);
  expect(await processRuntimePublication(deps)).toBe(false);
});

test.each(['rejected', 'lost response', 'unavailable API'])(
  'recovers %s purge after activation without replaying native content',
  async (failure) => {
    const { deps, runtime, renderer, input, selection, cache } = await setup();
    if (failure === 'rejected') cache.purge.mockResolvedValue({ success: false, errors: [] });
    else cache.purge.mockRejectedValue(new Error(failure));
    await acceptSelectedPublication(input, 'editor@example.com', deps);
    // An accepted pointer stays confirming even past the pre-activation retry limit.
    for (let i = 0; i < 7; i++) {
      expect(await processRuntimePublication(deps)).toBeGreaterThan(0);
      expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer.id).toBe(input.id);
      expect(await readPublication(deps.db, 'local', input.id)).toMatchObject({
        status: 'pending',
        stage: 'confirming',
      });
    }
    const active = (await readPublicationPointer(deps.bucket, 'local'))!.pointer;
    expect((await selection.selected()).pointer).toEqual(active);
    expect(renderer.fetch.mock.calls.filter(([request]) => request.method === 'GET')).toHaveLength(0);
    cache.purge.mockResolvedValue({ success: true, errors: [] });
    expect(await processRuntimePublication(deps)).toBe(true);
    expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
    expect(runtime.handleContentPublish).toHaveBeenCalledTimes(1);
    expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(active);
  },
);

test('a pending purge retry never replaces or confirms a newer accepted pointer', async () => {
  const { deps, input, cache } = await setup();
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  cache.purge.mockResolvedValueOnce({ success: false, errors: [] });
  await processRuntimePublication(deps);
  const active = (await readPublicationPointer(deps.bucket, 'local'))!;
  const newer = { ...active.pointer, id: crypto.randomUUID(), generation: active.pointer.generation + 1 };
  await activatePublication(deps.bucket, 'local', newer, active.etag);
  expect(await processRuntimePublication(deps)).toBe(true);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(newer);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('failed');
  expect(cache.purge).toHaveBeenCalledTimes(1);
});

test('retries a lost successful private purge receipt idempotently before public confirmation', async () => {
  const { deps, input, renderer, runtime, cache } = await setup();
  const send = renderer.fetch.getMockImplementation()!;
  let lost = true;
  renderer.fetch.mockImplementation(async (request) => {
    const response = await send(request);
    if (new URL(request.url).pathname === publicInvalidationPath && lost) {
      lost = false;
      expect(response.status).toBe(200);
      await response.body?.cancel();
      throw new Error('Lost private purge receipt');
    }
    return response;
  });
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  await processRuntimePublication(deps);
  const active = (await readPublicationPointer(deps.bucket, 'local'))!.pointer;
  expect(await readPublication(deps.db, 'local', input.id)).toMatchObject({ status: 'pending', stage: 'confirming' });
  expect(await processRuntimePublication(deps)).toBe(true);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  expect(cache.purge).toHaveBeenCalledTimes(2);
  expect(runtime.handleContentPublish).toHaveBeenCalledTimes(1);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(active);
});

test('does not mark an older publication live if a newer pointer wins during public confirmation', async () => {
  const { deps, input, renderer } = await setup();
  const send = renderer.fetch.getMockImplementation()!;
  let newer;
  renderer.fetch.mockImplementation(async (request) => {
    const response = await send(request);
    if (request.method === 'GET') {
      const active = (await readPublicationPointer(deps.bucket, 'local'))!;
      newer = { ...active.pointer, id: crypto.randomUUID(), generation: active.pointer.generation + 1 };
      await activatePublication(deps.bucket, 'local', newer, active.etag);
    }
    return response;
  });
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  expect(await processRuntimePublication(deps)).toBe(true);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('failed');
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(newer);
});

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
  const details = await readPublicationDetails(deps.db, deps.bucket, 'local', input.id);
  expect(details?.publication.completedAt).toEqual(expect.any(Number));
  expect(details?.comparison?.entries[0]).toMatchObject({ recordId: 'news', after: { title: 'Selected title' } });
  expect(await readPublicationDetails(deps.db, deps.bucket, 'uat', input.id)).toBeNull();
  expect(await processRuntimePublication(deps)).toBe(false);
  expect((await acceptSelectedPublication(input, 'editor@example.com', deps)).status).toBe('live');
});

test('recovers a lost post-activation response without republishing and never replaces the last valid site on verification failure', async () => {
  const { deps, runtime, renderer, input, pointer } = await setup();
  const send = renderer.fetch.getMockImplementation()!;
  await acceptSelectedPublication(input, 'editor@example.com', deps);
  renderer.fetch.mockRejectedValueOnce(new Error('renderer unavailable'));
  await processRuntimePublication(deps);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer).toEqual(pointer);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('pending');
  renderer.fetch.mockImplementationOnce(async (request) =>
    Response.json({ sha: 'c'.repeat(40), snapshotSha256: ((await request.json()) as typeof pointer).snapshotSha256 }),
  );
  renderer.fetch.mockImplementationOnce(send);
  renderer.fetch.mockRejectedValueOnce(new Error('lost confirmation'));
  await processRuntimePublication(deps);
  expect((await readPublicationPointer(deps.bucket, 'local'))!.pointer.id).toBe(input.id);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('pending');
  const beforeHash = async () =>
    (
      await deps.db
        .prepare('SELECT before_snapshot_sha256 AS hash FROM _blackbox_publications WHERE id = ?')
        .bind(input.id)
        .first<{ hash: string }>()
    )?.hash;
  expect(await beforeHash()).toBe(pointer.snapshotSha256);
  await processRuntimePublication(deps);
  expect((await readPublication(deps.db, 'local', input.id))?.status).toBe('live');
  expect(await beforeHash()).toBe(pointer.snapshotSha256);
  const completedAt = (await readPublication(deps.db, 'local', input.id))?.completedAt;
  expect(await processRuntimePublication(deps)).toBe(false);
  expect((await readPublication(deps.db, 'local', input.id))?.completedAt).toBe(completedAt);
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

test('rejects a reviewed selection whose publishable values match the accepted website', async () => {
  const { deps, runtime, input, pointer } = await setup();
  const { id, ...record } = input;
  const revision = await runtime.handleRevisionGet();
  runtime.handleRevisionGet.mockResolvedValue({
    ...revision,
    data: {
      item: {
        ...revision.data.item,
        data: { ...revision.data.item.data, title: 'Published title' },
      },
    },
  });
  await expect(
    acceptSelectedPublication({ id, records: [record], baseline: pointer.snapshotSha256 }, 'editor@example.com', deps),
  ).rejects.toThrow('No publishable differences remain.');
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect(await readPublication(deps.db, 'local', id)).toBeNull();
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
    const preview = await reviewPublication({ records: [{ collection: 'distro', recordId: 'news' }] }, deps);
    expect(preview.candidate.storeItems).toContainEqual({
      sourceKind: 'distro',
      sourceId: 'news',
      storeItemSlug: 'review-editorial-only',
      variantId,
    });
    expect(runtime.handleMediaGet).not.toHaveBeenCalled();
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
  const { review } = await reviewPublication({ records: [{ collection: 'news', recordId: 'news' }] }, deps);
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
  const publication = { records: [{ collection: 'news', recordId: 'news' }], baseline: review.baseline };
  await expect(selectPreviewContent({ collection: 'news', id: 'other', publication }, deps)).rejects.toThrow(
    'highlighted',
  );
  const selection = await selectPreviewContent({ collection: 'news', id: 'news', publication }, deps);
  expect(publishedCollection(selection.content, 'news', '/media').find((e) => e.id === 'news')?.data.title).toBe(
    'Selected title',
  );
  expect(publishedCollection(selection.content, 'news', '/media').find((e) => e.id === 'other')?.data.title).toBe(
    'Published title',
  );
  expect(review.media.image.src).toContain(`/review-media/${pointer.snapshotSha256}/`);
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect((await deps.db.prepare('SELECT COUNT(*) AS count FROM _blackbox_publications').first())?.count).toBe(0);
  expect((await readPublicationPointer(deps.bucket, 'local'))?.pointer).toEqual(pointer);
});

test('unsaved preview overlays only the selection and keeps accepted image bytes without writes', async () => {
  const { deps, runtime, pointer } = await setup();
  const baseline = await readPublishedSnapshot(deps.bucket, 'local', pointer.snapshotSha256);
  const before = await deps.bucket.list();
  const input = {
    collection: 'news' as const,
    id: 'news',
    slug: 'news',
    data: { ...baseline.records[0].data, title: 'Unsaved edit' },
  };
  const selected = await selectPreviewContent(input, deps);
  expect(selected.content.records.find((record) => record.id === 'news')).toEqual(input);
  expect(selected.content.records.find((record) => record.id === 'other')?.data.title).toBe('Published title');
  expect(selected.media.image.key).toBe(`snapshots/local/media/${baseline.media[0].sha256}`);
  expect(runtime.handleMediaGet).not.toHaveBeenCalled();
  expect(runtime.handleRevisionGet).not.toHaveBeenCalled();
  expect(runtime.handleContentPublish).not.toHaveBeenCalled();
  expect((await deps.bucket.list()).objects).toEqual(before.objects);
  expect((await deps.db.prepare('SELECT COUNT(*) AS count FROM _blackbox_publications').first())?.count).toBe(0);
  await expect(selectPreviewContent({ ...input, data: { ...input.data, title: '' } }, deps)).rejects.toThrow();
  expect(input.data.title).toBe('Unsaved edit');
});

test('new transient Distro uses publication fallback identity and canonical detail destination', async () => {
  const { deps } = await setup();
  const selection = await selectPreviewContent(
    {
      collection: 'distro',
      slug: 'new-record',
      data: {
        title: 'New record',
        artist_or_label: 'Label',
        group: 'CDs',
        image: { id: 'image' },
        image_alt: 'Sleeve',
        summary: 'New copy',
        gallery: [],
        order: 0,
      },
    },
    deps,
  );
  expect(selection.content.storeItems).toContainEqual({
    sourceKind: 'distro',
    sourceId: 'new-record',
    storeItemSlug: 'new-record',
    variantId: 'variant_new-record_standard',
  });
  expect(previewDestination(selection, 'detail', '/blackbox-records/')).toBe('/blackbox-records/store/new-record/');
  expect(previewDestination(selection, 'listing', '/')).toBe('/store/distro/');
  expect(selection.content.records.find((record) => record.id === 'new-record')).not.toHaveProperty('revisionId');
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
    await expect(
      selectPreviewContent(
        {
          collection: 'releases',
          id: ids.releases,
          publication: { records: [release], baseline: pointer.snapshotSha256 },
        },
        deps,
      ),
    ).rejects.toThrow('Resolve');
    const selected = order === 'artist-first' ? [artist, release] : [release, artist];
    const { review, candidate } = await reviewPublication({ records: selected }, deps);
    expect(review.entries.map((e) => e.issues)).toEqual([[], []]);
    expect(review.dependencies).toEqual([]);
    const context = {
      getEntry: (name: string, id: string) =>
        publishedCollection(candidate, name, '/media', review.media).find((e) => e.id === id),
    };
    expect(context.getEntry('releases', 'new-release')?.data.store_item).toBeNull();
    expect(context.getEntry('releases', 'new-release')?.data.artist).toEqual({
      collection: 'artists',
      id: 'new-artist',
    });
    expect(context.getEntry('artists', 'new-artist')?.data.title).toBe('New artist');
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
      publishedCollection(later.candidate, 'artists', '/media', later.review.media).find((e) => e.id === 'new-artist')
        ?.data.title,
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
