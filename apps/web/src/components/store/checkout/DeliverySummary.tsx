import * as React from 'react';
import { taxCollectionDisclosure } from '@blackbox/api-client/public';
import PurchaseInformation from '@/platform/components/PurchaseInformation';
import { Button } from '@/components/ui/button';
import { getCartSubtotalDisplay, type CartLine } from '@/components/store/cart/store-cart';
import {
  PublicCheckoutApiError,
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
  const [request, setRequest] = React.useState({ key: '', attempt: 0 });
  const attempt = request.attempt;
  const requesting = React.useRef(false);
  const hasRequested = React.useRef(false);
  const [result, setResult] = React.useState<{
    key: string;
    attempt: number;
    quote: DeliveryQuoteResponse['quote'];
    error: 'temporary' | 'unavailable' | null;
  } | null>(null);
  React.useEffect(() => {
    let active = true;
    setResult(null);
    const controller = new AbortController();
    const requestedLines: Lines = JSON.parse(key);
    requesting.current = requestedLines.length > 0;
    const readQuote = () => {
      hasRequested.current = true;
      void readDeliveryQuote(requestedLines, controller.signal).then(
        ({ quote }) => {
          if (!active) return;
          requesting.current = false;
          setResult({ key, attempt, quote, error: quote ? null : 'unavailable' });
        },
        (error: unknown) => {
          if (!active) return;
          requesting.current = false;
          const rejectedCart =
            error instanceof PublicCheckoutApiError &&
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 408 &&
            error.status !== 429;
          setResult({ key, attempt, quote: null, error: rejectedCart ? 'unavailable' : 'temporary' });
        },
      );
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (requestedLines.length) {
      if (hasRequested.current) timer = setTimeout(readQuote, 250);
      else readQuote();
    }
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, attempt]);
  const currentResult = result?.key === key && result.attempt === attempt ? result : null;
  const quote = currentResult?.quote ?? null;
  const loading = lines.length > 0 && !currentResult;
  const totalAmountMinor = quote?.totalAmountMinor ?? null;
  return {
    loading,
    error: currentResult?.error ?? null,
    retry() {
      if (loading || requesting.current || currentResult?.error !== 'temporary') return;
      requesting.current = true;
      setRequest((previous) => ({ key, attempt: previous.attempt + 1 }));
    },
    retrying: loading && request.key === key,
    quote,
    totalDisplay: totalAmountMinor === null ? null : money(totalAmountMinor),
  };
}

export function DeliverySummary({
  loading,
  quote,
  error,
  retry,
  retrying = false,
  presentation = 'review',
  pendingItemsDisplay = null,
}: Pick<ReturnType<typeof useDeliveryQuote>, 'loading' | 'quote'> & {
  error?: ReturnType<typeof useDeliveryQuote>['error'];
  retry?: () => void;
  retrying?: boolean;
  presentation?: 'drawer' | 'review';
  // The cart's own fixed-price subtotal, shown for Items until the quote replaces it.
  pendingItemsDisplay?: string | null;
}) {
  const isDrawer = presentation === 'drawer';
  return (
    <div
      className={isDrawer ? 'store-cart-drawer__delivery' : 'checkout-review__delivery'}
      aria-live="polite"
      aria-busy={loading}
      data-delivery-summary
    >
      {!quote && !loading ? (
        <p className="min-h-[4.75rem]">
          {error === 'temporary'
            ? "We couldn't calculate delivery. Please try again. Your cart is unchanged."
            : 'Delivery is unavailable for this cart. Please review the items.'}
        </p>
      ) : (
        // Both presentations reserve the real rows, including their font metrics, while the Worker quote is pending.
        <dl
          className={isDrawer ? 'space-y-2' : 'checkout-review__amounts'}
          aria-label={loading ? 'Calculating delivery and current prices…' : undefined}
        >
          <div className="flex justify-between gap-4">
            <dt>Items</dt>
            <dd>
              {quote?.merchandiseGrossMinor === null ? (
                'Choose amount at payment'
              ) : (
                <span className="font-display leading-none">
                  {quote ? money(quote.merchandiseGrossMinor) : (pendingItemsDisplay ?? '…')}
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Delivery</dt>
            <dd>
              <span className="font-display leading-none">{quote ? money(quote.amountMinor) : '…'}</span>
            </dd>
          </div>
          <div
            className={
              isDrawer
                ? 'flex justify-between gap-4 border-t border-border pt-2 font-semibold'
                : 'checkout-review__total flex justify-between gap-4 font-semibold'
            }
          >
            <dt>Total</dt>
            <dd>
              {quote?.totalAmountMinor === null ? (
                'Shown before payment'
              ) : (
                <span className="font-display leading-none">{quote ? money(quote.totalAmountMinor) : '…'}</span>
              )}
            </dd>
          </div>
        </dl>
      )}
      {retry && (error === 'temporary' || retrying) && (
        <Button type="button" variant="outline" onClick={retry} disabled={loading} aria-busy={loading}>
          {loading ? 'Checking delivery…' : 'Try delivery again'}
        </Button>
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
      {isDrawer ? <p>BOX NOW locker delivery within Greece.</p> : <PurchaseInformation presentation="checkout" />}
    </div>
  );
}

export default function CartDeliverySummary({
  lines,
  onTotalDisplayChange,
}: {
  lines: CartLine[];
  // The cart's Checkout action shows the quoted total beside its label once the quote is known.
  onTotalDisplayChange?: (totalDisplay: string | null) => void;
}) {
  const delivery = useDeliveryQuote(lines);
  const currency = lines[0]?.priceCurrencyCode;
  const fixedPriced = lines.every(
    (line) => line.priceKind === 'fixed' && line.priceAmountMinor !== null && line.priceCurrencyCode === currency,
  );

  React.useEffect(() => {
    onTotalDisplayChange?.(delivery.totalDisplay);
  }, [onTotalDisplayChange, delivery.totalDisplay]);

  return (
    <DeliverySummary
      {...delivery}
      presentation="drawer"
      pendingItemsDisplay={fixedPriced ? getCartSubtotalDisplay(lines) : null}
    />
  );
}
