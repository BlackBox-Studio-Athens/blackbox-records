import { describe, expect, it } from 'vitest';

import {
  createCartQuantity,
  createOnlineStockQuantity,
  createStockChangeDelta,
  createStockQuantity,
  createStockState,
  parseCheckoutSessionId,
  parsePaymentIntentId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../../src/domain/commerce';

describe('commerce value objects', () => {
  it('parses branded commerce identifiers', () => {
    expect(parseStoreItemSlug('disintegration-black-vinyl-lp')).toBe('disintegration-black-vinyl-lp');
    expect(parseVariantId('variant_barren-point_standard')).toBe('variant_barren-point_standard');
    expect(parseStripePriceId('price_test_barren_point')).toBe('price_test_barren_point');
    expect(parseCheckoutSessionId('cs_test_123')).toBe('cs_test_123');
    expect(parsePaymentIntentId('pi_test_123')).toBe('pi_test_123');
  });

  it('rejects malformed commerce identifiers', () => {
    expect(() => parseStoreItemSlug('Barren Point')).toThrow();
    expect(() => parseVariantId('barren-point')).toThrow();
    expect(() => parseStripePriceId('sk_test_secret')).toThrow();
    expect(() => parseCheckoutSessionId('pi_test_123')).toThrow();
    expect(() => parsePaymentIntentId('cs_test_123')).toThrow();
  });

  it('creates constrained quantities', () => {
    expect(createCartQuantity(1)).toBe(1);
    expect(createCartQuantity(9)).toBe(9);
    expect(createStockQuantity(0)).toBe(0);
    expect(createOnlineStockQuantity(2)).toBe(2);
    expect(createStockChangeDelta(-2)).toBe(-2);
  });

  it('rejects invalid quantity states', () => {
    expect(() => createCartQuantity(0)).toThrow();
    expect(() => createCartQuantity(10)).toThrow();
    expect(() => createCartQuantity(1.5)).toThrow();
    expect(() => createStockQuantity(-1)).toThrow();
    expect(() => createStockChangeDelta(0)).toThrow();
  });

  it('prevents online stock from exceeding counted stock', () => {
    expect(createStockState({ onlineQuantity: 2, quantity: 3 })).toEqual({
      onlineQuantity: 2,
      quantity: 3,
    });

    expect(() => createStockState({ onlineQuantity: 4, quantity: 3 })).toThrow(
      'Online stock cannot exceed stock quantity.',
    );
  });
});
