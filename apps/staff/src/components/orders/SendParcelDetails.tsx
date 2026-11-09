import { SEND_PARCEL_PRICES, SEND_PARCEL_URL } from '@coding-tree-io/boxnow-widget';
import { Copy, ExternalLink, Package } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import type { InternalOrder } from './internal-order-api';

type CurrentFulfillment = Extract<InternalOrder['fulfillment'], { kind: 'current' }>;

const euros = (minor: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(minor / 100);

/** Suggests BOX NOW's compartment from the same item-count bands as our delivery charge; the operator decides. */
export function suggestedParcelSize(fulfillment: CurrentFulfillment): string {
  const units = fulfillment.lines.reduce((sum, line) => sum + line.quantity, 0);
  const size = SEND_PARCEL_PRICES.sizes[units <= 4 ? 0 : units <= 8 ? 1 : 2];
  const charged =
    fulfillment.deliveryGrossMinor === null
      ? 'charge not recorded'
      : `we charged ${euros(fulfillment.deliveryGrossMinor)}`;
  const island = euros(size.priceMinor + SEND_PARCEL_PRICES.islandSurchargeMinor);
  return `${size.label} · BOX NOW ${euros(size.priceMinor)}, ${island} for an island (${charged})`;
}

export default function SendParcelDetails({ fulfillment }: { fulfillment: CurrentFulfillment }) {
  const [message, setMessage] = useState('');
  const locker = fulfillment.shippingLocker;
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Recipient', value: fulfillment.recipientName },
    ...(fulfillment.shopperContact.phone
      ? [{ label: 'Phone', value: fulfillment.shopperContact.phone, mono: true }]
      : []),
    { label: 'Email', value: fulfillment.shopperContact.email },
    ...(locker
      ? [
          { label: 'Locker', value: locker.name },
          { label: 'Locker ID', value: locker.lockerId, mono: true },
        ]
      : []),
  ];

  function copy(label: string, value: string) {
    void navigator.clipboard.writeText(value).then(
      () => setMessage(`Copied ${label.toLowerCase()}.`),
      () => setMessage('Copy failed. Select the text and copy it instead.'),
    );
  }

  return (
    <section className="order-section order-send-parcel" aria-labelledby="send-parcel-heading" data-send-parcel>
      <h2 id="send-parcel-heading">
        <Package aria-hidden="true" />
        For BOX NOW Send parcel
      </h2>
      {!locker && (
        <p className="order-send-parcel__no-locker">
          No locker chosen: BOX NOW&apos;s map was unavailable at checkout. Agree a locker with the customer, then enter
          it under Locker used.
        </p>
      )}
      <dl className="order-copy-list">
        <div>
          <dt>Parcel size</dt>
          <dd>{suggestedParcelSize(fulfillment)}</dd>
        </div>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.mono ? 'order-copy-list__mono' : undefined}>{row.value}</dd>
            <Button
              variant="ghost"
              onClick={() => copy(row.label, row.value)}
              aria-label={`Copy ${row.label.toLowerCase()}`}
            >
              Copy
            </Button>
          </div>
        ))}
      </dl>
      <div className="order-send-parcel__actions">
        <Button
          variant="outline"
          onClick={() => copy('All details', rows.map((row) => `${row.label}: ${row.value}`).join('\n'))}
        >
          <Copy aria-hidden="true" />
          Copy all
        </Button>
        <Button variant="outline" asChild>
          <a href={SEND_PARCEL_URL} target="_blank" rel="noopener noreferrer">
            Open Send parcel
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </div>
      <p className="order-muted">
        Pay by card in the form. Then drop the parcel at any BOX NOW locker, using the number from BOX NOW&apos;s email
        to open a door.
      </p>
      <span role="status" className="order-muted">
        {message}
      </span>
    </section>
  );
}
