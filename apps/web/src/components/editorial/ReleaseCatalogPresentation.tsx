import { useEffect } from 'react';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import { isReleaseOutNow } from '@/lib/release-feature';
import { preorderBadges, shipEstimateText } from '@/platform/lib/preorder-estimate';
import {
  neutralReleasePresentation,
  releaseCardSelector,
  readReleaseEntry,
  renderReleasePresentation,
  type Listing,
  type ReleasePresentationEntry,
  type ReleasePresentation,
} from './release-presentation';

export function releasePresentation(
  entry: ReleasePresentationEntry,
  record?: Listing,
  today = new Date(),
): ReleasePresentation {
  const neutral = neutralReleasePresentation(entry, today);
  if (
    entry.edition.kind !== 'native' ||
    record?.storeItemSlug !== entry.edition.storeSlug ||
    record.presentationState !== 'ready'
  )
    return neutral;
  const digitalBadges = neutral.badges.slice(0, -1);
  if (record.availabilityState === 'stocked') {
    const formatLabel = entry.edition.format === 'cd' ? 'CD' : entry.edition.format;
    if (record.preorder)
      return {
        state: 'preorder',
        preorder: record.preorder,
        badges: preorderBadges({
          releaseDate: entry.releaseDate,
          shipEstimate: record.preorder.shipEstimate,
          today,
        }),
        action: `Pre-order ${formatLabel}`,
        shipping:
          record.preorder.shipEstimate &&
          !isReleaseOutNow(entry.releaseDate ? new Date(entry.releaseDate) : undefined, today)
            ? `Expected to ship ${shipEstimateText(record.preorder.shipEstimate)}`
            : '',
      };
    const medium = ({ vinyl: 'Vinyl', cd: 'CD', cassette: 'Cassette' } as const)[entry.edition.format];
    return {
      state: 'available',
      badges: [...digitalBadges, `${medium} available`],
      action: `Buy ${formatLabel}`,
      shipping: '',
    };
  }
  const state = record.availabilityState;
  if (state !== 'sold_out' && state !== 'out_of_stock' && state !== 'unavailable') return neutral;
  const status = (
    { sold_out: 'Sold Out', out_of_stock: 'Out of Stock', unavailable: 'Currently Unavailable' } as const
  )[state];
  return { ...neutral, state, badges: [...digitalBadges, status] };
}

export function selectReleaseMerchandisingEntries<T extends ReleasePresentationEntry>(
  entries: T[],
  records: Listing[],
) {
  const bySlug = new Map(records.map((record) => [record.storeItemSlug, record]));
  const states = new Map(
    entries.map((entry) => [
      entry.id,
      releasePresentation(entry, entry.edition.kind === 'native' ? bySlug.get(entry.edition.storeSlug) : undefined),
    ]),
  );
  const rank = {
    preorder: 0,
    available: 1,
    announced: 2,
    sold_out: 3,
    out_of_stock: 3,
    unavailable: 3,
    unknown: 4,
    editorial: 5,
  };
  const priority = (entry: T) => (Number.isInteger(entry.priority) && entry.priority! > 0 ? entry.priority! : Infinity);
  const principal = entries
    .filter((entry) => {
      const state = states.get(entry.id)!.state;
      return state === 'preorder' || state === 'available';
    })
    .sort((a, b) => priority(a) - priority(b) || rank[states.get(a.id)!.state] - rank[states.get(b.id)!.state])
    .slice(0, 2);
  const remainder = entries
    .filter((entry) => !principal.includes(entry))
    .sort((a, b) => rank[states.get(a.id)!.state] - rank[states.get(b.id)!.state] || priority(a) - priority(b));
  return { principal, remainder, states };
}

