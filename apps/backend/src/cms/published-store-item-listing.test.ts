import { expect, it, vi } from 'vitest';
import { readPublishedStoreItemSlugs } from './published-store-item-listing';
import { readPublicationPointer, readPublishedSnapshot } from './published-storage';

vi.mock('./published-storage', () => ({ readPublicationPointer: vi.fn(), readPublishedSnapshot: vi.fn() }));

it('reads one accepted snapshot and preserves missing publication identities as unknown', async () => {
  const bucket = {} as R2Bucket;
  vi.mocked(readPublicationPointer)
    .mockResolvedValueOnce(null)
    .mockResolvedValue({ pointer: { snapshotSha256: 'sha' } } as never);
  expect(await readPublishedStoreItemSlugs(bucket, 'local')).toBeNull();
  vi.mocked(readPublishedSnapshot)
    .mockResolvedValueOnce({ storeItems: [{ storeItemSlug: 'listed' }] } as never)
    .mockResolvedValueOnce({} as never);
  expect(await readPublishedStoreItemSlugs(bucket, 'local')).toEqual(new Set(['listed']));
  expect(await readPublishedStoreItemSlugs(bucket, 'local')).toBeNull();
  expect(readPublishedSnapshot).toHaveBeenCalledTimes(2);
  vi.mocked(readPublishedSnapshot).mockRejectedValueOnce(new Error('unavailable'));
  expect(await readPublishedStoreItemSlugs(bucket, 'local')).toBeNull();
  expect(await readPublishedStoreItemSlugs(undefined, 'local')).toBeNull();
});
