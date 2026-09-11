import * as React from 'react';
import PurchaseInformation from '@/components/PurchaseInformation';
import {
  readDeliveryQuote,
  type DeliveryQuoteResponse,
  type StartCheckoutBody,
} from '@/lib/backend/public-checkout-api';

type Lines = NonNullable<StartCheckoutBody['lines']>;
const money = (amount: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount / 100);

export function useDeliveryQuote(lines: Lines) {
  const key = JSON.stringify(
    lines.map(({ storeItemSlug, variantId, quantity }) => ({ storeItemSlug, variantId, quantity })),
  );
  const [result, setResult] = React.useState<{ key: string; quote: DeliveryQuoteResponse['quote'] } | null>(null);
  React.useEffect(() => {
    let active = true;
    const requestedLines: Lines = JSON.parse(key);
    if (requestedLines.length) {
      void readDeliveryQuote(requestedLines).then(
        ({ quote }) => {
          if (active) setResult({ key, quote });
        },
        () => {
          if (active) setResult({ key, quote: null });
        },
      );
    }
    return () => {
      active = false;
    };
  }, [key]);
  return { loading: lines.length > 0 && result?.key !== key, quote: result?.key === key ? result.quote : null };
}

export function DeliverySummary({ loading, quote }: ReturnType<typeof useDeliveryQuote>) {
  return (
    <div className="space-y-3 text-sm" aria-live="polite" aria-busy={loading} data-delivery-summary>
      {loading ? (
        <p>Calculating delivery and current prices…</p>
      ) : !quote ? (
        <p>Delivery is unavailable for this cart. Please review the items or try again later.</p>
      ) : (
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt>Merchandise</dt>
            <dd>
              {quote.merchandiseGrossMinor === null ? 'Choose amount at payment' : money(quote.merchandiseGrossMinor)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Shipping — BOX NOW {quote.tier === 'small' ? 'Small' : 'Medium'}</dt>
            <dd>{money(quote.amountMinor)}</dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold">
            <dt>Total, VAT included</dt>
            <dd>{quote.totalAmountMinor === null ? 'Shown before payment' : money(quote.totalAmountMinor)}</dd>
          </div>
        </dl>
      )}
      <p className="text-xs leading-5 text-muted-foreground">VAT is included, never added again.</p>
      <PurchaseInformation />
    </div>
  );
}

export default function CartDeliverySummary({ lines }: { lines: Lines }) {
  return <DeliverySummary {...useDeliveryQuote(lines)} />;
}
