import { deliveryQuantityBands, priceDisclosure } from '@blackbox/api-client/public';

export default function DeliveryRates() {
  const format = (amount: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount / 100);
  return (
    <div className="space-y-2">
      <p>{priceDisclosure}</p>
      <p>
        BOX NOW 1–4 items: <span className="font-display">{format(deliveryQuantityBands[0]!.amountMinor)}</span>. 5–8
        items: <span className="font-display">{format(deliveryQuantityBands[1]!.amountMinor)}</span>. 9+ items:{' '}
        <span className="font-display">{format(deliveryQuantityBands[2]!.amountMinor)}</span>.
      </p>
      <p>One delivery charge per order, based on the total number of items.</p>
    </div>
  );
}
