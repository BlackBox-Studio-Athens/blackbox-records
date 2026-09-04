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
import type { CheckoutSessionId, VariantId } from '../../../../src/domain/commerce';
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
  CheckoutStockHoldRepository,
  CreateCheckoutStockHoldInput,
  CreateCheckoutStockHoldResult,
  CreatePendingCheckoutOrderInput,
  ExpiredSessionBoundCheckoutHold,
  ItemAvailabilityRecord,
  ItemAvailabilityRepository,
  OrderStateRepository,
  OrderStatus,
  StockRecord,
  StockRepository,
  SessionBoundPendingCheckoutOrder,
  SessionlessNotPaidCheckoutOrder,
  SessionlessPendingCheckoutOrder,
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
} from '../../../../src/domain/commerce/repositories/spi';
import { EMPTY_PAID_CHECKOUT_ORDER_FIELDS } from '../../../../src/domain/commerce/repositories/spi';
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

class InMemoryOrderStateRepository implements OrderStateRepository, CheckoutStockHoldRepository {
  public bindShouldFail = false;
  public createPendingHoldCalls = 0;
  public readonly records = new Map<string, CheckoutOrderRecord>();
  public readonly effectiveAvailability = new Map<string, number>();

  public async createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord> {
    const createdAt = input.createdAt ?? new Date('2026-04-25T10:00:00.000Z');
    const record: CheckoutOrderRecord = {
      ...EMPTY_PAID_CHECKOUT_ORDER_FIELDS,
      checkoutSessionId: input.checkoutSessionId,
      checkoutExpiresAt: input.checkoutExpiresAt ?? new Date(createdAt.getTime() + 30 * 60 * 1000),
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

    this.records.set(input.checkoutSessionId, record);

    return record;
  }

  public async findByCheckoutSessionId(checkoutSessionId: string): Promise<CheckoutOrderRecord | null> {
    return this.records.get(checkoutSessionId) ?? null;
  }

  public async createPendingHold(input: CreateCheckoutStockHoldInput): Promise<CreateCheckoutStockHoldResult> {
    this.createPendingHoldCalls += 1;

    for (const line of input.lines) {
      if ((await this.findEffectiveAvailability(line.variantId))! < line.quantity) return { kind: 'unavailable' };
    }

    const [primaryLine] = input.lines;
    const hold: SessionlessPendingCheckoutOrder = {
      ...EMPTY_PAID_CHECKOUT_ORDER_FIELDS,
      checkoutExpiresAt: input.checkoutExpiresAt,
      checkoutSessionId: null,
      createdAt: input.createdAt,
      id: input.orderId,
      lines: input.lines.map((line) => ({
        createdAt: input.createdAt,
        id: crypto.randomUUID(),
        orderId: input.orderId,
        ...line,
      })),
      needsReviewAt: null,
      notPaidAt: null,
      paidAt: null,
      shippingLocker: null,
      status: 'pending_payment',
      statusUpdatedAt: input.createdAt,
      storeItemSlug: primaryLine.storeItemSlug,
      stripePaymentIntentId: null,
      updatedAt: input.createdAt,
      variantId: primaryLine.variantId,
    };

    this.records.set(hold.id, hold);
    return { hold, kind: 'created' };
  }

  public async bindCheckoutSession(
    hold: SessionlessPendingCheckoutOrder,
    checkoutSessionId: CheckoutSessionId,
    boundAt: Date,
  ): Promise<SessionBoundPendingCheckoutOrder | null> {
    if (this.bindShouldFail) return null;
    if (this.records.get(hold.id)?.status !== 'pending_payment') return null;

    const bound: SessionBoundPendingCheckoutOrder = {
      ...hold,
      checkoutSessionId,
      statusUpdatedAt: boundAt,
      updatedAt: boundAt,
    };

    this.records.delete(hold.id);
    this.records.set(checkoutSessionId, bound);
    return bound;
  }

  public async releaseSessionlessHold(
    hold: SessionlessPendingCheckoutOrder,
    releasedAt: Date,
  ): Promise<SessionlessNotPaidCheckoutOrder | null> {
    if (this.records.get(hold.id)?.status !== 'pending_payment') return null;

    const released: SessionlessNotPaidCheckoutOrder = {
      ...hold,
      notPaidAt: releasedAt,
      status: 'not_paid',
      statusUpdatedAt: releasedAt,
      updatedAt: releasedAt,
    };

    this.records.set(hold.id, released);
    return released;
  }

  public async recoverCheckoutSession(
    orderId: string,
    recoveredCheckoutSessionId: CheckoutSessionId,
    recoveredAt: Date,
  ): Promise<boolean> {
    const current = this.records.get(orderId);
    if (!current || current.status !== 'pending_payment' || current.checkoutSessionId !== null) return false;

    this.records.delete(orderId);
    this.records.set(recoveredCheckoutSessionId, {
      ...current,
      checkoutSessionId: recoveredCheckoutSessionId,
      statusUpdatedAt: recoveredAt,
      updatedAt: recoveredAt,
    });
    return true;
  }

  public async findEffectiveAvailability(variantId: string) {
    const heldQuantity = [...this.records.values()]
      .filter((order) => order.status === 'pending_payment')
      .flatMap((order) => order.lines ?? [])
      .filter((line) => line.variantId === variantId)
      .reduce((total, line) => total + line.quantity, 0);

    return stockQuantity(Math.max(0, (this.effectiveAvailability.get(variantId) ?? 99) - heldQuantity));
  }

  public async listOldestExpiredSessionBoundHolds(
    variantIds: [VariantId, ...VariantId[]],
    expiredAt: Date,
  ): Promise<ExpiredSessionBoundCheckoutHold[]> {
    const requestedVariantIds = new Set<string>(variantIds);

    return [...this.records.values()]
      .flatMap((order) =>
        order.status === 'pending_payment' &&
        order.checkoutSessionId !== null &&
        order.checkoutExpiresAt <= expiredAt &&
        order.lines?.some((line) => requestedVariantIds.has(line.variantId))
          ? [
              {
                checkoutExpiresAt: order.checkoutExpiresAt,
                checkoutSessionId: order.checkoutSessionId,
                id: order.id,
              },
            ]
          : [],
      )
      .sort(
        (left, right) =>
          left.checkoutExpiresAt.getTime() - right.checkoutExpiresAt.getTime() || left.id.localeCompare(right.id),
      )
      .slice(0, 5);
  }

  public async releaseSessionBoundHold(hold: ExpiredSessionBoundCheckoutHold, releasedAt: Date): Promise<boolean> {
    const current = this.records.get(hold.checkoutSessionId);

    if (
      !current ||
      current.id !== hold.id ||
      current.status !== 'pending_payment' ||
      current.checkoutExpiresAt > releasedAt
    ) {
      return false;
    }

    this.records.set(hold.checkoutSessionId, {
      ...current,
      notPaidAt: releasedAt,
      status: 'not_paid',
      statusUpdatedAt: releasedAt,
      updatedAt: releasedAt,
    });
    return true;
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
    options: {
      apply?: boolean;
      applyProductProjection?: boolean;
      productProjection?: StripeCatalogProductProjection | null;
    };
  }> = [];
  public readonly issues = new Map<string, CatalogSyncIssue[]>();
  public readonly prices = new Map<string, StripeCatalogPrice>();

  public async reconcileVariant(
    storeItem: StoreItemOptionRecord,
    options: {
      apply?: boolean;
      applyProductProjection?: boolean;
      productProjection?: StripeCatalogProductProjection | null;
    } = {},
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
    productImages: ['https://blackbox-records-web.pages.dev/assets/catalog/releases/disintegration.jpg'],
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
      expireHostedCheckoutSession: vi.fn(async () => ({
        amountTotalMinor: null,
        checkoutSessionId: checkoutSessionId('cs_test_123'),
        currencyCode: null,
        customer: { email: null, name: null, phone: null },
        newsletterConsentCopyVersion: null,
        newsletterOptIn: false,
        paymentStatus: 'unpaid' as const,
        shippingAddress: null,
        status: 'expired' as const,
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
        newsletterConsentCopyVersion: null,
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
      imageUrls: ['https://blackbox-records-web.pages.dev/assets/catalog/releases/disintegration.jpg'],
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
    expect(catalogReconciler.calls[0]?.options.applyProductProjection).toBe(false);
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

  it('can read Store Offer price without applying catalog mutations', async () => {
    await expect(
      readStoreOffer(
        storeItems,
        itemAvailability,
        stock,
        catalogReconciler,
        productProjections,
        storeItem.storeItemSlug,
        { applyCatalogMutations: false },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        canCheckout: true,
        catalogStatus: 'ready',
      }),
    );

    expect(catalogReconciler.calls[0]?.options.apply).toBe(false);
    expect(catalogReconciler.calls[0]?.options.applyProductProjection).toBe(false);
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

  it('can start checkout without applying catalog mutations', async () => {
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
        undefined,
        { applyCatalogMutations: false },
      ),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    expect(catalogReconciler.calls[0]?.options.apply).toBe(false);
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

  it('returns a coherent sold-out Store Offer when OnlineStock is exhausted', async () => {
    await stock.save(storeItem.variantId, {
      onlineQuantity: 0,
      quantity: 3,
    });

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
        label: 'Sold Out',
        status: 'sold_out',
      },
      canCheckout: false,
      catalogStatus: 'sold_out',
      price: null,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
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
        availability: {
          label: 'Checkout Paused',
          status: 'unavailable',
        },
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

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          {
            displayName: 'BlackBox Records - Disintegration - Black Vinyl LP',
            lineAmountMinor: 2800,
            optionLabel: null,
            quantity: 1,
            storeItemSlug: 'disintegration-black-vinyl-lp',
            stripePriceId: 'price_test_barren_point',
            unitAmountMinor: 2800,
            variantId: 'variant_disintegration-black-vinyl-lp_standard',
          },
        ],
        cancelUrl: 'https://example.com/checkout',
        newsletterOptIn: false,
        successUrl: 'https://example.com/return',
      }),
    );
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

  it('creates the complete 30-minute hold before requesting provider authority', async () => {
    checkoutGateway.createHostedCheckoutSession = vi.fn(async (request) => {
      const [sessionlessHold] = [...orders.records.values()];

      expect(sessionlessHold).toMatchObject({
        checkoutSessionId: null,
        status: 'pending_payment',
      });
      expect(sessionlessHold?.lines).toHaveLength(1);
      expect(request.orderId).toBe(sessionlessHold?.id);
      expect(request.checkoutExpiresAt).toEqual(sessionlessHold?.checkoutExpiresAt);
      expect(request.checkoutExpiresAt.getTime() - sessionlessHold!.createdAt.getTime()).toBe(30 * 60 * 1000);

      return {
        checkoutSessionId: checkoutSessionId('cs_test_123'),
        checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
      };
    });

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
  });

  it('checks only the five oldest expired provider holds before one hold retry', async () => {
    const now = new Date('2026-09-01T00:00:00.000Z');
    const staleSessionIds: CheckoutSessionId[] = [];
    await stock.save(storeItem.variantId, { onlineQuantity: 6, quantity: 6 });
    orders.effectiveAvailability.set(storeItem.variantId, 6);

    for (let index = 0; index < 6; index += 1) {
      const createdAt = new Date(now.getTime() - (70 - index) * 60 * 1000);
      const created = await orders.createPendingHold({
        checkoutExpiresAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        createdAt,
        lines: [
          {
            displayName: 'Stale item',
            lineAmountMinor: 2500,
            optionLabel: null,
            quantity: cartQuantity(1),
            storeItemSlug: storeItem.storeItemSlug,
            stripePriceId: stripePriceId(`price_test_stale_${index}`),
            unitAmountMinor: 2500,
            variantId: storeItem.variantId,
          },
        ],
        orderId: `order_stale_${index}`,
      });
      expect(created.kind).toBe('created');
      if (created.kind !== 'created') continue;

      const sessionId = checkoutSessionId(`cs_test_stale_${index}`);
      staleSessionIds.push(sessionId);
      await orders.bindCheckoutSession(created.hold, sessionId, createdAt);
    }

    orders.createPendingHoldCalls = 0;
    checkoutGateway.readCheckoutSession = vi.fn(async (sessionId) => ({
      amountTotalMinor: null,
      checkoutSessionId: sessionId,
      currencyCode: null,
      customer: { email: null, name: null, phone: null },
      newsletterConsentCopyVersion: null,
      newsletterOptIn: false,
      paymentStatus: 'unpaid' as const,
      shippingAddress: null,
      status: 'expired' as const,
    }));

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
        undefined,
        { now },
      ),
    ).resolves.toEqual(expect.objectContaining({ checkoutSessionId: 'cs_test_123' }));

    expect(checkoutGateway.readCheckoutSession).toHaveBeenCalledTimes(5);
    expect(vi.mocked(checkoutGateway.readCheckoutSession).mock.calls.map(([sessionId]) => sessionId)).toEqual(
      staleSessionIds.slice(0, 5),
    );
    expect(orders.createPendingHoldCalls).toBe(2);
    expect(orders.records.get(staleSessionIds[5]!)).toMatchObject({ status: 'pending_payment' });
  });

  it('does not release a locally expired hold while its provider session remains open', async () => {
    const now = new Date('2026-09-01T00:00:00.000Z');
    orders.effectiveAvailability.set(storeItem.variantId, 1);
    const created = await orders.createPendingHold({
      checkoutExpiresAt: new Date(now.getTime() - 60 * 1000),
      createdAt: new Date(now.getTime() - 31 * 60 * 1000),
      lines: [
        {
          displayName: 'Stale item',
          lineAmountMinor: 2500,
          optionLabel: null,
          quantity: cartQuantity(1),
          storeItemSlug: storeItem.storeItemSlug,
          stripePriceId: stripePriceId('price_test_stale_open'),
          unitAmountMinor: 2500,
          variantId: storeItem.variantId,
        },
      ],
      orderId: 'order_stale_open',
    });
    expect(created.kind).toBe('created');
    if (created.kind !== 'created') return;
    await orders.bindCheckoutSession(created.hold, checkoutSessionId('cs_test_stale_open'), now);
    orders.createPendingHoldCalls = 0;
    checkoutGateway.readCheckoutSession = vi.fn(async () => ({
      amountTotalMinor: null,
      checkoutSessionId: checkoutSessionId('cs_test_stale_open'),
      currencyCode: null,
      customer: { email: null, name: null, phone: null },
      newsletterConsentCopyVersion: null,
      newsletterOptIn: false,
      paymentStatus: 'unpaid' as const,
      shippingAddress: null,
      status: 'open' as const,
    }));

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
        undefined,
        { now },
      ),
    ).rejects.toBeInstanceOf(CheckoutUnavailableError);

    expect(orders.createPendingHoldCalls).toBe(1);
    expect(orders.records.get('cs_test_stale_open')).toMatchObject({ status: 'pending_payment' });
  });