export function connectReleaseCatalogPresentation(root: HTMLElement, read = readPublicStoreListingPrices) {
  const controller = new AbortController();
  const layout = root.querySelector<HTMLElement>('[data-release-layout]')!;
  const catalog = root.querySelector<HTMLElement>('[data-release-catalog]')!;
  const grid = root.querySelector<HTMLElement>('[data-release-grid]')!;
  const cards = [...root.querySelectorAll<HTMLElement>(releaseCardSelector)];
  // Keep the catalog's stable tie order after enriched cards have moved into a cached snapshot.
  cards.forEach((card, index) => (card.dataset.releaseSourceOrder ??= String(index)));
  cards.sort((a, b) => Number(a.dataset.releaseSourceOrder) - Number(b.dataset.releaseSourceOrder));
  const entries = cards.map(readReleaseEntry);
  const cardById = new Map(cards.map((card) => [card.dataset.releaseId!, card]));

  function place(entry: ReleasePresentationEntry, role: 'lead' | 'supporting' | 'catalog') {
    const card = cardById.get(entry.id)!;
    const primary = role !== 'catalog';
    card.classList.toggle('block', !primary);
    card.dataset.releaseRole = role;
    card.classList.toggle('releases-latest-feature', role === 'lead');
    card.classList.toggle('releases-latest-feature__upcoming', role === 'supporting');
    const tile = card.querySelector<HTMLElement>('.release-card-tile--framed')!;
    tile.style.display = primary ? 'contents' : '';
    const copy = card.querySelector<HTMLElement>('.release-card-copy')!;
    for (const name of ['space-y-2.5', 'p-0', 'pt-4']) copy.classList.toggle(name, !primary);
    copy.classList.toggle('releases-latest-feature__copy', role === 'lead');
    copy.classList.toggle('releases-latest-feature__upcoming-copy', role === 'supporting');
    const artwork = card.querySelector<HTMLElement>('.release-card-image-shell')!;
    artwork.classList.toggle('release-card-image-shell--framed', !primary);
    card.querySelector('.release-card-image-frame')!.classList.toggle('release-card-image-frame--framed', !primary);
    artwork.classList.toggle('releases-latest-feature__artwork-link', role === 'lead');
    artwork.classList.toggle('releases-latest-feature__upcoming-artwork-link', role === 'supporting');
    const image = card.querySelector<HTMLImageElement>('img')!;
    image.classList.toggle('release-card-artwork--framed', !primary);
    image.classList.toggle('h-full', !primary);
    image.classList.toggle('releases-latest-feature__artwork', role === 'lead');
    image.classList.toggle('releases-latest-feature__upcoming-artwork', role === 'supporting');
    image.loading = role === 'lead' ? 'eager' : 'lazy';
    image.fetchPriority = role === 'lead' ? 'high' : 'auto';
    image.dataset.releaseCatalogSizes ??= image.sizes;
    const leadRegion = layout.classList.contains('releases-page-layout--single-column')
      ? '(min(100vw, 87rem) - 4.125rem)'
      : '((min(100vw, 87rem) - 4.125rem) * 0.75 - 1px)';
    image.sizes =
      role === 'lead'
        ? `(min-width: 80rem) calc(((${leadRegion} - 3rem - clamp(1.5rem, 3vw, 2.5rem)) * 0.95 / 1.95 - 2px) * 1.026), (min-width: 64rem) calc(((${leadRegion} - 4.5rem) * 0.9 / 1.9 - 2px) * 1.026), (min-width: 40rem) calc(((100vw - 5.75rem - 2px) * 0.9 / 1.9 - 2px) * 1.026), calc((100vw - 2.25rem - clamp(1rem, 2.5vw, 1.5rem) * 2) * 1.026)`
        : role === 'supporting'
          ? '(min-width: 64rem) calc(((min(100vw, 87rem) - 4.125rem) / 4 - 3rem - 2px) * 1.026), calc((8.5rem - 2px) * 1.026)'
          : image.dataset.releaseCatalogSizes;
    let heading = card.querySelector<HTMLElement>('[data-release-title]')!;
    const tag = primary ? 'H2' : 'H3';
    if (heading.tagName !== tag) {
      const replacement = document.createElement(tag.toLowerCase());
      for (const attribute of heading.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...heading.childNodes);
      heading.replaceWith(replacement);
      heading = replacement;
    }
    heading.classList.toggle('releases-latest-feature__title', role === 'lead');
    heading.classList.toggle('releases-latest-feature__upcoming-title', role === 'supporting');
    const summary = card.querySelector<HTMLElement>('[data-release-summary]');
    if (summary) {
      summary.hidden = !primary;
      summary.classList.toggle('releases-latest-feature__summary', role === 'lead');
      summary.classList.toggle('releases-latest-feature__upcoming-summary', role === 'supporting');
    }
    const listen = card.querySelector<HTMLButtonElement>('[data-music-streaming-service-embedded-player-trigger]');
    if (listen) {
      const destination = card.querySelector<HTMLElement>(
        primary ? '[data-release-actions]' : '.release-card-meta-row',
      )!;
      if (primary) destination.append(listen);
      else destination.prepend(listen);
    }
    const meta = card.querySelector<HTMLElement>('.release-card-meta-row')!;
    meta.hidden = primary;
    const scrim = card.querySelector<HTMLElement>('[data-release-artwork-scrim]')!;
    scrim.hidden = primary;
    if (role === 'catalog') grid.append(card);
    else layout.insertBefore(card, catalog);
  }

  function apply(records: Listing[]) {
    if (controller.signal.aborted) return;
    const { principal, remainder, states } = selectReleaseMerchandisingEntries(entries, records);
    for (const entry of entries) {
      const card = cardById.get(entry.id)!;
      const presentation = states.get(entry.id)!;
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
    layout.classList.toggle('releases-page-layout--single-column', principal.length < 2);
    principal.forEach((entry, index) => place(entry, index === 0 ? 'lead' : 'supporting'));
    remainder.forEach((entry) => place(entry, 'catalog'));
    catalog.hidden = remainder.length === 0;
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
