import * as React from 'react';

import {
  createPublicCheckoutApi,
  type PublicCheckoutApi,
  type PublicStoreOffer,
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
const cachedStoreOfferPriceDisplayReads = new Map<string, Promise<StoreOfferPriceDisplayView>>();

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

function loadDefaultStoreOfferPriceDisplayView(
  api: PublicCheckoutApi,
  storeItemSlug: string,
): Promise<StoreOfferPriceDisplayView> {
  const cachedRead = cachedStoreOfferPriceDisplayReads.get(storeItemSlug);

  if (cachedRead) {
    return cachedRead;
  }

  const nextRead = enqueueStoreOfferPriceRead(() => loadStoreOfferPriceDisplayView(api, storeItemSlug));
  cachedStoreOfferPriceDisplayReads.set(storeItemSlug, nextRead);

  return nextRead;
}

export default function StoreOfferPriceDisplay({ api, className, storeItemSlug }: StoreOfferPriceDisplayProps) {
  const [view, setView] = React.useState<StoreOfferPriceDisplayView>(loadingView);

  React.useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();

    setView(loadingView);

    const readStoreOfferPriceDisplayView = api
      ? loadStoreOfferPriceDisplayView(checkoutApi, storeItemSlug)
      : loadDefaultStoreOfferPriceDisplayView(checkoutApi, storeItemSlug);

    void readStoreOfferPriceDisplayView.then((nextView) => {
      if (isActive) {
        setView(nextView);
      }
    });

    return () => {
      isActive = false;
    };
  }, [api, storeItemSlug]);

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
