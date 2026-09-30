import * as React from 'react';
import PurchaseInformation from '@/platform/components/PurchaseInformation';
import {
  readDeliveryQuote,
  type DeliveryQuoteResponse,
  type StartCheckoutBody,
} from '@/components/store/checkout/public-checkout-api';

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
  const quote = result?.key === key ? result.quote : null;
  const totalAmountMinor = quote?.totalAmountMinor ?? null;
  return {
    loading: lines.length > 0 && result?.key !== key,
    quote,
    totalDisplay: totalAmountMinor === null ? null : money(totalAmountMinor),
  };
}

export function DeliverySummary({ loading, quote }: Pick<ReturnType<typeof useDeliveryQuote>, 'loading' | 'quote'>) {
  return (
    <div className="space-y-3 text-sm" aria-live="polite" aria-busy={loading} data-delivery-summary>
      {loading ? (
        <p className="min-h-[4.75rem]">Calculating delivery and current prices…</p>
      ) : !quote ? (
        <p className="min-h-[4.75rem]">
          Delivery is unavailable for this cart. Please review the items or try again later.
        </p>
      ) : (
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt>Merchandise</dt>
            <dd>
              {quote.merchandiseGrossMinor === null ? (
                'Choose amount at payment'
              ) : (
                <span className="font-display">{money(quote.merchandiseGrossMinor)}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Shipping — BOX NOW {quote.tier === 'small' ? 'Small' : 'Medium'}</dt>
            <dd>
              <span className="font-display">{money(quote.amountMinor)}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold">
            <dt>Total, VAT included</dt>
            <dd>
              {quote.totalAmountMinor === null ? (
                'Shown before payment'
              ) : (
                <span className="font-display">{money(quote.totalAmountMinor)}</span>
              )}
            </dd>
          </div>
        </dl>
      )}
      <p className="text-xs leading-5 text-muted-foreground">VAT is included, never added again.</p>
      <PurchaseInformation />
    </div>
  );
}

export default function CartDeliverySummary({
  lines,
  onTotalDisplayChange,
}: {
  lines: Lines;
  // The cart's Checkout action shows the quoted total beside its label once the quote is known.
  onTotalDisplayChange?: (totalDisplay: string | null) => void;
}) {
  const delivery = useDeliveryQuote(lines);

  React.useEffect(() => {
    onTotalDisplayChange?.(delivery.totalDisplay);
  }, [onTotalDisplayChange, delivery.totalDisplay]);

  return <DeliverySummary {...delivery} />;
}
