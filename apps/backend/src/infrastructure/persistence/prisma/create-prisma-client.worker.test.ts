import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { createPrismaClient, createPrismaClientScope } from './';
import type { AppBindings } from '../../../platform/env';

describe('createPrismaClient', () => {
  it('constructs a Prisma client from the COMMERCE_DB binding', async () => {
    const prisma = createPrismaClient({
      COMMERCE_DB: env.COMMERCE_DB,
    });

    expect(typeof prisma.storeItemOption.findUnique).toBe('function');
    expect(typeof prisma.itemAvailability.findUnique).toBe('function');
    await prisma.$disconnect();
  });

  it('retains one client per object through request cleanup, with separate object scopes', async () => {
    const bindings = { COMMERCE_DB: env.COMMERCE_DB } as AppBindings;
    const firstObject = createPrismaClientScope(bindings);
    const secondObject = createPrismaClientScope(bindings);
    const first = createPrismaClient(firstObject);
    await first.$disconnect();
    expect(createPrismaClient(firstObject)).toBe(first);
    expect(createPrismaClient(secondObject)).not.toBe(first);
    expect(createPrismaClient(bindings)).not.toBe(first);
    // Cleanup did not close the retained D1 client.
    await expect(first.$queryRaw`SELECT 1`).resolves.toEqual([{ '1': 1 }]);
  });
});
