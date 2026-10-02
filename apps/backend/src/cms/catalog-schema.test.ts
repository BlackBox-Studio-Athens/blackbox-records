import { SchemaRegistry } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { afterEach, expect, test, vi } from 'vitest';
import { prepareCatalogSchema } from './catalog-schema';

afterEach(() => vi.restoreAllMocks());

test('catalog preparation adds optional Artist activity and News reference fields and safely repeats', async () => {
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
  expect(create).toHaveBeenCalledWith('artists', {
    slug: 'is_active',
    label: 'Active artist',
    type: 'boolean',
    required: false,
  });
  expect(create).toHaveBeenCalledWith('news', {
    slug: 'artist',
    label: 'Artist',
    type: 'reference',
    required: false,
    options: { collection: 'artists' },
  });
  expect(create).toHaveBeenCalledWith('releases', {
    slug: 'partner_links',
    label: 'partner_links',
    type: 'json',
    required: false,
  });
  const created = create.mock.calls.length;
  expect((await prepareCatalogSchema(runtime)).status).toBe(200);
  expect(create).toHaveBeenCalledTimes(created);
  fields.set('news/artist', { ...fields.get('news/artist')!, type: 'string' });
  await expect(prepareCatalogSchema(runtime)).rejects.toThrow('Unexpected field type: news.artist');
  fields.set('news/artist', { ...fields.get('news/artist')!, type: 'reference' });
  fields.set('releases/partner_links', { ...fields.get('releases/partner_links')!, type: 'string' });
  await expect(prepareCatalogSchema(runtime)).rejects.toThrow('Unexpected field type: releases.partner_links');
  fields.set('releases/partner_links', { ...fields.get('releases/partner_links')!, type: 'json' });
  fields.set('artists/is_active', { ...fields.get('artists/is_active')!, type: 'string' });
  await expect(prepareCatalogSchema(runtime)).rejects.toThrow('Unexpected field type: artists.is_active');
});
