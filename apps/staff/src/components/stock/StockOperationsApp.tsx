import { ArrowRight, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { LoadingButtonContent, LoadingInline, LoadingStateBlock } from '../ui/loading-feedback';
import { Textarea } from '../ui/textarea';
import {
  createInternalStockApi,
  InternalStockApiError,
  type InternalStockDetail,
  type InternalStockHistoryResponse,
  type InternalVariantSummary,
} from '../../lib/backend/internal-stock-api';
import { cn } from '../../lib/utils';
import ItemPriceEditor from './ItemPriceEditor';

interface StockOperationsAppProps {
  backendBaseUrl: string;
  showPrice?: boolean;
}

type HistoryEntry = InternalStockHistoryResponse['entries'][number];
export type StockLoadingIntent = 'refresh' | 'search' | 'variant' | 'workspace' | null;
type StockSubmittingIntent = 'stockChange' | 'stockCount' | null;

export default function StockOperationsApp({ backendBaseUrl, showPrice = false }: StockOperationsAppProps) {
  const [query, setQuery] = useState('');
  const [variants, setVariants] = useState<InternalVariantSummary[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [stockDetail, setStockDetail] = useState<InternalStockDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState<StockLoadingIntent>('workspace');
  const [submittingIntent, setSubmittingIntent] = useState<StockSubmittingIntent>(null);
  const [statusMessage, setStatusMessage] = useState('Loading stock workspace.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changeDelta, setChangeDelta] = useState('');
  const [stockDirection, setStockDirection] = useState('remove');
  const [changeReason, setChangeReason] = useState('manual_adjustment');
  const [changeNotes, setChangeNotes] = useState('');
  const [countedQuantity, setCountedQuantity] = useState('');
  const [onlineQuantity, setOnlineQuantity] = useState('');
  const [countNotes, setCountNotes] = useState('');
  const [expectedRevision, setExpectedRevision] = useState<number | null>(null);
  const [countNeedsReassessment, setCountNeedsReassessment] = useState(false);
  const [hasFreshStock, setHasFreshStock] = useState(false);
  const countVariantRef = useRef('');
  const activeStockLoadRequestRef = useRef(0);

  const api = createInternalStockApi({ backendBaseUrl });
  const canMutateSelectedStock = canSubmitStockMutation(selectedVariantId, stockDetail);
  const selectedStockDetail = canMutateSelectedStock ? stockDetail : null;

  async function searchVariants(nextQuery = query) {
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingIntent(nextQuery.trim() ? 'search' : 'workspace');
    setStatusMessage(nextQuery.trim() ? 'Searching items.' : 'Loading stock workspace.');

    try {
      const results = await api.searchVariants(nextQuery, 25);
      setVariants(results);
      setStatusMessage(results.length === 0 ? 'No items found.' : `${results.length} items found.`);
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
      setStatusMessage('Stock is not available. Try again.');
    } finally {
      setIsLoading(false);
      setLoadingIntent(null);
    }
  }

  async function loadVariant(
    variantId: string,
    shouldUpdateUrl = true,
    intent: Exclude<StockLoadingIntent, null> = 'variant',
  ) {
    if (!variantId) {
      return;
    }

    setSelectedVariantId(variantId);
    setHasFreshStock(false);
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingIntent(intent);
    setStatusMessage(intent === 'refresh' ? 'Refreshing stock.' : 'Loading selected stock.');
    const requestId = activeStockLoadRequestRef.current + 1;
    activeStockLoadRequestRef.current = requestId;

    try {
      const [detail, historyResponse] = await Promise.all([
        api.readStock(variantId),
        api.readStockHistory(variantId, 25),
      ]);

      if (!shouldApplyStockLoadResult(activeStockLoadRequestRef.current, requestId)) {
        return;
      }

      setStockDetail(detail);
      setHistory(historyResponse.entries);
      setHasFreshStock(true);
      if (countVariantRef.current !== variantId) {
        countVariantRef.current = variantId;
        setCountedQuantity(String(detail.stock.quantity));
        setOnlineQuantity(String(detail.stock.onlineQuantity));
        setCountNotes('');
        setExpectedRevision(detail.stock.revision);
        setCountNeedsReassessment(false);
      }
      setStatusMessage('Stock loaded.');

      if (shouldUpdateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('variantId', variantId);
        window.history.replaceState({}, '', url);
      }
    } catch (error) {
      if (shouldApplyStockLoadResult(activeStockLoadRequestRef.current, requestId)) {
        setErrorMessage(readErrorMessage(error));
        setStatusMessage(intent === 'refresh' ? 'Stock refresh failed.' : 'Item is not available. Try again.');
      }
    } finally {
      if (shouldApplyStockLoadResult(activeStockLoadRequestRef.current, requestId)) {
        setIsLoading(false);
        setLoadingIntent(null);
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get('variantId');

    void (async () => {
      await searchVariants('');

      if (variantId) {
        await loadVariant(variantId, false);
      }
    })();
  }, []);

  async function handleSearch(event: { preventDefault(): void }) {
    event.preventDefault();
    await searchVariants(query);
  }

  async function handleStockChange(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!canMutateSelectedStock) {
      return;
    }

    const variantId = selectedVariantId;
    setIsSubmitting(true);
    setSubmittingIntent('stockChange');
    setErrorMessage(null);
    setStatusMessage('Saving stock change.');

    try {
      await api.recordStockChange(variantId, {
        delta: Number(changeDelta) * (stockDirection === 'remove' ? -1 : 1),
        notes: normalizeNotes(changeNotes),
        reason: changeReason,
      });
      setChangeDelta('');
      setChangeNotes('');
      await loadVariant(variantId, false, 'refresh');
      setStatusMessage('Stock updated.');
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setSubmittingIntent(null);
    }
  }

  async function handleStockCount(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!canMutateSelectedStock || !hasFreshStock || isSubmitting || isLoading || countNeedsReassessment) {
      return;
    }

    const variantId = selectedVariantId;
    setIsSubmitting(true);
    setSubmittingIntent('stockCount');
    setErrorMessage(null);
    setStatusMessage('Saving count.');

    try {
      await api.recordStockCount(variantId, {
        expectedRevision,
        countedQuantity: Number(countedQuantity),
        notes: normalizeNotes(countNotes),
        onlineQuantity: Number(onlineQuantity),
      });
      setCountNotes('');
      countVariantRef.current = '';
      await loadVariant(variantId, false, 'refresh');
      setStatusMessage('Stock count saved.');
    } catch (error) {
      setCountNeedsReassessment(true);
      await loadVariant(variantId, false, 'refresh');
      if (error instanceof InternalStockApiError && error.status === 409) {
        setStatusMessage('Stock changed. Your count and notes are retained. Reassess before submitting again.');
      } else {
        setStatusMessage(
          'The count was not confirmed. Refresh stock and history before deciding whether to submit again.',
        );
      }
      setErrorMessage(readErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setSubmittingIntent(null);
    }
  }

  const isSearchPending = loadingIntent === 'search' || loadingIntent === 'workspace';
  const isStockRefreshPending = loadingIntent === 'refresh';
  const loadingLabel = readStockLoadingLabel(loadingIntent);

  return (
    <div className="min-h-screen bg-[#080808] text-foreground">
      <section className="relative overflow-hidden border-b border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(245,245,245,0.14),transparent_32%),linear-gradient(180deg,#111,#080808)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)] lg:items-end">
          <div className="grid gap-4">
            <Badge
              variant="outline"
              className="w-fit border-white/20 bg-white/5 font-mono uppercase tracking-[0.22em] text-white/75"
            >
              Protected Ops
            </Badge>
            <div className="grid gap-2">
              <h1 className="font-display text-5xl uppercase tracking-[0.08em] text-white sm:text-7xl">
                {showPrice ? 'Items' : 'Stock'}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                Find a record or other item to{' '}
                {showPrice ? 'change its price or update stock.' : 'update stock or record a new count.'}
              </p>
            </div>
          </div>
          <Card className="rounded-none border-white/15 bg-black/45">
            <CardContent className="grid gap-3 p-5">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <ShieldCheck className="size-4" />
                <span>Private label workspace</span>
              </div>
              <p className="font-mono text-xs text-white/45">
                Changes to price and stock apply immediately. Existing orders stay unchanged.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(19rem,0.45fr)_minmax(0,1fr)] lg:px-8">
        <aside className="grid content-start gap-5">
          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Find an item</CardTitle>
              <CardDescription>Search by item name.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <Input
                    aria-label="Search items"
                    className="rounded-none border-white/15 bg-black/40"
                    id="stock-variant-search"
                    name="q"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="barren, tape, distro..."
                    value={query}
                  />
                  <Button
                    aria-label={isSearchPending ? 'Searching items' : 'Search'}
                    aria-busy={isSearchPending ? 'true' : undefined}
                    className="min-w-11 rounded-none"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isSearchPending ? (
                      <LoadingButtonContent label={<span className="sr-only">Searching items</span>} />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="font-mono text-xs text-white/45" role="status" aria-live="polite">
                  {statusMessage}
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {variants.map((variant) => (
                <button
                  className={cn(
                    'group grid gap-2 border border-white/10 bg-black/30 p-3 text-left transition hover:border-white/30 hover:bg-white/5',
                    selectedVariantId === variant.variantId && 'border-white/45 bg-white/10',
                  )}
                  disabled={isSubmitting}
                  key={variant.variantId}
                  onClick={() => void loadVariant(variant.variantId)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm capitalize text-white/80">
                      {variant.displayName ?? variant.storeItemSlug.replaceAll('-', ' ')}
                    </span>
                    <ArrowRight className="size-4 text-white/35 transition group-hover:translate-x-1 group-hover:text-white/80" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {variant.sourceKind === 'release' ? 'Label release' : 'Distro'}
                  </span>
                </button>
              ))}
              {variants.length === 0 && isLoading ? (
                <LoadingInline className="font-mono text-xs text-white/55" label={loadingLabel} />
              ) : (
                variants.length === 0 && <p className="text-sm text-white/50">No items found. Try another name.</p>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="grid content-start gap-5">
          {showPrice && selectedVariantId && (
            <ItemPriceEditor key={selectedVariantId} variantId={selectedVariantId} backendBaseUrl={backendBaseUrl} />
          )}
          {errorMessage && (
            <div className="border border-white/25 bg-white/10 p-4 text-sm text-white" role="alert">
              {errorMessage}
            </div>
          )}

          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="grid gap-1">
                <CardTitle className="font-display text-4xl uppercase tracking-[0.06em]">Current Stock</CardTitle>
                <CardDescription>
                  {selectedStockDetail
                    ? (selectedStockDetail.displayName ?? selectedStockDetail.storeItemSlug.replaceAll('-', ' '))
                    : 'Choose an item to see its stock.'}
                </CardDescription>
              </div>
              <Button
                className="rounded-none"
                disabled={!selectedVariantId || isLoading}
                aria-busy={isStockRefreshPending ? 'true' : undefined}
                onClick={() => void loadVariant(selectedVariantId, false, 'refresh')}
                type="button"
                variant="outline"
              >
                {isStockRefreshPending ? (
                  <LoadingButtonContent label="Refreshing stock" />
                ) : (
                  <>
                    <RefreshCcw className="size-4" />
                    Refresh
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {isLoading && !selectedStockDetail ? (
                <LoadingStateBlock
                  className="min-h-40 border-white/10 bg-black/30"
                  title={loadingLabel}
                  description="Getting the latest stock count."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <StockMetric label="Physical stock" value={selectedStockDetail?.stock.quantity} />
                  <StockMetric label="Available online" value={selectedStockDetail?.stock.onlineQuantity} />
                  <StockMetric label="Updated" value={formatDate(selectedStockDetail?.stock.updatedAt)} isText />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-none border-white/15 bg-[#101010]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Add or remove stock</CardTitle>
                <CardDescription>
                  Remove stock after a sale or a gift. Add stock when new copies arrive.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3"
                  onSubmit={handleStockChange}
                  aria-busy={submittingIntent === 'stockChange' ? 'true' : undefined}
                >
                  <label htmlFor="stock-change-direction">What changed?</label>
                  <select
                    id="stock-change-direction"
                    className="min-h-11 border border-border bg-background p-2"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    value={stockDirection}
                    onChange={(event) => setStockDirection(event.target.value)}
                  >
                    <option value="remove">Remove stock</option>
                    <option value="add">Add stock</option>
                  </select>
                  <label htmlFor="stock-change-delta">How many?</label>
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    id="stock-change-delta"
                    name="delta"
                    onChange={(event) => setChangeDelta(event.target.value)}
                    placeholder="For example, 2"
                    min="1"
                    step="1"
                    required
                    type="number"
                    value={changeDelta}
                  />
                  <label htmlFor="stock-change-reason">Reason</label>
                  <select
                    className="min-h-11 rounded-none border border-white/15 bg-black/40 p-2"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    id="stock-change-reason"
                    name="reason"
                    onChange={(event) => setChangeReason(event.target.value)}
                    required
                    value={changeReason}
                  >
                    <option value="manual_adjustment">Other stock change</option>
                    <option value="show_sale">Sold at a show</option>
                    <option value="delivery">New delivery</option>
                    <option value="gift">Gift or promo copy</option>
                  </select>
                  <label htmlFor="stock-change-notes">Notes (optional)</label>
                  <Textarea
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    id="stock-change-notes"
                    name="notes"
                    onChange={(event) => setChangeNotes(event.target.value)}
                    placeholder="Notes"
                    value={changeNotes}
                  />
                  <Button className="rounded-none" disabled={!canMutateSelectedStock || isSubmitting} type="submit">
                    {submittingIntent === 'stockChange' ? (
                      <LoadingButtonContent label="Saving stock change" />
                    ) : (
                      'Save stock change'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-none border-white/15 bg-[#101010]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Count stock</CardTitle>
                <CardDescription>Enter how many you have counted, then how many may be sold online.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3"
                  onSubmit={handleStockCount}
                  aria-busy={submittingIntent === 'stockCount' ? 'true' : undefined}
                >
                  <label htmlFor="stock-count-counted-quantity">Physical stock counted</label>
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    id="stock-count-counted-quantity"
                    min="0"
                    name="countedQuantity"
                    onChange={(event) => setCountedQuantity(event.target.value)}
                    placeholder="Counted Stock"
                    required
                    type="number"
                    value={countedQuantity}
                  />
                  <label htmlFor="stock-count-online-quantity">Available online</label>
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    id="stock-count-online-quantity"
                    min="0"
                    name="onlineQuantity"
                    onChange={(event) => setOnlineQuantity(event.target.value)}
                    placeholder="OnlineStock"
                    required
                    type="number"
                    value={onlineQuantity}
                  />
                  <label htmlFor="stock-count-notes">Notes (optional)</label>
                  <Textarea
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!canMutateSelectedStock || isSubmitting}
                    id="stock-count-notes"
                    name="notes"
                    onChange={(event) => setCountNotes(event.target.value)}
                    placeholder="Notes"
                    value={countNotes}
                  />
                  {countNeedsReassessment && (
                    <Button
                      className="rounded-none"
                      disabled={!canMutateSelectedStock || !hasFreshStock || isLoading || isSubmitting}
                      onClick={() => {
                        if (!selectedStockDetail || !hasFreshStock) return;
                        setExpectedRevision(selectedStockDetail.stock.revision);
                        setCountNeedsReassessment(false);
                        setStatusMessage('Count reassessed against the displayed stock. Review and save when ready.');
                      }}
                      type="button"
                      variant="outline"
                    >
                      I have reassessed this count
                    </Button>
                  )}
                  <Button
                    className="rounded-none"
                    disabled={
                      !canMutateSelectedStock || !hasFreshStock || isSubmitting || isLoading || countNeedsReassessment
                    }
                    type="submit"
                  >
                    {submittingIntent === 'stockCount' ? <LoadingButtonContent label="Saving count" /> : 'Save count'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Recent History</CardTitle>
              <CardDescription>Previous stock changes and counts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {history.map((entry) => (
                <HistoryRow entry={entry} key={`${entry.type}-${entry.id}`} />
              ))}
              {history.length === 0 && <p className="text-sm text-white/50">No recent history loaded.</p>}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export function readStockLoadingLabel(intent: StockLoadingIntent) {
  if (intent === 'refresh') return 'Refreshing stock';
  if (intent === 'search') return 'Searching items';
  if (intent === 'variant') return 'Loading selected stock';
  return 'Loading stock workspace';
}

export function shouldApplyStockLoadResult(activeRequestId: number, requestId: number) {
  return activeRequestId === requestId;
}

export function canSubmitStockMutation(
  selectedVariantId: string,
  stockDetail: Pick<InternalStockDetail, 'variantId'> | null,
) {
  return Boolean(selectedVariantId && stockDetail?.variantId === selectedVariantId);
}

function StockMetric({
  isText = false,
  label,
  value,
}: {
  isText?: boolean;
  label: string;
  value?: number | string | null | undefined;
}) {
  return (
    <div className="border border-white/10 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className={cn('mt-3 font-display uppercase tracking-[0.06em] text-white', isText ? 'text-2xl' : 'text-5xl')}>
        {value ?? '-'}
      </p>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const quantityLabel =
    entry.type === 'change'
      ? `${entry.quantityDelta > 0 ? '+' : ''}${entry.quantityDelta}`
      : `count ${entry.countedQuantity}`;

  return (
    <article className="grid gap-2 border border-white/10 bg-black/25 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
      <Badge variant="outline" className="w-fit border-white/15 font-mono uppercase tracking-[0.16em]">
        {entry.type === 'change' ? 'Stock change' : 'Stock count'}
      </Badge>
      <div className="grid gap-1">
        <p className="font-mono text-xs text-white/75">{quantityLabel}</p>
        <p className="text-xs text-white/45">
          {entry.actorEmail} / {formatDate(entry.recordedAt)}
        </p>
        {entry.notes && <p className="text-sm text-white/60">{entry.notes}</p>}
      </div>
      {'onlineQuantity' in entry && (
        <p className="font-mono text-xs text-white/50">Available online: {entry.onlineQuantity}</p>
      )}
    </article>
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function normalizeNotes(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown stock operation error.';
}
