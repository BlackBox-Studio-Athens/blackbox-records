import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import {
  PrismaItemAvailabilityRepository,
  PrismaOrderStateRepository,
  PrismaStockChangeRepository,
  PrismaStockCountRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
  createPrismaClient,
} from '../../../src/infrastructure/persistence/prisma';

describe('Prisma repository seams', () => {
  it('constructs repository implementations against the shared Prisma client seam', async () => {
    const prisma = createPrismaClient({
      COMMERCE_DB: env.COMMERCE_DB,
    });

    const storeItemOptions = new PrismaStoreItemOptionRepository(prisma);
    const itemAvailability = new PrismaItemAvailabilityRepository(prisma);
    const stock = new PrismaStockRepository(prisma);
    const stockChanges = new PrismaStockChangeRepository(prisma);
    const stockCounts = new PrismaStockCountRepository(prisma);
    const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
    const orders = new PrismaOrderStateRepository(prisma);

    expect(typeof prisma.checkoutOrder.findUnique).toBe('function');
    expect(typeof orders.createPending).toBe('function');
    expect(typeof orders.findByCheckoutSessionId).toBe('function');
    expect(typeof orders.saveTransition).toBe('function');
    expect(typeof storeItemOptions.findByStoreItemSlug).toBe('function');
    expect(typeof storeItemOptions.findByVariantId).toBe('function');
    expect(typeof storeItemOptions.findBySource).toBe('function');
    expect(typeof storeItemOptions.search).toBe('function');
    expect(typeof itemAvailability.findByVariantId).toBe('function');
    expect(typeof stock.findByVariantId).toBe('function');
    expect(typeof stock.save).toBe('function');
    expect(typeof stockChanges.listByVariantId).toBe('function');
    expect(typeof stockChanges.record).toBe('function');
    expect(typeof stockCounts.listByVariantId).toBe('function');
    expect(typeof stockCounts.record).toBe('function');
    expect(typeof variantStripeMappings.findByVariantId).toBe('function');

    await prisma.$disconnect();
  });
});
