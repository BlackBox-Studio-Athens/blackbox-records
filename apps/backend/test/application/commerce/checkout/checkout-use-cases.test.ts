import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CatalogDriftError,
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  listVariantOffersForStoreItem,
  readCheckoutState,
  readStoreOffer,
  startCheckout,
  StoreItemNotFoundError,
  VariantMismatchError,
} from '../../../../src/application/commerce/checkout';
import type { CheckoutGateway } from '../../../../src/application/commerce/checkout/spi';
import type {
  CatalogProductProjectionReader,
  CatalogReconciler,
  CatalogSyncIssue,
  CatalogSyncVariantResult,
  StripeCatalogPrice,
  StripeCatalogProductProjection,
} from '../../../../src/application/commerce/catalog-sync';
import type {
  CheckoutOrderRecord,
  CheckoutOrderTransitionInput,
  CreatePendingCheckoutOrderInput,
  ItemAvailabilityRecord,
  ItemAvailabilityRepository,
  OrderStateRepository,
  OrderStatus,
  StockRecord,
  StockRepository,
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
} from '../../../../src/domain/commerce/repositories/spi';
import {
  cartQuantity,
  checkoutSessionId,
  stockQuantity,
  storeItemSlug,
  stripePriceId,
  variantId as toVariantId,
} from '../../../support/commerce-value-objects';

class InMemoryStoreItemOptionRepository implements StoreItemOptionRepository {
  public constructor(private readonly records: StoreItemOptionRecord[]) {}

  public async findBySource(source: StoreItemSourceRef): Promise<StoreItemOptionRecord | null> {
    return (
      this.records.find((record) => record.sourceKind === source.sourceKind && record.sourceId === source.sourceId) ??
      null
    );
  }

  public async findByStoreItemSlug(storeItemSlug: string): Promise<StoreItemOptionRecord | null> {
    return this.records.find((record) => record.storeItemSlug === storeItemSlug) ?? null;
  }

  public async findByVariantId(variantId: string): Promise<StoreItemOptionRecord | null> {
    return this.records.find((record) => record.variantId === variantId) ?? null;
  }

  public async search(query: string | null, limit: number): Promise<StoreItemOptionRecord[]> {
    return this.records.slice(0, limit);
  }
}

class InMemoryItemAvailabilityRepository implements ItemAvailabilityRepository {
  public readonly records = new Map<string, ItemAvailabilityRecord>();

  public async findByVariantId(variantId: string): Promise<ItemAvailabilityRecord | null> {
    return this.records.get(variantId) ?? null;
  }
}

class InMemoryStockRepository implements StockRepository {
  public readonly records = new Map<string, StockRecord>();

  public async findByVariantId(variantId: string): Promise<StockRecord | null> {
    return this.records.get(variantId) ?? null;
  }

  public async save(variantId: string, state: { onlineQuantity: number; quantity: number }): Promise<StockRecord> {
    const record: StockRecord = {
      createdAt: new Date('2026-04-24T10:00:00.000Z'),
      onlineQuantity: stockQuantity(state.onlineQuantity),
      quantity: stockQuantity(state.quantity),
      updatedAt: new Date('2026-04-24T10:00:00.000Z'),
      variantId: toVariantId(variantId),
    };

    this.records.set(variantId, record);

    return record;
  }
}

class InMemoryOrderStateRepository implements OrderStateRepository {
  public readonly records = new Map<string, CheckoutOrderRecord>();

  public async createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord> {
    const createdAt = input.createdAt ?? new Date('2026-04-25T10:00:00.000Z');
    const record: CheckoutOrderRecord = {
      checkoutSessionId: input.checkoutSessionId,
      createdAt,
      id: `order_${this.records.size + 1}`,
      needsReviewAt: null,
      notPaidAt: null,
      paidAt: null,
      shippingLocker: input.shippingLocker,
      status: 'pending_payment',
      statusUpdatedAt: createdAt,
      storeItemSlug: input.storeItemSlug,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      updatedAt: createdAt,
      variantId: input.variantId,
    };

    this.records.set(record.checkoutSessionId, record);

    return record;
  }

