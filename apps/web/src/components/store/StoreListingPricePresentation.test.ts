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

function availabilityPlaceholder(storeItemSlug: string) {
  const attributes = new Map<string, string>();
  let hidden = false;
  return {
    dataset: { storeItemSlug, storeListingAvailabilityState: 'sold_out' },
    get hidden() {
      return hidden;
    },
    set hidden(value: boolean) {
      hidden = value;
    },
    removeAttribute: (name: string) => attributes.delete(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    textContent: STORE_LISTING_PRICE_COPY.soldOut,
  };
}

function listingRoot(prices: unknown[], availability: unknown[] = []) {
  return {
    querySelectorAll: (selector: string) =>
      (selector === '[data-store-listing-availability]' ? availability : prices) as HTMLElement[],
  } as unknown as ParentNode;
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
      {
        availabilityState: 'stocked' as const,
        displayPrice: '€28.00',
        presentationState: 'ready' as const,
        storeItemSlug: 'ready-item',
      },
      {
        availabilityState: 'unavailable' as const,
        presentationState: 'unavailable' as const,
        storeItemSlug: 'unavailable-item',
      },
    ]);

    connectStoreListingPricePresentation({
      readListingPrices,
      root: listingRoot([ready, unavailable, missing]),
    });

    await vi.waitFor(() => expect(ready.textContent).toBe('€28.00'));
    expect(readListingPrices).toHaveBeenCalledOnce();
    expect(ready.dataset.storeListingPriceState).toBe('ready');
    expect(unavailable.textContent).toBe(STORE_LISTING_PRICE_COPY.unavailable);
    expect(missing.textContent).toBe(STORE_LISTING_PRICE_COPY.unavailable);
    expect(ready.getAttribute('aria-busy')).toBeNull();
  });

  it('shows explicit availability and treats older or missing records as unknown', async () => {
    const stocked = availabilityPlaceholder('stocked');
    const soldOut = availabilityPlaceholder('sold-out');
    const outOfStock = availabilityPlaceholder('out-of-stock');
    const unavailable = availabilityPlaceholder('unavailable');
    const older = availabilityPlaceholder('older');
    const missing = availabilityPlaceholder('missing');
    const records = [
      { storeItemSlug: 'stocked', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'stocked' },
      { storeItemSlug: 'sold-out', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'sold_out' },
      {
        storeItemSlug: 'out-of-stock',
        presentationState: 'ready',
        displayPrice: '€28.00',
        availabilityState: 'out_of_stock',
      },
      { storeItemSlug: 'unavailable', presentationState: 'unavailable', availabilityState: 'unavailable' },
      { storeItemSlug: 'older', presentationState: 'ready', displayPrice: '€28.00' },
    ];

    connectStoreListingPricePresentation({
      readListingPrices: async () => records as never,
      root: listingRoot([], [stocked, soldOut, outOfStock, unavailable, older, missing]),
    });

    await vi.waitFor(() => expect(soldOut.textContent).toBe(STORE_LISTING_PRICE_COPY.soldOut));
    expect(stocked.hidden).toBe(true);
    expect(outOfStock.textContent).toBe(STORE_LISTING_PRICE_COPY.outOfStock);
    expect(unavailable.textContent).toBe(STORE_LISTING_PRICE_COPY.currentlyUnavailable);
    expect(older.textContent).toBe(STORE_LISTING_PRICE_COPY.availabilityUnknown);
    expect(missing.textContent).toBe(STORE_LISTING_PRICE_COPY.availabilityUnknown);
    expect(older.dataset.storeListingAvailabilityState).toBe('unknown');
  });

  it('consumes one already-prepared projection without creating a second read', async () => {
    const item = placeholder('item');
    const prepareProjection = vi.fn(async () => [
      {
        availabilityState: 'stocked' as const,
        displayPrice: '€24.00',
        presentationState: 'ready' as const,
        storeItemSlug: 'item',
      },
    ]);
    const preparedProjection = prepareProjection();

    connectStoreListingPricePresentation({
      readListingPrices: () => preparedProjection,
      root: listingRoot([item]),
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
      root: listingRoot([item]),
    });

    cleanup();

    expect(signal?.aborted).toBe(true);
  });

  it('replaces indefinite loading with a non-price state when the projection fails', async () => {
    const item = placeholder('item');
    const availability = availabilityPlaceholder('item');
    connectStoreListingPricePresentation({
      readListingPrices: async () => {
        throw new Error('Worker unavailable');
      },
      root: listingRoot([item], [availability]),
    });

    await vi.waitFor(() => expect(item.textContent).toBe(STORE_LISTING_PRICE_COPY.unavailable));
    expect(item.dataset.storeListingPriceState).toBe('unavailable');
    expect(availability.textContent).toBe(STORE_LISTING_PRICE_COPY.availabilityUnknown);
    expect(availability.dataset.storeListingAvailabilityState).toBe('unknown');
  });
});
