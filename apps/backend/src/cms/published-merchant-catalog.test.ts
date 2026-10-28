import { expect, it, vi } from 'vitest';
import { loadPublishedMerchantCatalog } from './published-merchant-catalog';

function fixture(snapshot: Record<string, unknown> = {}) {
  const sha = 'a'.repeat(64);
  const pointer = { id: crypto.randomUUID(), snapshotSha256: sha, generation: 1 };
  const manifest = JSON.stringify({
    schemaVersion: 1,
    environment: 'uat',
    records: [],
    media: [],
    storeItems: [],
    ...snapshot,
  });
  const object = (body: string, checksum?: string) => ({
    size: body.length,
    etag: 'etag',
    checksums: { toJSON: () => ({ sha256: checksum }) },
    body: { cancel: vi.fn() },
    json: async () => JSON.parse(body),
    text: async () => body,
  });
  const get = vi.fn(async (key: string) =>
    key === 'snapshots/uat/current.json'
      ? object(JSON.stringify(pointer))
      : key === `snapshots/uat/manifest/${sha}`
        ? object(manifest, sha)
        : null,
  );
  return { bucket: { get } as unknown as R2Bucket, get, pointer, object };
}

it('loads only the exact accepted manifest and distinguishes a verified empty catalog', async () => {
  const { bucket, get, pointer } = fixture();
  const catalog = await loadPublishedMerchantCatalog(bucket, 'uat');
  expect(catalog.identity).toBe(pointer.snapshotSha256);
  expect(catalog.snapshot.storeItems).toEqual([]);
  await expect(catalog.isCurrent()).resolves.toBe(true);
  expect(get.mock.calls.map(([key]) => key)).toEqual([
    'snapshots/uat/current.json',
    `snapshots/uat/manifest/${pointer.snapshotSha256}`,
    'snapshots/uat/current.json',
    'snapshots/uat/current.json',
  ]);
});

it('rejects a missing pointer, missing legacy identities and an unreadable source', async () => {
  const missing = { get: vi.fn(async () => null) } as unknown as R2Bucket;
  await expect(loadPublishedMerchantCatalog(missing, 'uat')).rejects.toThrow('unavailable');
  await expect(loadPublishedMerchantCatalog(fixture({ storeItems: undefined }).bucket, 'uat')).rejects.toThrow(
    'identities are unavailable',
  );
  const { bucket, get } = fixture();
  get.mockRejectedValue(new Error('R2 unavailable'));
  await expect(loadPublishedMerchantCatalog(bucket, 'uat')).rejects.toThrow('R2 unavailable');
});

it('rejects an unreadable or checksum-mismatched manifest and a foreign environment', async () => {
  const missing = fixture();
  missing.get.mockResolvedValueOnce(missing.object(JSON.stringify(missing.pointer))).mockResolvedValueOnce(null);
  await expect(loadPublishedMerchantCatalog(missing.bucket, 'uat')).rejects.toThrow('snapshot is unavailable');
  const corrupt = fixture();
  corrupt.get
    .mockResolvedValueOnce(corrupt.object(JSON.stringify(corrupt.pointer)))
    .mockResolvedValueOnce(corrupt.object('{}', 'b'.repeat(64)));
  await expect(loadPublishedMerchantCatalog(corrupt.bucket, 'uat')).rejects.toThrow('snapshot is unavailable');
  await expect(loadPublishedMerchantCatalog(fixture({ environment: 'prd' }).bucket, 'uat')).rejects.toThrow();
});

it('rejects a pointer change during loading and reports later changes without claiming an empty catalog', async () => {
  const moving = fixture();
  moving.get.mockImplementationOnce(async () => {
    const old = moving.object(JSON.stringify(moving.pointer));
    moving.pointer.generation += 1;
    return old;
  });
  await expect(loadPublishedMerchantCatalog(moving.bucket, 'uat')).rejects.toThrow('changed during loading');
  const stable = fixture();
  const catalog = await loadPublishedMerchantCatalog(stable.bucket, 'uat');
  stable.pointer.id = crypto.randomUUID();
  await expect(catalog.isCurrent()).resolves.toBe(false);
  stable.get.mockRejectedValue(new Error('R2 unavailable'));
  await expect(catalog.isCurrent()).rejects.toThrow('R2 unavailable');
});
