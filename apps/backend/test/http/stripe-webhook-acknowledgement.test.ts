import { describe, expect, it, vi } from 'vitest';

import {
  acknowledgeVerifiedStripeWebhookEvent,
  type StripeWebhookAcknowledgementServices,
} from '../../src/interfaces/http/routes/stripe-webhook-acknowledgement';
import { createCheckoutOrderReferenceToken, type CheckoutOrderPaid } from '../../src/application/commerce/orders';
import type { CatalogSyncIssue, CatalogSyncVariantResult } from '../../src/application/commerce/catalog-sync';
import type { VerifiedStripeWebhookEvent } from '../../src/infrastructure/stripe';
import type { StoreItemOptionRecord } from '../../src/domain/commerce/repositories/spi';
import { storeItemSlug, variantId } from '../support/commerce-value-objects';

const storeItem: StoreItemOptionRecord = {
  sourceId: 'disintegration',
  sourceKind: 'release',
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
};

function createServices(): StripeWebhookAcknowledgementServices {
  return {
    applyNonPaidCheckoutReconciliation: vi.fn(),
    applyPaidCheckoutReconciliation: vi.fn(),
    findStoreItemByStripeProductId: vi.fn(async () => storeItem),
    markCatalogEventFailed: vi.fn(async () => undefined),
    markCatalogEventSucceeded: vi.fn(async () => undefined),
    publishCheckoutOrderPaid: vi.fn(),
    recoverCheckoutOrderSession: vi.fn(async () => true),
    recordCatalogWebhookEvent: vi.fn(async () => ({
      record: {
        catalogObjectId: 'price_test_123',
        catalogObjectKind: 'price' as const,
        eventId: 'evt_catalog_price',
        eventType: 'price.updated',
        processingCompletedAt: null,
        processingFailureReason: null,
        processingStatus: 'pending' as const,
        processedAt: new Date('2026-05-24T00:00:00.000Z'),
        stripeCreatedAt: new Date('2026-05-23T23:46:40.000Z'),
        variantId: storeItem.variantId,
      },
      status: 'recorded' as const,
    })),
    reconcileCatalogVariant: vi.fn(async () => createCatalogResult()),
  };
}

function createCatalogResult(issues: CatalogSyncIssue[] = []): CatalogSyncVariantResult {
  return {
    actions: [],
    issueCount: issues.length,
    issues,
    lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
    mapping: null,
    resolvedPrice: null,
    snapshot: null,
    storeItem,
  };
}

describe('Stripe webhook acknowledgement checkout events', () => {
  it('looks up sessions without metadata before ignoring unrelated missing orders', async () => {
    const services = createServices();
    const event = createPaidCheckoutEvent();
    if (!('checkoutSession' in event)) throw new Error('Expected checkout fixture');
    event.checkoutSession.metadata = {};
    vi.mocked(services.applyPaidCheckoutReconciliation).mockResolvedValueOnce({
      kind: 'missing_order',
      checkoutSessionId: event.checkoutSession.id,
    } as never);
    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      received: true,
      ignored: true,
    });
    expect(services.applyPaidCheckoutReconciliation).toHaveBeenCalledOnce();
    expect(services.recoverCheckoutOrderSession).not.toHaveBeenCalled();
  });
  it('publishes CheckoutOrderPaid only after paid reconciliation applies', async () => {
    const services = createServices();
    const checkoutOrderPaid = createCheckoutOrderPaidFixture();
    vi.mocked(services.applyPaidCheckoutReconciliation).mockResolvedValueOnce({
      checkoutOrderPaid,
      kind: 'applied',
      order: {} as never,
      stock: {} as never,
      stockChange: {} as never,
    });

    await expect(acknowledgeVerifiedStripeWebhookEvent(createPaidCheckoutEvent(), services)).resolves.toEqual({
      received: true,
    });

    expect(services.applyPaidCheckoutReconciliation).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendedOrderStatus: 'paid',
        source: expect.objectContaining({
          customer: expect.objectContaining({
            email: 'buyer@example.com',
          }),
          newsletterOptIn: true,
        }),
      }),
    );
    expect(services.recoverCheckoutOrderSession).toHaveBeenCalledWith(
      'order_1',
      'cs_test_123',
      new Date(1_790_002_100_000),
    );
    expect(services.publishCheckoutOrderPaid).toHaveBeenCalledWith(checkoutOrderPaid);
  });

  it('does not publish CheckoutOrderPaid for paid replay reconciliation', async () => {
    const services = createServices();
    vi.mocked(services.applyPaidCheckoutReconciliation).mockResolvedValueOnce({
      kind: 'replay',
      order: {} as never,
      paidFulfillment: {
        kind: 'incomplete',
        order: {} as never,
        reason: 'incomplete_paid_fulfillment',
      },
    });

    await expect(acknowledgeVerifiedStripeWebhookEvent(createPaidCheckoutEvent(), services)).resolves.toEqual({
      received: true,
    });

    expect(services.publishCheckoutOrderPaid).not.toHaveBeenCalled();
  });
});

function catalogEvent(kind: 'price' | 'product' = 'price'): VerifiedStripeWebhookEvent {
  return {
    id: 'evt_catalog',
    created: 1790000000,
    isAllowed: true,
    type: kind === 'price' ? 'price.updated' : 'product.updated',
    catalogObject:
      kind === 'price'
        ? { id: 'price_test', object: kind, product: 'prod_test', metadata: {}, lookup_key: null }
        : { id: 'prod_test', object: kind, metadata: {} },
  } as VerifiedStripeWebhookEvent;
}

