import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as stripe from '../../../infrastructure/stripe';
import {
  createPrismaClient,
  PrismaItemAvailabilityRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { D1CheckoutStockHoldRepository } from '../../../infrastructure/persistence/d1-checkout-stock-hold-repository';
import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  type StripeCatalogPrice,
} from '../../../application/commerce/catalog-sync';
import { parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../../../domain/commerce';
import { createPublicCommerceServices } from './public-commerce-services';

describe('delivery quotes with provider reconciliation', () => {
  const bindings = {
    COMMERCE_DB: env.COMMERCE_DB,
    PRODUCT_ENVIRONMENT: 'LOCAL' as const,
    STRIPE_SECRET_KEY: 'sk_test_fixture',
    STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_fixture',
  };
  const db = createPrismaClient(bindings);
  let services: ReturnType<typeof createPublicCommerceServices>;
  let item: {
    storeItemSlug: ReturnType<typeof parseStoreItemSlug>;
    variantId: ReturnType<typeof parseVariantId>;
    sourceId: string;
    sourceKind: 'release';
  };
  const provider = {
    retrieveDefaultPrice: vi.fn(),
    retrievePrice: vi.fn(),
    createCatalogPrice: vi.fn(),
    updateProductProjection: vi.fn(),
  };
  const lines = (quantity = 1) => [{ storeItemSlug: item.storeItemSlug, variantId: item.variantId, quantity }];
  let price: StripeCatalogPrice;

  beforeEach(async () => {
    const id = crypto.randomUUID();
    item = {
      storeItemSlug: parseStoreItemSlug(`quote-${id}`),
      variantId: parseVariantId(`variant_quote_${id}`),
      sourceId: id,
      sourceKind: 'release',
    };
    const priceId = parseStripePriceId(`price_quote_${id}`);
    const metadata = createStripeCatalogMetadata('local', item);
    price = {
      active: true,
      amountMinor: 2000,
      currencyCode: 'EUR',
      customUnitAmount: null,
      lookupKey: createStripeCatalogLookupKey('local', item),
      metadata,
      priceKind: 'fixed',
      priceId,
      productActive: true,
      productDescription: '',
      productId: `prod_quote_${id}`,
      productImages: [],
      productMetadata: metadata,
      productName: 'Quote Record',
      productTaxCode: 'txcd_99999999',
      taxBehavior: 'inclusive',
    };
    await db.storeItemOption.create({
      data: {
        ...item,
        cmsSourceId: `cms-quote-${id}`,
        itemType: 'vinyl',
        priceKind: 'fixed',
        catalogAvailability: 'published',
        catalogRevision: 1,
        productProjection: {
          name: 'Quote Record',
          description: '',
          imageUrls: [],
          metadata: {},
          taxCode: 'txcd_99999999',
        },
      },
    });
    await db.itemAvailability.create({ data: { variantId: item.variantId, status: 'available', canBuy: true } });
    await db.stock.create({ data: { variantId: item.variantId, quantity: 20, onlineQuantity: 20 } });
    await db.variantStripeMapping.create({
      data: { variantId: item.variantId, stripePriceId: priceId, stripeProductId: price.productId },
    });
    provider.retrieveDefaultPrice.mockResolvedValue(price);
    // The quote path uses only these gateway reads; the partial mock stands in for the full gateway.
    vi.spyOn(stripe, 'createStripeCatalogGateway').mockReturnValue(
      provider as unknown as ReturnType<typeof stripe.createStripeCatalogGateway>,
    );
    services = createPublicCommerceServices(bindings);
  });

  afterEach(async () => {
    await services.disconnect();
    await db.$disconnect();
    vi.restoreAllMocks();
    for (const mock of Object.values(provider)) mock.mockReset();
  });

  it('reads each prerequisite once and current stock/holds again only after the provider', async () => {
    const identity = vi.spyOn(PrismaStoreItemOptionRepository.prototype, 'findByStoreItemSlug');
    const projection = vi.spyOn(PrismaStoreItemOptionRepository.prototype, 'findByStoreItem');
    const availability = vi.spyOn(PrismaItemAvailabilityRepository.prototype, 'findByVariantId');
    const stock = vi.spyOn(PrismaStockRepository.prototype, 'findByVariantId');
    const mapping = vi.spyOn(PrismaVariantStripeMappingRepository.prototype, 'findByVariantId');
    const snapshot = vi.spyOn(PrismaStoreOfferSnapshotRepository.prototype, 'findByVariantId');
    const holds = vi.spyOn(D1CheckoutStockHoldRepository.prototype, 'findEffectiveAvailability');
    const statements = vi.spyOn(env.COMMERCE_DB, 'prepare');
    await expect(services.quoteDelivery(lines())).resolves.toMatchObject({
      merchandiseGrossMinor: 2000,
      amountMinor: 300,
      totalAmountMinor: 2300,
    });
    for (const read of [identity, projection, availability, stock, mapping, snapshot])
      expect(read).toHaveBeenCalledTimes(1);
    expect(holds).toHaveBeenCalledTimes(2);
    expect(statements.mock.calls.filter(([sql]) => /^SELECT\b/i.test(sql.trim()))).toHaveLength(8);
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledExactlyOnceWith(price.productId);
    expect(provider.retrievePrice).not.toHaveBeenCalled();
    expect(provider.createCatalogPrice).not.toHaveBeenCalled();
    expect(provider.updateProductProjection).not.toHaveBeenCalled();
    expect(holds.mock.invocationCallOrder[1]).toBeGreaterThan(
      provider.retrieveDefaultPrice.mock.invocationCallOrder[0]!,
    );
  });

  it('starts the independent projection read while availability is pending', async () => {
    const availability = await new PrismaItemAvailabilityRepository(db).findByVariantId(item.variantId);
    let release!: (value: typeof availability) => void;
    vi.spyOn(PrismaItemAvailabilityRepository.prototype, 'findByVariantId').mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const projection = vi.spyOn(PrismaStoreItemOptionRepository.prototype, 'findByStoreItem');
    const quote = services.quoteDelivery(lines());
    try {
      await vi.waitFor(() => expect(projection).toHaveBeenCalledTimes(1));
    } finally {
      release(availability);
    }
    await expect(quote).resolves.toMatchObject({ totalAmountMinor: 2300 });
  });

  it.each([
    [1, 300],
    [4, 300],
    [5, 600],
    [8, 600],
    [9, 1000],
  ])('preserves the tariff for %i copies', async (quantity, amountMinor) => {
    await expect(services.quoteDelivery(lines(quantity))).resolves.toMatchObject({
      amountMinor,
      merchandiseGrossMinor: 2000 * quantity,
      totalAmountMinor: 2000 * quantity + amountMinor,
    });
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledTimes(1);
  });

  it('merges duplicate lines before provider reads and quantity pricing', async () => {
    await expect(services.quoteDelivery([...lines(1), ...lines(2)])).resolves.toMatchObject({
      merchandiseGrossMinor: 6000,
      amountMinor: 300,
      totalAmountMinor: 6300,
    });
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledTimes(1);
    await expect(services.quoteDelivery([...lines(5), ...lines(5)])).resolves.toBeNull();
    await expect(
      services.quoteDelivery([...lines(), { ...lines()[0]!, storeItemSlug: 'different-record' }]),
    ).resolves.toBeNull();
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledTimes(1);
  });

  it.each([0, 1])('rejects insufficient stock of %i copies', async (quantity) => {
    await db.stock.update({ where: { variantId: item.variantId }, data: { quantity, onlineQuantity: quantity } });
    await expect(services.quoteDelivery(lines(2))).resolves.toBeNull();
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledTimes(quantity === 0 ? 0 : 1);
  });

  it('propagates provider failure without retrying or returning a local snapshot quote', async () => {
    provider.retrieveDefaultPrice.mockRejectedValue(new Error('Provider unavailable'));
    await expect(services.quoteDelivery(lines())).rejects.toThrow('Provider unavailable');
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledTimes(1);
    expect(provider.retrievePrice).not.toHaveBeenCalled();
  });

  it('keeps sold-out rejection when the overlapping projection read fails', async () => {
    await db.stock.update({ where: { variantId: item.variantId }, data: { quantity: 0, onlineQuantity: 0 } });
    vi.spyOn(PrismaStoreItemOptionRepository.prototype, 'findByStoreItem').mockRejectedValue(
      new Error('Projection unavailable'),
    );
    await expect(services.quoteDelivery(lines())).resolves.toBeNull();
    expect(provider.retrieveDefaultPrice).not.toHaveBeenCalled();
    await db.stock.update({ where: { variantId: item.variantId }, data: { quantity: 1, onlineQuantity: 1 } });
    await expect(services.quoteDelivery(lines())).rejects.toThrow('Projection unavailable');
  });

  it('rejects a hold created while the provider is still pending', async () => {
    await db.stock.update({ where: { variantId: item.variantId }, data: { quantity: 1, onlineQuantity: 1 } });
    let started!: () => void;
    const providerStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    let finish!: (value: StripeCatalogPrice) => void;
    provider.retrieveDefaultPrice.mockImplementation(() => {
      started();
      return new Promise<StripeCatalogPrice>((resolve) => {
        finish = resolve;
      });
    });
    const quote = services.quoteDelivery(lines());
    await providerStarted;
    const now = new Date();
    await db.checkoutOrder.create({
      data: {
        storeItemSlug: item.storeItemSlug,
        variantId: item.variantId,
        status: 'pending_payment',
        statusUpdatedAt: now,
        checkoutExpiresAt: new Date(now.getTime() + 60000),
        lines: { create: { storeItemSlug: item.storeItemSlug, variantId: item.variantId, quantity: 1 } },
      },
    });
    finish(price);
    await expect(quote).resolves.toBeNull();
    expect(provider.retrieveDefaultPrice).toHaveBeenCalledTimes(1);
  });
});
