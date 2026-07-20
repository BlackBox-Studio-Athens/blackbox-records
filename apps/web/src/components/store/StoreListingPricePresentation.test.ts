import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  connectStoreListingPricePresentation,
  readPublicStoreListingPrices,
  STORE_LISTING_PRICE_COPY,
} from './StoreListingPricePresentation';

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
  afterEach(() => vi.unstubAllGlobals());

  it('uses the single listing projection endpoint and forwards cancellation', async () => {
    const records = [{ displayPrice: '€28.00', presentationState: 'ready' as const, storeItemSlug: 'item' }];
    const fetchRequest = vi.fn(async () => ({ ok: true, json: async () => records }));
    const abortController = new AbortController();
    vi.stubGlobal('fetch', fetchRequest);

    await expect(readPublicStoreListingPrices(abortController.signal)).resolves.toEqual(records);
    expect(fetchRequest).toHaveBeenCalledWith('/api/store/listing-prices', {
      headers: { accept: 'application/json' },
      signal: abortController.signal,
    });
  });

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

  it('consumes one already-prepared projection without creating a second read', async () => {
    const item = placeholder('item');
    const prepareProjection = vi.fn(async () => [
      { displayPrice: '€24.00', presentationState: 'ready' as const, storeItemSlug: 'item' },
    ]);
    const preparedProjection = prepareProjection();

    connectStoreListingPricePresentation({
      readListingPrices: () => preparedProjection,
      root: { querySelectorAll: () => [item] } as unknown as ParentNode,
    });

    await vi.waitFor(() => expect(item.textContent).toBe('€24.00'));
    expect(prepareProjection).toHaveBeenCalledOnce();
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
