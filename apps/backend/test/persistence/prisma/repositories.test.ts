import { describe, expect, it } from 'vitest';

import { PrismaCatalogItemMappingRepository, PrismaInventoryRepository, PrismaVariantStripeMappingRepository, createPrismaClient } from '../../../src/infrastructure/persistence/prisma';

function createD1DatabaseStub(): D1Database {
    return {
        batch: async () => [],
        dump: async () => new ArrayBuffer(0),
        exec: async () => ({
            count: 0,
            duration: 0,
        }),
        prepare: () => ({
            all: async () => ({ results: [], success: true, meta: { duration: 0 } }),
            bind: () => ({
                all: async () => ({ results: [], success: true, meta: { duration: 0 } }),
                first: async () => null,
                raw: async () => [],
                run: async () => ({ success: true, meta: { duration: 0 } }),
            }),
            first: async () => null,
            raw: async () => [],
            run: async () => ({ success: true, meta: { duration: 0 } }),
        }),
    } as unknown as D1Database;
}

describe('Prisma repository seams', () => {
    it('constructs repository implementations against the shared Prisma client seam', async () => {
        const prisma = createPrismaClient({
            COMMERCE_DB: createD1DatabaseStub(),
        });

        const catalogItemMappings = new PrismaCatalogItemMappingRepository(prisma);
        const inventory = new PrismaInventoryRepository(prisma);
        const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);

        expect(typeof catalogItemMappings.findByCatalogItemSlug).toBe('function');
        expect(typeof catalogItemMappings.findBySource).toBe('function');
        expect(typeof inventory.findByVariantId).toBe('function');
        expect(typeof variantStripeMappings.findByVariantId).toBe('function');

        await prisma.$disconnect();
    });
});
