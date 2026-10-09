import * as React from 'react';
import { taxCollectionDisclosure } from '@blackbox/api-client/public';
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
    setResult(null);
    const controller = new AbortController();
    const requestedLines: Lines = JSON.parse(key);
    const timer = requestedLines.length
      ? setTimeout(() => {
          void readDeliveryQuote(requestedLines, controller.signal).then(
            ({ quote }) => {
              if (active) setResult({ key, quote });
            },
            () => {
              if (active) setResult({ key, quote: null });
            },
          );
        }, 250)
      : undefined;
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
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

export function DeliverySummary({
  loading,
  quote,
  presentation = 'review',
}: Pick<ReturnType<typeof useDeliveryQuote>, 'loading' | 'quote'> & {
  presentation?: 'drawer' | 'review';
}) {
  const isDrawer = presentation === 'drawer';
  const waitingReview = loading && !isDrawer;
  return (
    <div
      className={isDrawer ? 'store-cart-drawer__delivery' : 'checkout-review__delivery'}
      aria-live="polite"
      aria-busy={loading}
      data-delivery-summary
    >
      {loading && isDrawer ? (
        <p className="min-h-[4.75rem]">Calculating delivery and current prices…</p>
      ) : !quote && !waitingReview ? (
        <p className="min-h-[4.75rem]">
          Delivery is unavailable for this cart. Please review the items or try again later.
        </p>
      ) : (
        // Review reserves the real rows, including their font metrics, while the Worker quote is pending.
        <dl
          className={isDrawer ? 'space-y-2' : 'checkout-review__amounts'}
          aria-label={waitingReview ? 'Calculating delivery and current prices…' : undefined}
        >
          <div className="flex justify-between gap-4">
            <dt>Items</dt>
            <dd>
              {quote?.merchandiseGrossMinor === null ? (
                'Choose amount at payment'
              ) : (
                <span className="font-display leading-none">{quote ? money(quote.merchandiseGrossMinor) : '…'}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>BOX NOW locker delivery</dt>
            <dd>
              <span className="font-display leading-none">{quote ? money(quote.amountMinor) : '…'}</span>
            </dd>
          </div>
          {!isDrawer && (
            <div className="checkout-review__total flex justify-between gap-4 font-semibold">
              <dt>Total, charged today</dt>
              <dd>
                {quote?.totalAmountMinor === null ? (
                  'Shown before payment'
                ) : (
                  <span className="font-display leading-none">{quote ? money(quote.totalAmountMinor) : '…'}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}
      {(!isDrawer || quote?.taxCollectionMode) && (
        <p data-tax-disclosure>
          {quote?.taxCollectionMode
            ? taxCollectionDisclosure(quote.taxCollectionMode)
            : loading
              ? 'Checking tax collection…'
              : 'Tax details are shown before payment.'}
        </p>
      )}
      {isDrawer ? (
        <p>Greece-only BOX NOW locker delivery. We arrange your locker with you before dispatch.</p>
      ) : (
        <PurchaseInformation presentation="checkout" />
      )}
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

  return <DeliverySummary {...delivery} presentation="drawer" />;
}
