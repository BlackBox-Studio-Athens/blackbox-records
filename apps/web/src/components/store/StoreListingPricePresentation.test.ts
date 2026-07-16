import { describe, expect, it, vi } from 'vitest';

import { connectStoreListingPricePresentation, STORE_LISTING_PRICE_COPY } from './StoreListingPricePresentation';

function placeholder(storeItemSlug: string) {
  const attributes = new Map([['aria-busy', 'true']]);
  return {
    dataset: { storeItemSlug, storeListingPriceState: 'loading' },
    getAttribute: (name: string) => attributes.get(name) ?? null,
    removeAttribute: (name: string) => attributes.delete(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    textContent: STORE_LISTING_PRICE_COPY.loading,
  };
}

describe('Store listing-price presentation', () => {
  it('uses one projection read and renders ready, unavailable, and missing records honestly', async () => {
    const ready = placeholder('ready-item');
    const unavailable = placeholder('unavailable-item');
    const missing = placeholder('missing-item');
    const readListingPrices = vi.fn(async () => [
      { displayPrice: '€28.00', presentationState: 'ready' as const, storeItemSlug: 'ready-item' },
      { presentationState: 'unavailable' as const, storeItemSlug: 'unavailable-item' },
    ]);

    connectStoreListingPricePresentation({
      readListingPrices,
      root: { querySelectorAll: () => [ready, unavailable, missing] } as unknown as ParentNode,
    });

    await vi.waitFor(() => expect(ready.textContent).toBe('€28.00'));
    expect(readListingPrices).toHaveBeenCalledOnce();
    expect(ready.dataset.storeListingPriceState).toBe('ready');
    expect(unavailable.textContent).toBe(STORE_LISTING_PRICE_COPY.unavailable);
    expect(missing.textContent).toBe(STORE_LISTING_PRICE_COPY.unavailable);
    expect(ready.getAttribute('aria-busy')).toBeNull();
  });

  it('aborts the active projection read during cleanup', () => {
    const item = placeholder('item');
    let signal: AbortSignal | undefined;
    const cleanup = connectStoreListingPricePresentation({
      readListingPrices: (nextSignal) => {
        signal = nextSignal;
        return new Promise(() => {});
      },
      root: { querySelectorAll: () => [item] } as unknown as ParentNode,
    });

    cleanup();

    expect(signal?.aborted).toBe(true);
  });

  it('replaces indefinite loading with a non-price state when the projection fails', async () => {
    const item = placeholder('item');
    connectStoreListingPricePresentation({
      readListingPrices: async () => {
        throw new Error('Worker unavailable');
      },
      root: { querySelectorAll: () => [item] } as unknown as ParentNode,
    });

    await vi.waitFor(() => expect(item.textContent).toBe(STORE_LISTING_PRICE_COPY.unavailable));
    expect(item.dataset.storeListingPriceState).toBe('unavailable');
  });
});
