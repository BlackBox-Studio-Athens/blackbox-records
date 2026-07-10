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
    catalogEnvironment: 'uat',
    catalogWebhookMutationEnabled: true,
    findStoreItemByVariantId: vi.fn(async () => storeItem),
    markCatalogEventFailed: vi.fn(async () => undefined),
    markCatalogEventSucceeded: vi.fn(async () => undefined),
    publishCheckoutOrderPaid: vi.fn(),
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
          appEnv: 'uat',
          sourceId: 'disintegration',
          sourceKind: 'release',
          storeItemSlug: 'disintegration-black-vinyl-lp',
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
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_product');
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
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_price');
  });

  it('acknowledges conflicting catalog identity without reconciliation', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_conflicting_identity',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {
          appEnv: 'uat',
          sourceId: 'disintegration',
          sourceKind: 'release',
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_other_standard',
        },
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_conflicting_identity',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.findStoreItemByVariantId).not.toHaveBeenCalled();
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_conflicting_identity');
  });

  it('acknowledges BlackBox metadata with an external lookup key as conflicting identity', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_external_lookup_conflict',
        lookup_key: 'external:catalog:price',
        metadata: {
          appEnv: 'uat',
          sourceId: 'disintegration',
          sourceKind: 'release',
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_external_lookup_conflict',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.findStoreItemByVariantId).not.toHaveBeenCalled();
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_external_lookup_conflict');
  });

  it('acknowledges duplicate catalog events without replaying reconciliation', async () => {
    const services = createServices();
    vi.mocked(services.recordCatalogWebhookEvent).mockResolvedValueOnce({
      record: {
        catalogObjectId: 'price_test_123',
        catalogObjectKind: 'price' as const,
        eventId: 'evt_catalog_price',
        eventType: 'price.updated',
        processingCompletedAt: new Date('2026-05-24T00:01:00.000Z'),
        processingFailureReason: null,
        processingStatus: 'succeeded' as const,
        processedAt: new Date('2026-05-24T00:00:00.000Z'),
        stripeCreatedAt: new Date(1_790_000_000 * 1000),
        variantId: storeItem.variantId,
      },
      status: 'duplicate_succeeded' as const,
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

  it('retries duplicate catalog events that previously failed processing', async () => {
    const services = createServices();
    vi.mocked(services.recordCatalogWebhookEvent).mockResolvedValueOnce({
      record: {
        catalogObjectId: 'price_test_123',
        catalogObjectKind: 'price' as const,
        eventId: 'evt_catalog_price',
        eventType: 'price.updated',
        processingCompletedAt: null,
        processingFailureReason: 'reconciliation_failed',
        processingStatus: 'failed' as const,
        processedAt: new Date('2026-05-24T00:00:00.000Z'),
        stripeCreatedAt: new Date(1_790_000_000 * 1000),
        variantId: storeItem.variantId,
      },
      status: 'duplicate_retryable' as const,
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
    expect(services.reconcileCatalogVariant).toHaveBeenCalledWith(storeItem);
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_price');
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
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_price_old_payload');
  });

  it('records blocking catalog drift without logging false reconciliation success', async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
    };
    const services = {
      ...createServices(),
      logger,
    };
    vi.mocked(services.reconcileCatalogVariant).mockResolvedValueOnce(
      createCatalogResult([
        {
          code: 'ambiguous_active_price',
          detail: 'Multiple active Prices match the variant.',
          driftCategory: 'price_authority',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ]),
    );
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_ambiguous',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_ambiguous',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_ambiguous');
    expect(services.markCatalogEventFailed).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'catalog_drift',
        retryable: false,
        safeReason: 'ambiguous_active_price',
      }),
    );
    expect(logger.info).not.toHaveBeenCalledWith(expect.objectContaining({ outcome: 'catalog_reconciled' }));
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
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_deleted');
  });

  it('acknowledges malformed catalog identity without reconciliation', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_123',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:not-a-variant',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_malformed',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.findStoreItemByVariantId).not.toHaveBeenCalled();
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_malformed');
  });

  it('ignores catalog events from another Product Environment without D1 mutation', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_123',
        lookup_key: 'blackbox:prd:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_foreign',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.findStoreItemByVariantId).not.toHaveBeenCalled();
    expect(services.reconcileCatalogVariant).not.toHaveBeenCalled();
    expect(services.markCatalogEventSucceeded).toHaveBeenCalledWith('evt_catalog_foreign');
  });

  it('leaves catalog events retryable when reconciliation fails', async () => {
    const services = createServices();
    vi.mocked(services.reconcileCatalogVariant).mockRejectedValueOnce(new Error('Stripe unavailable'));
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_123',
        lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_retryable',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).rejects.toThrow('Stripe unavailable');
    expect(services.markCatalogEventFailed).toHaveBeenCalledWith('evt_catalog_retryable', 'reconciliation_failed');
    expect(services.markCatalogEventSucceeded).not.toHaveBeenCalled();
  });

  it('reports PRD catalog webhooks as readiness-only before the open gate', async () => {
    const services = {
      ...createServices(),
      catalogEnvironment: 'prd' as const,
      catalogWebhookMutationEnabled: false,
    };
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_live_123',
        lookup_key: 'blackbox:prd:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_prd_readiness',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({
      ignored: true,
      received: true,
    });
    expect(services.recordCatalogWebhookEvent).not.toHaveBeenCalled();
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
