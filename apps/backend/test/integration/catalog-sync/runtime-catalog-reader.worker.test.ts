import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { createPrismaClient, PrismaStoreItemOptionRepository } from '../../../src/infrastructure/persistence/prisma';
import { createRuntimeCatalogProductProjectionReader } from '../../../src/application/commerce/catalog-sync';
import { parseStoreItemSlug, parseVariantId } from '../../../src/domain/commerce';

it('reads newly inserted catalog data without rebuilding and rejects incomplete, unpublished, or mismatched items', async () => {
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const repository = new PrismaStoreItemOptionRepository(prisma);
  const reader = createRuntimeCatalogProductProjectionReader(repository, 'uat');
  const identity = {
    storeItemSlug: parseStoreItemSlug('new-runtime-reader-item'),
    variantId: parseVariantId('variant_runtime_reader'),
    sourceKind: 'release' as const,
    sourceId: 'new-runtime-reader-source',
  };
  const projection = {
    name: 'New runtime item',
    description: 'Copy',
    imageUrls: ['https://example.com/artwork.jpg'],
    metadata: {},
    taxCode: null,
  };
  try {
    expect(await reader.findByStoreItem(identity)).toBeNull();
    const data = {
      ...identity,
      cmsSourceId: 'cms-runtime-reader',
      itemType: 'Vinyl 12-inch',
      priceKind: 'fixed',
      catalogAvailability: 'published',
      catalogRevision: 1,
      productProjection: projection,
    };
    await prisma.storeItemOption.create({ data });
    expect(await reader.findByStoreItem(identity)).toEqual(projection);
    for (const mismatch of [
      { sourceId: 'other-source' },
      { sourceKind: 'distro' as const },
      { storeItemSlug: parseStoreItemSlug('other-slug') },
      { variantId: parseVariantId('variant_other') },
    ])
      expect(await reader.findByStoreItem({ ...identity, ...mismatch })).toBeNull();
    for (const invalid of [
      { catalogAvailability: 'withheld' },
      { catalogAvailability: 'retired' },
      { catalogRevision: 0 },
      { cmsSourceId: null },
      { itemType: null },
      { priceKind: null },
      { productProjection: { ...projection, name: '' } },
      { productProjection: { ...projection, imageUrls: ['javascript:alert(1)'] } },
      { productProjection: { ...projection, metadata: { bad: 3 } } },
    ]) {
      await prisma.storeItemOption.update({ where: { variantId: identity.variantId }, data: { ...data, ...invalid } });
      expect(await reader.findByStoreItem(identity)).toBeNull();
    }
    const updated = { ...projection, name: 'Updated runtime title' };
    await prisma.storeItemOption.update({
      where: { variantId: identity.variantId },
      data: { ...data, productProjection: updated, priceKind: 'pay_what_you_want', catalogRevision: 2 },
    });
    expect(await reader.findByStoreItem(identity)).toEqual(updated);
    const localArtwork = { ...projection, imageUrls: ['http://127.0.0.1:8787/media/published/' + 'a'.repeat(64)] };
    await prisma.storeItemOption.update({
      where: { variantId: identity.variantId },
      data: { productProjection: localArtwork },
    });
    expect(await createRuntimeCatalogProductProjectionReader(repository, 'local').findByStoreItem(identity)).toEqual(
      localArtwork,
    );
    expect(await reader.findByStoreItem(identity)).toBeNull();
    expect(await createRuntimeCatalogProductProjectionReader(repository, 'prd').findByStoreItem(identity)).toBeNull();
  } finally {
    await prisma.$disconnect();
  }
});
