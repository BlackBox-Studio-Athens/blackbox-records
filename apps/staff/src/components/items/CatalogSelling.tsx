import { useEffect, useRef, useState } from 'react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../../lib/backend/editorial-api';
import { createInternalStockApi, type CatalogSellingDetail } from '../../lib/backend/internal-stock-api';
import { Button } from '../ui/button';
import ItemPriceEditor from '../stock/ItemPriceEditor';
import ItemPublication from '../stock/ItemPublication';

export default function CatalogSelling({
  item,
  base,
  section,
  onSummary,
  onDetails,
}: {
  item: EditorialRecord;
  base: string;
  section: 'selling' | 'stock';
  onSummary(item: EditorialRecord): void;
  onDetails(): void;
}) {
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
      if (fresh.selling && section === 'selling') {
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
  }, [base, item.id, section]);
  const selling = selected?.selling;
  if (message)
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
  if (section === 'stock')
    return (
      <section className="p-6">
        <h2 className="text-lg font-semibold">Stock</h2>
        <dl className="my-6 grid grid-cols-2 gap-4">
          <div>
            <dt>{selling.itemType === 'Clothes' ? 'Units on hand' : 'Copies on hand'}</dt>
            <dd className="text-2xl">{selling.quantity ?? 'Not recorded'}</dd>
          </div>
          <div>
            <dt>Available to buy online</dt>
            <dd className="text-2xl">{selling.onlineQuantity ?? 'Not recorded'}</dd>
          </div>
        </dl>
        <a
          className="inline-flex min-h-11 items-center underline"
          href={`/stock/?variantId=${encodeURIComponent(selling.variantId)}`}
        >
          Manage stock
        </a>
      </section>
    );
  return (
    <div className="grid min-w-0 gap-6 p-6">
      {saved && <p role="status">Price saved. Existing orders are unchanged.</p>}
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
      {readiness && (readiness.state !== 'blocked' || ['resume', 'price_change'].includes(readiness.action)) ? (
        <ItemPriceEditor
          key={`price:${selling.variantId}:${generation}`}
          variantId={selling.variantId}
          backendBaseUrl={base}
          readiness={readiness}
          onRefresh={load}
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
      {readiness?.state === 'ready' || (readiness?.state === 'blocked' && readiness.action === 'publication') ? (
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
    </div>
  );
}
