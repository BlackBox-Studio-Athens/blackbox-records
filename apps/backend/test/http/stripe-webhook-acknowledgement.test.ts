import { describe, expect, it, vi } from 'vitest';

import {
  acknowledgeVerifiedStripeWebhookEvent,
  type StripeWebhookAcknowledgementServices,
} from '../../src/interfaces/http/routes/stripe-webhook-acknowledgement';
import type { VerifiedStripeWebhookEvent } from '../../src/infrastructure/stripe';
import type { StoreItemOptionRecord } from '../../src/domain/commerce/repositories/spi';
import { storeItemSlug, variantId } from '../support/commerce-value-objects';

const storeItem: StoreItemOptionRecord = {
  sourceId: 'barren-point',
  sourceKind: 'release',
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_barren-point_standard'),
};

function createServices(): StripeWebhookAcknowledgementServices {
  return {
    applyNonPaidCheckoutReconciliation: vi.fn(),
    applyPaidCheckoutReconciliation: vi.fn(),
    findStoreItemByVariantId: vi.fn(async () => storeItem),
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

describe('Stripe webhook acknowledgement catalog events', () => {
  it('reconciles Product catalog events by app-owned variant metadata', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'prod_test_123',
        metadata: {
          variantId: 'variant_barren-point_standard',
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
      variantId: 'variant_barren-point_standard',
    });
    expect(services.findStoreItemByVariantId).toHaveBeenCalledWith('variant_barren-point_standard');
    expect(services.reconcileCatalogVariant).toHaveBeenCalledWith(storeItem);
  });

  it('reconciles Price catalog events by deterministic lookup key when metadata is absent', async () => {
    const services = createServices();
    const event: VerifiedStripeWebhookEvent = {
      catalogObject: {
        id: 'price_test_123',
        lookup_key: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_barren-point_standard',
        metadata: {},
        object: 'price',
      },
      created: 1_790_000_000,
      id: 'evt_catalog_price',
      isAllowed: true,
      type: 'price.updated',
    } as unknown as VerifiedStripeWebhookEvent;

    await expect(acknowledgeVerifiedStripeWebhookEvent(event, services)).resolves.toEqual({ received: true });
    expect(services.findStoreItemByVariantId).toHaveBeenCalledWith('variant_barren-point_standard');
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
        lookup_key: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_barren-point_standard',
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
        lookup_key: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_barren-point_standard',
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
