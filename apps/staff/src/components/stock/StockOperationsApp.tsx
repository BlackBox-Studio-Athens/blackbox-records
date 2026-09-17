import { ArrowDownUp, ArrowRight, ClipboardCheck, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
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
import ItemPublication from './ItemPublication';

interface StockOperationsAppProps {
  backendBaseUrl: string;
  mode?: 'items' | 'stock';
}

type HistoryEntry = InternalStockHistoryResponse['entries'][number];
export type StockLoadingIntent = 'refresh' | 'search' | 'variant' | 'workspace' | null;
type StockSubmittingIntent = 'stockChange' | 'stockCount' | null;

export default function StockOperationsApp({ backendBaseUrl, mode = 'stock' }: StockOperationsAppProps) {
  const isItemsWorkspace = mode === 'items';
  const [query, setQuery] = useState('');
  const [variants, setVariants] = useState<InternalVariantSummary[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [stockDetail, setStockDetail] = useState<InternalStockDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(true);
  const [searchMessage, setSearchMessage] = useState('Loading items.');
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequest = useRef(0);
  const [historyPending, setHistoryPending] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState<StockLoadingIntent>('workspace');
  const [submittingIntent, setSubmittingIntent] = useState<StockSubmittingIntent>(null);
  const [statusMessage, setStatusMessage] = useState('Choose an item to see its stock.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changeDelta, setChangeDelta] = useState('');
  const [stockDirection, setStockDirection] = useState('remove');
  const [stockMode, setStockMode] = useState<'adjust' | 'count'>('adjust');
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
  const selectedStockDetail = canSubmitStockMutation(selectedVariantId, stockDetail) ? stockDetail : null;
  const canMutateSelectedStock = !!selectedStockDetail && hasFreshStock && !isLoading;
  const adjustmentQuantity =
    selectedStockDetail && /^\d+$/.test(changeDelta)
      ? selectedStockDetail.stock.quantity + Number(changeDelta) * (stockDirection === 'remove' ? -1 : 1)
      : null;
  const adjustmentInvalid = adjustmentQuantity !== null && adjustmentQuantity < 0;

  async function searchVariants(nextQuery = query) {
    const requestId = ++searchRequest.current;
    setSearchError(null);
    setIsSearchPending(true);
    setSearchMessage('Searching items.');

    try {
      const results = await api.searchVariants(nextQuery, 25);
      if (requestId !== searchRequest.current) return;
      setVariants(results);
      setSearchMessage(results.length === 0 ? 'No items found.' : `${results.length} items found.`);
    } catch (error) {
      if (requestId !== searchRequest.current) return;
      setSearchError(readErrorMessage(error));
      setSearchMessage('Search is unavailable. Try again.');
    } finally {
      if (requestId === searchRequest.current) setIsSearchPending(false);
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
    setHistory([]);
    setHistoryError(null);
    setHistoryPending(!isItemsWorkspace);
    if (!isItemsWorkspace) {
      void api
        .readStockHistory(variantId, 25)
        .then((result) => {
          if (requestId === activeStockLoadRequestRef.current) setHistory(result.entries);
        })
        .catch((error) => {
          if (requestId === activeStockLoadRequestRef.current) setHistoryError(readErrorMessage(error));
        })
        .finally(() => {
          if (requestId === activeStockLoadRequestRef.current) setHistoryPending(false);
        });
    }

    try {
      const detail = await api.readStock(variantId);

      if (!shouldApplyStockLoadResult(activeStockLoadRequestRef.current, requestId)) {
        return;
      }

      setStockDetail(detail);
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

    void searchVariants('');
    if (variantId) void loadVariant(variantId, false);
    return () => {
      searchRequest.current++;
      activeStockLoadRequestRef.current++;
    };
  }, []);

  async function handleSearch(event: { preventDefault(): void }) {
    event.preventDefault();
    await searchVariants(query);
  }

  async function handleStockChange(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!canMutateSelectedStock || isSubmitting) {
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

  const isStockRefreshPending = loadingIntent === 'refresh';
  const loadingLabel = readStockLoadingLabel(loadingIntent);

  return (
    <div className="staff-workspace staff-stock-workspace min-h-screen">
      <section className="staff-workspace-hero">
        <div className="staff-workspace-hero__inner">
          <div className="grid gap-3">
            <Badge variant="outline" className="w-fit">
              <ShieldCheck aria-hidden="true" />
              Protected operations
            </Badge>
            <div className="grid gap-2">
              <h1>{isItemsWorkspace ? 'Items' : 'Stock'}</h1>
              <p>
                {isItemsWorkspace
                  ? 'Prepare catalog items, set prices, and publish them when ready.'
                  : 'Keep physical and online stock aligned.'}
              </p>
            </div>
          </div>
          <div className="staff-workspace-meta">
            <ShieldCheck aria-hidden="true" />
            <span>Changes apply immediately. Existing orders stay unchanged.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(19rem,0.45fr)_minmax(0,1fr)] lg:px-8">
        <aside className="grid content-start gap-5">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Find an item</CardTitle>
              <CardDescription>Search by item name.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <Input
                    aria-label="Search items"
                    className="border-input bg-background"
                    id="stock-variant-search"
                    name="q"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="barren, tape, distro..."
                    value={query}
                  />
                  <Button
                    aria-label={isSearchPending ? 'Searching items' : 'Search'}
                    aria-busy={isSearchPending ? 'true' : undefined}
                    className="min-w-11"
                    disabled={isSearchPending}
                    type="submit"
                  >
                    {isSearchPending ? (
                      <LoadingButtonContent label={<span className="sr-only">Searching items</span>} />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                  {searchMessage}
                </p>
                {searchError && (
                  <p role="alert" className="text-sm text-red-400">
                    {searchError}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{isItemsWorkspace ? 'Items' : 'Inventory'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {variants.map((variant) => (
                <button
                  className={cn(
                    'group grid gap-2 rounded-md border border-border bg-background p-3 text-left transition hover:border-ring hover:bg-accent',
                    selectedVariantId === variant.variantId && 'border-ring bg-accent',
                  )}
                  disabled={isSubmitting}
                  key={variant.variantId}
                  onClick={() => void loadVariant(variant.variantId)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm capitalize text-foreground">
                      {variant.displayName ?? variant.storeItemSlug.replaceAll('-', ' ')}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {variant.sourceKind === 'release' ? 'Label release' : 'Distro'}
                  </span>
                </button>
              ))}
              {variants.length === 0 && isSearchPending ? (
                <LoadingInline className="text-xs text-muted-foreground" label="Loading items" />
              ) : (
                variants.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items found. Try another name.</p>
                )
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="grid content-start gap-5">
          <p role="status" className="text-sm text-muted-foreground">
            {statusMessage}
          </p>
          {isItemsWorkspace && selectedVariantId && (
            <ItemPriceEditor key={selectedVariantId} variantId={selectedVariantId} backendBaseUrl={backendBaseUrl} />
          )}
          {isItemsWorkspace && selectedVariantId && (
            <ItemPublication
              key={`publication-${selectedVariantId}`}
              variantId={selectedVariantId}
              backendBaseUrl={backendBaseUrl}
            />
          )}
          {errorMessage && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-foreground"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <Card className="border-border bg-card">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="grid gap-1">
                <CardTitle>Current stock</CardTitle>
                <CardDescription>
                  {selectedStockDetail
                    ? (selectedStockDetail.displayName ?? selectedStockDetail.storeItemSlug.replaceAll('-', ' '))
                    : 'Choose an item to see its stock.'}
                </CardDescription>
              </div>
              <Button
                disabled={!selectedVariantId || isLoading || isSubmitting}
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
              {isItemsWorkspace && selectedVariantId && (
                <Button asChild type="button" variant="outline">
                  <a href={`/stock/?variantId=${encodeURIComponent(selectedVariantId)}`}>Manage stock</a>
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4">
              {isLoading && !selectedStockDetail ? (
                <LoadingStateBlock
                  className="min-h-40 border-border bg-background"
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

          {!isItemsWorkspace && (
            <div className="grid gap-5">
              <ButtonGroup aria-label="Stock operation mode" className="w-full sm:w-fit">
                <Button
                  type="button"
                  variant={stockMode === 'adjust' ? 'secondary' : 'outline'}
                  aria-pressed={stockMode === 'adjust'}
                  onClick={() => setStockMode('adjust')}
                >
                  <ArrowDownUp aria-hidden="true" />
                  Adjust stock
                </Button>
                <Button
                  type="button"
                  variant={stockMode === 'count' ? 'secondary' : 'outline'}
                  aria-pressed={stockMode === 'count'}
                  onClick={() => setStockMode('count')}
                >
                  <ClipboardCheck aria-hidden="true" />
                  Count stock
                </Button>
              </ButtonGroup>
              <div className="grid gap-5 xl:grid-cols-2">
                <div hidden={stockMode !== 'adjust'}>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Add or remove stock</CardTitle>
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
                          className="border-input bg-background"
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
                          className="min-h-11 border border-input bg-background p-2"
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
                          className="border-input bg-background"
                          disabled={!canMutateSelectedStock || isSubmitting}
                          id="stock-change-notes"
                          name="notes"
                          onChange={(event) => setChangeNotes(event.target.value)}
                          placeholder="Notes"
                          value={changeNotes}
                        />
                        <div
                          className="staff-operation-preview"
                          data-invalid={adjustmentInvalid ? 'true' : undefined}
                          aria-live="polite"
                        >
                          <span>After this change</span>
                          <strong>
                            {adjustmentInvalid ? 'Cannot go below zero' : (adjustmentQuantity ?? 'Enter a quantity')}
                          </strong>
                        </div>
                        <Button disabled={!canMutateSelectedStock || isSubmitting || adjustmentInvalid} type="submit">
                          {submittingIntent === 'stockChange' ? (
                            <LoadingButtonContent label="Saving stock change" />
                          ) : (
                            'Save stock change'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div hidden={stockMode !== 'count'}>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Count stock</CardTitle>
                      <CardDescription>
                        Enter how many you have counted, then how many may be sold online.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        className="grid gap-3"
                        onSubmit={handleStockCount}
                        aria-busy={submittingIntent === 'stockCount' ? 'true' : undefined}
                      >
                        <label htmlFor="stock-count-counted-quantity">Physical stock counted</label>
                        <Input
                          className="border-input bg-background"
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
                          className="border-input bg-background"
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
                          className="border-input bg-background"
                          disabled={!canMutateSelectedStock || isSubmitting}
                          id="stock-count-notes"
                          name="notes"
                          onChange={(event) => setCountNotes(event.target.value)}
                          placeholder="Notes"
                          value={countNotes}
                        />
                        {countNeedsReassessment && (
                          <Button
                            disabled={!canMutateSelectedStock || !hasFreshStock || isLoading || isSubmitting}
                            onClick={() => {
                              if (!selectedStockDetail || !hasFreshStock) return;
                              setExpectedRevision(selectedStockDetail.stock.revision);
                              setCountNeedsReassessment(false);
                              setStatusMessage(
                                'Count reassessed against the displayed stock. Review and save when ready.',
                              );
                            }}
                            type="button"
                            variant="outline"
                          >
                            I have reassessed this count
                          </Button>
                        )}
                        <Button
                          disabled={
                            !canMutateSelectedStock ||
                            !hasFreshStock ||
                            isSubmitting ||
                            isLoading ||
                            countNeedsReassessment
                          }
                          type="submit"
                        >
                          {submittingIntent === 'stockCount' ? (
                            <LoadingButtonContent label="Saving count" />
                          ) : (
                            'Save count'
                          )}
                        </Button>
                        <div className="staff-operation-preview" aria-live="polite">
                          <span>Count to save</span>
                          <strong>
                            {countedQuantity && onlineQuantity
                              ? `${countedQuantity} physical · ${onlineQuantity} online`
                              : 'Enter both quantities'}
                          </strong>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {!isItemsWorkspace && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Recent history</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {historyPending && <LoadingInline label="Loading stock history" />}
                {historyError && (
                  <p role="alert" className="text-sm text-destructive">
                    History could not load. Use Refresh to try again. {historyError}
                  </p>
                )}
                {history.map((entry) => (
                  <HistoryRow entry={entry} key={`${entry.type}-${entry.id}`} />
                ))}
                {!historyPending && !historyError && history.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent history loaded.</p>
                )}
              </CardContent>
            </Card>
          )}
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
    <div className="staff-stock-metric border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn('mt-3 font-mono font-semibold tabular-nums text-foreground', isText ? 'text-base' : 'text-3xl')}>
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
    <article className="staff-history-row grid gap-2 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
      <Badge variant="outline" className="w-fit font-mono uppercase tracking-[0.12em]">
        {entry.type === 'change' ? 'Stock change' : 'Stock count'}
      </Badge>
      <div className="grid gap-1">
        <p className="font-mono text-xs text-foreground">{quantityLabel}</p>
        <p className="text-xs text-muted-foreground">
          {entry.actorEmail} / {formatDate(entry.recordedAt)}
        </p>
        {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
      </div>
      {'onlineQuantity' in entry && (
        <p className="font-mono text-xs text-muted-foreground">Available online: {entry.onlineQuantity}</p>
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
