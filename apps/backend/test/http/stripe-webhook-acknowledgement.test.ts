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
