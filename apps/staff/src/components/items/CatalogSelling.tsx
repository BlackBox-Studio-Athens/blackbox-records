import type { EditorialRecord } from '../../lib/backend/editorial-api';
import ItemPriceEditor from '../stock/ItemPriceEditor';
import ItemPublication from '../stock/ItemPublication';

export default function CatalogSelling({
  item,
  base,
  section,
}: {
  item: EditorialRecord;
  base: string;
  section: 'selling' | 'stock';
}) {
  const selling = item.selling;
  if (!selling)
    return (
      <div className="p-6">
        <p>This title has no shop listing yet.</p>
        <a
          className="inline-flex min-h-11 items-center underline"
          href={`/items/new/?${new URLSearchParams({ collection: item.collection ?? 'releases', id: item.id })}`}
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
    <div className="grid gap-6 p-6">
      <ItemPriceEditor key={`price:${selling.variantId}`} variantId={selling.variantId} backendBaseUrl={base} />
      <ItemPublication key={`publish:${selling.variantId}`} variantId={selling.variantId} backendBaseUrl={base} />
    </div>
  );
}