  it('fails closed when provider confirmation for a stale hold errors', async () => {
    const now = new Date('2026-09-01T00:00:00.000Z');
    orders.effectiveAvailability.set(storeItem.variantId, 1);
    const created = await orders.createPendingHold({
      checkoutExpiresAt: new Date(now.getTime() - 60 * 1000),
      createdAt: new Date(now.getTime() - 31 * 60 * 1000),
      lines: [
        {
          displayName: 'Stale item',
          lineAmountMinor: 2500,
          optionLabel: null,
          quantity: cartQuantity(1),
          storeItemSlug: storeItem.storeItemSlug,
          stripePriceId: stripePriceId('price_test_stale_error'),
          unitAmountMinor: 2500,
          variantId: storeItem.variantId,
        },
      ],
      orderId: 'order_stale_error',
    });
    expect(created.kind).toBe('created');
    if (created.kind !== 'created') return;
    await orders.bindCheckoutSession(created.hold, checkoutSessionId('cs_test_stale_error'), now);
    orders.createPendingHoldCalls = 0;
    checkoutGateway.readCheckoutSession = vi.fn(async () => {
      throw new Error('provider unavailable');
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
        undefined,
        { now },
      ),
    ).rejects.toBeInstanceOf(CheckoutUnavailableError);

    expect(orders.createPendingHoldCalls).toBe(1);
    expect(orders.records.get('cs_test_stale_error')).toMatchObject({ status: 'pending_payment' });
  });

