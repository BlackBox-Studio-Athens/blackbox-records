import { ArrowRight, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createInternalStockApi,
  type InternalStockDetail,
  type InternalStockHistoryResponse,
  type InternalVariantSummary,
} from '@/lib/backend/internal-stock-api';
import { cn } from '@/lib/utils';

interface StockOperationsAppProps {
  backendBaseUrl: string;
}

type HistoryEntry = InternalStockHistoryResponse['entries'][number];

export default function StockOperationsApp({ backendBaseUrl }: StockOperationsAppProps) {
  const [query, setQuery] = useState('');
  const [variants, setVariants] = useState<InternalVariantSummary[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [stockDetail, setStockDetail] = useState<InternalStockDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading stock workspace.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changeDelta, setChangeDelta] = useState('');
  const [changeReason, setChangeReason] = useState('manual_adjustment');
  const [changeNotes, setChangeNotes] = useState('');
  const [countedQuantity, setCountedQuantity] = useState('');
  const [onlineQuantity, setOnlineQuantity] = useState('');
  const [countNotes, setCountNotes] = useState('');

  const api = createInternalStockApi({ backendBaseUrl });

  async function searchVariants(nextQuery = query) {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const results = await api.searchVariants(nextQuery, 25);
      setVariants(results);
      setStatusMessage(results.length === 0 ? 'No variants found.' : `${results.length} variants ready.`);
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
      setStatusMessage('Stock API unavailable.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadVariant(variantId: string, shouldUpdateUrl = true) {
    if (!variantId) {
      return;
    }

    setSelectedVariantId(variantId);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const [detail, historyResponse] = await Promise.all([api.readStock(variantId), api.readStockHistory(variantId, 25)]);
      setStockDetail(detail);
      setHistory(historyResponse.entries);
      setCountedQuantity(String(detail.stock.quantity));
      setOnlineQuantity(String(detail.stock.onlineQuantity));
      setStatusMessage(`Loaded ${variantId}.`);

      if (shouldUpdateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('variantId', variantId);
        window.history.replaceState({}, '', url);
      }
    } catch (error) {
      setStockDetail(null);
      setHistory([]);
      setErrorMessage(readErrorMessage(error));
      setStatusMessage('Variant detail unavailable.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get('variantId');

    void searchVariants('');

    if (variantId) {
      void loadVariant(variantId, false);
    }
  }, []);

  async function handleSearch(event: { preventDefault(): void }) {
    event.preventDefault();
    await searchVariants(query);
  }

  async function handleStockChange(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!selectedVariantId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.recordStockChange(selectedVariantId, {
        delta: Number(changeDelta),
        notes: normalizeNotes(changeNotes),
        reason: changeReason,
      });
      setChangeDelta('');
      setChangeNotes('');
      await loadVariant(selectedVariantId, false);
      setStatusMessage('StockChange recorded.');
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStockCount(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!selectedVariantId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.recordStockCount(selectedVariantId, {
        countedQuantity: Number(countedQuantity),
        notes: normalizeNotes(countNotes),
        onlineQuantity: Number(onlineQuantity),
      });
      setCountNotes('');
      await loadVariant(selectedVariantId, false);
      setStatusMessage('StockCount recorded.');
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-foreground">
      <section className="relative overflow-hidden border-b border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(245,245,245,0.14),transparent_32%),linear-gradient(180deg,#111,#080808)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)] lg:items-end">
          <div className="grid gap-4">
            <Badge variant="outline" className="w-fit border-white/20 bg-white/5 font-mono uppercase tracking-[0.22em] text-white/75">
              Protected Ops
            </Badge>
            <div className="grid gap-2">
              <h1 className="font-display text-5xl uppercase tracking-[0.08em] text-white sm:text-7xl">Stock Control</h1>
              <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                Search a Variant, review Stock and OnlineStock, then record a StockChange or StockCount through the protected backend API.
              </p>
            </div>
          </div>
          <Card className="rounded-none border-white/15 bg-black/45">
            <CardContent className="grid gap-3 p-5">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <ShieldCheck className="size-4" />
                <span>Identity is enforced by Cloudflare Access at the API boundary.</span>
              </div>
              <p className="font-mono text-xs text-white/45">
                {backendBaseUrl ? `API: ${backendBaseUrl}` : 'API: same-origin /api/internal'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(19rem,0.45fr)_minmax(0,1fr)] lg:px-8">
        <aside className="grid content-start gap-5">
          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Find Variant</CardTitle>
              <CardDescription>Search by Variant, store item slug, source id, or source kind.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <Input
                    aria-label="Search variants"
                    className="rounded-none border-white/15 bg-black/40"
                    id="stock-variant-search"
                    name="q"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="barren, tape, distro..."
                    value={query}
                  />
                  <Button aria-label="Search" className="rounded-none" disabled={isLoading} type="submit">
                    <Search className="size-4" />
                  </Button>
                </div>
                <p className="font-mono text-xs text-white/45">{statusMessage}</p>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Variants</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {variants.map((variant) => (
                <button
                  className={cn(
                    'group grid gap-2 border border-white/10 bg-black/30 p-3 text-left transition hover:border-white/30 hover:bg-white/5',
                    selectedVariantId === variant.variantId && 'border-white/45 bg-white/10',
                  )}
                  key={variant.variantId}
                  onClick={() => void loadVariant(variant.variantId)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-white/80">{variant.variantId}</span>
                    <ArrowRight className="size-4 text-white/35 transition group-hover:translate-x-1 group-hover:text-white/80" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {variant.sourceKind} / {variant.storeItemSlug}
                  </span>
                </button>
              ))}
              {variants.length === 0 && <p className="text-sm text-white/50">No variants loaded yet.</p>}
            </CardContent>
          </Card>
        </aside>

        <main className="grid content-start gap-5">
          {errorMessage && (
            <div className="border border-white/25 bg-white/10 p-4 text-sm text-white" role="alert">
              {errorMessage}
            </div>
          )}

          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="grid gap-1">
                <CardTitle className="font-display text-4xl uppercase tracking-[0.06em]">Current Stock</CardTitle>
                <CardDescription>{stockDetail ? stockDetail.variantId : 'Select a Variant to inspect stock.'}</CardDescription>
              </div>
              <Button
                className="rounded-none"
                disabled={!selectedVariantId || isLoading}
                onClick={() => void loadVariant(selectedVariantId, false)}
                type="button"
                variant="outline"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StockMetric label="Stock" value={stockDetail?.stock.quantity} />
                <StockMetric label="OnlineStock" value={stockDetail?.stock.onlineQuantity} />
                <StockMetric label="Updated" value={formatDate(stockDetail?.stock.updatedAt)} isText />
              </div>
              {stockDetail && (
                <div className="grid gap-2 border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/55">
                  <span>storeItemSlug: {stockDetail.storeItemSlug}</span>
                  <span>source: {stockDetail.sourceKind}/{stockDetail.sourceId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-none border-white/15 bg-[#101010]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Record StockChange</CardTitle>
                <CardDescription>Use signed movement: negative for outgoing, positive for incoming.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={handleStockChange}>
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!selectedVariantId || isSubmitting}
                    id="stock-change-delta"
                    name="delta"
                    onChange={(event) => setChangeDelta(event.target.value)}
                    placeholder="Delta, e.g. -1"
                    required
                    type="number"
                    value={changeDelta}
                  />
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!selectedVariantId || isSubmitting}
                    id="stock-change-reason"
                    name="reason"
                    onChange={(event) => setChangeReason(event.target.value)}
                    placeholder="Reason"
                    required
                    value={changeReason}
                  />
                  <Textarea
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!selectedVariantId || isSubmitting}
                    id="stock-change-notes"
                    name="notes"
                    onChange={(event) => setChangeNotes(event.target.value)}
                    placeholder="Notes"
                    value={changeNotes}
                  />
                  <Button className="rounded-none" disabled={!selectedVariantId || isSubmitting} type="submit">
                    Save StockChange
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-none border-white/15 bg-[#101010]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Record StockCount</CardTitle>
                <CardDescription>Reset the physical count and choose the safe online quantity.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={handleStockCount}>
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!selectedVariantId || isSubmitting}
                    id="stock-count-counted-quantity"
                    min="0"
                    name="countedQuantity"
                    onChange={(event) => setCountedQuantity(event.target.value)}
                    placeholder="Counted Stock"
                    required
                    type="number"
                    value={countedQuantity}
                  />
                  <Input
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!selectedVariantId || isSubmitting}
                    id="stock-count-online-quantity"
                    min="0"
                    name="onlineQuantity"
                    onChange={(event) => setOnlineQuantity(event.target.value)}
                    placeholder="OnlineStock"
                    required
                    type="number"
                    value={onlineQuantity}
                  />
                  <Textarea
                    className="rounded-none border-white/15 bg-black/40"
                    disabled={!selectedVariantId || isSubmitting}
                    id="stock-count-notes"
                    name="notes"
                    onChange={(event) => setCountNotes(event.target.value)}
                    placeholder="Notes"
                    value={countNotes}
                  />
                  <Button className="rounded-none" disabled={!selectedVariantId || isSubmitting} type="submit">
                    Save StockCount
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-none border-white/15 bg-[#101010]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.06em]">Recent History</CardTitle>
              <CardDescription>Immutable StockChange and StockCount entries from the protected API.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {history.map((entry) => (
                <HistoryRow entry={entry} key={`${entry.type}-${entry.id}`} />
              ))}
              {history.length === 0 && <p className="text-sm text-white/50">No recent history loaded.</p>}
            </CardContent>
          </Card>
        </main>
      </section>
    </div>
  );
}

function StockMetric({ isText = false, label, value }: { isText?: boolean; label: string; value?: number | string | null | undefined }) {
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
  const quantityLabel = entry.type === 'change' ? `${entry.quantityDelta > 0 ? '+' : ''}${entry.quantityDelta}` : `count ${entry.countedQuantity}`;

  return (
    <article className="grid gap-2 border border-white/10 bg-black/25 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
      <Badge variant="outline" className="w-fit border-white/15 font-mono uppercase tracking-[0.16em]">
        {entry.type === 'change' ? 'StockChange' : 'StockCount'}
      </Badge>
      <div className="grid gap-1">
        <p className="font-mono text-xs text-white/75">{quantityLabel}</p>
        <p className="text-xs text-white/45">
          {entry.actorEmail} / {formatDate(entry.recordedAt)}
        </p>
        {entry.notes && <p className="text-sm text-white/60">{entry.notes}</p>}
      </div>
      {'onlineQuantity' in entry && <p className="font-mono text-xs text-white/50">OnlineStock {entry.onlineQuantity}</p>}
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
