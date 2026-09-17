import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import { createPrismaClient, PrismaStoreItemOptionRepository } from '../../../src/infrastructure/persistence/prisma';
import { inventoryQuerySchema } from '../../../src/application/commerce/stock/inventory';

it('paginates 250 items with duplicate titles, server filters, missing stock and a fixed cutoff', async ({ task }) => {
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const repository = new PrismaStoreItemOptionRepository(prisma);
  const reads = vi.spyOn(prisma, '$queryRawUnsafe');
  try {
    for (let offset = 0; offset < 250; offset += 10)
      await prisma.storeItemOption.createMany({
        data: Array.from({ length: 10 }, (_, index) => {
          const number = offset + index;
          return {
            id: `inventory-test-${number}`,
            sourceKind: 'distro' as const,
            sourceId: `inventory-test-${number}`,
            variantId: `inventory-test-${number}`,
            storeItemSlug: `inventory-test-${number}`,
            itemType: number % 2 ? 'Tapes' : 'Clothes',
            productProjection: {
              name:
                number < 4
                  ? `Inventory test Ω ${number}`
                  : `Inventory test ${Math.floor(number / 2)
                      .toString()
                      .padStart(3, '0')}`,
            },
            createdAt: new Date('2026-01-01T00:00:00Z'),
          };
        }),
      });
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await repository.readInventory(
        inventoryQuerySchema.parse({
          q: 'Inventory test',
          cursor,
          area: 'distro',
          format: 'Tapes',
          before: '2026-02-01T00:00:00Z',
        }),
      );
      expect(page.items.length).toBeLessThanOrEqual(25);
      expect(page.items.every((item) => item.itemType === 'Tapes' && item.quantity === null)).toBe(true);
      ids.push(...page.items.map((item) => item.variantId));
      cursor = page.nextCursor;
    } while (cursor);
    expect(ids.length).toBe(125);
    expect(new Set(ids).size).toBe(125);
    expect(reads).toHaveBeenCalledTimes(5);
    const [sql, ...parameters] = reads.mock.calls[0]!;
    const measured = await env.COMMERCE_DB.prepare(sql)
      .bind(...parameters)
      .all();
    Object.assign(task.meta, {
      inventoryCost: { catalogSize: 250, pageSize: 25, queriesPerPage: 1, rowsRead: measured.meta.rows_read },
    });
    let greekCursor: string | undefined;
    const greekIds: string[] = [];
    do {
      const page = await repository.readInventory(
        inventoryQuerySchema.parse({ q: 'Inventory test Ω', limit: 1, cursor: greekCursor }),
      );
      greekIds.push(...page.items.map((item) => item.variantId));
      greekCursor = page.nextCursor;
    } while (greekCursor);
    expect(new Set(greekIds).size).toBe(4);
    expect(
      (await repository.readInventory(inventoryQuerySchema.parse({ q: 'Inventory test 124' }))).items,
    ).toHaveLength(2);
    expect(
      (
        await repository.readInventory(
          inventoryQuerySchema.parse({ q: 'Inventory test', before: '2025-01-01T00:00:00Z' }),
        )
      ).items,
    ).toHaveLength(0);
    expect(inventoryQuerySchema.safeParse({ cursor: '[1,2,3]' }).success).toBe(false);
    expect(inventoryQuerySchema.safeParse({ format: 'x'.repeat(101) }).success).toBe(false);
  } finally {
    await prisma.storeItemOption.deleteMany({ where: { id: { startsWith: 'inventory-test-' } } });
    await prisma.$disconnect();
  }
});
