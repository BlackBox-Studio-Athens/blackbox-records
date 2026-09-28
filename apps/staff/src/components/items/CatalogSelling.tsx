import { useCallback, useEffect, useRef, useState } from 'react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../../lib/backend/editorial-api';
import { createInternalStockApi, type CatalogSellingDetail } from '../../lib/backend/internal-stock-api';
import { Button } from '../ui/button';
import ItemPriceEditor from '../stock/ItemPriceEditor';
import ItemPublication from '../stock/ItemPublication';
import StockOperationsApp from '../stock/StockOperationsApp';

export default function CatalogSelling({
  item,
  base,
  onSummary,
  onDetails,
  onLeaveGuard,
}: {
  item: EditorialRecord;
  base: string;
  onSummary(item: EditorialRecord): void;
  onDetails(): void;
  onLeaveGuard(guard: (() => boolean) | null): void;
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
  const [message, setMessage] = useState('Loading selling details…');
  const [saved, setSaved] = useState(false);
  const [generation, setGeneration] = useState(0);
  const sequence = useRef(0);
  async function load() {
    const request = ++sequence.current;
    setReadiness(null);
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
      onSummary(fresh);
      if (fresh.selling) {
        const next = await createInternalStockApi({ backendBaseUrl: base }).readSelling(fresh.selling.variantId);
        if (request !== sequence.current) return;
        setReadiness(next);
      }
      setGeneration((value) => value + 1);
      setMessage('');
    } catch {
      if (request === sequence.current)
        setMessage('Selling details could not be refreshed. Select Refresh to try again.');
    }
  }
  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, [base, item.id]);
  const selling = selected?.selling;
  if (message && !selected)
    return (
      <div className="grid gap-4 p-6">
        {saved && <p role="status">Price saved. Existing orders are unchanged.</p>}
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
  return (
    <section aria-label="Price and stock" tabIndex={-1} className="catalog-commerce grid min-w-0 gap-6">
      <div>
        <h2 className="text-lg font-semibold">Price & stock</h2>
        <p className="text-sm text-muted-foreground">
          Saving a price updates the shop price. Shop publication controls the saved title, description and artwork.
          Details and photos save automatically.
        </p>
      </div>
      {message && <p role="status">{message}</p>}
      {saved && <p role="status">Price saved. Existing orders are unchanged.</p>}
      {readiness === null ? (
        <p className="text-sm text-muted-foreground">Checking shop publication status…</p>
      ) : readiness.state === 'ready' || (readiness.state === 'blocked' && readiness.action === 'publication') ? (
        <ItemPublication
          key={`publish:${selling.variantId}:${generation}`}
          variantId={selling.variantId}
          backendBaseUrl={base}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Finish price setup before publishing this item for sale. Editorial Review changes remains available in
          Details.
        </p>
      )}
      {readiness?.state === 'blocked' && (
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
              onRefresh={load}
              onLeaveGuard={registerPrice}
              onSaved={async () => {
                setSaved(true);
                await load();
              }}
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
          embedded={{ variantId: selling.variantId, onLeaveGuard: registerStock }}
        />
      </div>
    </section>
  );
}
