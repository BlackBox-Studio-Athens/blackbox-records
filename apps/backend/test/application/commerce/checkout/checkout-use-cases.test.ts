import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CheckoutConfigurationError,
  CheckoutUnavailableError,
  listVariantOffersForStoreItem,
  readCheckoutState,
  readStoreOffer,
  startCheckout,
  StoreItemNotFoundError,
  VariantMismatchError,
  type CheckoutGateway,
} from '../../../../src/application/commerce/checkout';
import type {
  ItemAvailabilityRecord,
  ItemAvailabilityRepository,
  StockRecord,
  StockRepository,
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
  VariantStripeMappingRecord,
  VariantStripeMappingRepository,
} from '../../../../src/domain/commerce/repositories';

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
      onlineQuantity: state.onlineQuantity,
      quantity: state.quantity,
      updatedAt: new Date('2026-04-24T10:00:00.000Z'),
      variantId,
    };

    this.records.set(variantId, record);

    return record;
  }
}

class InMemoryVariantStripeMappingRepository implements VariantStripeMappingRepository {
  public readonly records = new Map<string, VariantStripeMappingRecord>();

  public async findByVariantId(variantId: string): Promise<VariantStripeMappingRecord | null> {
    return this.records.get(variantId) ?? null;
  }
}

describe('checkout use cases', () => {
  const storeItem: StoreItemOptionRecord = {
    sourceId: 'barren-point',
    sourceKind: 'release',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  };

  let storeItems: InMemoryStoreItemOptionRepository;
  let itemAvailability: InMemoryItemAvailabilityRepository;
  let stock: InMemoryStockRepository;
  let stripeMappings: InMemoryVariantStripeMappingRepository;
  let checkoutGateway: CheckoutGateway;

  beforeEach(async () => {
    storeItems = new InMemoryStoreItemOptionRepository([storeItem]);
    itemAvailability = new InMemoryItemAvailabilityRepository();
    stock = new InMemoryStockRepository();
    stripeMappings = new InMemoryVariantStripeMappingRepository();
    checkoutGateway = {
      createEmbeddedCheckoutSession: vi.fn(async () => ({
        checkoutSessionId: 'cs_test_123',
        clientSecret: 'cs_test_123_secret_abc',
      })),
      readCheckoutSession: vi.fn(async () => ({
        checkoutSessionId: 'cs_test_123',
        paymentStatus: 'paid' as const,
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
    stripeMappings.records.set(storeItem.variantId, {
      stripePriceId: 'price_test_barren_point',
      variantId: storeItem.variantId,
    });
  });

  it('reads backend-known checkout eligibility for one store item', async () => {
    await expect(readStoreOffer(storeItems, itemAvailability, stock, 'disintegration-black-vinyl-lp')).resolves.toEqual(
      {
        availability: {
          label: 'Available',
          status: 'available',
        },
        canCheckout: true,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      },
    );
  });

  it('returns array-shaped variant offers for future multi-variant expansion', async () => {
    await expect(
      listVariantOffersForStoreItem(storeItems, itemAvailability, stock, 'disintegration-black-vinyl-lp'),
    ).resolves.toEqual([
      expect.objectContaining({
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_barren-point_standard',
      }),
    ]);
  });

  it('rejects unknown store items before starting checkout', async () => {
    await expect(
      startCheckout(storeItems, itemAvailability, stock, stripeMappings, checkoutGateway, {
        returnUrl: 'https://example.com/return',
        storeItemSlug: 'unknown',
        variantId: storeItem.variantId,
      }),
    ).rejects.toBeInstanceOf(StoreItemNotFoundError);
  });

  it('rejects variants that do not belong to the requested store item', async () => {
    await expect(
      startCheckout(storeItems, itemAvailability, stock, stripeMappings, checkoutGateway, {
        returnUrl: 'https://example.com/return',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: 'variant_other',
      }),
    ).rejects.toBeInstanceOf(VariantMismatchError);
  });

  it('rejects unavailable or out-of-online-stock items', async () => {
    await stock.save(storeItem.variantId, {
      onlineQuantity: 0,
      quantity: 3,
    });

    await expect(
      startCheckout(storeItems, itemAvailability, stock, stripeMappings, checkoutGateway, {
        returnUrl: 'https://example.com/return',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      }),
    ).rejects.toBeInstanceOf(CheckoutUnavailableError);
  });

  it('returns a non-500 configuration error when Stripe price mapping is missing', async () => {
    stripeMappings.records.clear();

    await expect(
      startCheckout(storeItems, itemAvailability, stock, stripeMappings, checkoutGateway, {
        returnUrl: 'https://example.com/return',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      }),
    ).rejects.toBeInstanceOf(CheckoutConfigurationError);
  });

  it('starts embedded Checkout with the mapped Stripe price', async () => {
    await expect(
      startCheckout(storeItems, itemAvailability, stock, stripeMappings, checkoutGateway, {
        returnUrl: 'https://example.com/return',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      }),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      clientSecret: 'cs_test_123_secret_abc',
    });

    expect(checkoutGateway.createEmbeddedCheckoutSession).toHaveBeenCalledWith({
      returnUrl: 'https://example.com/return',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      stripePriceId: 'price_test_barren_point',
      variantId: 'variant_barren-point_standard',
    });
  });

  it('maps Stripe Checkout Session status into app-owned return state without D1 writes', async () => {
    await expect(readCheckoutState(checkoutGateway, 'cs_test_123')).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      paymentStatus: 'paid',
      state: 'paid',
      status: 'complete',
    });

    expect(checkoutGateway.readCheckoutSession).toHaveBeenCalledWith('cs_test_123');
  });
});
