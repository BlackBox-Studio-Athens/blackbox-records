import * as React from 'react';

import {
  createPublicCheckoutApi,
  type PublicCheckoutApi,
  type PublicStoreOffer,
  type StoreCapabilities,
} from '@/lib/backend/public-checkout-api';
import { cn } from '@/lib/utils';

export const STORE_OFFER_PRICE_DISPLAY_COPY = {
  loading: 'Checking price',
  unavailable: 'Checkout unavailable',
} as const;

type StoreOfferPriceDisplayTone = 'loading' | 'ready' | 'unavailable';

export type StoreOfferPriceDisplayView = {
  isLoading: boolean;
  label: string;
  tone: StoreOfferPriceDisplayTone;
};

type StoreOfferPriceDisplayProps = {
  api?: PublicCheckoutApi;
  className?: string;
  listing?: boolean;
  storeItemSlug: string;
};

const loadingView: StoreOfferPriceDisplayView = {
  isLoading: true,
  label: STORE_OFFER_PRICE_DISPLAY_COPY.loading,
  tone: 'loading',
};

const maxConcurrentStoreOfferPriceReads = 4;

let activeStoreOfferPriceReads = 0;

const pendingStoreOfferPriceReads: Array<() => void> = [];
let listingCapabilityConsumers = 0;
let listingCapabilityRead: Promise<StoreCapabilities> | null = null;

export function acquireListingStoreCapabilities(api: PublicCheckoutApi) {
  listingCapabilityConsumers += 1;
  listingCapabilityRead ??= api.readStoreCapabilities();

  let released = false;
  return {
    read: listingCapabilityRead,
    release() {
      if (released) return;
      released = true;
      listingCapabilityConsumers -= 1;
      if (listingCapabilityConsumers === 0) listingCapabilityRead = null;
    },
  };
}

function enqueueStoreOfferPriceRead(
  task: () => Promise<StoreOfferPriceDisplayView>,
): Promise<StoreOfferPriceDisplayView> {
  return new Promise((resolve, reject) => {
    const runTask = () => {
      activeStoreOfferPriceReads += 1;

      task()
        .then(resolve, reject)
        .finally(() => {
          activeStoreOfferPriceReads -= 1;
          pendingStoreOfferPriceReads.shift()?.();
        });
    };

    if (activeStoreOfferPriceReads < maxConcurrentStoreOfferPriceReads) {
      runTask();
      return;
    }

    pendingStoreOfferPriceReads.push(runTask);
  });
}

export function createStoreOfferPriceDisplayView(
  offer: PublicStoreOffer | null | undefined,
): StoreOfferPriceDisplayView {
  if (offer?.canCheckout && offer.price?.display) {
    return {
      isLoading: false,
      label: offer.price.display,
      tone: 'ready',
    };
  }

  return {
    isLoading: false,
    label: STORE_OFFER_PRICE_DISPLAY_COPY.unavailable,
    tone: 'unavailable',
  };
}

export async function loadStoreOfferPriceDisplayView(
  api: PublicCheckoutApi,
  storeItemSlug: string,
): Promise<StoreOfferPriceDisplayView> {
  try {
    return createStoreOfferPriceDisplayView(await api.readStoreOffer(storeItemSlug));
  } catch {
    return createStoreOfferPriceDisplayView(null);
  }
}

export function loadDefaultStoreOfferPriceDisplayView(
  api: PublicCheckoutApi,
  storeItemSlug: string,
): Promise<StoreOfferPriceDisplayView> {
  return enqueueStoreOfferPriceRead(() => loadStoreOfferPriceDisplayView(api, storeItemSlug));
}

export default function StoreOfferPriceDisplay({
  api,
  className,
  listing = false,
  storeItemSlug,
}: StoreOfferPriceDisplayProps) {
  const [view, setView] = React.useState<StoreOfferPriceDisplayView>(loadingView);

  React.useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();

    setView(loadingView);

    const listingCapabilities = listing ? acquireListingStoreCapabilities(checkoutApi) : null;
    const readStoreOfferPriceDisplayView = listingCapabilities
      ? listingCapabilities.read
          .then((capabilities) =>
            capabilities.nativeCheckout.enabled
              ? loadDefaultStoreOfferPriceDisplayView(checkoutApi, storeItemSlug)
              : createStoreOfferPriceDisplayView(null),
          )
          .catch(() => createStoreOfferPriceDisplayView(null))
      : api
        ? loadStoreOfferPriceDisplayView(checkoutApi, storeItemSlug)
        : loadDefaultStoreOfferPriceDisplayView(checkoutApi, storeItemSlug);

    void readStoreOfferPriceDisplayView.then((nextView) => {
      if (isActive) {
        setView(nextView);
      }
    });

    return () => {
      isActive = false;
      listingCapabilities?.release();
    };
  }, [api, listing, storeItemSlug]);

  return (
    <span
      aria-busy={view.isLoading ? 'true' : undefined}
      className={cn(
        className,
        view.tone === 'loading' && 'text-muted-foreground',
        view.tone === 'unavailable' && 'text-muted-foreground',
      )}
      data-store-offer-price
      data-store-offer-price-state={view.tone}
    >
      {view.label}
    </span>
  );
}
