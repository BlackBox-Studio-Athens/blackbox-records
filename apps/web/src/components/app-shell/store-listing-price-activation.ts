import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';

type DocumentListingPriceRequest = {
  document: Document;
  pathname: string;
  abortController: AbortController;
  promise: Promise<PublicStoreListingPrice[]>;
};

declare global {
  interface Window {
    blackboxStoreListingPriceDocument?: DocumentListingPriceRequest;
    blackboxStoreListingPriceDocumentHandled?: Document;
  }
}

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
  if (typeof window !== 'undefined') {
    window.blackboxStoreListingPriceDocument?.abortController.abort();
    delete window.blackboxStoreListingPriceDocument;
    window.blackboxStoreListingPriceDocumentHandled = globalThis.document;
  }
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
  const documentRequest = typeof window === 'undefined' ? undefined : window.blackboxStoreListingPriceDocument;
  if (typeof window !== 'undefined') delete window.blackboxStoreListingPriceDocument;
  const adoptDocumentRequest =
    state.generation === 0 &&
    documentRequest?.document === globalThis.document &&
    documentRequest?.pathname === pathname;
  if (!adoptDocumentRequest) documentRequest?.abortController.abort();
  clearStoreListingPriceActivation(state);
  const abortController = adoptDocumentRequest ? documentRequest.abortController : new AbortController();
  const generation = ++state.generation;
  const promise = adoptDocumentRequest ? documentRequest.promise : readListingPrices(abortController.signal);
  void promise.catch(() => undefined);
  state.current = { abortController, generation, pathname, promise };
  return state.current;
}

export function getPreparedStoreListingPriceReader(state: StoreListingPriceActivationState, pathname: string) {
  // The initial shell presentation reaches this reader before any navigation activation exists.
  if (!state.current && state.generation === 0 && typeof window !== 'undefined') {
    const request = window.blackboxStoreListingPriceDocument;
    delete window.blackboxStoreListingPriceDocument;
    window.blackboxStoreListingPriceDocumentHandled = globalThis.document;
    if (request && request.document === globalThis.document && request.pathname === pathname) {
      state.current = {
        abortController: request.abortController,
        generation: ++state.generation,
        pathname,
        promise: request.promise,
      };
    } else request?.abortController.abort();
  }
  const activation = state.current;
  return activation?.pathname === pathname ? () => activation.promise : undefined;
}