  public async findByCheckoutSessionId(checkoutSessionId: string): Promise<CheckoutOrderRecord | null> {
    return this.records.get(checkoutSessionId) ?? null;
  }

  public async listRecent(input: { limit: number; status?: OrderStatus | null }): Promise<CheckoutOrderRecord[]> {
    return [...this.records.values()]
      .filter((record) => !input.status || record.status === input.status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, input.limit);
  }

  public async saveTransition(
    checkoutSessionId: string,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null> {
    const current = this.records.get(checkoutSessionId);

    if (!current) {
      return null;
    }

    const next: CheckoutOrderRecord = {
      ...current,
      needsReviewAt: transition.status === 'needs_review' ? transition.statusUpdatedAt : current.needsReviewAt,
      notPaidAt: transition.status === 'not_paid' ? transition.statusUpdatedAt : current.notPaidAt,
      paidAt: transition.status === 'paid' ? transition.statusUpdatedAt : current.paidAt,
      status: transition.status,
      statusUpdatedAt: transition.statusUpdatedAt,
      stripePaymentIntentId: transition.stripePaymentIntentId ?? current.stripePaymentIntentId,
      updatedAt: transition.statusUpdatedAt,
    };

    this.records.set(checkoutSessionId, next);

    return next;
  }
}

class InMemoryCatalogReconciler implements Pick<CatalogReconciler, 'reconcileVariant'> {
  public readonly calls: Array<{
    options: { apply?: boolean; productProjection?: StripeCatalogProductProjection | null };
  }> = [];
  public readonly issues = new Map<string, CatalogSyncIssue[]>();
  public readonly prices = new Map<string, StripeCatalogPrice>();

  public async reconcileVariant(
    storeItem: StoreItemOptionRecord,
    options: { apply?: boolean; productProjection?: StripeCatalogProductProjection | null } = {},
  ): Promise<CatalogSyncVariantResult> {
    this.calls.push({ options });
    const resolvedPrice = this.prices.get(storeItem.variantId) ?? null;
    const issues =
      this.issues.get(storeItem.variantId) ??
      (resolvedPrice
        ? []
        : [
            {
              code: 'missing_price',
              detail: 'No active Stripe Price resolved for test variant.',
              driftCategory: 'price_authority',
              storeItemSlug: storeItem.storeItemSlug,
              variantId: storeItem.variantId,
            },
          ]);

    return {
      actions: [],
      issueCount: issues.length,
      issues,
      lookupKey: `blackbox:uat:${storeItem.storeItemSlug}:${storeItem.variantId}`,
      mapping: resolvedPrice
        ? {
            stripePriceId: resolvedPrice.priceId,
            variantId: storeItem.variantId,
          }
        : null,
      resolvedPrice,
      snapshot: null,
      storeItem,
    };
  }
}

class InMemoryCatalogProductProjectionReader implements CatalogProductProjectionReader {
  public readonly projections = new Map<string, StripeCatalogProductProjection>();

