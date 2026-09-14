import { env } from 'cloudflare:workers';
import { expect, it, vi } from 'vitest';
import { setupCatalogItem, type StripeCatalogPrice } from '../../../src/application/commerce/catalog-sync';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  D1OperatorStockRepository,
  PrismaStoreItemOptionRepository,
} from '../../../src/infrastructure/persistence/prisma';
import { createStockChangeDelta, parseStripePriceId, parseVariantId } from '../../../src/domain/commerce';

it.each(['none', 'source', 'product', 'price', 'binding', 'stock', 'complete'] as const)(
  'resumes full setup after %s acknowledgement loss',
  async (interruption) => {
    const db = createPrismaClient(env);
    const journal = new D1CatalogOperationRepository(env.COMMERCE_DB);
    const stock = new D1OperatorStockRepository(env.COMMERCE_DB);
    let time = new Date();
    let lost = false;
    const interrupt = (step: string) => {
      if (step === interruption && !lost) {
        lost = true;
        throw new Error('Lost response');
      }
    };
    const source = {
      id: `cms-command-${interruption}`,
      slug: `setup-command-${interruption}`,
      data: { title: 'Record' },
    };
    const command = {
      operationId: source.slug,
      storeItemSlug: source.slug,
      source: { mode: 'create', sourceKind: 'release', slug: source.slug, data: source.data },
      itemType: 'Vinyl 12-inch',
      price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2200 },
      openingQuantity: 10,
    };
    const presentation = {
      name: 'Record',
      description: 'CMS content',
      imageUrls: ['https://public.example/cover.jpg'],
      metadata: {},
      taxCode: 'txcd_99999999',
    };
    const ensureSource = vi.fn(async () => {
      interrupt('source');
      return source;
    });
    const preparePresentation = vi.fn(async () => presentation);
    const priceId = parseStripePriceId(`price_command_${interruption}`);
    const gateway = {
      ensureSetupProduct: vi.fn(async () => {
        interrupt('product');
        return { productId: `prod_command_${interruption}`, active: true, name: 'Record', metadata: {} };
      }),
      createReplacementPrice: vi.fn(async () => {
        interrupt('price');
        return { priceId } as StripeCatalogPrice;
      }),
      selectReplacementPrice: vi.fn(async () => ({ priceId }) as StripeCatalogPrice),
    };
    const bind = journal.bindSetupPrice.bind(journal);
    vi.spyOn(journal, 'bindSetupPrice').mockImplementation(async (...args) => {
      const result = await bind(...args);
      interrupt('binding');
      return result;
    });
    const initialize = stock.initializeOpeningStock.bind(stock);
    vi.spyOn(stock, 'initializeOpeningStock').mockImplementation(async (...args) => {
      const result = await initialize(...args);
      interrupt('stock');
      return result;
    });
    const complete = journal.completeSetup.bind(journal);
    vi.spyOn(journal, 'completeSetup').mockImplementation(async (...args) => {
      const result = await complete(...args);
      interrupt('complete');
      return result;
    });
    const deps = {
      environment: 'uat' as const,
      journal,
      stock,
      catalog: new PrismaStoreItemOptionRepository(db),
      sources: { ensureSource },
      preparePresentation,
      gateway,
      now: () => time,
    };
    try {
      await expect(
        setupCatalogItem(deps, 'operator@example.com', { ...command, itemType: 'Digital download' }),
      ).rejects.toThrow();
      await expect(
        setupCatalogItem(deps, 'operator@example.com', {
          ...command,
          source: { ...command.source, sourceKind: 'distro', data: { ...source.data, group: 'Clothes' } },
        }),
      ).rejects.toThrow('physical type');
      await expect(setupCatalogItem({ ...deps, environment: 'prd' }, 'operator@example.com', command)).rejects.toThrow(
        'confirmation',
      );
      expect(await journal.find(command.operationId)).toBeNull();
      expect(ensureSource).not.toHaveBeenCalled();
      await expect(
        setupCatalogItem(deps, 'operator@example.com', { ...command, price: { ...command.price, amountMinor: 0 } }),
      ).rejects.toThrow();
      if (interruption !== 'none') {
        await expect(setupCatalogItem(deps, 'operator@example.com', command)).rejects.toThrow('Lost response');
        time = new Date(time.getTime() + 120_000);
      }
      const result = await setupCatalogItem(deps, 'operator@example.com', command);
      expect(result.status).toBe('completed');
      expect(preparePresentation).toHaveBeenCalledTimes(1);
      expect(gateway.createReplacementPrice).toHaveBeenCalledWith(
        expect.objectContaining({ amountMinor: 2200, expectedDefaultPriceId: null }),
        expect.any(Object),
      );
      const item = await db.storeItemOption.findUnique({ where: { variantId: result.variantId } });
      expect(item).toMatchObject({
        catalogRevision: 1,
        catalogAvailability: 'withheld',
        productProjection: presentation,
      });
      expect(await db.stock.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
        quantity: 10,
        onlineQuantity: 10,
      });
      await stock.recordChange({
        variantId: parseVariantId(result.variantId),
        quantityDelta: createStockChangeDelta(-2),
        reason: 'Sale',
        notes: null,
        actorEmail: 'operator@example.com',
      });
      const calls = gateway.ensureSetupProduct.mock.calls.length;
      expect(await setupCatalogItem(deps, 'operator@example.com', command)).toEqual(result);
      expect(gateway.ensureSetupProduct).toHaveBeenCalledTimes(calls);
      expect(await db.stock.findUnique({ where: { variantId: result.variantId } })).toMatchObject({
        quantity: 8,
        onlineQuantity: 8,
      });
      await expect(setupCatalogItem(deps, 'operator@example.com', { ...command, openingQuantity: 20 })).rejects.toThrow(
        'conflicts',
      );
      expect(await db.stockChange.count({ where: { variantId: result.variantId } })).toBe(2);
    } finally {
      await db.$disconnect();
    }
  },
);
