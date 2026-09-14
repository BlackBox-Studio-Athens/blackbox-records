import { z } from 'zod';
import type { RuntimeCatalogRepository } from '../../../domain/commerce/repositories/spi';
import type { CatalogProductProjectionReader } from './catalog-product-projections';

const nonblank = z
  .string()
  .min(1)
  .refine((value) => value === value.trim());
const runtimeCatalogSchema = z.object({
  cmsSourceId: nonblank,
  itemType: nonblank,
  priceKind: z.enum(['fixed', 'pay_what_you_want']),
  catalogAvailability: z.literal('published'),
  catalogRevision: z.number().int().positive(),
  productProjection: z
    .object({
      name: nonblank,
      description: z.string(),
      imageUrls: z.array(z.url({ protocol: /^https$/ })),
      metadata: z.record(z.string(), z.string()),
      taxCode: nonblank.nullable(),
    })
    .strict(),
});

export function createRuntimeCatalogProductProjectionReader(
  catalog: RuntimeCatalogRepository,
): CatalogProductProjectionReader {
  return {
    async findByStoreItem(storeItem) {
      const record = await catalog.findByStoreItem(storeItem);
      const parsed = runtimeCatalogSchema.safeParse(record);
      return parsed.success ? parsed.data.productProjection : null;
    },
  };
}
