import { describe, expect, it, vi } from 'vitest';

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
  it('reuses one prepared promise only for its owning route', async () => {
    const state = createState();
    const records = [{ displayPrice: '€28.00', presentationState: 'ready' as const, storeItemSlug: 'item' }];
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
