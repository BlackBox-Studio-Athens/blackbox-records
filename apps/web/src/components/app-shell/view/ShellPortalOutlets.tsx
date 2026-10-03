import * as React from 'react';
import { createPortal } from 'react-dom';

import type { StoreCartState } from '@/components/store/cart/store-cart';
import { isCurrentPath } from '@/platform/utils/urls';

const ArtistsRosterFilters = React.lazy(() => import('@/components/artists/ArtistsRosterFilters'));
const StoreDistroSearch = React.lazy(() => import('@/components/store/StoreDistroSearch'));
const ServicesInquiryForm = React.lazy(() => import('@/components/services/ServicesInquiryForm'));
const StoreCartButton = React.lazy(() => import('@/components/store/cart/StoreCartButton'));
const NewsletterSignupForm = React.lazy(() => import('@/components/NewsletterSignupForm'));

class PortalErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback: React.ReactNode; onError?: () => void }>,
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onError?.();
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// The header cart control appears only when there is something in the cart or the shopper is in the store.
// Normalized cart lines always hold a quantity of at least one, so a line count stands in for the item count
// without pulling the cart module into this eager bundle.
export function shouldShowStoreCartControl(storeCartState: StoreCartState, activeShellPathname: string) {
  return storeCartState.lines.length > 0 || isCurrentPath(activeShellPathname, '/store/');
}

function loadingStatus(label: string) {
  return (
    <span className="sr-only" role="status">
      Loading {label}…
    </span>
  );
}

type ShellPortalOutletsProps = {
  activeShellPathname: string;
  artistsRosterFiltersContainer: HTMLElement | null;
  distroSearchContainer: HTMLElement | null;
  onOpenStoreCart: () => void;
  servicesInquiryContainer: HTMLElement | null;
  servicesInquirySubmitText: string;
  storeCartHeaderContainer: HTMLElement | null;
  storeCartBridgeFailed: boolean;
  storeCartState: StoreCartState;
  newsletterContainer?: HTMLElement | null;
};

export default function ShellPortalOutlets({
  activeShellPathname,
  artistsRosterFiltersContainer,
  distroSearchContainer,
  onOpenStoreCart,
  servicesInquiryContainer,
  servicesInquirySubmitText,
  storeCartHeaderContainer,
  storeCartBridgeFailed,
  storeCartState,
  newsletterContainer,
}: ShellPortalOutletsProps) {
  return (
    <>
      {newsletterContainer
        ? createPortal(
            <PortalErrorBoundary
              key={activeShellPathname}
              fallback={<p role="alert">Newsletter signup is unavailable. Reload the page and try again.</p>}
            >
              <React.Suspense fallback={loadingStatus('newsletter signup')}>
                <NewsletterSignupForm
                  key={activeShellPathname}
                  formId={newsletterContainer.dataset.formId ?? 'newsletter-email'}
                  buttonLabel={newsletterContainer.dataset.buttonLabel ?? 'Subscribe'}
                  placeholder={newsletterContainer.dataset.placeholder ?? 'your@email.com'}
                />
              </React.Suspense>
            </PortalErrorBoundary>,
            newsletterContainer,
          )
        : null}
      {artistsRosterFiltersContainer
        ? createPortal(
            <PortalErrorBoundary fallback={<p role="alert">Artist filters are unavailable.</p>}>
              <React.Suspense fallback={loadingStatus('artist filters')}>
                <ArtistsRosterFilters key={activeShellPathname} pageKey={activeShellPathname} />
              </React.Suspense>
            </PortalErrorBoundary>,
            artistsRosterFiltersContainer,
          )
        : null}

      {distroSearchContainer
        ? createPortal(
            <PortalErrorBoundary
              key={activeShellPathname}
              fallback={<p role="alert">Store search is unavailable. Browse the catalog below.</p>}
              onError={() => document.documentElement.removeAttribute('data-store-coverflow-capable')}
            >
              <React.Suspense fallback={loadingStatus('Store search')}>
                <StoreDistroSearch
                  key={activeShellPathname}
                  pageKey={activeShellPathname}
                  scope={activeShellPathname === '/store/distro/' ? 'distro' : 'all'}
                />
              </React.Suspense>
            </PortalErrorBoundary>,
            distroSearchContainer,
          )
        : null}

      {servicesInquiryContainer
        ? createPortal(
            <PortalErrorBoundary
              fallback={<p role="alert">The inquiry form is unavailable. Reload the page and try again.</p>}
            >
              <React.Suspense fallback={loadingStatus('inquiry form')}>
                <ServicesInquiryForm key={activeShellPathname} submitText={servicesInquirySubmitText} />
              </React.Suspense>
            </PortalErrorBoundary>,
            servicesInquiryContainer,
          )
        : null}

      {storeCartHeaderContainer && shouldShowStoreCartControl(storeCartState, activeShellPathname)
        ? createPortal(
            storeCartBridgeFailed ? (
              <span role="alert">Cart is unavailable.</span>
            ) : (
              <PortalErrorBoundary
                fallback={
                  <button
                    type="button"
                    className="site-button site-button--outline border border-border px-3 py-2"
                    onClick={onOpenStoreCart}
                  >
                    Cart
                  </button>
                }
              >
                <React.Suspense fallback={loadingStatus('cart')}>
                  <StoreCartButton cartState={storeCartState} onClick={onOpenStoreCart} />
                </React.Suspense>
              </PortalErrorBoundary>
            ),
            storeCartHeaderContainer,
          )
        : null}
    </>
  );
}
