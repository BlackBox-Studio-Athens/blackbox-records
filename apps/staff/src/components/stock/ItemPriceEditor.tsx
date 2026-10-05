import { useEffect, useRef, useState } from 'react';
import { Disc3, Euro, RefreshCw, Undo2 } from 'lucide-react';
import { DISTRO_GROUP_VALUES } from '@blackbox/content-model';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EditorialApiError } from '../../lib/backend/editorial-api';
import { createInternalStockApi, type CatalogSellingDetail } from '../../lib/backend/internal-stock-api';
import {
  clearPriceDraft,
  describePrice,
  euroMinor,
  isEuroDraft,
  priceAmount,
  readPriceDraft,
  samePrice,
  savePriceDraft,
  type DraftLookup,
  type DraftPrice,
  type PriceDraft,
} from '../../lib/item-commerce';

const toEuros = (minor: number) => (minor / 100).toFixed(2);
type Values = { amount: string; minimum: string; maximum: string };

// Typed prices save as an EmDash draft; Publish changes applies them through the price command.
export default function ItemPriceEditor({
  variantId,
  backendBaseUrl,
  readiness,
  target,
  stored,
  onRefresh,
  onDraftChange,
  onLeaveGuard,
}: {
  variantId: string;
  backendBaseUrl: string;
  readiness: CatalogSellingDetail;
  target: { collection: 'releases' | 'distro'; recordId: string };
  /** The draft from the workspace read, or unknown when that read could not include drafts. */
  stored: DraftLookup;
  onRefresh(): Promise<void>;
  onDraftChange(draft: PriceDraft | null): void;
  onLeaveGuard?(guard: (() => boolean) | null): void;
}) {
  const initial = readiness.state === 'setup_required' ? readiness : null;
  const detail = readiness.state === 'ready' ? readiness.detail : null;
  const blocked = readiness.state === 'blocked' ? readiness : null;
  const resume = blocked?.pending ?? null;
  const live = detail?.price ?? null;
  const kind = live?.kind ?? initial?.priceKind ?? resume?.price.kind ?? 'fixed';
  const [draft, setDraft] = useState<PriceDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [amount, setAmount] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [itemType, setItemType] = useState(initial?.itemType ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const draftRef = useRef<PriceDraft | null>(null);
  // Saves run one at a time, so each carries the revision the previous one returned.
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const queuedSaves = useRef(0);
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const editable = !!(initial || detail);
  const attemptRetained = !!draft?.attempt;

  function show(price: DraftPrice | null) {
    if (!price) {
      setAmount('');
      setMinimum('');
      setMaximum('');
      return;
    }
    setAmount(toEuros(priceAmount(price)));
    setMinimum(price.kind === 'pay_what_you_want' ? toEuros(price.minimumAmountMinor) : '');
    setMaximum(price.kind === 'pay_what_you_want' ? toEuros(price.maximumAmountMinor) : '');
  }
  function remember(next: PriceDraft | null) {
    draftRef.current = next;
    setDraft(next);
    onDraftChangeRef.current(next);
  }

  useEffect(() => {
    let active = true;
    void (stored.status === 'known' ? Promise.resolve(stored.draft) : readPriceDraft(backendBaseUrl, target))
      .then(async (found) => {
        // A draft that already matches the live price was applied; drop it quietly.
        if (found && live && samePrice(live, found.price)) {
          await clearPriceDraft(backendBaseUrl, found);
          found = null;
        }
        if (!active) return;
        remember(found);
        show(found?.price ?? live ?? resume?.price ?? null);
        if (found?.itemType) setItemType(found.itemType);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        show(live);
        setError(true);
        setMessage('The price draft could not be loaded. Refresh before changing the price.');
      });
    return () => {
      active = false;
    };
  }, [backendBaseUrl, target.collection, target.recordId]);

  useEffect(() => {
    onLeaveGuard?.(() => queuedSaves.current === 0);
    const warn = (event: BeforeUnloadEvent) => {
      if (queuedSaves.current > 0) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      onLeaveGuard?.(null);
      window.removeEventListener('beforeunload', warn);
      clearTimeout(timer.current);
    };
  }, [onLeaveGuard]);

  function readPrice(values: Values): DraftPrice {
    if (kind === 'fixed') return { kind, currencyCode: 'EUR', amountMinor: euroMinor(values.amount) };
    const price = {
      kind,
      currencyCode: 'EUR' as const,
      minimumAmountMinor: euroMinor(values.minimum),
      presetAmountMinor: euroMinor(values.amount),
      maximumAmountMinor: euroMinor(values.maximum),
    };
    if (price.minimumAmountMinor > price.presetAmountMinor || price.presetAmountMinor > price.maximumAmountMinor)
      throw new Error('Minimum must not exceed suggested price, and suggested price must not exceed maximum.');
    return price;
  }

  async function save(values: Values, format: string) {
    let price: DraftPrice;
    try {
      price = readPrice(values);
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : 'Check the price.');
      return;
    }
    const current = draftRef.current;
    const chosenFormat = initial ? (initial.itemType ?? format) : '';
    try {
      if (live && samePrice(live, price)) {
        if (current) await clearPriceDraft(backendBaseUrl, current);
        remember(null);
      } else {
        remember(
          await savePriceDraft(
            backendBaseUrl,
            {
              collection: target.collection,
              recordId: target.recordId,
              price,
              // The format is checked when the first price is published; a draft may wait for it.
              ...(chosenFormat ? { itemType: chosenFormat } : {}),
              liveAmountWhenStaged: live ? priceAmount(live) : null,
              attempt: null,
            },
            current?.revision ?? null,
          ),
        );
      }
      setError(false);
      setMessage(initial && !chosenFormat ? 'Draft saved. Choose a format before publishing.' : '');
    } catch (caught) {
      setError(true);
      if (caught instanceof EditorialApiError && caught.status === 409) {
        const stored = await readPriceDraft(backendBaseUrl, target).catch(() => null);
        remember(stored);
        show(stored?.price ?? live);
        setMessage('A teammate changed this price draft. Their version is shown.');
      } else setMessage('The price draft was not saved. Check your connection and try again.');
    }
  }
  function persist(values: Values, format = itemType) {
    queuedSaves.current++;
    setSaving(true);
    const run = saveQueue.current.then(() => save(values, format));
    saveQueue.current = run
      .catch(() => {})
      .finally(() => {
        queuedSaves.current--;
        if (!queuedSaves.current) setSaving(false);
      });
    return run;
  }

  function edit(next: Partial<Values>) {
    const values = { amount, minimum, maximum, ...next };
    if (next.amount !== undefined) setAmount(next.amount);
    if (next.minimum !== undefined) setMinimum(next.minimum);
    if (next.maximum !== undefined) setMaximum(next.maximum);
    setMessage('');
    setError(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      void persist(values);
    }, 750);
  }

  async function undo() {
    clearTimeout(timer.current);
    timer.current = undefined;
    setBusy(true);
    try {
      await saveQueue.current;
      const current = draftRef.current;
      if (current) await clearPriceDraft(backendBaseUrl, current);
      remember(null);
      show(live);
      setMessage('');
      setError(false);
    } catch {
      setError(true);
      setMessage('The price draft could not be removed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resumeSetup() {
    if (!resume) return;
    setBusy(true);
    try {
      const result = await createInternalStockApi({ backendBaseUrl }).initializePrice(variantId, resume);
      setError(result.status === 'needs_review');
      setMessage(
        result.status === 'needs_review'
          ? `Ask a label administrator to review operation ${result.operationId}.`
          : result.status === 'completed'
            ? ''
            : 'The first price is still being set. Check again shortly.',
      );
      if (result.status === 'completed') await onRefresh();
    } catch {
      setError(true);
      setMessage('We could not confirm the price. Resume again, or refresh to check its status.');
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = 'grid gap-2 text-sm font-medium';
  const blockedNote = resume
    ? 'An earlier first price is unfinished. Resume it before changing the price.'
    : blocked
      ? attemptRetained
        ? `${blocked.reason} Publish changes checks and finishes it.`
        : `${blocked.reason} Ask a label administrator to review operation ${blocked.operationId ?? 'shown in history'}.`
      : null;
  return (
    <section aria-labelledby="item-price-heading" className="grid min-w-0 gap-4 border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="item-price-heading" className="text-lg font-semibold">
          Price
        </h2>
        {draft && (
          <Badge variant="outline" className="cms-state-warning border-current">
            Not live yet
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {blockedNote ??
          'Saved as a draft the whole team can see. Shoppers see it only after you publish changes. Existing orders keep the price they were paid at.'}
      </p>
      {editable && (
        <fieldset disabled={!loaded || busy || attemptRetained} className="grid min-w-0 gap-3">
          <legend className="sr-only">Selling price</legend>
          {initial && !initial.itemType && (
            <label className={fieldClass}>
              <span className="flex items-center gap-2">
                <Disc3 className="size-4 text-muted-foreground" aria-hidden="true" />
                Format
              </span>
              <select
                className="min-h-11 min-w-0 rounded border border-input bg-background px-3 focus-visible:ring-2"
                required
                value={itemType}
                onChange={(event) => {
                  setItemType(event.target.value);
                  if (amount) void persist({ amount, minimum, maximum }, event.target.value);
                }}
              >
                <option value="">Choose format</option>
                {DISTRO_GROUP_VALUES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
          {kind === 'pay_what_you_want' && (
            <label className={fieldClass}>
              <span className="flex items-center gap-2">
                <Euro className="size-4 text-muted-foreground" aria-hidden="true" />
                Minimum (EUR)
              </span>
              <Input
                inputMode="decimal"
                value={minimum}
                aria-describedby="price-feedback"
                onChange={(event) => isEuroDraft(event.target.value) && edit({ minimum: event.target.value })}
              />
            </label>
          )}
          <label className={fieldClass}>
            <span className="flex items-center gap-2">
              <Euro className="size-4 text-muted-foreground" aria-hidden="true" />
              {kind === 'pay_what_you_want' ? 'Suggested price (EUR)' : 'Price (EUR)'}
            </span>
            <Input
              inputMode="decimal"
              value={amount}
              aria-invalid={error || undefined}
              aria-describedby="price-feedback"
              className={draft ? 'border-[var(--warning)]' : undefined}
              onChange={(event) => isEuroDraft(event.target.value) && edit({ amount: event.target.value })}
              onBlur={() => {
                if (timer.current) {
                  clearTimeout(timer.current);
                  timer.current = undefined;
                  void persist({ amount, minimum, maximum });
                }
              }}
            />
          </label>
          {kind === 'pay_what_you_want' && (
            <label className={fieldClass}>
              <span className="flex items-center gap-2">
                <Euro className="size-4 text-muted-foreground" aria-hidden="true" />
                Maximum (EUR)
              </span>
              <Input
                inputMode="decimal"
                value={maximum}
                aria-describedby="price-feedback"
                onChange={(event) => isEuroDraft(event.target.value) && edit({ maximum: event.target.value })}
              />
            </label>
          )}
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {(live || editable) && (
          <p className="text-muted-foreground">
            Live now: <strong className="text-foreground">{live ? describePrice(live) : 'No price yet'}</strong>
          </p>
        )}
        {draft && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy || saving || attemptRetained}
            onClick={() => void undo()}
          >
            <Undo2 aria-hidden="true" />
            Undo price change
          </Button>
        )}
        {resume && (
          <Button type="button" disabled={busy} onClick={() => void resumeSetup()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            {busy ? 'Checking price…' : 'Resume'}
          </Button>
        )}
      </div>
      <p
        id="price-feedback"
        role={error ? 'alert' : 'status'}
        className={`min-h-5 break-words text-sm ${error ? 'cms-state-error' : 'text-muted-foreground'}`}
      >
        {message ||
          (saving
            ? 'Saving draft…'
            : attemptRetained
              ? 'A publish attempt for this price is being confirmed. Publish changes finishes it.'
              : draft
                ? 'Draft saved. Publish changes to make it live.'
                : '')}
      </p>
    </section>
  );
}
