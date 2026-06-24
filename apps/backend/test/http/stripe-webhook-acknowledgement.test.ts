import { describe, expect, it, vi } from 'vitest';

import {
  acknowledgeVerifiedStripeWebhookEvent,
  type StripeWebhookAcknowledgementServices,
} from '../../src/interfaces/http/routes/stripe-webhook-acknowledgement';
import { createCheckoutOrderReferenceToken, type CheckoutOrderPaid } from '../../src/application/commerce/orders';
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
    findStoreItemByVariantId: vi.fn(async () => storeItem),
    publishCheckoutOrderPaid: vi.fn(),
    recordCatalogWebhookEvent: vi.fn(async () => ({
      record: {
        catalogObjectId: 'price_test_123',
        catalogObjectKind: 'price' as const,
        eventId: 'evt_catalog_price',
        eventType: 'price.updated',
        processedAt: new Date('2026-05-24T00:00:00.000Z'),
        stripeCreatedAt: new Date('2026-05-23T23:46:40.000Z'),
        variantId: storeItem.variantId,
      },
      status: 'recorded' as const,
    })),
    reconcileCatalogVariant: vi.fn(),
  };
}

describe('Stripe webhook acknowledgement checkout events', () => {
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
    expect(services.publishCheckoutOrderPaid).toHaveBeenCalledWith(checkoutOrderPaid);
  });

  it('does not publish CheckoutOrderPaid for paid replay reconciliation', async () => {
    const services = createServices();
    vi.mocked(services.applyPaidCheckoutReconciliation).mockResolvedValueOnce({
      kind: 'replay',
      order: {} as never,
    });

    await expect(acknowledgeVerifiedStripeWebhookEvent(createPaidCheckoutEvent(), services)).resolves.toEqual({
      received: true,
    });

    expect(services.publishCheckoutOrderPaid).not.toHaveBeenCalled();
  });
});

describe('Stripe webhook acknowledgement catalog events', () => {
  it('reconciles Product catalog events by app-owned variant metadata', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'prod_test_123',
        metadata: {
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
        object: 'product',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_product',
      isAllowed: true,
      type: 'product.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({ received: true });
    expect(services.recordCatalogWebhookEvent).toHaveBeenCalledWith({
      catalogObjectId: 'prod_test_123',
      catalogObjectKind: 'product',
      eventId: 'evt_catalog_product',
      eventType: 'product.updated',
      stripeCreatedAt: new Date(1_790_000_000 * 1000),
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(services.findStoreItemByVariantId).toHaveBeenCalledWith('variant_disintegration-black-vinyl-lp_standard');
    expect(services.reconcileCatalogVariant).toHaveBeenCalledWith(storeItem);
  });

  it('reconciles Price catalog events by deterministic lookup key when metadata is absent', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_123',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_price',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({ received: true });
    expect(services.findStoreItemByVariantId).toHaveBeenCalledWith('variant_disintegration-black-vinyl-lp_standard');
    expect(services.reconcileCatalogVariant).toHaveBeenCalledWith(storeItem);
  });

  it('acknowledges duplicate catalog events without replaying reconciliation', async () => {
    const services = createServices();
    vi.mocked(services.recordCatalogWebhookEvent).mockResolvedValueOnce({
      record: {
        catalogObjectId: 'price_test_123',
        catalogObjectKind: 'price' as const,
        eventId: 'evt_catalog_price',
        eventType: 'price.updated',
        processedAt: new Date('2026-05-24T00:00:00.000Z'),
        stripeCreatedAt: new Date(1_790_000_000 * 1000),
        variantId: storeItem.variantId,
      },
      status: 'duplicate' as const,
    });
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_123',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_price',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({ received: true });
    expect(services.findStoreItemByVariantId).not.toHaveBeenCalled();
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
  });

  it('reconciles out-of-order catalog events from current Store Item state instead of event payload state', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        active: false,
        id: 'price_test_old_payload',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
        unit_amount: 1000,
      },
      created: 1_790_000_000,
      id: 'evt_catalog_price_old_payload',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({ received: true });
    expect(services.reconcileCatalogVariant).toHaveBeenCalledWith(storeItem);
    expect(services.reconcileCatalogVariant).toHaveBeenCalledTimes(1);
  });

  it('acknowledges deleted catalog events without reconciliation when no variant can be read', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        deleted: true,
        id: 'price_test_123',
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_deleted',
      isAllowed: true,
      type: 'price.deleted',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.findStoreItemByVariantId).not.toHaveBeenCalled();
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
  });
});

function createPaidCheckoutEvent(): VerifiedStripeWebhookEvent {
  return {
    checkoutSession: {
      amount_total: 2500,
      currency: 'eur',
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
        quantity: 1,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePriceId: 'price_test_123',
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