  it('releases a sessionless hold when provider creation fails', async () => {
    checkoutGateway.createHostedCheckoutSession = vi.fn(async () => {
      throw new Error('provider unavailable');
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
    ).rejects.toThrow('provider unavailable');

    expect([...orders.records.values()]).toEqual([
      expect.objectContaining({ checkoutSessionId: null, status: 'not_paid' }),
    ]);
  });

  it('expires a provider session before releasing a hold after binding fails', async () => {
    orders.bindShouldFail = true;

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

    expect(checkoutGateway.expireHostedCheckoutSession).toHaveBeenCalledWith('cs_test_123');
    expect([...orders.records.values()]).toEqual([
      expect.objectContaining({ checkoutSessionId: null, status: 'not_paid' }),
    ]);
  });

  it('starts hosted Checkout with the current replacement Stripe Price', async () => {
    catalogReconciler.prices.set(
      storeItem.variantId,
      createCatalogPrice({
        amountMinor: 3200,
        priceId: 'price_test_replacement_black_vinyl',
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

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          expect.objectContaining({
            stripePriceId: 'price_test_replacement_black_vinyl',
          }),
        ],
      }),
    );
  });

  it('rejects checkout when active Stripe Price Authority is ambiguous', async () => {
    catalogReconciler.prices.clear();
    catalogReconciler.issues.set(storeItem.variantId, [
      {
        code: 'ambiguous_active_price',
        detail: 'Multiple active Prices match this Store Item variant.',
        driftCategory: 'price_authority',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
    ]);

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

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          {
            displayName: 'BlackBox Records - Disintegration - Black Vinyl LP',
            lineAmountMinor: null,
            optionLabel: null,
            quantity: 1,
            storeItemSlug: 'disintegration-black-vinyl-lp',
            stripePriceId: 'price_test_pay_what_you_want',
            unitAmountMinor: null,
            variantId: 'variant_disintegration-black-vinyl-lp_standard',
          },
        ],
        cancelUrl: 'https://example.com/checkout',
        newsletterOptIn: false,
        successUrl: 'https://example.com/return',
      }),
    );
  });

  it('merges duplicate CartLines into one immutable order-line snapshot per variant', async () => {
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
              quantity: cartQuantity(1),
              storeItemSlug: storeItem.storeItemSlug,
              variantId: storeItem.variantId,
            },
            {
              quantity: cartQuantity(1),
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

    expect(checkoutGateway.createHostedCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          {
            displayName: 'BlackBox Records - Disintegration - Black Vinyl LP',
            lineAmountMinor: 5600,
            optionLabel: null,
            quantity: 2,
            storeItemSlug: 'disintegration-black-vinyl-lp',
            stripePriceId: 'price_test_barren_point',
            unitAmountMinor: 2800,
            variantId: 'variant_disintegration-black-vinyl-lp_standard',
          },
        ],
        cancelUrl: 'https://example.com/checkout',
        newsletterOptIn: false,
        successUrl: 'https://example.com/return',
      }),
    );
    expect(orders.records.get('cs_test_123')?.lines).toEqual([
      expect.objectContaining({
        displayName: 'BlackBox Records - Disintegration - Black Vinyl LP',
        lineAmountMinor: 5600,
        optionLabel: null,
        quantity: 2,
        unitAmountMinor: 2800,
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    ]);
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
