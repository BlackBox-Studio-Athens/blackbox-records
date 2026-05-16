import * as React from 'react';
import { createPortal } from 'react-dom';

import ArtistsRosterFilters from '@/components/artists/ArtistsRosterFilters';
import ServicesInquiryForm from '@/components/services/ServicesInquiryForm';
import StoreCartButton from '@/components/store/StoreCartButton';
import type { StoreCartState } from '@/lib/store-cart';

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
            <ArtistsRosterFilters key={activeShellPathname} pageKey={activeShellPathname} />,
            artistsRosterFiltersContainer,
          )
        : null}

      {servicesInquiryContainer
        ? createPortal(
            <ServicesInquiryForm
              key={activeShellPathname}
              email={servicesInquiryEmail}
              submitText={servicesInquirySubmitText}
            />,
            servicesInquiryContainer,
          )
        : null}

      {storeCartHeaderContainer
        ? createPortal(
            <StoreCartButton cartState={storeCartState} onClick={onOpenStoreCart} />,
            storeCartHeaderContainer,
          )
        : null}
    </>
  );
}
