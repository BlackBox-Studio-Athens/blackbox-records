import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  createInternalStockApi,
  InternalStockApiError,
  type CatalogPriceCommand,
  type CatalogPriceDetail,
} from '../../lib/backend/internal-stock-api';

export function euroMinor(value: string): number {
  if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(value.trim()))
    throw new Error('Enter a positive EUR amount with at most two decimal places.');
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (amount < 1 || amount > 99_999_999) throw new Error('Amount must be between €0.01 and €999,999.99.');
  return amount;
}

export default function ItemPriceEditor({ variantId, backendBaseUrl }: { variantId: string; backendBaseUrl: string }) {
  const api = createInternalStockApi({ backendBaseUrl });
  const [detail, setDetail] = useState<CatalogPriceDetail | null>(null);
  const [amount, setAmount] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<CatalogPriceCommand | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Loading price…');
  const [error, setError] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const storageKey = `blackbox-price-command:${backendBaseUrl}:${variantId}`;

  async function load() {
    const current = await api.readPrice(variantId);
    setDetail(current);
    setAmount(
      ((current.price.kind === 'fixed' ? current.price.amountMinor : current.price.presetAmountMinor) / 100).toFixed(2),
    );
    if (current.price.kind === 'pay_what_you_want') {
      setMinimum((current.price.minimumAmountMinor / 100).toFixed(2));
      setMaximum((current.price.maximumAmountMinor / 100).toFixed(2));
    }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved && active) {
          setPending(JSON.parse(saved) as CatalogPriceCommand);
          setMessage('Your last price change was not confirmed. Select Check again.');
          return;
        }
        await load();
        if (active) setMessage('');
      } catch {
        if (active) {
          setError(true);
          setMessage('Price is unavailable. Reload to try again.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || needsReview || (!pending && !detail)) return;
    setBusy(true);
    setError(false);
    try {
      let command = pending;
      if (!command && detail) {
        const price: CatalogPriceDetail['price'] =
          detail.price.kind === 'fixed'
            ? { kind: 'fixed', currencyCode: 'EUR', amountMinor: euroMinor(amount) }
            : {
                kind: 'pay_what_you_want',
                currencyCode: 'EUR',
                minimumAmountMinor: euroMinor(minimum),
                presetAmountMinor: euroMinor(amount),
                maximumAmountMinor: euroMinor(maximum),
              };
        if (
          price.kind === 'pay_what_you_want' &&
          (price.minimumAmountMinor > price.presetAmountMinor || price.presetAmountMinor > price.maximumAmountMinor)
        )
          throw new Error('Minimum must not exceed suggested price, and suggested price must not exceed maximum.');
        if (detail.requiresLiveConfirmation && !confirmed)
          throw new Error('Confirm that you want to change the shop price.');
        command = {
          operationId: crypto.randomUUID(),
          expectedRevision: detail.expectedRevision,
          confirmLivePriceChange: confirmed,
          price,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(command));
        setPending(command);
      }
      if (!command) return;
      const result = await api.changePrice(variantId, command);
      if (result.status === 'completed') {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        setConfirmed(false);
        setMessage('Price updated. Existing orders are unchanged.');
        setDetail(null);
        await load().catch(() => {
          setMessage('Price updated. Reload to see the current price.');
        });
      } else if (result.status === 'needs_review') {
        setNeedsReview(true);
        setError(true);
        setMessage('We cannot finish this change. Ask a label administrator for help.');
      } else setMessage('The price change is not finished. Select Check again.');
    } catch (caught) {
      setError(true);
      setMessage(
        caught instanceof InternalStockApiError
          ? caught.status === 409
            ? 'The price has changed or needs a check. Ask a label administrator for help.'
            : 'We could not confirm the price change. Select Check again.'
          : caught instanceof Error
            ? caught.message
            : 'We could not confirm the price change. Select Check again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="item-price-heading" className="grid gap-4 border border-border bg-card p-5">
      <h2 id="item-price-heading" className="font-display text-3xl uppercase">
        Price
      </h2>
      <p className="text-sm text-muted-foreground">
        The shop price changes now. Existing orders keep their original price.
      </p>
      {detail && (
        <p>
          Current price:{' '}
          {detail.price.kind === 'fixed'
            ? `€${(detail.price.amountMinor / 100).toFixed(2)}`
            : `Pay what you want, suggested €${(detail.price.presetAmountMinor / 100).toFixed(2)}`}
        </p>
      )}
      <form onSubmit={submit} className="grid gap-4">
        {detail && (
          <fieldset disabled={busy || !!pending} className="grid gap-3">
            {detail.price.kind === 'pay_what_you_want' && (
              <label className="grid gap-2">
                Minimum (EUR)
                <Input inputMode="decimal" required value={minimum} onChange={(e) => setMinimum(e.target.value)} />
              </label>
            )}
            <label className="grid gap-2">
              {detail.price.kind === 'fixed' ? 'New price (EUR)' : 'Suggested price (EUR)'}
              <Input inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            {detail.price.kind === 'pay_what_you_want' && (
              <label className="grid gap-2">
                Maximum (EUR)
                <Input inputMode="decimal" required value={maximum} onChange={(e) => setMaximum(e.target.value)} />
              </label>
            )}
            {detail.requiresLiveConfirmation && (
              <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} required />I
                want to change the price in the shop
              </label>
            )}
          </fieldset>
        )}
        {(detail || pending) && (
          <Button type="submit" disabled={busy || needsReview}>
            {busy ? 'Checking price change…' : pending ? 'Check again' : 'Change price'}
          </Button>
        )}
      </form>
      {message && (
        <p role={error ? 'alert' : 'status'} className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
