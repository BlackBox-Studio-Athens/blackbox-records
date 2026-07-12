import * as React from 'react';
import { createPortal } from 'react-dom';

import type { StoreCartState } from '@/lib/store-cart';

const ArtistsRosterFilters = React.lazy(() => import('@/components/artists/ArtistsRosterFilters'));
const ServicesInquiryForm = React.lazy(() => import('@/components/services/ServicesInquiryForm'));
const StoreCartButton = React.lazy(() => import('@/components/store/StoreCartButton'));

class PortalErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback: React.ReactNode }>,
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
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
  onOpenStoreCart: () => void;
  servicesInquiryContainer: HTMLElement | null;
  servicesInquiryEmail: string;
  servicesInquirySubmitText: string;
  storeCartHeaderContainer: HTMLElement | null;
  storeCartState: StoreCartState;
};

export default function ShellPortalOutlets({
  activeShellPathname,
  artistsRosterFiltersContainer,
  onOpenStoreCart,
  servicesInquiryContainer,
  servicesInquiryEmail,
  servicesInquirySubmitText,
  storeCartHeaderContainer,
  storeCartState,
}: ShellPortalOutletsProps) {
  return (
    <>
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

      {servicesInquiryContainer
        ? createPortal(
            <PortalErrorBoundary
              fallback={
                <p role="alert">
                  The inquiry form is unavailable.{' '}
                  <a href={`mailto:${servicesInquiryEmail}`}>Email BlackBox Records.</a>
                </p>
              }
            >
              <React.Suspense fallback={loadingStatus('inquiry form')}>
                <ServicesInquiryForm
                  key={activeShellPathname}
                  email={servicesInquiryEmail}
                  submitText={servicesInquirySubmitText}
                />
              </React.Suspense>
            </PortalErrorBoundary>,
            servicesInquiryContainer,
          )
        : null}

      {storeCartHeaderContainer
        ? createPortal(
            <PortalErrorBoundary
              fallback={
                <button type="button" onClick={onOpenStoreCart}>
                  Cart
                </button>
              }
            >
              <React.Suspense fallback={loadingStatus('cart')}>
                <StoreCartButton cartState={storeCartState} onClick={onOpenStoreCart} />
              </React.Suspense>
            </PortalErrorBoundary>,
            storeCartHeaderContainer,
          )
        : null}
    </>
  );
}
