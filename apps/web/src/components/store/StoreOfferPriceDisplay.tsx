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

type StoreOfferPriceDisplayTone = 'loading' | 'ready' | 'unavailable' | 'error';

export type StoreOfferPriceDisplayView = {
  isLoading: boolean;
  label: string;
  tone: StoreOfferPriceDisplayTone;
};

type StoreOfferPriceDisplayProps = {
  api?: PublicCheckoutApi;
  className?: string;
  suppressUnavailableHeadline?: boolean;
  storeItemSlug: string;
};

const loadingView: StoreOfferPriceDisplayView = {
  isLoading: true,
  label: STORE_OFFER_PRICE_DISPLAY_COPY.loading,
  tone: 'loading',
};

export function createStoreOfferPriceDisplayView(
  offer: PublicStoreOffer | null | undefined,
): StoreOfferPriceDisplayView {
  if (offer?.catalogStatus === 'ready') {
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
    return {
      ...createStoreOfferPriceDisplayView(null),
      tone: 'error',
    };
  }
}

export default function StoreOfferPriceDisplay({
  api,
  className,
  storeItemSlug,
  suppressUnavailableHeadline = false,
}: StoreOfferPriceDisplayProps) {
  const [view, setView] = React.useState<StoreOfferPriceDisplayView>(loadingView);
  const hideUnavailableHeadline = suppressUnavailableHeadline && view.tone === 'unavailable';

  React.useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();

    setView(loadingView);

    void loadStoreOfferPriceDisplayView(checkoutApi, storeItemSlug).then((nextView) => {
      if (isActive) {
        setView(nextView);
      }
    });

    return () => {
      isActive = false;
    };
  }, [api, storeItemSlug]);

  return (
    <span>
      <span
        aria-busy={view.isLoading ? 'true' : undefined}
        aria-hidden={hideUnavailableHeadline ? 'true' : undefined}
        className={cn(
          className,
          view.tone === 'loading' && 'text-muted-foreground',
          (view.tone === 'unavailable' || view.tone === 'error') && 'text-muted-foreground',
          hideUnavailableHeadline && 'invisible',
        )}
        data-store-offer-price
        data-store-offer-price-state={view.tone}
      >
        {view.label}
      </span>
      <span className="mt-2 block text-xs leading-5 text-muted-foreground">
        VAT included. Shipping calculated in your cart.{' '}
        <a className="underline" href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/terms/`}>
          Delivery rates and terms
        </a>
        .
      </span>
    </span>
  );
}
