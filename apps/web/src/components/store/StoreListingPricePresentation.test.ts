import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';

import {
  connectStoreListingPricePresentation,
  readPublicStoreListingPrices,
  sanitizeStoreListingPricePlaceholders,
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
  const textContent: string = STORE_LISTING_PRICE_COPY.loading;
  return {
    dataset: { storeItemSlug, storeListingPriceState: 'loading' },
    getAttribute: (name: string) => attributes.get(name) ?? null,
    removeAttribute: (name: string) => attributes.delete(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    textContent,
  };
}

function availabilityPlaceholder(storeItemSlug: string, releaseDate?: string) {
  const attributes = new Map<string, string>();
  const textContent: string = STORE_LISTING_PRICE_COPY.soldOut;
  let hidden = false;
  const preorder = { hidden: true, textContent: '' };
  const releaseStatus = { hidden: true, textContent: 'Digital out now' };
  const card = {
    dataset: {} as Record<string, string>,
    preorder,
    releaseStatus,
    querySelector: (selector: string) => (selector === '[data-store-listing-preorder]' ? preorder : releaseStatus),
  };
  return {
    dataset: {
      storeItemSlug,
      storeListingAvailabilityState: 'sold_out',
      ...(releaseDate ? { storeReleaseDate: releaseDate } : {}),
    },
    card,
    closest: () => card,
    get hidden() {
      return hidden;
    },
    set hidden(value: boolean) {
      hidden = value;
    },
    removeAttribute: (name: string) => attributes.delete(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    textContent,
  };
}

function buyButton(storeItemSlug: string) {
  const attributes = new Map<string, string>();
  const classes = new Set<string>();
  let pressListener: ((event: Event) => void) | undefined;
  const status = { dataset: {} as Record<string, string>, hidden: true, textContent: '' };
  const cardLink = { focus: vi.fn() };
  const button = {
    dataset: {
      storeItemSlug,
      storeCardBuy: JSON.stringify({ storeItemSlug, title: 'Item' }),
      storeCardBuyLabel: STORE_LISTING_PRICE_COPY.buy as string,
    },
    classList: {
      contains: (name: string) => classes.has(name),
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      toggle: (name: string, enabled: boolean) => (enabled ? classes.add(name) : classes.delete(name)),
    },
    hidden: false,
    disabled: false,
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

function listingRoot(
  prices: unknown[],
  availability: ReturnType<typeof availabilityPlaceholder>[] = [],
  buys: unknown[] = [],
) {
  const elementsBySelector: Record<string, unknown[]> = {
    '[data-store-listing-price]': prices,
    '[data-store-listing-availability]': availability,
    '[data-store-card-buy]': buys,
    '[data-store-listing-preorder]': availability.map((item) => item.card.preorder),
    '[data-store-listing-release-status]': availability.map((item) => item.card.releaseStatus),
  };
  return {
    querySelectorAll: (selector: string) =>
      (selector === '[data-store-preorder]'
        ? availability.map((item) => item.card).filter((card) => 'storePreorder' in card.dataset)
        : (elementsBySelector[selector] ?? [])) as HTMLElement[],
  } as unknown as ParentNode;
}

describe('Store listing-price presentation', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { dispatchEvent: vi.fn(), querySelector: () => null });
  });
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
    const preorderNotes = { hidden: false };
    const view = { disabled: false };
    const controls = { hidden: true, querySelectorAll: () => [view] };
    const elements: Record<string, unknown[]> = {
      '[data-store-search-toolbar]': [toolbar],
      '[data-store-artists]': [artistHost],
      '[data-store-empty-results], [data-store-result-total]': [total],
      '[data-store-preorder-notes]': [preorderNotes],
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
    expect(preorderNotes.hidden).toBe(true);
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

  it('requests the narrowed projection only when the preorders scope is supplied', async () => {
    const fetchRequest = vi.fn(async () => ({ ok: true, json: async () => [] }));
    const abortController = new AbortController();
    vi.stubGlobal('fetch', fetchRequest);

    await expect(readPublicStoreListingPrices(abortController.signal, { scope: 'preorders' })).resolves.toEqual([]);
    expect(fetchRequest).toHaveBeenCalledWith('/api/store/listing-prices?scope=preorders', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: abortController.signal,
    });
    await readPublicStoreListingPrices();
    expect(fetchRequest).toHaveBeenLastCalledWith('/api/store/listing-prices', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: null,
    });
  });

  it.each([
    {
      state: 'before release',
      today: '2026-10-15T23:59:59Z',
      releaseDate: '2026-10-16',
      shipEstimate: { kind: 'month', month: '2026-10', part: null } as const,
      badge: 'Pre-order · out 16 Oct 2026',
      outNow: false,
    },
    {
      state: 'on release day',
      today: '2026-10-16T00:00:00Z',
      releaseDate: '2026-10-16',
      shipEstimate: { kind: 'month', month: '2026-10', part: null } as const,
      badge: 'Pre-order · ships around October 2026',
      outNow: true,
    },
    {
      state: 'after release with an exact date',
      today: '2026-10-17T12:00:00Z',
      releaseDate: '2026-10-16',
      shipEstimate: { kind: 'date', date: '2026-10-20' } as const,
      badge: 'Pre-order · ships 20 Oct 2026',
      outNow: true,
    },
    {
      state: 'after release with a withheld estimate',
      today: '2026-10-17T12:00:00Z',
      releaseDate: '2026-10-16',
      shipEstimate: null,
      badge: 'Pre-order',
      outNow: true,
    },
    {
      state: 'without a release date',
      today: '2026-10-17T12:00:00Z',
      releaseDate: undefined,
      shipEstimate: { kind: 'month', month: '2026-10', part: 'mid' } as const,
      badge: 'Pre-order · ships around mid October 2026',
      outNow: false,
    },
  ])(
    'uses the dedicated preorder badge $state while retaining the low-stock slot',
    async ({ today, releaseDate, shipEstimate, badge, outNow }) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(today));
      const availability = availabilityPlaceholder('item', releaseDate);
      const buy = buyButton('item');
      connectStoreListingPricePresentation({
        readListingPrices: async () => [
          {
            storeItemSlug: 'item',
            presentationState: 'ready',
            displayPrice: '€28.00',
            availabilityState: 'stocked',
            lowStockQuantity: 3,
            preorder: { shipEstimate },
          },
        ],
        root: listingRoot([], [availability], [buy]),
      });

      await vi.waitFor(() => expect(availability.card.preorder.hidden).toBe(false));
      expect(availability.card.preorder.textContent).toBe(badge);
      expect(availability.card.dataset.storePreorder).toBe('');
      expect(availability.card.releaseStatus).toEqual({ hidden: !outNow, textContent: 'Digital out now' });
      expect(availability).toMatchObject({
        hidden: false,
        textContent: 'Only 3 left',
        dataset: { storeListingAvailabilityState: 'low_stock' },
      });
      expect(buy.hidden).toBe(false);
      expect(buy.textContent).toBe('Pre-order');
      expect(buy.dataset.storeCardBuyLabel).toBe('Pre-order');
      expect(buy.classList.contains('preorder-action')).toBe(true);
      expect(buy.classList.contains('purchase-action')).toBe(false);
      expect(document.dispatchEvent).toHaveBeenCalledOnce();
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'blackbox:store-listing-applied' }),
      );
    },
  );

  it.each(['sold_out', 'out_of_stock'] as const)(
    'shows the %s badge and a disabled preorder control without allowing an order',
    async (availabilityState) => {
      const availability = availabilityPlaceholder('item');
      const buy = buyButton('item');
      connectStoreListingPricePresentation({
        readListingPrices: async () => [
          {
            storeItemSlug: 'item',
            presentationState: 'ready',
            displayPrice: '€28.00',
            availabilityState,
            preorder: { shipEstimate: null },
          },
        ],
        root: listingRoot([], [availability], [buy]),
      });

      await vi.waitFor(() => expect(document.dispatchEvent).toHaveBeenCalledOnce());
      expect(availability.card.preorder.hidden).toBe(true);
      expect(availability.card.releaseStatus.hidden).toBe(true);
      expect(availability.card.dataset.storePreorder).toBe('');
      expect(availability.hidden).toBe(false);
      expect(availability.dataset.storeListingAvailabilityState).toBe(availabilityState);
      expect(availability.textContent).toBe(availabilityState === 'sold_out' ? 'Sold Out' : 'Out of Stock');
      expect(buy.hidden).toBe(false);
      expect(buy.disabled).toBe(true);
      expect(buy.textContent).toBe('Pre-order');
      requestStoreCartAddFromSeed.mockClear();
      buy.press();
      expect(requestStoreCartAddFromSeed).not.toHaveBeenCalled();
    },
  );

  it.each(['ordinary', 'older', 'missing', 'failed'] as const)(
    'does not retain preorder presentation for a %s projection',
    async (state) => {
      const availability = availabilityPlaceholder('item');
      const buy = buyButton('item');
      availability.card.dataset.storePreorder = '';
      Object.assign(availability.card.preorder, { hidden: false, textContent: 'Pre-order' });
      availability.card.releaseStatus.hidden = false;
      buy.classList.add('preorder-action');
      buy.dataset.storeCardBuyLabel = 'Pre-order';
      buy.textContent = 'Pre-order';
      buy.disabled = true;
      connectStoreListingPricePresentation({
        readListingPrices: async () => {
          if (state === 'failed') throw new Error('Worker unavailable');
          if (state === 'missing') return [];
          return [
            {
              storeItemSlug: 'item',
              presentationState: 'ready',
              displayPrice: '€28.00',
              availabilityState: 'stocked',
              ...(state === 'ordinary' ? { preorder: null } : {}),
            },
          ] as PublicStoreListingPrice[];
        },
        root: listingRoot([], [availability], [buy]),
      });

      await vi.waitFor(() => expect(document.dispatchEvent).toHaveBeenCalledOnce());
      expect(availability.card.dataset).not.toHaveProperty('storePreorder');
      expect(availability.card.preorder).toEqual({ hidden: true, textContent: '' });
      expect(availability.card.releaseStatus).toEqual({ hidden: true, textContent: 'Digital out now' });
      expect(buy.classList.contains('preorder-action')).toBe(false);
      expect(buy.textContent).toBe('Buy');
      expect(buy.dataset.storeCardBuyLabel).toBe('Buy');
      expect(buy.hidden).toBe(state === 'missing' || state === 'failed');
      expect(buy.disabled).toBe(state === 'missing' || state === 'failed');
    },
  );

  it('sanitizes the complete live presentation for a shell snapshot', () => {
    const price = placeholder('item');
    const availability = availabilityPlaceholder('item', '2026-10-16');
    const buy = buyButton('item');
    price.dataset.storeListingPriceState = 'ready';
    price.textContent = '€28.00';
    availability.dataset.storeListingAvailabilityState = 'low_stock';
    availability.textContent = 'Only 3 left';
    availability.card.dataset.storePreorder = '';
    Object.assign(availability.card.preorder, { hidden: false, textContent: 'Pre-order · ships around October 2026' });
    availability.card.releaseStatus.hidden = false;
    buy.classList.add('preorder-action');
    buy.classList.add('purchase-action');
    buy.dataset.storeCardBuyLabel = 'Pre-order';
    buy.textContent = 'Added';
    buy.setAttribute('aria-busy', 'true');

    sanitizeStoreListingPricePlaceholders(listingRoot([price], [availability], [buy]));

    expect(price.dataset.storeListingPriceState).toBe('loading');
    expect(price.textContent).toBe('Checking price');
    expect(price.getAttribute('aria-busy')).toBe('true');
    expect(availability).toMatchObject({
      hidden: false,
      textContent: 'Checking availability',
      dataset: { storeListingAvailabilityState: 'pending', storeReleaseDate: '2026-10-16' },
    });
    expect(availability.card.dataset).not.toHaveProperty('storePreorder');
    expect(availability.card.preorder).toEqual({ hidden: true, textContent: '' });
    expect(availability.card.releaseStatus).toEqual({ hidden: true, textContent: 'Digital out now' });
    expect(buy.hidden).toBe(true);
    expect(buy.getAttribute('aria-busy')).toBeNull();
    expect(buy.classList.contains('preorder-action')).toBe(false);
    expect(buy.classList.contains('purchase-action')).toBe(false);
    expect(buy.dataset.storeCardBuyLabel).toBe('Buy');
    expect(buy.textContent).toBe('Buy');
    expect(document.dispatchEvent).not.toHaveBeenCalled();
  });

  it('keeps preorder slots empty while pending and ignores a projection after cleanup', async () => {
    const availability = availabilityPlaceholder('item');
    const buy = buyButton('item');
    let resolveRecords: (records: PublicStoreListingPrice[]) => void = () => {};
    const cleanup = connectStoreListingPricePresentation({
      readListingPrices: () =>
        new Promise((resolve) => {
          resolveRecords = resolve;
        }),
      root: listingRoot([], [availability], [buy]),
    });
    expect(availability.dataset.storeListingAvailabilityState).toBe('pending');
    expect(availability.card.dataset).not.toHaveProperty('storePreorder');
    expect(availability.card.preorder).toEqual({ hidden: true, textContent: '' });
    expect(availability.card.releaseStatus.hidden).toBe(true);
    expect(buy.hidden).toBe(true);
    expect(buy.classList.contains('preorder-action')).toBe(false);
    expect(document.dispatchEvent).not.toHaveBeenCalled();

    cleanup();
    resolveRecords([
      {
        storeItemSlug: 'item',
        presentationState: 'ready',
        displayPrice: '€28.00',
        availabilityState: 'stocked',
        preorder: { shipEstimate: null },
      },
    ]);
    await Promise.resolve();
    await Promise.resolve();
    expect(availability.dataset.storeListingAvailabilityState).toBe('pending');
    expect(availability.card.preorder.hidden).toBe(true);
    expect(buy.hidden).toBe(true);
    expect(document.dispatchEvent).not.toHaveBeenCalled();
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
    expect(buys.every((buy) => !buy.classList.contains('purchase-action'))).toBe(true);

    resolveRecords([
      { storeItemSlug: 'stocked', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'stocked' },
      { storeItemSlug: 'sold-out', presentationState: 'ready', displayPrice: '€28.00', availabilityState: 'sold_out' },
      { storeItemSlug: 'unpriced', presentationState: 'unavailable', availabilityState: 'stocked' },
    ] as never);

    await vi.waitFor(() => expect(stocked?.hidden).toBe(false));
    expect([soldOut?.hidden, unpriced?.hidden, missing?.hidden]).toEqual([true, true, true]);
    expect(stocked?.classList.contains('purchase-action')).toBe(true);
    expect([soldOut, unpriced, missing].every((buy) => !buy?.classList.contains('purchase-action'))).toBe(true);
  });

  it.each([false, true])(
    'adds through the authoritative offer and restores the label after Added (preorder: %s)',
    async (preorder) => {
      vi.useFakeTimers();
      vi.stubGlobal('window', globalThis);
      requestStoreCartAddFromSeed.mockResolvedValueOnce({ cartItem: {}, isQueued: false, label: null });
      const buy = buyButton('item');
      connectStoreListingPricePresentation({
        readListingPrices: async () => [
          {
            storeItemSlug: 'item',
            presentationState: 'ready',
            displayPrice: '€28.00',
            availabilityState: 'stocked',
            preorder: preorder ? { shipEstimate: null } : null,
          },
        ],
        root: listingRoot([placeholder('item')], [availabilityPlaceholder('item')], [buy]),
      });

      await vi.waitFor(() => expect(buy.hidden).toBe(false));
      buy.press();
      expect(buy.textContent).toBe(STORE_LISTING_PRICE_COPY.adding);
      expect(buy.getAttribute('aria-busy')).toBe('true');

      await vi.waitFor(() => expect(buy.textContent).toBe('Added'));
      expect(requestStoreCartAddFromSeed).toHaveBeenCalledWith({ storeItemSlug: 'item', title: 'Item' });
      expect(buy.getAttribute('aria-busy')).toBeNull();
      vi.advanceTimersByTime(4000);
      expect(buy.textContent).toBe(preorder ? 'Pre-order' : 'Buy');
      expect(buy.classList.contains('preorder-action')).toBe(preorder);
      expect(buy.classList.contains('purchase-action')).toBe(!preorder);
    },
  );

  it.each([false, true])(
    'shows the authoritative depleted status after a purchase attempt (preorder: %s)',
    async (preorder) => {
      vi.stubGlobal('window', globalThis);
      requestStoreCartAddFromSeed.mockResolvedValueOnce({ cartItem: null, label: 'Sold Out', statusTone: 'sold-out' });
      const buy = buyButton('item');
      connectStoreListingPricePresentation({
        readListingPrices: async () => [
          {
            storeItemSlug: 'item',
            presentationState: 'ready',
            displayPrice: '€28.00',
            availabilityState: 'stocked',
            preorder: preorder ? { shipEstimate: null } : null,
          },
        ],
        root: listingRoot([placeholder('item')], [], [buy]),
      });

      await vi.waitFor(() => expect(buy.disabled).toBe(false));
      buy.press();

      await vi.waitFor(() => expect(buy.status.textContent).toBe('Sold Out'));
      expect(buy.status).toMatchObject({ hidden: false, dataset: { storeListingAvailabilityState: 'sold_out' } });
      expect(buy.hidden).toBe(!preorder);
      expect(buy.disabled).toBe(true);
      expect(buy.classList.contains('purchase-action')).toBe(false);
      expect(buy.cardLink.focus).toHaveBeenCalledOnce();
    },
  );
});