  public findByStoreItem(storeItem: StoreItemOptionRecord): StripeCatalogProductProjection | null {
    return this.projections.get(storeItem.variantId) ?? null;
  }
}

function createCatalogPrice(input: {
  amountMinor?: number;
  customUnitAmount?: StripeCatalogPrice['customUnitAmount'];
  currencyCode?: string;
  priceId?: string;
  priceKind?: StripeCatalogPrice['priceKind'];
  storeItem: StoreItemOptionRecord;
}): StripeCatalogPrice {
  return {
    active: true,
    amountMinor: input.priceKind === 'pay_what_you_want' ? null : (input.amountMinor ?? 2800),
    currencyCode: input.currencyCode ?? 'EUR',
    customUnitAmount: input.customUnitAmount ?? null,
    lookupKey: `blackbox:uat:${input.storeItem.storeItemSlug}:${input.storeItem.variantId}`,
    metadata: {
      appEnv: 'uat',
      sourceId: input.storeItem.sourceId,
      sourceKind: input.storeItem.sourceKind,
      storeItemSlug: input.storeItem.storeItemSlug,
      variantId: input.storeItem.variantId,
    },
    priceKind: input.priceKind ?? 'fixed',
    priceId: stripePriceId(input.priceId ?? 'price_test_barren_point'),
    productActive: true,
    productDescription: 'Disintegration by Afterwise.',
    productId: 'prod_test_barren_point',
    productImages: ['https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg'],
    productMetadata: {
      appEnv: 'uat',
      sourceId: input.storeItem.sourceId,
      sourceKind: input.storeItem.sourceKind,
      storeItemSlug: input.storeItem.storeItemSlug,
      variantId: input.storeItem.variantId,
    },
    productName: 'BlackBox Records - Disintegration - Black Vinyl LP',
    productTaxCode: null,
  };
}

describe('checkout use cases', () => {
  const storeItem: StoreItemOptionRecord = {
    sourceId: 'disintegration',
    sourceKind: 'release',
    storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
    variantId: toVariantId('variant_disintegration-black-vinyl-lp_standard'),
  };

  let storeItems: InMemoryStoreItemOptionRepository;
  let itemAvailability: InMemoryItemAvailabilityRepository;
  let stock: InMemoryStockRepository;
  let catalogReconciler: InMemoryCatalogReconciler;
  let productProjections: InMemoryCatalogProductProjectionReader;
  let orders: InMemoryOrderStateRepository;
  let checkoutGateway: CheckoutGateway;

  beforeEach(async () => {
    storeItems = new InMemoryStoreItemOptionRepository([storeItem]);
    itemAvailability = new InMemoryItemAvailabilityRepository();
    stock = new InMemoryStockRepository();
    catalogReconciler = new InMemoryCatalogReconciler();
    productProjections = new InMemoryCatalogProductProjectionReader();
    orders = new InMemoryOrderStateRepository();
    checkoutGateway = {
      createHostedCheckoutSession: vi.fn(async () => ({
        checkoutSessionId: checkoutSessionId('cs_test_123'),
        checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
      })),
      readCheckoutSessionLineItems: vi.fn(async () => []),
      readCheckoutSession: vi.fn(async () => ({
        amountTotalMinor: null,
        checkoutSessionId: checkoutSessionId('cs_test_123'),
        currencyCode: null,
        customer: {
          email: null,
          name: null,
          phone: null,
        },
        newsletterOptIn: false,
        paymentStatus: 'paid' as const,
        shippingAddress: null,
        status: 'complete' as const,
      })),
    };

    itemAvailability.records.set(storeItem.variantId, {
      canBuy: true,
      status: 'available',
      updatedAt: new Date('2026-04-24T10:00:00.000Z'),
      variantId: storeItem.variantId,
    });
    await stock.save(storeItem.variantId, {
      onlineQuantity: 2,
      quantity: 3,
    });
    productProjections.projections.set(storeItem.variantId, {
      description: 'Disintegration by Afterwise.',
      imageUrls: ['https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg'],
      metadata: {
        sourceId: storeItem.sourceId,
        sourceKind: storeItem.sourceKind,
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
      name: 'BlackBox Records - Disintegration - Black Vinyl LP',
      taxCode: null,
    });
    catalogReconciler.prices.set(storeItem.variantId, createCatalogPrice({ storeItem }));
  });

  it('reads backend-known checkout eligibility for one store item', async () => {
    await expect(
      readStoreOffer(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        storeItem.storeItemSlug,
      ),
    ).resolves.toEqual({
      availability: {
        label: 'Available',
        status: 'available',
      },
      canCheckout: true,
      catalogStatus: 'ready',
      price: {
        amountMinor: 2800,
        currencyCode: 'EUR',
        display: '€28.00',
        kind: 'fixed',
      },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(catalogReconciler.calls[0]?.options.productProjection).toEqual(
      productProjections.projections.get(storeItem.variantId),
    );
  });

  it('reads Store Offer price from a replacement Stripe Price without content changes', async () => {
    catalogReconciler.prices.set(
      storeItem.variantId,
      createCatalogPrice({
        amountMinor: 3200,
        priceId: 'price_test_replacement_black_vinyl',
        storeItem,
      }),
    );

    await expect(
      readStoreOffer(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        storeItem.storeItemSlug,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        price: {
          amountMinor: 3200,
          currencyCode: 'EUR',
          display: '€32.00',
          kind: 'fixed',
        },
      }),
    );
  });

  it('reads pay-what-you-want Store Offers from Stripe custom prices', async () => {
    catalogReconciler.prices.set(
      storeItem.variantId,
      createCatalogPrice({
        customUnitAmount: {
          maximumAmountMinor: 10000,
          minimumAmountMinor: 100,
          presetAmountMinor: 500,
        },
        priceId: 'price_test_pay_what_you_want',
        priceKind: 'pay_what_you_want',
        storeItem,
      }),
    );

    await expect(
      readStoreOffer(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        storeItem.storeItemSlug,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        price: {
          currencyCode: 'EUR',
          display: 'Pay what you want',
          kind: 'pay_what_you_want',
          maximumAmountMinor: 10000,
          minimumAmountMinor: 100,
          presetAmountMinor: 500,
        },
      }),
    );
  });

  it('returns array-shaped variant offers for future multi-variant expansion', async () => {
    await expect(
      listVariantOffersForStoreItem(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        storeItem.storeItemSlug,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        catalogStatus: 'ready',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    ]);
  });

  it('starts checkout without a browser-selected locker for manual BOX NOW fulfillment', async () => {
    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    expect(orders.records.get('cs_test_123')).toMatchObject({
      shippingLocker: null,
      status: 'pending_payment',
    });
  });

  it('rejects disabled native checkout before Stripe or order writes', async () => {
    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
        {
          isNativeCheckoutEnabled: async () => false,
        },
      ),
    ).rejects.toBeInstanceOf(NativeCheckoutDisabledError);

    expect(checkoutGateway.createHostedCheckoutSession).not.toHaveBeenCalled();
    expect(orders.records.size).toBe(0);
  });

  it('rejects unknown store items before starting checkout', async () => {
    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItemSlug('unknown'),
          variantId: storeItem.variantId,
        },
      ),
    ).rejects.toBeInstanceOf(StoreItemNotFoundError);
  });

  it('rejects variants that do not belong to the requested store item', async () => {
    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: toVariantId('variant_other'),
        },
      ),
    ).rejects.toBeInstanceOf(VariantMismatchError);
  });

  it('rejects unavailable or out-of-online-stock items', async () => {
    await stock.save(storeItem.variantId, {
      onlineQuantity: 0,
      quantity: 3,
    });

    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ),
    ).rejects.toBeInstanceOf(CheckoutUnavailableError);
  });

  it('returns a non-500 catalog drift error when Stripe price authority is missing', async () => {
    catalogReconciler.prices.clear();

    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ),
    ).rejects.toBeInstanceOf(CatalogDriftError);
  });

  it('pauses Store Offer checkout when Product Projection cannot be confirmed', async () => {
    catalogReconciler.issues.set(storeItem.variantId, [
      {
        code: 'product_projection_mismatch',
        detail: 'Stripe Product projection differs: images.',
        driftCategory: 'product_projection',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
    ]);

    await expect(
      readStoreOffer(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        storeItem.storeItemSlug,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        canCheckout: false,
        catalogStatus: 'catalog_drift',
        price: null,
      }),
    );
  });

  it('rejects checkout before Stripe writes when Product Projection is missing or drifted', async () => {
    productProjections.projections.clear();

    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ),
    ).rejects.toBeInstanceOf(CatalogDriftError);

    expect(checkoutGateway.createHostedCheckoutSession).not.toHaveBeenCalled();
    expect(orders.records.size).toBe(0);
  });

  it('starts hosted Checkout with the mapped Stripe price', async () => {
    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith({
      lineItems: [
        {
          quantity: 1,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          stripePriceId: 'price_test_barren_point',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
      ],
      cancelUrl: 'https://example.com/checkout',
      newsletterOptIn: false,
      successUrl: 'https://example.com/return',
    });
    expect(orders.records.get('cs_test_123')).toEqual(
      expect.objectContaining({
        checkoutSessionId: 'cs_test_123',
        shippingLocker: null,
        status: 'pending_payment',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    );
  });

  it('starts hosted Checkout for pay-what-you-want items using only the Stripe Price ID', async () => {
    catalogReconciler.prices.set(
      storeItem.variantId,
      createCatalogPrice({
        customUnitAmount: {
          maximumAmountMinor: 10000,
          minimumAmountMinor: 100,
          presetAmountMinor: 500,
        },
        priceId: 'price_test_pay_what_you_want',
        priceKind: 'pay_what_you_want',
        storeItem,
      }),
    );

    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith({
      lineItems: [
        {
          quantity: 1,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          stripePriceId: 'price_test_pay_what_you_want',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
      ],
      cancelUrl: 'https://example.com/checkout',
      newsletterOptIn: false,
      successUrl: 'https://example.com/return',
    });
  });

  it('starts hosted Checkout with requested CartQuantity and fixed Stripe quantity', async () => {
    await expect(
      startCheckout(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        checkoutGateway,
        orders,
        {
          lines: [
            {
              quantity: cartQuantity(2),
              storeItemSlug: storeItem.storeItemSlug,
              variantId: storeItem.variantId,
            },
          ],
          cancelUrl: 'https://example.com/checkout',
          successUrl: 'https://example.com/return',
        },
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith({
      lineItems: [
        {
          quantity: 2,
          storeItemSlug: 'disintegration-black-vinyl-lp',
          stripePriceId: 'price_test_barren_point',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
      ],
      cancelUrl: 'https://example.com/checkout',
      newsletterOptIn: false,
      successUrl: 'https://example.com/return',
    });
  });

  it('passes checkout newsletter opt-in to the hosted Checkout Session request', async () => {
    await startCheckout(
      storeItems,
      itemAvailability,
      stock,
      catalogReconciler,
      productProjections,
      checkoutGateway,
      orders,
      {
        cancelUrl: 'https://example.com/checkout',
        newsletterOptIn: true,
        successUrl: 'https://example.com/return',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
    );

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        newsletterOptIn: true,
      }),
    );
  });

  it('maps Stripe Checkout Session status into app-owned return state without D1 writes', async () => {
    await expect(readCheckoutState(checkoutGateway, orders, checkoutSessionId('cs_test_123'))).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      orderStatus: null,
      paymentStatus: 'paid',
      shippingLocker: null,
      state: 'paid',
      status: 'complete',
    });

    expect(checkoutGateway.readCheckoutSession).toHaveBeenCalledWith('cs_test_123');
  });

  it('surfaces manual BOX NOW return state without a persisted locker snapshot', async () => {
    await startCheckout(
      storeItems,
      itemAvailability,
      stock,
      catalogReconciler,
      productProjections,
      checkoutGateway,
      orders,
      {
        cancelUrl: 'https://example.com/checkout',
        successUrl: 'https://example.com/return',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
    );

    await expect(readCheckoutState(checkoutGateway, orders, checkoutSessionId('cs_test_123'))).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      orderStatus: 'pending_payment',
      paymentStatus: 'paid',
      shippingLocker: null,
      state: 'paid',
      status: 'complete',
    });
  });
});
