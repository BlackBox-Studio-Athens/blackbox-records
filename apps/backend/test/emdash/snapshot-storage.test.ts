import { env } from 'cloudflare:test';
import { expect, test, vi } from 'vitest';
import { completeSnapshot, storeSnapshotMedia } from '../../src/cms/snapshot-storage';
import { isSupportedCmsApiRequest } from '../../src/middleware';

test('stores immutable bytes, reuses existing objects without writes, and isolates target keys', async () => {
  const bytes = new TextEncoder().encode('snapshot bytes');
  const result = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes);
  const first = await env.TEST_SNAPSHOTS.get(result.key);
  expect(await first!.text()).toBe('snapshot bytes');
  expect(first!.httpMetadata?.cacheControl).toBe('private, no-store');
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  expect(await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes)).toEqual(result);
  expect(put).not.toHaveBeenCalled();
  put.mockRestore();
  const head = vi.spyOn(env.TEST_SNAPSHOTS, 'head').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
  const parallel = await Promise.all([1, 2].map(() => storeSnapshotMedia(env.TEST_SNAPSHOTS, 'uat', bytes)));
  head.mockRestore();
  expect(parallel[0]).toEqual(parallel[1]);
  expect(parallel[0].key).not.toBe(result.key);
  expect((await env.TEST_SNAPSHOTS.head(result.key))!.version).toBe(first!.version);
  for (const key of [
    result.key,
    encodeURIComponent(result.key),
    '%2573napshots/local/manifest/x',
    'backups/private.sql',
  ]) {
    for (const method of ['GET', 'HEAD'])
      expect(
        isSupportedCmsApiRequest(new Request('https://staff.example/_emdash/api/media/file/' + key, { method })),
      ).toBe(false);
  }
});

test('does not overwrite an existing corrupt object or write oversized input', async () => {
  const bytes = new TextEncoder().encode('corrupt object case');
  const result = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes);
  await env.TEST_SNAPSHOTS.put(result.key, 'different bytes');
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  await expect(storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes)).rejects.toThrow('integrity');
  await expect(storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', new Uint8Array(20 * 1024 * 1024 + 1))).rejects.toThrow(
    'size',
  );
  expect(put).not.toHaveBeenCalled();
  put.mockRestore();
  expect(await (await env.TEST_SNAPSHOTS.get(result.key))!.text()).toBe('different bytes');
});

test('recovers a lost write acknowledgement without another write', async () => {
  const bytes = new TextEncoder().encode('lost acknowledgement');
  const nativePut = env.TEST_SNAPSHOTS.put.bind(env.TEST_SNAPSHOTS);
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put').mockImplementationOnce(async (key, body, options) => {
    await nativePut(key, body, options);
    throw new Error('Lost acknowledgement');
  });
  await expect(storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes)).rejects.toThrow('acknowledgement');
  const recovered = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes);
  expect(put).toHaveBeenCalledTimes(1);
  put.mockRestore();
  expect(await (await env.TEST_SNAPSHOTS.get(recovered.key))!.text()).toBe('lost acknowledgement');
});

test('completes only a valid manifest whose referenced image bytes exist in the same environment', async () => {
  const bytes = Uint8Array.from(
    atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII='),
    (character) => character.charCodeAt(0),
  );
  const stored = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', bytes);
  const invalidImage = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'local', new TextEncoder().encode('not an image'));
  const snapshot = {
    schemaVersion: 1,
    environment: 'local',
    records: [
      {
        collection: 'news',
        id: 'news',
        slug: 'news',
        revisionId: 'live',
        data: { title: 'News', date: '2026-09-14', summary: 'Copy', image: { id: 'image' }, image_alt: 'Cover' },
      },
    ],
    media: [
      {
        id: 'image',
        sha256: stored.sha256,
        filename: 'cover.png',
        mimeType: 'image/png',
        size: bytes.byteLength,
        width: 1,
        height: 1,
      },
    ],
  };
  const json = JSON.stringify(snapshot);
  const result = await completeSnapshot(env.TEST_SNAPSHOTS, 'local', json);
  expect(await (await env.TEST_SNAPSHOTS.get(result.key))!.text()).toBe(json);
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  expect(await completeSnapshot(env.TEST_SNAPSHOTS, 'local', json)).toEqual(result);
  expect(put).not.toHaveBeenCalled();
  await expect(completeSnapshot(env.TEST_SNAPSHOTS, 'uat', json)).rejects.toThrow();
  await expect(
    completeSnapshot(env.TEST_SNAPSHOTS, 'uat', JSON.stringify({ ...snapshot, environment: 'uat' })),
  ).rejects.toThrow('Missing');
  for (const patch of [
    { media: [] },
    { media: [...snapshot.media, snapshot.media[0]] },
    { records: [...snapshot.records, snapshot.records[0]] },
    { media: [{ ...snapshot.media[0], width: 2 }] },
    { media: [{ ...snapshot.media[0], sha256: invalidImage.sha256, size: invalidImage.size }] },
    { media: [{ ...snapshot.media[0], filename: '../unsafe.png' }] },
    { records: [{ ...snapshot.records[0], data: { ...snapshot.records[0].data, date: 'invalid' } }] },
  ])
    await expect(
      completeSnapshot(env.TEST_SNAPSHOTS, 'local', JSON.stringify({ ...snapshot, ...patch })),
    ).rejects.toThrow();
  expect(put).not.toHaveBeenCalled();
  put.mockRestore();
  await env.TEST_SNAPSHOTS.delete(stored.key);
  await expect(completeSnapshot(env.TEST_SNAPSHOTS, 'local', json)).rejects.toThrow('Missing');
  expect(await (await env.TEST_SNAPSHOTS.get(result.key))!.text()).toBe(json);
});
