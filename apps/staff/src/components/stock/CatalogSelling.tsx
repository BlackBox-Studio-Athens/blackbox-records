import { useCallback, useEffect, useRef, useState } from 'react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../../lib/backend/editorial-api';
import {
  createInternalStockApi,
  type CatalogSellingDetail,
  type InternalStockDetail,
} from '../../lib/backend/internal-stock-api';
import {
  describePrice,
  draftLookup,
  formatEuro,
  readItemPublication,
  startItemPublication,
  type DraftLookup,
  type ItemCommerce,
  type ItemPublicationStatus,
  type PriceDraft,
  type ShopStatus,
} from '../../lib/item-commerce';
import { usePublicationPolling } from '../publication/PublicationStatus';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import ItemPriceEditor from './ItemPriceEditor';
import StockOperationsApp from './StockOperationsApp';

export default function CatalogSelling({
  item,
  base,
  onSummary,
  onDetails,
  onLeaveGuard,
  onCommerce,
}: {
  item: EditorialRecord;
  base: string;
  onSummary(item: EditorialRecord): void;
  onDetails(): void;
  onLeaveGuard(guard: (() => boolean) | null): void;
  /** Unavailable selling state lets publishing fall back to website-only publication. */
  onCommerce(commerce: ItemCommerce): void;
}) {
  const priceGuard = useRef<(() => boolean) | null>(null);
  const stockGuard = useRef<(() => boolean) | null>(null);
  const registerPrice = useCallback((guard: (() => boolean) | null) => {
    priceGuard.current = guard;
  }, []);
  const registerStock = useCallback((guard: (() => boolean) | null) => {
    stockGuard.current = guard;
  }, []);
  useEffect(() => {
    onLeaveGuard(() => (stockGuard.current?.() ?? true) && (priceGuard.current?.() ?? true));
    return () => onLeaveGuard(null);
  }, [onLeaveGuard]);
  const [selected, setSelected] = useState<EditorialRecord | null>(null);
  const [readiness, setReadiness] = useState<CatalogSellingDetail | null>(null);
  const [stockDetail, setStockDetail] = useState<InternalStockDetail | null>(null);
  const [priceDraft, setPriceDraft] = useState<PriceDraft | null>(item.priceDraft ?? null);
  const [storedDraft, setStoredDraft] = useState<DraftLookup>({ status: 'unknown' });
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState('Loading selling details…');
  const [generation, setGeneration] = useState(0);
  const sequence = useRef(0);
  async function load() {
    const request = ++sequence.current;
    setReadiness(null);
    setLoadFailed(false);
    setMessage('Loading selling details…');
    try {
      const page = await editorialRequest<EditorialList<EditorialRecord>>(
        base,
        `blackbox/workspace?${new URLSearchParams({ collection: item.collection ?? 'releases', id: item.id })}`,
      );
      const fresh = page.items.find((record) => record.id === item.id);
      if (!fresh) throw new Error('Item is unavailable.');
      if (request !== sequence.current) return;
      setSelected(fresh);
      setPriceDraft(fresh.priceDraft ?? null);
      setStoredDraft(draftLookup(fresh));
      onSummary(fresh);
      if (fresh.selling) {
        const next = await createInternalStockApi({ backendBaseUrl: base }).readSelling(fresh.selling.variantId);
        if (request !== sequence.current) return;
        setReadiness(next);
      }
      setGeneration((value) => value + 1);
      setMessage('');
    } catch {
      if (request !== sequence.current) return;
      setLoadFailed(true);
      setMessage('Selling details could not be refreshed. Select Refresh to try again.');
    }
  }
  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, [base, item.id]);
  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('staff:item-published', refresh);
    return () => window.removeEventListener('staff:item-published', refresh);
  }, [base, item.id]);
  const selling = selected?.selling;
  const livePrice = readiness?.state === 'ready' ? readiness.detail.price : null;
  const listedAmount = selling?.amountMinor;
  const availability = selling?.catalogAvailability;
  const shop: ShopStatus =
    availability === 'published'
      ? 'on_sale'
      : availability === 'withheld' && (livePrice || priceDraft)
        ? 'ready_to_sell'
        : 'not_ready';
  useEffect(() => {
    if (loadFailed) return onCommerce({ status: 'unavailable' });
    if (!selling || !readiness) return onCommerce({ status: 'loading' });
    onCommerce({
      status: 'ready',
      state: {
        variantId: selling.variantId,
        shop,
        requiresLiveConfirmation:
          readiness.state === 'ready'
            ? readiness.detail.requiresLiveConfirmation
            : readiness.state === 'setup_required'
              ? readiness.requiresLiveConfirmation
              : false,
        livePrice,
        priceDraft,
      },
    });
  }, [loadFailed, selling, readiness, priceDraft, shop, livePrice, onCommerce]);

  if (message && !selected)
    return (
      <div className="grid gap-4 p-6">
        <p role="status">{message}</p>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
    );
  if (!selling)
    return (
      <div className="p-6">
        <p>This title has no shop listing yet.</p>
        <a
          className="inline-flex min-h-11 items-center underline"
          href={`/items/new/?${new URLSearchParams({ collection: selected?.collection ?? 'releases', id: item.id })}`}
        >
          Set up selling
        </a>
      </div>
    );
  const collection = (selected?.collection ?? item.collection) === 'distro' ? 'distro' : 'releases';
  return (
    <section aria-label="Price and stock" tabIndex={-1} className="catalog-commerce grid min-w-0 gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-border bg-card px-4 py-3 text-sm">
        <Badge
          variant="outline"
          className={availability === 'published' ? 'cms-state-success border-current' : 'border-border'}
        >
          {availability === 'published' ? 'In the shop' : availability === 'retired' ? 'Retired' : 'Not on sale yet'}
        </Badge>
        <p>
          {livePrice || typeof listedAmount === 'number' ? (
            <>
              Shoppers see <strong>{livePrice ? describePrice(livePrice) : formatEuro(listedAmount!)}</strong>
            </>
          ) : (
            'No selling price yet'
          )}
          {stockDetail?.variantId === selling.variantId && stockDetail.availableOnlineQuantity !== undefined && (
            <>
              {' '}
              · Available to buy online: <strong>{stockDetail.availableOnlineQuantity}</strong>
            </>
          )}
        </p>
        <p className="text-muted-foreground sm:ml-auto">
          Price, text and photos go live together with Publish changes.
        </p>
      </div>
      {message && <p role="status">{message}</p>}
      {readiness?.state === 'blocked' && readiness.action === 'publication' && (
        <ShopUpdateRecovery base={base} variantId={selling.variantId} onSettled={() => void load()} />
      )}
      {readiness?.state === 'blocked' && !['resume', 'price_change', 'publication'].includes(readiness.action) && (
        <div className="grid gap-3">
          <p>{readiness.reason}</p>
          {readiness.operationId && <p className="break-all text-sm">Operation: {readiness.operationId}</p>}
          {readiness.action === 'details' && (
            <Button variant="outline" onClick={onDetails}>
              Review Details
            </Button>
          )}
        </div>
      )}
      <div className="catalog-commerce-columns">
        <div className="min-w-0">
          {readiness && (readiness.state !== 'blocked' || ['resume', 'price_change'].includes(readiness.action)) ? (
            <ItemPriceEditor
              key={`price:${selling.variantId}:${generation}`}
              variantId={selling.variantId}
              backendBaseUrl={base}
              readiness={readiness}
              target={{ collection, recordId: item.id }}
              stored={storedDraft}
              onRefresh={load}
              onDraftChange={setPriceDraft}
              onLeaveGuard={registerPrice}
            />
          ) : (
            <Button variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
          )}
        </div>
        <StockOperationsApp
          key={selling.variantId}
          backendBaseUrl={base}
          embedded={{ variantId: selling.variantId, onLeaveGuard: registerStock, onStockRead: setStockDetail }}
        />
      </div>
    </section>
  );
}

