import { useEffect, useRef, useState } from 'react';
import { DISTRO_GROUP_VALUES } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  createInternalStockApi,
  InternalStockApiError,
  type CatalogPriceCommand,
  type CatalogPriceInitializeCommand,
  type CatalogSellingDetail,
} from '../../lib/backend/internal-stock-api';

export function euroMinor(value: string): number {
  if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(value.trim()))
    throw new Error('Enter a positive EUR amount with at most two decimal places.');
  const [whole, fraction = ''] = value.trim().replace(',', '.').split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (amount < 1 || amount > 99_999_999) throw new Error('Amount must be between €0.01 and €999,999.99.');
  return amount;
}

export default function ItemPriceEditor({
  variantId,
  backendBaseUrl,
  readiness,
  onRefresh,
  onSaved,
}: {
  variantId: string;
  backendBaseUrl: string;
  readiness: CatalogSellingDetail;
  onRefresh(): Promise<void>;
  onSaved(): Promise<void>;
}) {
  const api = createInternalStockApi({ backendBaseUrl });
  const initial = readiness.state === 'setup_required' ? readiness : null;
  const detail = readiness.state === 'ready' ? readiness.detail : null;
  const resume = readiness.state === 'blocked' ? readiness.pending : null;
  const storageKey = `blackbox-price-command:${backendBaseUrl}:${variantId}`;
  const [pending, setPending] = useState<CatalogPriceCommand | CatalogPriceInitializeCommand | null>(() => {
    if (resume) return resume;
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as CatalogPriceCommand | null;
    } catch {
      return null;
    }
  });
  const price = detail?.price ?? resume?.price;
  const kind = price?.kind ?? initial?.priceKind ?? 'fixed';
  const [amount, setAmount] = useState(
    price ? ((price.kind === 'fixed' ? price.amountMinor : price.presetAmountMinor) / 100).toFixed(2) : '',
  );
  const [minimum, setMinimum] = useState(
    price?.kind === 'pay_what_you_want' ? (price.minimumAmountMinor / 100).toFixed(2) : '',
  );
  const [maximum, setMaximum] = useState(
    price?.kind === 'pay_what_you_want' ? (price.maximumAmountMinor / 100).toFixed(2) : '',
  );
  const [itemType, setItemType] = useState(initial?.itemType ?? resume?.itemType ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    pending ? 'A submitted price operation is unfinished. Resume it before making another change.' : '',
  );
  const [error, setError] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const isInitial = !!initial || !!resume || (!!pending && 'cmsRevision' in pending);
  const requiresConfirmation = detail?.requiresLiveConfirmation ?? initial?.requiresLiveConfirmation ?? false;

  async function refresh() {
    if (dirty && !window.confirm('Discard the unsaved price and refresh for review?')) return;
    await onRefresh();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || needsReview || saved) return;
    setBusy(true);
    setError(false);
    try {
      let command = pending;
      if (!command) {
        const price: CatalogPriceCommand['price'] =
          kind === 'fixed'
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
        if (requiresConfirmation && !confirmed) throw new Error('Confirm this live price.');
        if (initial) {
          const format = initial.itemType ?? DISTRO_GROUP_VALUES.find((value) => value === itemType);
          if (!format) throw new Error('Choose a supported format.');
          command = {
            operationId: crypto.randomUUID(),
            expectedRevision: initial.expectedRevision,
            cmsRevision: initial.cmsRevision,
            itemType: format,
            price,
            confirmLiveSetup: confirmed,
          };
        } else if (detail) {
          command = {
            operationId: crypto.randomUUID(),
            expectedRevision: detail.expectedRevision,
            price,
            confirmLivePriceChange: confirmed,
          };
          sessionStorage.setItem(storageKey, JSON.stringify(command));
        }
        if (!command) return;
        setPending(command);
      }
      const result =
        'cmsRevision' in command
          ? await api.initializePrice(variantId, command)
          : await api.changePrice(variantId, command);
      if (!active.current) return;
      if (result.status === 'completed') {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        setDirty(false);
        setSaved(true);
        setMessage('Price saved. Existing orders are unchanged.');
        await onSaved();
      } else if (result.status === 'needs_review') {
        setNeedsReview(true);
        setError(true);
        setMessage(`Ask a label administrator to review operation ${result.operationId}.`);
      } else setMessage('The price operation is unfinished. Select Resume to check it.');
    } catch (caught) {
      if (!active.current) return;
      setError(true);
      if (caught instanceof InternalStockApiError && caught.status === 409) {
        // Fresh initial-pricing conflicts leave the reviewed form values in place.
        if (isInitial) setPending(null);
        else setNeedsReview(true);
        setMessage(
          'The saved version or price has changed. Your amount is retained. Refresh and review before trying again.',
        );
      } else
        setMessage(
          caught instanceof InternalStockApiError
            ? 'We could not confirm the price operation. Resume with the same input, or Refresh to check its status.'
            : caught instanceof Error
              ? caught.message
              : 'Price is unavailable. Refresh to try again.',
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }

  return (
    <section aria-labelledby="item-price-heading" className="grid min-w-0 gap-4 border border-border bg-card p-5">
      <h2 id="item-price-heading" className="text-lg font-semibold">
        Price
      </h2>
      <p className="text-sm text-muted-foreground">
        {isInitial
          ? 'Set the first selling price. Publish item is a separate step; stock stays unchanged.'
          : 'The shop price changes now. Existing orders keep their original price.'}
      </p>
      {initial && <p>No price set</p>}
      {detail && (
        <p>
          Current price:{' '}
          {detail.price.kind === 'fixed'
            ? `€${(detail.price.amountMinor / 100).toFixed(2)}`
            : `Pay what you want, suggested €${(detail.price.presetAmountMinor / 100).toFixed(2)}`}
        </p>
      )}
      <form onSubmit={submit} onChange={() => setDirty(true)} className="grid min-w-0 gap-4">
        {(initial || detail || resume) && (
          <fieldset disabled={busy || !!pending || saved} className="grid min-w-0 gap-3">
            {initial && !initial.itemType && (
              <label className="grid gap-2">
                Format
                <select
                  className="min-h-11 min-w-0 rounded border border-input bg-background px-3 focus-visible:ring-2"
                  required
                  value={itemType}
                  onChange={(event) => setItemType(event.target.value)}
                >
                  <option value="">Choose format</option>
                  {DISTRO_GROUP_VALUES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            )}
            {kind === 'pay_what_you_want' && (
              <label className="grid gap-2">
                Minimum (EUR)
                <Input
                  inputMode="decimal"
                  required
                  value={minimum}
                  aria-describedby={error ? 'price-feedback' : undefined}
                  onChange={(event) => setMinimum(event.target.value)}
                />
              </label>
            )}
            <label className="grid gap-2">
              {kind === 'pay_what_you_want' ? 'Suggested price (EUR)' : isInitial ? 'Price (EUR)' : 'New price (EUR)'}
              <Input
                inputMode="decimal"
                required
                value={amount}
                aria-invalid={error || undefined}
                aria-describedby={error ? 'price-feedback' : undefined}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            {kind === 'pay_what_you_want' && (
              <label className="grid gap-2">
                Maximum (EUR)
                <Input
                  inputMode="decimal"
                  required
                  value={maximum}
                  aria-describedby={error ? 'price-feedback' : undefined}
                  onChange={(event) => setMaximum(event.target.value)}
                />
              </label>
            )}
            {requiresConfirmation && (
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                {kind === 'pay_what_you_want'
                  ? 'Apply these pricing settings to the live shop'
                  : 'Apply this price to the live shop'}
              </label>
            )}
          </fieldset>
        )}
        {(initial || detail || pending) && !saved && (
          <Button type="submit" disabled={busy || needsReview}>
            {busy
              ? 'Checking price…'
              : pending
                ? isInitial
                  ? 'Resume'
                  : 'Check again'
                : isInitial
                  ? 'Set price'
                  : 'Change price'}
          </Button>
        )}
      </form>
      {message && (
        <p id="price-feedback" role={error ? 'alert' : 'status'} className="break-words text-sm">
          {message}
        </p>
      )}
      <Button type="button" variant="outline" disabled={busy} onClick={() => void refresh()}>
        Refresh
      </Button>
    </section>
  );
}
