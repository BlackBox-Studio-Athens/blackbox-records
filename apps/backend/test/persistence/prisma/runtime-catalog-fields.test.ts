import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { createPrismaClient, PrismaStoreItemOptionRepository } from '../../../src/infrastructure/persistence/prisma';
import { parseStoreItemSlug } from '../../../src/domain/commerce';

it('round-trips catalog data through D1 while preserving all unique identities and existing repository reads', async () => {
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  try {
    const input = {
      storeItemSlug: 'catalog-persistence-item',
      sourceKind: 'release' as const,
      sourceId: 'catalog-persistence-source',
      variantId: 'variant_catalog_persistence',
      cmsSourceId: '01M2DC9W8CZ962NHWEEPBWV9A2',
      itemType: 'Vinyl 12-inch',
      priceKind: 'pay_what_you_want',
      productProjection: { name: 'Catalog item', description: 'Copy', imageUrls: [], metadata: {}, taxCode: null },
    };
    const created = await prisma.storeItemOption.create({ data: input });
    expect(created).toMatchObject({ ...input, catalogAvailability: 'withheld', catalogRevision: 0 });
    expect(await prisma.storeItemOption.findUnique({ where: { id: created.id } })).toEqual(created);
    const repository = new PrismaStoreItemOptionRepository(prisma);
    expect(await repository.search('catalog item', 20)).toMatchObject([
      { variantId: input.variantId, displayName: 'Catalog item' },
    ]);
    expect(await repository.search('no matching title', 20)).toEqual([]);
    expect(await repository.findByStoreItemSlug(parseStoreItemSlug(input.storeItemSlug))).toEqual({
      storeItemSlug: input.storeItemSlug,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      variantId: input.variantId,
    });
    for (const field of ['storeItemSlug', 'sourceId', 'variantId', 'cmsSourceId'] as const) {
      await expect(
        prisma.storeItemOption.create({
          data: {
            ...input,
            storeItemSlug: 'other-slug',
            sourceId: 'other-source',
            variantId: 'variant_other',
            cmsSourceId: 'other-cms-source',
            [field]: input[field],
          },
        }),
      ).rejects.toThrow();
    }
  } finally {
    await prisma.$disconnect();
  }
});
