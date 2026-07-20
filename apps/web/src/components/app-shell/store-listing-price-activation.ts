import type { PublicStoreListingPrice } from '@/lib/backend/public-checkout-api';

export type StoreListingPriceActivationState = {
  current: {
    abortController: AbortController;
    generation: number;
    pathname: string;
    promise: Promise<PublicStoreListingPrice[]>;
  } | null;
  generation: number;
};

export function clearStoreListingPriceActivation(state: StoreListingPriceActivationState, generation?: number): void {
  if (generation !== undefined && state.current?.generation !== generation) return;
  state.current?.abortController.abort();
  state.current = null;
}

export function prepareStoreListingPriceActivation({
  pathname,
  readListingPrices,
  state,
}: {
  pathname: string;
  readListingPrices: (signal: AbortSignal) => Promise<PublicStoreListingPrice[]>;
  state: StoreListingPriceActivationState;
}) {
  clearStoreListingPriceActivation(state);
  const abortController = new AbortController();
  const generation = ++state.generation;
  const promise = readListingPrices(abortController.signal);
  void promise.catch(() => undefined);
  state.current = { abortController, generation, pathname, promise };
  return state.current;
}

export function getPreparedStoreListingPriceReader(state: StoreListingPriceActivationState, pathname: string) {
  const activation = state.current;
  return activation?.pathname === pathname ? () => activation.promise : undefined;
}
