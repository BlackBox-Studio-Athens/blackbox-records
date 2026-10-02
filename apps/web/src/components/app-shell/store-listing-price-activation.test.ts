import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearStoreListingPriceActivation,
  getPreparedStoreListingPriceReader,
  prepareStoreListingPriceActivation,
  type StoreListingPriceActivationState,
} from './store-listing-price-activation';

function createState(): StoreListingPriceActivationState {
  return { current: null, generation: 0 };
}

describe('Store listing-price activation', () => {
  afterEach(() => vi.unstubAllGlobals());

  function directDocument(pathname = '/store/') {
    const document = { querySelector: () => null } as unknown as Document;
    const browser = {} as Window;
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', browser);
    const records = [
      { storeItemSlug: 'item', displayPrice: '€28.00', availabilityState: 'stocked', presentationState: 'ready' },
    ];
    const fetch = vi.fn(async () => ({ ok: true, json: async () => records }));
    const source = readFileSync(new URL('../../layouts/StoreListingPricePrefetch.astro', import.meta.url), 'utf8');
    const script = source.slice(source.indexOf('>') + 1, source.lastIndexOf('</script>'));
    const run = () =>
      runInNewContext(script, {
        backendBaseUrl: '',
        collectionPathname: pathname,
        document,
        window: browser,
        location: { pathname: `/blackbox-records${pathname}` },
        fetch,
        AbortController,
      });
    return { browser, document, fetch, records, run };
  }

  it('adopts the inline direct-load request once and makes one fresh read on each later activation', async () => {
    const direct = directDocument();
    const state = createState();
    const readListingPrices = vi.fn(async () => []);
    direct.run();
    direct.run();
    expect(direct.fetch).toHaveBeenCalledOnce();
    expect(direct.fetch.mock.calls[0]).toEqual([
      '/api/store/listing-prices',
      expect.objectContaining({ cache: 'no-store' }),
    ]);
    const reader = getPreparedStoreListingPriceReader(state, '/store/');
    expect(await reader?.()).toEqual(direct.records);
    expect(await reader?.()).toEqual(direct.records);
    expect(readListingPrices).not.toHaveBeenCalled();
    expect(direct.browser.blackboxStoreListingPriceDocument).toBeUndefined();
    direct.run();
    expect(direct.fetch).toHaveBeenCalledOnce();

    clearStoreListingPriceActivation(state);
    prepareStoreListingPriceActivation({ pathname: '/store/distro/', readListingPrices, state });
    await getPreparedStoreListingPriceReader(state, '/store/distro/')?.();
    expect(readListingPrices).toHaveBeenCalledOnce();
    prepareStoreListingPriceActivation({ pathname: '/store/', readListingPrices, state });
    await getPreparedStoreListingPriceReader(state, '/store/')?.();
    expect(readListingPrices).toHaveBeenCalledTimes(2);
  });

  it('does not duplicate a shell-first read when the inline script executes later', () => {
    const direct = directDocument();
    const readListingPrices = vi.fn(async () => []);
    prepareStoreListingPriceActivation({
      pathname: '/store/',
      readListingPrices,
      state: createState(),
    });
    direct.run();
    expect(readListingPrices).toHaveBeenCalledOnce();
    expect(direct.fetch).not.toHaveBeenCalled();
  });

  it('guards a direct shell fallback when the document script has not run yet', () => {
    const direct = directDocument();
    expect(getPreparedStoreListingPriceReader(createState(), '/store/')).toBeUndefined();
    direct.run();
    expect(direct.fetch).not.toHaveBeenCalled();
  });

  it('aborts a document request on route exit before hydration', () => {
    const direct = directDocument();
    direct.run();
    const abortController = direct.browser.blackboxStoreListingPriceDocument!.abortController;
    clearStoreListingPriceActivation(createState());
    expect(abortController.signal.aborted).toBe(true);
    expect(direct.browser.blackboxStoreListingPriceDocument).toBeUndefined();
  });

  it('rejects a document promise from another route or document', () => {
    const direct = directDocument();
    direct.run();
    const first = direct.browser.blackboxStoreListingPriceDocument!;
    const readListingPrices = vi.fn(async () => []);
    prepareStoreListingPriceActivation({
      pathname: '/store/distro/',
      readListingPrices,
      state: createState(),
    });
    expect(first.abortController.signal.aborted).toBe(true);
    expect(readListingPrices).toHaveBeenCalledOnce();

    const stale = { ...first, abortController: new AbortController(), document: {} as Document };
    direct.browser.blackboxStoreListingPriceDocument = stale;
    prepareStoreListingPriceActivation({
      pathname: '/store/',
      readListingPrices,
      state: createState(),
    });
    expect(stale.abortController.signal.aborted).toBe(true);
    expect(readListingPrices).toHaveBeenCalledTimes(2);
  });

  it('reuses one prepared promise only for its owning route', async () => {
    const state = createState();
    const records = [
      {
        availabilityState: 'stocked' as const,
        displayPrice: '€28.00',
        preorder: null,
        presentationState: 'ready' as const,
        storeItemSlug: 'item',
      },
    ];
    const readListingPrices = vi.fn(async () => records);

    prepareStoreListingPriceActivation({ pathname: '/store/', readListingPrices, state });

    expect(await getPreparedStoreListingPriceReader(state, '/store/')?.()).toEqual(records);
    expect(getPreparedStoreListingPriceReader(state, '/store/distro/')).toBeUndefined();
    expect(readListingPrices).toHaveBeenCalledOnce();
  });

  it('aborts a superseded activation and keeps the replacement isolated', () => {
    const state = createState();
    const first = prepareStoreListingPriceActivation({
      pathname: '/store/',
      readListingPrices: () => new Promise(() => {}),
      state,
    });
    const second = prepareStoreListingPriceActivation({
      pathname: '/store/distro/',
      readListingPrices: () => new Promise(() => {}),
      state,
    });

    expect(first.abortController.signal.aborted).toBe(true);
    expect(second.abortController.signal.aborted).toBe(false);
    expect(second.generation).toBe(first.generation + 1);
    clearStoreListingPriceActivation(state, first.generation);
    expect(state.current).toBe(second);
  });

  it('clears and aborts the current activation during route exit or teardown', () => {
    const state = createState();
    const activation = prepareStoreListingPriceActivation({
      pathname: '/store/',
      readListingPrices: () => new Promise(() => {}),
      state,
    });

    clearStoreListingPriceActivation(state);

    expect(activation.abortController.signal.aborted).toBe(true);
    expect(state.current).toBeNull();
  });
});
