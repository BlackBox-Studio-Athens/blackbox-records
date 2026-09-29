import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { parseStoreItemSlug, parseVariantId, parseStripePriceId } from '../../../src/domain/commerce/ids';
import { createStockQuantity, createStockChangeDelta } from '../../../src/domain/commerce';
import { createStripeCatalogRequestShapeFingerprint } from '../../../src/application/commerce/catalog-sync';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  D1OperatorStockRepository,
} from '../../../src/infrastructure/persistence/prisma';

it.each(['release', 'distro'] as const)(
  'atomically links one %s identity and resumes without duplicates',
  async (sourceKind) => {
    const db = createPrismaClient(env);
    const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
    const item = {
      variantId: parseVariantId(`variant_setup_catalog_${sourceKind}`),
      storeItemSlug: parseStoreItemSlug(`setup-catalog-${sourceKind}`),
      sourceKind,
      sourceId: `setup-source-${sourceKind}`,
    };
    const presentation = {
      itemType: 'Vinyl 12-inch',
      priceKind: 'fixed',
      productProjection: {
        name: 'Setup record',
        description: 'CMS description',
        imageUrls: [],
        metadata: {},
        taxCode: 'txcd_99999999',
      },
    };
    const input = {
      id: `setup-catalog-${sourceKind}`,
      kind: 'item_setup' as const,
      variantId: item.variantId,
      expectedRevision: 0,
      actorEmail: 'operator@example.com',
      inputFingerprint: createStripeCatalogRequestShapeFingerprint(item),
    };
    try {
      await journal.begin(input);
      const claim = (await journal.claim(input.id))!;
      const operation = (await journal.advance(claim, 'source_linked', { cmsSourceId: `cms-${sourceKind}` }))!;
      expect(await journal.linkSetupCatalog({ ...operation, claimToken: 'stale' }, item, presentation)).toBe(false);
      expect(await journal.linkSetupCatalog(operation, item, presentation, new Date(Date.now() + 120_000))).toBe(false);
      await db.variantStripeMapping.create({ data: { variantId: item.variantId, stripePriceId: 'price_existing' } });
      expect(await journal.linkSetupCatalog(operation, item, presentation)).toBe(false);
      await db.variantStripeMapping.delete({ where: { variantId: item.variantId } });
      const trigger = `fail_setup_${sourceKind}`;
      await env.COMMERCE_DB.exec(
        `CREATE TRIGGER ${trigger} BEFORE INSERT ON StoreItemOption WHEN NEW.variantId = '${item.variantId}' BEGIN SELECT RAISE(ABORT, 'setup failure'); END`,
      );
      try {
        await expect(journal.linkSetupCatalog(operation, item, presentation)).rejects.toThrow();
        expect(await journal.find(input.id)).toMatchObject({ step: 'source_linked' });
        expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toBeNull();
      } finally {
        await env.COMMERCE_DB.exec(`DROP TRIGGER ${trigger}`);
      }
      const attempts = await Promise.all([
        journal.linkSetupCatalog(operation, item, presentation),
        journal.linkSetupCatalog(operation, item, presentation),
      ]);
      expect(attempts.filter(Boolean)).toHaveLength(1);
      expect(await journal.begin(input)).toMatchObject({ step: 'catalog_linked' });
      const saved = await db.storeItemOption.findUnique({ where: { variantId: item.variantId } });
      expect(saved).toMatchObject({
        ...item,
        cmsSourceId: `cms-${sourceKind}`,
        catalogAvailability: 'withheld',
        catalogRevision: 0,
      });
      expect(await journal.linkSetupCatalog(operation, item, presentation)).toBe(false);
      expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toEqual(saved);
      expect(await db.itemAvailability.findUnique({ where: { variantId: item.variantId } })).toBeNull();
      const catalog = (await journal.find(input.id))!;
      const productId = `prod_setup_${sourceKind}`;
      const priceId = parseStripePriceId(`price_setup_${sourceKind}`);
      const product = (await journal.advance(catalog, 'product_bound', { stripeProductId: productId }))!;
      expect(await journal.bindSetupPrice({ ...product, claimToken: 'stale' }, priceId)).toBe(false);
      expect(await journal.bindSetupPrice(product, priceId, new Date(Date.now() + 120_000))).toBe(false);
      await db.variantStripeMapping.create({
        data: { variantId: `${item.variantId}_foreign`, stripeProductId: productId, stripePriceId: priceId },
      });
      expect(await journal.bindSetupPrice(product, priceId)).toBe(false);
      await db.variantStripeMapping.delete({ where: { stripeProductId: productId } });
      await env.COMMERCE_DB.exec(
        `CREATE TRIGGER ${trigger} BEFORE INSERT ON VariantStripeMapping WHEN NEW.variantId = '${item.variantId}' BEGIN SELECT RAISE(ABORT, 'binding failure'); END`,
      );
      try {
        await expect(journal.bindSetupPrice(product, priceId)).rejects.toThrow();
        expect(await journal.find(input.id)).toMatchObject({ step: 'product_bound' });
        expect(await db.variantStripeMapping.findUnique({ where: { variantId: item.variantId } })).toBeNull();
      } finally {
        await env.COMMERCE_DB.exec(`DROP TRIGGER ${trigger}`);
      }
      const bindings = await Promise.all([
        journal.bindSetupPrice(product, priceId),
        journal.bindSetupPrice(product, priceId),
      ]);
      expect(bindings.filter(Boolean)).toHaveLength(1);
      const bound = (await journal.find(input.id))!;
      expect(bound).toMatchObject({
        step: 'price_bound',
        results: { stripeProductId: productId, stripePriceId: priceId },
      });
      expect(await db.variantStripeMapping.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        stripeProductId: productId,
        stripePriceId: priceId,
      });
      const stock = new D1OperatorStockRepository(env.COMMERCE_DB);
      expect(await stock.initializeOpeningStock(bound, createStockQuantity(10))).toBe(true);
      await stock.recordChange({
        variantId: item.variantId,
        quantityDelta: createStockChangeDelta(-2),
        actorEmail: input.actorEmail,
        reason: 'Sale',
        notes: null,
      });
      expect(await journal.bindSetupPrice(product, priceId)).toBe(false);
      expect(await stock.initializeOpeningStock(bound, createStockQuantity(10))).toBe(false);
      expect(await db.stock.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        quantity: 8,
        onlineQuantity: 8,
      });
      expect(await db.stockChange.count({ where: { variantId: item.variantId } })).toBe(2);
      expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toEqual(saved);
      // A second operation with another variant cannot claim the already-linked source or slug.
      const other = { ...input, id: `${input.id}-other`, variantId: parseVariantId(`${item.variantId}_other`) };
      await journal.begin(other);
      const otherClaim = (await journal.claim(other.id))!;
      const linked = (await journal.advance(otherClaim, 'source_linked', { cmsSourceId: `cms-${sourceKind}` }))!;
      expect(
        await journal.linkSetupCatalog(
          linked,
          {
            ...item,
            variantId: other.variantId,
            storeItemSlug: parseStoreItemSlug(`${item.storeItemSlug}-other`),
            sourceId: 'another-source',
          },
          presentation,
        ),
      ).toBe(false);
      expect(await journal.find(other.id)).toMatchObject({ step: 'source_linked' });
      expect(await db.storeItemOption.count({ where: { sourceKind, cmsSourceId: `cms-${sourceKind}` } })).toBe(1);
      const initialized = (await journal.find(input.id))!;
      await expect(journal.advance(initialized, 'completed')).rejects.toThrow('Invalid');
      expect(await journal.completeSetup({ ...initialized, claimToken: 'stale' }, presentation)).toBe(false);
      expect(await journal.completeSetup(initialized, presentation, new Date(Date.now() + 120_000))).toBe(false);
      await db.variantStripeMapping.update({
        where: { variantId: item.variantId },
        data: { stripePriceId: 'price_changed' },
      });
      expect(await journal.completeSetup(initialized, presentation)).toBe(false);
      await db.variantStripeMapping.update({ where: { variantId: item.variantId }, data: { stripePriceId: priceId } });
      await env.COMMERCE_DB.exec(
        `CREATE TRIGGER ${trigger} BEFORE UPDATE ON StoreItemOption WHEN NEW.variantId = '${item.variantId}' BEGIN SELECT RAISE(ABORT, 'completion failure'); END`,
      );
      try {
        await expect(journal.completeSetup(initialized, presentation)).rejects.toThrow();
        expect(await journal.find(input.id)).toMatchObject({ status: 'pending', step: 'stock_initialized' });
        expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toEqual(saved);
      } finally {
        await env.COMMERCE_DB.exec(`DROP TRIGGER ${trigger}`);
      }
      expect(await journal.completeSetup(initialized, presentation)).toBe(true);
      expect(await journal.completeSetup(initialized, presentation)).toBe(false);
      expect(await journal.begin(input)).toMatchObject({ status: 'completed', step: 'completed', claimToken: null });
      expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        ...presentation,
        catalogRevision: 1,
        catalogAvailability: 'withheld',
      });
      expect(await db.stock.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        quantity: 8,
        onlineQuantity: 8,
      });
    } finally {
      await db.$disconnect();
    }
  },
);
