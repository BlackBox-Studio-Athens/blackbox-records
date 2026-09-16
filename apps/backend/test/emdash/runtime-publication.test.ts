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
import { readPublication } from '../../src/cms/publication-journal';

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
        item: { id: 'selected', collection: 'news', entryId: 'news', data: { ...data, title: 'Selected title' } },
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
