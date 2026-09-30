import { SchemaRegistry } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { afterEach, expect, test, vi } from 'vitest';
import { prepareCatalogSchema } from './catalog-schema';

afterEach(() => vi.restoreAllMocks());

test('catalog preparation adds one optional News Artist reference and safely repeats', async () => {
  const fields = new Map<string, Awaited<ReturnType<SchemaRegistry['getField']>>>();
  vi.spyOn(SchemaRegistry.prototype, 'getField').mockImplementation(
    async (collection, slug) => fields.get(`${collection}/${slug}`) ?? null,
  );
  vi.spyOn(SchemaRegistry.prototype, 'getCollection').mockResolvedValue(null);
  const create = vi.spyOn(SchemaRegistry.prototype, 'createField').mockImplementation(async (collection, input) => {
    const field = input as Awaited<ReturnType<SchemaRegistry['createField']>>;
    fields.set(`${collection}/${input.slug}`, field);
    return field;
  });
  const runtime = { db: {} } as EmDashRuntime;
  expect((await prepareCatalogSchema(runtime)).status).toBe(200);
  expect(create).toHaveBeenCalledWith('news', {
    slug: 'artist',
    label: 'Artist',
    type: 'reference',
    required: false,
    options: { collection: 'artists' },
  });
  const created = create.mock.calls.length;
  expect((await prepareCatalogSchema(runtime)).status).toBe(200);
  expect(create).toHaveBeenCalledTimes(created);
  fields.set('news/artist', { ...fields.get('news/artist')!, type: 'string' });
  await expect(prepareCatalogSchema(runtime)).rejects.toThrow('Unexpected field type: news.artist');
});
