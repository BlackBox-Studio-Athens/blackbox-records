import { useEffect } from 'react';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import {
  releasePresentation,
  releaseCardSelector,
  readReleaseEntry,
  renderReleasePresentation,
  type Listing,
  type ReleasePresentationEntry,
} from './release-presentation';

export function selectReleaseMerchandisingEntries<T extends ReleasePresentationEntry>(
  entries: T[],
  records: Listing[] = [],
) {
  const bySlug = new Map(records.map((record) => [record.storeItemSlug, record]));
  const states = new Map(
    entries.map((entry) => [
      entry.id,
      releasePresentation(entry, entry.edition.kind === 'native' ? bySlug.get(entry.edition.storeSlug) : undefined),
    ]),
  );
  const priority = (entry: T) => (Number.isInteger(entry.priority) && entry.priority! > 0 ? entry.priority! : Infinity);
  // Editorial geometry is shared by SSR and hydration; live offers only establish purchase intent.
  const principal = entries
    .filter((entry) => entry.edition.kind === 'native')
    .sort((a, b) => priority(a) - priority(b))
    .slice(0, 2);
  const remainder = entries.filter((entry) => !principal.includes(entry));
  return { principal, remainder, states };
}

export function connectReleaseCatalogPresentation(root: HTMLElement, read = readPublicStoreListingPrices) {
  const controller = new AbortController();
  const cards = [...root.querySelectorAll<HTMLElement>(releaseCardSelector)];
  const entries = cards.map(readReleaseEntry);
  const cardById = new Map(cards.map((card) => [card.dataset.releaseId!, card]));

  function apply(records: Listing[]) {
    if (controller.signal.aborted) return;
    const bySlug = new Map(records.map((record) => [record.storeItemSlug, record]));
    for (const entry of entries) {
      const card = cardById.get(entry.id)!;
      const presentation = releasePresentation(
        entry,
        entry.edition.kind === 'native' ? bySlug.get(entry.edition.storeSlug) : undefined,
      );
      renderReleasePresentation(
        card,
        entry,
        presentation,
        buttonVariants({
          variant: presentation.state === 'preorder' || presentation.state === 'available' ? 'default' : 'outline',
          size: 'lg',
          className:
            presentation.state === 'preorder'
              ? 'preorder-action'
              : presentation.state === 'available'
                ? 'purchase-action'
                : undefined,
        }),
      );
    }
  }

  apply([]);
  void read(controller.signal)
    .then(apply)
    .catch(() => apply([]));
  return () => controller.abort();
}

export default function ReleaseCatalogPresentation({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (root) return connectReleaseCatalogPresentation(root);
    return undefined;
  }, [rootId]);
  return null;
}
