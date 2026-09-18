import { describe, expect, it } from 'vitest';

import {
  checkoutAttemptKey,
  checkoutAttemptFingerprint,
  clearCheckoutAttempt,
  getOrCreateCheckoutAttempt,
} from './checkout-attempt';
import { createCartQuantity, type CartLine } from '../../lib/store-cart';

describe('checkout attempt identity', () => {
  it('reuses the key for the same input and rotates only for a changed intent', () => {
    const storage = createStorage();
    const input = {
      lines: [createLine(1)],
      newsletterOptIn: false,
      storeItemSlug: 'test-item',
      variantId: 'variant_test',
    };

    const first = getOrCreateCheckoutAttempt(input, storage);
    expect(getOrCreateCheckoutAttempt(input, storage)).toBe(first);
    expect(storage.getItem(checkoutAttemptKey)).toContain(first);

    const changed = getOrCreateCheckoutAttempt({ ...input, newsletterOptIn: true }, storage);
    expect(changed).not.toBe(first);
  });

  it('merges and sorts equivalent cart lines in the fingerprint', () => {
    const line = createLine(1);
    const fingerprint = checkoutAttemptFingerprint({
      lines: [
        { ...line, quantity: createCartQuantity(1), storeItemSlug: 'z-item', variantId: 'variant-z' },
        { ...line, quantity: createCartQuantity(2), storeItemSlug: 'a-item', variantId: 'variant-a' },
      ],
      newsletterOptIn: false,
      storeItemSlug: 'z-item',
      variantId: 'variant-z',
    });

    expect(fingerprint).toContain('"quantity":2');
    expect(fingerprint.indexOf('a-item')).toBeLessThan(fingerprint.indexOf('z-item'));
  });

  it('clears the persisted attempt for an explicit new checkout', () => {
    const storage = createStorage();
    getOrCreateCheckoutAttempt(
      {
        lines: [createLine(1)],
        newsletterOptIn: false,
        storeItemSlug: 'test-item',
        variantId: 'variant_test',
      },
      storage,
    );

    clearCheckoutAttempt(storage);

    expect(storage.getItem(checkoutAttemptKey)).toBeNull();
  });
});

function createLine(quantity: number): CartLine {
  return {
    availabilityLabel: 'Available',
    image: null,
    imageAlt: null,
    optionLabel: null,
    priceAmountMinor: 2000,
    priceCurrencyCode: 'EUR',
    priceDisplay: '€20.00',
    priceKind: 'fixed',
    quantity: createCartQuantity(quantity),
    storeItemSlug: 'test-item',
    subtitle: 'Test item',
    title: 'Test item',
    variantId: 'variant_test',
  };
}

function createStorage(): Storage {
  const values = new Map<string, string>();
  const storage: Storage = {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    length: 0,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
  return storage;
}
