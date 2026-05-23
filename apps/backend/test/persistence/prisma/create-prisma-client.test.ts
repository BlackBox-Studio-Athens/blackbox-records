import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma';

describe('createPrismaClient', () => {
  it('constructs a Prisma client from the COMMERCE_DB binding', async () => {
    const prisma = createPrismaClient({
      COMMERCE_DB: env.COMMERCE_DB,
    });

    expect(typeof prisma.storeItemOption.findUnique).toBe('function');
    expect(typeof prisma.itemAvailability.findUnique).toBe('function');
    await prisma.$disconnect();
  });
});
