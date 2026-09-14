import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import {
  changeCatalogPrice,
  CatalogPriceConflictError,
  createStripeCatalogMetadata,
  type StripeCatalogPrice,
} from '../../../src/application/commerce/catalog-sync';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../src/infrastructure/persistence/prisma';
import { parseStripePriceId } from '../../../src/domain/commerce';

it.each(['none', 'create', 'select', 'complete', 'external'] as const)(
  'finishes a price command after %s acknowledgement loss without duplicating logical writes',
  async (interruption) => {
    const db = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
    try {
      await db.storeItemOption.create({
        data: {
          variantId: `variant_command-${interruption}`,
          storeItemSlug: `command-${interruption}`,
          sourceKind: 'release',
          sourceId: `command-${interruption}`,
          cmsSourceId: `cms-command-${interruption}`,
          itemType: 'vinyl',
          priceKind: 'fixed',
          catalogAvailability: 'published',
          catalogRevision: 1,
          productProjection: { name: 'Record', description: '', imageUrls: [], metadata: {}, taxCode: null },
        },
      });
      await db.variantStripeMapping.create({
        data: {
          variantId: `variant_command-${interruption}`,
          stripeProductId: `prod_command-${interruption}`,
          stripePriceId: 'price_old',
        },
      });
      const catalog = new PrismaStoreItemOptionRepository(db);
      const mappings = new PrismaVariantStripeMappingRepository(db);
      const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
      const item = (await catalog.findByVariantId(`variant_command-${interruption}` as never))!;
      const metadata = createStripeCatalogMetadata('uat', item);
      const old: StripeCatalogPrice = {
        priceId: parseStripePriceId('price_old'),
        productId: `prod_command-${interruption}`,
        active: true,
        productActive: true,
        amountMinor: 1000,
        currencyCode: 'EUR',
        taxBehavior: 'inclusive',
        customUnitAmount: null,
        priceKind: 'fixed',
        metadata,
        productMetadata: metadata,
        productDescription: '',
        productImages: [],
        productName: 'Record',
        productTaxCode: 'txcd_99999999',
        lookupKey: null,
      };
      let replacement: StripeCatalogPrice | null = null;
      let selected = old;
      let creates = 0;
      let selections = 0;
      let interrupted = false;
      const failOnce = (phase: string) => {
        if (interruption === phase && !interrupted) {
          interrupted = true;
          throw new Error('acknowledgement lost');
        }
      };
      const gateway = {
        retrieveDefaultPrice: vi.fn(async () => selected),
        createReplacementPrice: vi.fn(async () => {
          if (!replacement) {
            creates++;
            replacement = { ...old, priceId: parseStripePriceId('price_new'), amountMinor: 2500 };
          }
          failOnce('create');
          return replacement;
        }),
        selectReplacementPrice: vi.fn(async () => {
          if (interruption === 'external') throw new CatalogPriceConflictError('Product default changed.');
          if (selected !== replacement) {
            selections++;
            selected = replacement!;
          }
          failOnce('select');
          return selected;
        }),
      };
      const complete = journal.completePriceChange.bind(journal);
      vi.spyOn(journal, 'completePriceChange').mockImplementation(async (...args) => {
        const result = await complete(...args);
        failOnce('complete');
        return result;
      });
      let time = new Date('2026-09-13T12:00:00Z');
      const deps = { environment: 'uat' as const, catalog, mappings, journal, gateway, now: () => time };
      const command = {
        operationId: `price-command-${interruption}`,
        expectedRevision: 1,
        price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2500 },
      };
      if (interruption === 'external') {
        expect(await changeCatalogPrice(deps, item.variantId, 'verified@example.com', command)).toMatchObject({
          status: 'needs_review',
        });
        expect(await changeCatalogPrice(deps, item.variantId, 'verified@example.com', command)).toMatchObject({
          status: 'needs_review',
        });
        expect(creates).toBe(1);
        expect(selections).toBe(0);
        expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
          catalogRevision: 1,
        });
        return;
      }
      if (interruption !== 'none') {
        await expect(changeCatalogPrice(deps, item.variantId, 'verified@example.com', command)).rejects.toThrow(
          'acknowledgement',
        );
        if (interruption !== 'complete') {
          expect(await changeCatalogPrice(deps, item.variantId, 'verified@example.com', command)).toMatchObject({
            status: 'pending',
          });
          expect(creates).toBe(1);
        }
        time = new Date(time.getTime() + 2 * 86_400_000);
      }
      expect(await changeCatalogPrice(deps, item.variantId, 'verified@example.com', command)).toEqual({
        operationId: command.operationId,
        variantId: item.variantId,
        status: 'completed',
      });
      expect(await changeCatalogPrice(deps, item.variantId, 'verified@example.com', command)).toMatchObject({
        status: 'completed',
      });
      expect(creates).toBe(1);
      expect(selections).toBe(1);
      expect(await db.storeItemOption.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        catalogRevision: 2,
      });
      expect(await db.storeOfferSnapshot.findUnique({ where: { variantId: item.variantId } })).toMatchObject({
        amountMinor: 2500,
        stripePriceId: 'price_new',
      });
      expect(await journal.find(command.operationId)).toMatchObject({
        actorEmail: 'verified@example.com',
        results: { previousStripePriceId: 'price_old' },
      });
      await expect(
        changeCatalogPrice(deps, item.variantId, 'verified@example.com', {
          ...command,
          price: { ...command.price, amountMinor: 3000 },
        }),
      ).rejects.toThrow('conflicts');
      await expect(
        changeCatalogPrice(deps, item.variantId, 'verified@example.com', {
          ...command,
          actorEmail: 'forged@example.com',
        }),
      ).rejects.toThrow();
      await expect(
        changeCatalogPrice({ ...deps, environment: 'prd' }, item.variantId, 'verified@example.com', command),
      ).rejects.toBeInstanceOf(CatalogPriceConflictError);
      for (const price of [
        { kind: 'fixed', currencyCode: 'USD', amountMinor: 2500 },
        { kind: 'fixed', currencyCode: 'EUR', amountMinor: 1.5 },
        { kind: 'fixed', currencyCode: 'EUR', amountMinor: 0 },
        {
          kind: 'pay_what_you_want',
          currencyCode: 'EUR',
          minimumAmountMinor: 500,
          presetAmountMinor: 100,
          maximumAmountMinor: 1000,
        },
      ])
        await expect(
          changeCatalogPrice(deps, item.variantId, 'verified@example.com', { ...command, price }),
        ).rejects.toThrow();
      expect(creates).toBe(1);
    } finally {
      await db.$disconnect();
    }
  },
);