describe('Stripe webhook acknowledgement catalog events', () => {
  it.each(['price', 'product'] as const)(
    'refreshes only the bound item for %s events without requiring payload metadata',
    async (kind) => {
      const services = createServices();
      await expect(acknowledgeVerifiedStripeWebhookEvent(catalogEvent(kind), services)).resolves.toEqual({
        received: true,
      });
      expect(services.findStoreItemByStripeProductId).toHaveBeenCalledWith('prod_test');
      expect(services.reconcileCatalogVariant).toHaveBeenCalledWith(storeItem);
      expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog');
    },
  );

  it('ignores unbound Products even when payload metadata claims a local identity', async () => {
    const services = createServices();
    vi.mocked(services.findStoreItemByStripeProductId).mockResolvedValue(null);
    await expect(acknowledgeVerifiedStripeWebhookEvent(catalogEvent(), services)).resolves.toEqual({
      received: true,
      ignored: true,
    });
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
  });

  it('does not repeat successful event mutations', async () => {
    const services = createServices();
    const recorded = await services.recordCatalogWebhookEvent({} as never);
    vi.mocked(services.recordCatalogWebhookEvent).mockResolvedValue({ ...recorded, status: 'duplicate_succeeded' });
    await acknowledgeVerifiedStripeWebhookEvent(catalogEvent(), services);
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
  });

  it('keeps failed refreshes retryable and completes a successful retry', async () => {
    const services = createServices();
    vi.mocked(services.reconcileCatalogVariant).mockRejectedValueOnce(new Error('Stripe unavailable'));
    await expect(acknowledgeVerifiedStripeWebhookEvent(catalogEvent(), services)).rejects.toThrow('Stripe unavailable');
    expect(services.markCatalogEventFailed).toHaveBeenCalledWith('evt_catalog', 'reconciliation_failed');
    expect(services.markCatalogEventSucceeded).not.toHaveBeenCalled();
    await acknowledgeVerifiedStripeWebhookEvent(catalogEvent(), services);
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog');
  });

  it('acknowledges persistent catalog drift without enabling checkout', async () => {
    const services = createServices();
    vi.mocked(services.reconcileCatalogVariant).mockResolvedValue(
      createCatalogResult([
        {
          code: 'missing_price',
          detail: 'Missing default',
          driftCategory: 'price_authority',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ]),
    );
    await expect(acknowledgeVerifiedStripeWebhookEvent(catalogEvent(), services)).resolves.toEqual({
      received: true,
      ignored: true,
    });
    expect(services.applyPaidCheckoutReconciliation).not.toHaveBeenCalled();
  });
});

function createPaidCheckoutEvent(): VerifiedStripeWebhookEvent {
  return {
    checkoutSession: {
      amount_total: 2500,
      expires_at: 1_790_002_100,
      currency: 'eur',
      collected_information: {
        shipping_details: {
          name: 'Shipping Recipient',
          address: {
            city: 'Athens',
            country: 'GR',
            line1: 'Shipping Street 2',
            line2: null,
            postal_code: '10558',
            state: null,
          },
        },
      },
      customer_details: {
        address: {
          city: 'Athens',
          country: 'GR',
          line1: 'Long Street 1',
          line2: null,
          postal_code: '10558',
          state: null,
        },
        email: 'buyer@example.com',
        name: 'Buyer Name',
        phone: '+302100000000',
      },
      customer_email: 'fallback@example.com',
      id: 'cs_test_123',
      metadata: {
        newsletterOptIn: 'true',
        orderId: 'order_1',
      },
      object: 'checkout.session',
      payment_intent: 'pi_test_123',
      payment_status: 'paid',
      status: 'complete',
    },
    created: 1_790_000_000,
    id: 'evt_checkout_paid',
    isAllowed: true,
    type: 'checkout.session.completed',
  } as unknown as VerifiedStripeWebhookEvent;
}

function createCheckoutOrderPaidFixture(): CheckoutOrderPaid {
  return {
    amountTotalMinor: 2500,
    checkoutSessionId: 'cs_test_123',
    currencyCode: 'EUR',
    customerName: 'Buyer Name',
    lineItems: [
      {
        displayName: 'Disintegration Black Vinyl LP',
        lineAmountMinor: 2500,
        optionLabel: null,
        quantity: 1,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePriceId: 'price_test_123',
        unitAmountMinor: 2500,
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ],
    newsletterOptIn: true,
    occurredAt: new Date('2026-04-25T11:00:00.000Z'),
    orderId: 'order_1',
    orderReference: createCheckoutOrderReferenceToken({
      checkoutSessionId: 'cs_test_123',
      orderId: 'order_1',
      referenceDate: new Date('2026-04-25T11:00:00.000Z'),
    }),
    paidAt: new Date('2026-04-25T11:00:00.000Z'),
    paymentStatus: 'paid' as const,
    shippingAddress: {
      city: 'Athens',
      country: 'GR',
      line1: 'Long Street 1',
      line2: null,
      postalCode: '10558',
      state: null,
    },
    shopperContact: {
      email: 'buyer@example.com',
      phone: '+302100000000',
    },
    stripePaymentIntentId: 'pi_test_123',
  };
}
