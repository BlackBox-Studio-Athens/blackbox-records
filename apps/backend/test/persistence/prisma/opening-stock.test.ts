import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  D1OperatorStockRepository,
} from '../../../src/infrastructure/persistence/prisma';
import { createStockChangeDelta, createStockQuantity, parseVariantId } from '../../../src/domain/commerce';
import { createStripeCatalogRequestShapeFingerprint } from '../../../src/application/commerce/catalog-sync';

it.each([0, 10])('initializes %i opening units once and preserves later movements on retry', async (quantity) => {
  const db = createPrismaClient(env);
  const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
  const stock = new D1OperatorStockRepository(env.COMMERCE_DB);
  const variantId = parseVariantId(`variant_opening_${quantity}`);
  try {
    await db.storeItemOption.create({
      data: {
        variantId,
        storeItemSlug: `opening-${quantity}`,
        sourceKind: 'release',
        sourceId: `opening-${quantity}`,
        cmsSourceId: `cms-opening-${quantity}`,
        catalogRevision: 1,
      },
    });
    await db.variantStripeMapping.create({
      data: { variantId, stripeProductId: `prod_opening_${quantity}`, stripePriceId: `price_opening_${quantity}` },
    });
    await journal.begin({
      id: `opening-${quantity}`,
      kind: 'item_setup',
      variantId,
      expectedRevision: 1,
      actorEmail: 'verified@example.com',
      inputFingerprint: createStripeCatalogRequestShapeFingerprint({ quantity }),
    });
    const claim = (await journal.claim(`opening-${quantity}`))!;
    const source = (await journal.advance(claim, 'source_linked', { cmsSourceId: `cms-opening-${quantity}` }))!;
    const catalog = (await journal.advance(source, 'catalog_linked'))!;
    const product = (await journal.advance(catalog, 'product_bound', { stripeProductId: `prod_opening_${quantity}` }))!;
    const operation = (await journal.advance(product, 'price_bound', { stripePriceId: `price_opening_${quantity}` }))!;
    await expect(journal.advance(operation, 'stock_initialized')).rejects.toThrow('Invalid');
    expect(
      await stock.initializeOpeningStock({ ...operation, claimToken: 'stale' }, createStockQuantity(quantity)),
    ).toBe(false);
    expect(
      await stock.initializeOpeningStock(
        operation,
        createStockQuantity(quantity),
        false,
        new Date(Date.now() + 120_000),
      ),
    ).toBe(false);
    await expect(stock.initializeOpeningStock(operation, -1 as never)).rejects.toThrow();
    await db.stock.create({ data: { variantId, quantity: 7, onlineQuantity: 5 } });
    expect(await stock.initializeOpeningStock(operation, createStockQuantity(quantity))).toBe(false);
    expect(await db.stock.findUnique({ where: { variantId } })).toMatchObject({ quantity: 7, onlineQuantity: 5 });
    await db.stock.delete({ where: { variantId } });
    const earlier = await db.stockChange.create({
      data: { variantId, quantityDelta: 7, reason: 'Existing history', actorEmail: 'verified@example.com' },
    });
    expect(await stock.initializeOpeningStock(operation, createStockQuantity(quantity))).toBe(false);
    expect(await db.stock.findUnique({ where: { variantId } })).toBeNull();
    await db.stockChange.delete({ where: { id: earlier.id } });
    // A late statement failure must undo the journal transition and Stock insert.
    await env.COMMERCE_DB.exec(
      `CREATE TRIGGER fail_opening_stock BEFORE INSERT ON ${quantity > 0 ? 'StockChange' : 'Stock'} WHEN NEW.variantId = '${variantId}' BEGIN SELECT RAISE(ABORT, 'opening failure'); END`,
    );
    await expect(stock.initializeOpeningStock(operation, createStockQuantity(quantity))).rejects.toThrow();
    expect(await journal.find(operation.id)).toMatchObject({ step: 'price_bound' });
    expect(await db.stock.findUnique({ where: { variantId } })).toBeNull();
    await env.COMMERCE_DB.exec('DROP TRIGGER fail_opening_stock');
    const attempts = await Promise.all([
      stock.initializeOpeningStock(operation, createStockQuantity(quantity)),
      stock.initializeOpeningStock(operation, createStockQuantity(quantity)),
    ]);
    expect(attempts.filter(Boolean)).toHaveLength(1);
    const initialized = (await journal.find(operation.id))!;
    expect(initialized.step).toBe('stock_initialized');
    expect(await db.stock.findUnique({ where: { variantId } })).toMatchObject({
      quantity,
      onlineQuantity: quantity,
      restockPlanned: false,
      revision: 0,
    });
    const history = await db.stockChange.findMany({ where: { variantId } });
    expect(history).toHaveLength(quantity > 0 ? 1 : 0);
    if (quantity > 0)
      expect(history[0]).toMatchObject({
        id: initialized.results.stockChangeId,
        quantityDelta: quantity,
        actorEmail: 'verified@example.com',
      });
    else expect(initialized.results.stockChangeId).toBeUndefined();
    const delta = quantity > 0 ? -2 : 3;
    await stock.recordChange({
      variantId,
      quantityDelta: createStockChangeDelta(delta),
      actorEmail: 'verified@example.com',
      reason: 'Movement',
      notes: null,
    });
    const moved = await db.stock.findUnique({ where: { variantId } });
    expect(await stock.initializeOpeningStock(operation, createStockQuantity(quantity))).toBe(false);
    expect(await stock.initializeOpeningStock(initialized, createStockQuantity(quantity))).toBe(false);
    expect(await db.stock.findUnique({ where: { variantId } })).toEqual(moved);
    expect(await db.stockChange.count({ where: { variantId } })).toBe(history.length + 1);
  } finally {
    await db.$disconnect();
  }
});
