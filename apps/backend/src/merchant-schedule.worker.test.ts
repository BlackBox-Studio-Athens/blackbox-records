import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import type { ContentSnapshot } from '@blackbox/content-model';
import { createPrismaClient } from './infrastructure/persistence/prisma';
import { D1MerchantSyncRepository } from './infrastructure/persistence/d1-merchant-sync-repository';
import { createStripeCatalogLookupKey, createStripeCatalogMetadata } from './application/commerce/catalog-sync';
import type { StripeCatalogPrice } from './application/commerce/catalog-sync';
import { parseStoreItemSlug, parseVariantId, parseStripePriceId } from './domain/commerce';
import { GoogleMerchantError } from './infrastructure/google-merchant';
import type * as MerchantIntegration from './infrastructure/google-merchant';
import { runMerchantSchedule } from './merchant-schedule';

const external = vi.hoisted(() => ({ load: vi.fn(), price: vi.fn(), upsert: vi.fn(), quota: vi.fn() }));
vi.mock('./cms/published-merchant-catalog', () => ({ loadPublishedMerchantCatalog: external.load }));
vi.mock('./infrastructure/stripe', () => ({
  createStripeCatalogGateway: () => ({ retrieveDefaultPrice: external.price }),
}));
vi.mock('./infrastructure/google-merchant', async (original) => ({
  ...(await original<typeof MerchantIntegration>()),
  GoogleMerchantAdapter: class {
    verifySource = vi.fn();
    checkQuota = external.quota;
    upsert = external.upsert;
    remove = vi.fn();
  },
}));
afterEach(() => vi.restoreAllMocks());

it.each([false, true])('fits a complete two-offer pass inside D1 Free, quota recovery=%s', async (recover) => {
  vi.clearAllMocks();
  external.upsert.mockReset().mockResolvedValue(undefined);
  const prisma = createPrismaClient({ COMMERCE_DB: env.COMMERCE_DB });
  const prefix = `budget-${crypto.randomUUID()}`;
  const items = ['a', 'b', 'c'].map((suffix) => ({
    sourceKind: 'distro' as const,
    sourceId: `${prefix}-${suffix}`,
    storeItemSlug: parseStoreItemSlug(`${prefix}-${suffix}`),
    variantId: parseVariantId(`variant_${prefix}-${suffix}`),
  }));
  const prices = new Map<string, StripeCatalogPrice>();
  try {
    for (const item of items) {
      const productId = `prod_${item.variantId}`,
        priceId = parseStripePriceId(`price_${item.variantId}`);
      const metadata = createStripeCatalogMetadata('uat', item);
      await prisma.storeItemOption.create({
        data: {
          ...item,
          cmsSourceId: item.sourceId,
          itemType: 'Cassette',
          priceKind: 'fixed',
          catalogAvailability: 'published',
          catalogRevision: 1,
          productProjection: {
            name: 'Record',
            description: 'Record',
            imageUrls: ['https://example.com/record.jpg'],
            metadata: {},
            taxCode: 'txcd_99999999',
          },
        },
      });
      await prisma.stock.create({ data: { variantId: item.variantId, quantity: 1, onlineQuantity: 1 } });
      await prisma.itemAvailability.create({ data: { variantId: item.variantId, status: 'available', canBuy: true } });
      await prisma.variantStripeMapping.create({
        data: { variantId: item.variantId, stripePriceId: priceId, stripeProductId: productId },
      });
      prices.set(productId, {
        active: true,
        taxBehavior: 'inclusive',
        amountMinor: 1000,
        currencyCode: 'EUR',
        customUnitAmount: null,
        lookupKey: createStripeCatalogLookupKey('uat', item),
        metadata,
        priceKind: 'fixed',
        priceId,
        productActive: true,
        productDescription: 'Record',
        productId,
        productImages: ['https://example.com/record.jpg'],
        productMetadata: metadata,
        productName: 'Record',
        productTaxCode: 'txcd_99999999',
      });
    }
    external.price.mockImplementation(async (id: string) => prices.get(id));
    const snapshot = {
      schemaVersion: 1,
      environment: 'uat',
      storeItems: items,
      records: items.map((item) => ({
        collection: 'distro',
        id: item.sourceId,
        revisionId: 'revision',
        slug: item.sourceId,
        data: { title: 'Record', product_condition: 'new', image: { id: 'cover' } },
      })),
      media: [{ id: 'cover', sha256: 'a'.repeat(64) }],
    } as unknown as ContentSnapshot;
    external.load.mockResolvedValue({ identity: 'accepted', snapshot, isCurrent: async () => true });
    const scope = { environment: 'uat', accountId: recover ? '102' : '101', dataSourceId: '123' };
    if (recover) {
      const repository = new D1MerchantSyncRepository(env.COMMERCE_DB);
      const prior = new Date(Date.now() - 86400000),
        claim = (await repository.claimRun(scope, prior))!;
      await repository.deferQuota(claim, new Date(Date.now() - 1000), prior);
      await repository.finishRun(claim, null, prior);
      external.upsert.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new GoogleMerchantError('quota', 429));
    }
    const usage = { calls: 0, rowsRead: 0, rowsWritten: 0 };
    const track = (statement: D1PreparedStatement): D1PreparedStatement =>
      new Proxy(statement, {
        get(target, key) {
          if (key === 'bind') return (...values: unknown[]) => track(target.bind(...values));
          if (['first', 'all', 'run', 'raw'].includes(String(key)))
            return async (...args: unknown[]) => {
              usage.calls++;
              expect(usage.calls).toBeLessThanOrEqual(50);
              const result = await (target[key as 'all'] as (...values: unknown[]) => Promise<unknown>).apply(
                target,
                args,
              );
              if (result && typeof result === 'object' && 'meta' in result) {
                const meta = (result as D1Result).meta;
                usage.rowsRead += meta.rows_read;
                usage.rowsWritten += meta.rows_written;
              }
              return result;
            };
          return Reflect.get(target, key);
        },
      });
    const db = new Proxy(env.COMMERCE_DB, {
      get(target, key) {
        return key === 'prepare' ? (sql: string) => track(target.prepare(sql)) : Reflect.get(target, key);
      },
    });
    const info = vi.spyOn(console, 'info'),
      warn = vi.spyOn(console, 'warn');
    await runMerchantSchedule(
      {
        PRODUCT_ENVIRONMENT: 'UAT',
        COMMERCE_DB: db,
        NATIVE_CHECKOUT_ENABLED: 'true',
        STRIPE_SECRET_KEY: 'sk_test_mock',
        STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
        MERCHANT_SYNC_ENABLED: 'true',
        MERCHANT_ACCOUNT_ID: scope.accountId,
        MERCHANT_DATA_SOURCE_ID: scope.dataSourceId,
        MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({
          client_email: 'test@project.iam.gserviceaccount.com',
          private_key: 'test',
        }),
      },
      {} as R2Bucket,
      Date.now(),
    );
    expect(external.price).toHaveBeenCalledTimes(2);
    expect(external.upsert).toHaveBeenCalledTimes(2);
    expect(usage.calls).toBe(recover ? 38 : 37);
    expect(usage.calls).toBeLessThanOrEqual(39);
    expect(JSON.stringify([...info.mock.calls, ...warn.mock.calls])).toContain(
      recover ? 'source_stopped' : 'completed',
    );
    console.log('Merchant complete local D1 invocation budget', { recover, ...usage });
  } finally {
    await prisma.$disconnect();
  }
});
