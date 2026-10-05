import * as React from 'react';
import { DIGITAL_RELEASE_BADGE } from '@blackbox/content-model';

import type { PublicCheckoutApi, PublicStoreOffer } from '@/components/store/checkout/public-checkout-api';
import { cn } from '@/components/ui/utils';
import { preorderBadges, shipEstimateText } from '@/platform/lib/preorder-estimate';

export const STORE_OFFER_PRICE_DISPLAY_COPY = {
  loading: 'Checking price',
  unavailable: 'Checkout unavailable',
} as const;

type StoreOfferPriceDisplayTone = 'loading' | 'ready' | 'unavailable' | 'error';

export type StoreOfferPriceDisplayView = {
  isLoading: boolean;
  label: string;
  tone: StoreOfferPriceDisplayTone;
  preorder?: Extract<PublicStoreOffer, { catalogStatus: 'ready' }>['preorder'];
};

type StoreOfferPriceDisplayProps = {
  api?: PublicCheckoutApi;
  className?: string;
  releaseDate?: Date | string | null | undefined;
  isVinyl?: boolean;
  preorderFacts?: boolean;
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
      ...(offer.preorder ? { preorder: offer.preorder } : {}),
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
  releaseDate,
  isVinyl = false,
  preorderFacts = false,
  storeItemSlug,
  suppressUnavailableHeadline = false,
}: StoreOfferPriceDisplayProps) {
  const [view, setView] = React.useState<StoreOfferPriceDisplayView>(loadingView);
  const hideUnavailableHeadline = suppressUnavailableHeadline && view.tone === 'unavailable';
  const Wrapper = preorderFacts ? 'div' : 'span';
  const release = releaseDate ? new Date(releaseDate) : undefined;
  const released = preorderBadges({ releaseDate, shipEstimate: null, today: new Date() })[0] === DIGITAL_RELEASE_BADGE;
  const releaseText = release
    ? release.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : 'To be confirmed';
  const estimateText = view.preorder?.shipEstimate ? shipEstimateText(view.preorder.shipEstimate) : 'To be confirmed';

  React.useEffect(() => {
    let isActive = true;
    setView(loadingView);
    async function loadOffer() {
      try {
        const checkoutApi =
          api ?? (await import('@/components/store/checkout/public-checkout-api')).createPublicCheckoutApi();
        const nextView = await loadStoreOfferPriceDisplayView(checkoutApi, storeItemSlug);
        if (isActive) setView(nextView);
      } catch {
        if (isActive) setView({ ...createStoreOfferPriceDisplayView(null), tone: 'error' });
      }
    }
    void loadOffer();

    return () => {
      isActive = false;
    };
  }, [api, storeItemSlug]);

  return (
    <Wrapper>
      <span className={preorderFacts ? 'flex flex-wrap items-center gap-3' : undefined}>
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
        {preorderFacts && view.tone === 'ready' && view.preorder && (
          <>
            {released && <span className="store-item-card__release-status">{DIGITAL_RELEASE_BADGE}</span>}
            <span className="preorder-badge">Pre-order</span>
          </>
        )}
      </span>
      <span className="mt-2 block text-xs leading-5 text-muted-foreground">
        VAT included. Shipping calculated in your cart.{' '}
        <a className="underline" href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/terms/`}>
          Delivery rates and terms
        </a>
        .
      </span>
      {preorderFacts && view.tone === 'ready' && view.preorder && (
        <dl className="preorder-facts" style={{ marginTop: '1rem' }}>
          <div>
            <dt>{released ? 'Album' : 'Release date'}</dt>
            <dd>{released ? `${DIGITAL_RELEASE_BADGE}, released ${releaseText}` : releaseText}</dd>
          </div>
          <div>
            <dt>{isVinyl ? 'Vinyl expected to ship' : 'Expected to ship'}</dt>
            <dd>{estimateText.charAt(0).toUpperCase() + estimateText.slice(1)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>Charged in full today</dd>
          </div>
        </dl>
      )}
    </Wrapper>
  );
}
