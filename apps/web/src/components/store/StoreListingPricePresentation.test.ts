import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  connectStoreListingPricePresentation,
  readPublicStoreListingPrices,
  STORE_LISTING_PRICE_COPY,
  sanitizeStoreSearchChrome,
} from './StoreListingPricePresentation';

const { requestStoreCartAddFromSeed } = vi.hoisted(() => ({ requestStoreCartAddFromSeed: vi.fn() }));
vi.mock('@/components/store/checkout/StoreItemPurchaseActions', () => ({
  requestStoreCartAddFromSeed,
  STORE_ITEM_ADDED_CONFIRMATION_MS: 4000,
  STORE_ITEM_PURCHASE_ACTION_COPY: { added: 'Added' },
}));

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

function buyButton(storeItemSlug: string) {
  const attributes = new Map<string, string>();
  let pressListener: ((event: Event) => void) | undefined;
  const status = { dataset: {} as Record<string, string>, hidden: true, textContent: '' };
  const cardLink = { focus: vi.fn() };
  const button = {
    dataset: { storeItemSlug, storeCardBuy: JSON.stringify({ storeItemSlug, title: 'Item' }) },
    hidden: false,
    textContent: STORE_LISTING_PRICE_COPY.buy as string,
    parentElement: { querySelector: () => status },
    closest: () => ({ querySelector: () => cardLink }),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    removeAttribute: (name: string) => attributes.delete(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    addEventListener: (_type: string, listener: (event: Event) => void) => {
      pressListener = listener;
    },
    removeEventListener: () => {
      pressListener = undefined;
    },
    press: () => pressListener?.({ currentTarget: button } as unknown as Event),
    cardLink,
    status,
  };
  return button;
}

function listingRoot(prices: unknown[], availability: unknown[] = [], buys: unknown[] = []) {
  const elementsBySelector: Record<string, unknown[]> = {
    '[data-store-listing-price]': prices,
    '[data-store-listing-availability]': availability,
    '[data-store-card-buy]': buys,
  };
  return {
    querySelectorAll: (selector: string) => (elementsBySelector[selector] ?? []) as HTMLElement[],
  } as unknown as ParentNode;
}

describe('Store listing-price presentation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('resets cached server chrome in place without collapsing its control boxes', () => {
    const input = { disabled: false, value: 'band', removeAttribute: vi.fn() };
    const summary = { textContent: '1 item' };
    const clear = { disabled: false, hidden: false };
    const toolbar = {
      removeAttribute: vi.fn(),
      querySelector: (selector: string) => (selector === 'input[type="search"]' ? input : summary),
      querySelectorAll: () => [clear],
    };
    const select = { disabled: false, value: 'band' };
    const fieldset = { disabled: false };
    const radios = [
      { value: '', checked: false, toggleAttribute: vi.fn() },
      { value: 'band', checked: true, toggleAttribute: vi.fn() },
    ];
    const artistHost = {
      querySelector: (selector: string) => (selector === 'select' ? select : fieldset),
      querySelectorAll: () => radios,
    };
    const total = { hidden: false };
    const view = { disabled: false };
    const controls = { hidden: true, querySelectorAll: () => [view] };
    const elements: Record<string, unknown[]> = {
      '[data-store-search-toolbar]': [toolbar],
      '[data-store-artists]': [artistHost],
      '[data-store-empty-results], [data-store-result-total]': [total],
      '[data-store-coverflow-controls]': [controls],
    };
    const root = { querySelectorAll: (selector: string) => elements[selector] ?? [] } as unknown as ParentNode;
    sanitizeStoreSearchChrome(root);
    expect(input).toMatchObject({ disabled: true, value: '' });
    expect(summary.textContent).toBe('');
    expect(clear).toEqual({ disabled: true, hidden: true });
    expect(select).toEqual({ disabled: true, value: '' });
    expect(fieldset.disabled).toBe(true);
    expect(radios.map(({ checked }) => checked)).toEqual([true, false]);
    expect(total.hidden).toBe(true);
    expect(controls.hidden).toBe(false);
    expect(view.disabled).toBe(true);
  });

  it('uses the single listing projection endpoint and forwards cancellation', async () => {
    const records = [{ displayPrice: '€28.00', presentationState: 'ready' as const, storeItemSlug: 'item' }];
    const fetchRequest = vi.fn(async () => ({ ok: true, json: async () => records }));
    const abortController = new AbortController();
    vi.stubGlobal('fetch', fetchRequest);

    await expect(readPublicStoreListingPrices(abortController.signal)).resolves.toEqual(records);
    expect(fetchRequest).toHaveBeenCalledWith('/api/store/listing-prices', {
      cache: 'no-store',
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
        preorder: null,
        storeItemSlug: 'ready-item',
      },
      {
        availabilityState: 'unavailable' as const,
        presentationState: 'unavailable' as const,
        preorder: null,
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

  it('shows copies left on stocked cards while keeping Buy available', async () => {
    const scarce = availabilityPlaceholder('scarce');
    const plenty = availabilityPlaceholder('plenty');
    const unpriced = availabilityPlaceholder('unpriced');
    const scarceBuy = buyButton('scarce');
    const records = [
      {
        storeItemSlug: 'scarce',
        presentationState: 'ready',
        displayPrice: '€28.00',
        availabilityState: 'stocked',
        lowStockQuantity: 2,
      },
      { storeItemSlug: 'plenty', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'stocked' },
      { storeItemSlug: 'unpriced', presentationState: 'unavailable', availabilityState: 'stocked' },
    ];

    connectStoreListingPricePresentation({
      readListingPrices: async () => records as never,
      root: listingRoot([], [scarce, plenty, unpriced], [scarceBuy]),
    });

    await vi.waitFor(() => expect(scarce.textContent).toBe('Only 2 left'));
    expect(scarce.hidden).toBe(false);
    expect(scarce.dataset.storeListingAvailabilityState).toBe('low_stock');
    expect(scarceBuy.hidden).toBe(false);
    expect(plenty.hidden).toBe(true);
    expect(unpriced.hidden).toBe(true);
  });

  it('consumes one already-prepared projection without creating a second read', async () => {
    const item = placeholder('item');
    const prepareProjection = vi.fn(async () => [
      {
        availabilityState: 'stocked' as const,
        displayPrice: '€24.00',
        preorder: null,
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

  it('offers Buy only for priced, stocked records once the projection arrives', async () => {
    const buys = ['stocked', 'sold-out', 'unpriced', 'missing'].map(buyButton);
    const [stocked, soldOut, unpriced, missing] = buys;
    let resolveRecords: (records: never) => void = () => {};
    connectStoreListingPricePresentation({
      readListingPrices: () =>
        new Promise((resolve) => {
          resolveRecords = resolve;
        }),
      root: listingRoot([placeholder('stocked')], [], buys),
    });
    expect(buys.every((buy) => buy.hidden)).toBe(true);

    resolveRecords([
      { storeItemSlug: 'stocked', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'stocked' },
      { storeItemSlug: 'sold-out', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'sold_out' },
      { storeItemSlug: 'unpriced', presentationState: 'unavailable', availabilityState: 'stocked' },
    ] as never);

    await vi.waitFor(() => expect(stocked?.hidden).toBe(false));
    expect([soldOut?.hidden, unpriced?.hidden, missing?.hidden]).toEqual([true, true, true]);
  });

  it('adds through the authoritative offer on press and confirms in place', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
    requestStoreCartAddFromSeed.mockResolvedValueOnce({ cartItem: {}, isQueued: false, label: null });
    const buy = buyButton('item');
    connectStoreListingPricePresentation({
      readListingPrices: async () => [],
      root: listingRoot([placeholder('item')], [], [buy]),
    });

    buy.press();
    expect(buy.textContent).toBe(STORE_LISTING_PRICE_COPY.adding);
    expect(buy.getAttribute('aria-busy')).toBe('true');

    await vi.waitFor(() => expect(buy.textContent).toBe('Added'));
    expect(requestStoreCartAddFromSeed).toHaveBeenCalledWith({ storeItemSlug: 'item', title: 'Item' });
    expect(buy.getAttribute('aria-busy')).toBeNull();
    vi.advanceTimersByTime(4000);
    expect(buy.textContent).toBe(STORE_LISTING_PRICE_COPY.buy);
  });

  it('shows the offer status instead of adding when the item stopped being buyable', async () => {
    vi.stubGlobal('window', globalThis);
    requestStoreCartAddFromSeed.mockResolvedValueOnce({ cartItem: null, label: 'Sold Out', statusTone: 'sold-out' });
    const buy = buyButton('item');
    connectStoreListingPricePresentation({
      readListingPrices: async () => [],
      root: listingRoot([placeholder('item')], [], [buy]),
    });

    buy.press();

    await vi.waitFor(() => expect(buy.status.textContent).toBe('Sold Out'));
    expect(buy.status).toMatchObject({ hidden: false, dataset: { storeListingAvailabilityState: 'sold_out' } });
    expect(buy.hidden).toBe(true);
    expect(buy.cardLink.focus).toHaveBeenCalledOnce();
  });
});