// A shop update that is still running, failed or needs review stays visible and resumable here.
function ShopUpdateRecovery({ base, variantId, onSettled }: { base: string; variantId: string; onSettled(): void }) {
  const [status, setStatus] = useState<ItemPublicationStatus | 'checking' | 'unknown'>('checking');
  const [busy, setBusy] = useState(false);
  const api = createInternalStockApi({ backendBaseUrl: base });
  async function check() {
    try {
      const next = await readItemPublication(base, api, variantId);
      setStatus(next);
      if (next === 'live') onSettled();
    } catch {
      setStatus('unknown');
    }
  }
  useEffect(() => {
    void check();
  }, [base, variantId]);
  const polling = usePublicationPolling(status === 'pending' ? variantId : '', check);
  async function retry() {
    setBusy(true);
    try {
      const next = await startItemPublication(base, api, variantId);
      setStatus(next);
      if (next === 'live') onSettled();
    } catch {
      setStatus('unknown');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div role="status" className="grid gap-3 border border-border bg-card p-4 text-sm">
      <p>
        {status === 'checking'
          ? 'Checking the last shop update…'
          : status === 'pending'
            ? 'The last shop update is still running. The website and shop checkout update when it finishes.'
            : status === 'failed'
              ? 'The last shop update failed. Retry sends the same saved content.'
              : status === 'needs_review'
                ? 'The last shop update needs a label administrator to review it.'
                : status === 'unknown'
                  ? 'The last shop update could not be checked. Check again before publishing.'
                  : 'The shop update is live.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {status === 'failed' && (
          <Button disabled={busy} onClick={() => void retry()}>
            Retry shop update
          </Button>
        )}
        {(status === 'unknown' || polling.paused) && (
          <Button variant="outline" disabled={polling.checking} onClick={() => void polling.check()}>
            Check status
          </Button>
        )}
      </div>
    </div>
  );
}
