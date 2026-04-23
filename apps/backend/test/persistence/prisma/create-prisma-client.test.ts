import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';

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

describe('createPrismaClient', () => {
    it('constructs a Prisma client from the COMMERCE_DB binding', async () => {
        const prisma = createPrismaClient({
            COMMERCE_DB: createD1DatabaseStub(),
        });

        expect(typeof prisma.storeItemOption.findUnique).toBe('function');
        expect(typeof prisma.itemAvailability.findUnique).toBe('function');
        await prisma.$disconnect();
    });
});
