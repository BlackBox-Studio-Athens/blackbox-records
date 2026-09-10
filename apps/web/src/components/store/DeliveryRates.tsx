import * as React from 'react';
import { createPublicCheckoutApi, type StoreCapabilities } from '@/lib/backend/public-checkout-api';

export default function DeliveryRates() {
  const [pricing, setPricing] = React.useState<StoreCapabilities['pricing']>();
  React.useEffect(() => {
    let active = true;
    void createPublicCheckoutApi()
      .readStoreCapabilities()
      .then(
        (capabilities) => {
          if (active) setPricing(capabilities.pricing);
        },
        () => {},
      );
    return () => {
      active = false;
    };
  }, []);
  if (!pricing) return <p>Delivery rates are temporarily unavailable. Confirm them in your cart before payment.</p>;
  const format = (amount: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: pricing.currencyCode }).format(amount / 100);
  return (
    <div className="space-y-2">
      <p>{pricing.vatDisclosure}</p>
      <p>
        BOX NOW Small: {format(pricing.deliveryCharges.small)}. BOX NOW Medium: {format(pricing.deliveryCharges.medium)}
        .
      </p>
      <p>One VAT-inclusive delivery charge per eligible order. Your complete cart determines the parcel size.</p>
    </div>
  );
}
