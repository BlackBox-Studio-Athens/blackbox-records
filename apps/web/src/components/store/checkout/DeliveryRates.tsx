import { deliveryCharges, vatDisclosure } from '@blackbox/api-client/public';

export default function DeliveryRates() {
  const format = (amount: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount / 100);
  return (
    <div className="space-y-2">
      <p>{vatDisclosure}</p>
      <p>
        BOX NOW Small: <span className="font-display">{format(deliveryCharges.small)}</span>. BOX NOW Medium:{' '}
        <span className="font-display">{format(deliveryCharges.medium)}</span>.
      </p>
      <p>One VAT-inclusive delivery charge per eligible order. Your complete cart determines the parcel size.</p>
    </div>
  );
}
