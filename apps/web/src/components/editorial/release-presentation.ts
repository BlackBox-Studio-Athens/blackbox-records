import type { Tracklist } from '@blackbox/content-model';
import type { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import type { OpenPreorder } from '@/lib/open-preorders';
import { availabilityLabel, expectedMonthText, isNotifiable } from '@/platform/lib/availability-copy';
import { shipEstimateText } from '@/platform/lib/preorder-estimate';

export type Listing = Awaited<ReturnType<typeof readPublicStoreListingPrices>>[number];
type ReleaseEdition =
  | { kind: 'native'; storeSlug: string; format: Tracklist['format'] }
  | { kind: 'announced'; format: Tracklist['format'] }
  | { kind: 'none' };
export type ReleasePresentationEntry = {
  id: string;
  priority?: number | undefined;
  edition: ReleaseEdition;
};
export type ReleasePresentation = { price: string; status: string } & (
  | { state: 'preorder'; action: `Pre-order ${string}`; shipping: string; preorder: NonNullable<Listing['preorder']> }
  | { state: 'available'; action: `Buy ${string}`; shipping: '' }
  | {
      state: 'announced' | 'editorial' | 'coming_soon' | 'repressing' | 'sold_out' | 'unknown';
      action: '';
      shipping: string;
    }
);

export function neutralReleasePresentation(
  entry: ReleasePresentationEntry,
): Exclude<ReleasePresentation, { state: 'preorder' | 'available' }> {
  if (entry.edition.kind === 'none') return { state: 'editorial', action: '', status: '', shipping: '', price: '' };
  const action = '';
  // An announced edition has no Store Item and no offer to read.
  if (entry.edition.kind === 'announced')
    return {
      state: 'announced',
      status: 'Coming soon',
      action,
      shipping: '',
      price: '',
    };
  return { state: 'unknown', action, status: '', shipping: '', price: '' };
}

export function releasePresentation(entry: ReleasePresentationEntry, record?: Listing): ReleasePresentation {
  const neutral = neutralReleasePresentation(entry);
  if (entry.edition.kind !== 'native' || record?.storeItemSlug !== entry.edition.storeSlug) return neutral;
  // The Store card rule: a ready record shows its price whatever its availability, a paused one included.
  const price = record.presentationState === 'ready' ? record.displayPrice : '';
  const state: unknown = record.availabilityState;
  if (state === 'stocked' && record.presentationState === 'ready') {
    const formatLabel = entry.edition.format === 'cd' ? 'CD' : entry.edition.format;
    if (record.preorder)
      return {
        state: 'preorder',
        preorder: record.preorder,
        status: '',
        action: `Pre-order ${formatLabel}`,
        shipping: record.preorder.shipEstimate
          ? `Expected to ship ${shipEstimateText(record.preorder.shipEstimate)}`
          : '',
        price,
      };
    return {
      state: 'available',
      status: '',
      action: `Buy ${formatLabel}`,
      shipping: '',
      price,
    };
  }
  const label = availabilityLabel(state);
  // Pending, paused and unrecognised offers make no public availability claim.
  if (!label || (state !== 'coming_soon' && state !== 'repressing' && state !== 'sold_out'))
    return { ...neutral, price };
  return {
    ...neutral,
    state,
    status: state === 'coming_soon' ? 'Coming soon' : state === 'sold_out' ? 'Sold out' : label,
    shipping: isNotifiable(state) ? expectedMonthText(record.expectedMonth) : '',
    price,
  };
}

export function releaseActionClassName(presentation: ReleasePresentation) {
  return presentation.state === 'preorder' || presentation.state === 'available'
    ? buttonVariants({
        className: presentation.state === 'preorder' ? 'preorder-action' : 'purchase-action',
      })
    : '';
}

// The rendered projection lists only ready, stocked, open pre-orders: the listing record those always produce.
export function projectedListing({ storeItemSlug, displayPrice, shipEstimate }: OpenPreorder): Listing {
  return {
    availabilityState: 'stocked',
    displayPrice,
    preorder: { shipEstimate },
    presentationState: 'ready',
    storeItemSlug,
  };
}

// SSR writes the projected pre-order a card rendered with, so a cached return restores that HTML state.
export function readProjectedListing(card: HTMLElement): Listing | undefined {
  const projected = card.dataset.releaseProjected;
  return projected ? projectedListing(JSON.parse(projected)) : undefined;
}

export function physicalStatusState(
  presentation: ReleasePresentation,
): 'coming_soon' | 'repressing' | 'sold_out' | null {
  if (presentation.state === 'announced') return 'coming_soon';
  return presentation.state === 'coming_soon' ||
    presentation.state === 'repressing' ||
    presentation.state === 'sold_out'
    ? presentation.state
    : null;
}

export const releaseCardSelector = '[data-release-id][data-release-role]';

export function readReleaseEntry(card: HTMLElement): ReleasePresentationEntry {
  const format = card.dataset.releasePhysicalFormat;
  const storeSlug = card.dataset.releaseStoreSlug;
  const edition: ReleaseEdition =
    format === 'vinyl' || format === 'cd' || format === 'cassette'
      ? storeSlug
        ? { kind: 'native', format, storeSlug }
        : { kind: 'announced', format }
      : { kind: 'none' };
  return {
    id: card.dataset.releaseId!,
    priority: Number(card.dataset.releasePriority) || undefined,
    edition,
  };
}

export function renderReleasePresentation(
  card: HTMLElement,
  entry: ReleasePresentationEntry,
  presentation: ReleasePresentation,
  actionClassName?: string,
) {
  const action = card.querySelector<HTMLAnchorElement>('[data-release-purchase]');
  const buyable = presentation.state === 'preorder' || presentation.state === 'available';
  if (action && entry.edition.kind === 'native') {
    if (!buyable && action.isConnected && action.ownerDocument.activeElement === action) {
      (
        card.querySelector<HTMLAnchorElement>('.release-card-formats .release-format-link[href]') ??
        card.querySelector<HTMLAnchorElement>('.release-card-title-link[href]')
      )?.focus();
    }
    // The label has its own span so label writes keep a catalog card's record mark.
    (action.querySelector?.<HTMLElement>('[data-release-purchase-label]') ?? action).textContent = presentation.action;
    action.className = actionClassName ?? releaseActionClassName(presentation);
    action.hidden = !buyable;
    // The accessible name starts with the visible label and adds the release, so repeated actions stay distinct.
    const releaseName = card.dataset.releaseName;
    if (releaseName) action.setAttribute('aria-label', `${presentation.action}, ${releaseName}`);
  }
  const status = card.querySelector<HTMLElement>('[data-release-status]');
  if (status) {
    status.textContent = presentation.status;
    status.hidden = !status.textContent;
    const state = physicalStatusState(presentation);
    if (state) status.dataset.availabilityState = state;
    else delete status.dataset.availabilityState;
  }
  const slot = card.querySelector<HTMLElement>('[data-release-purchase-slot]');
  if (slot) slot.hidden = !buyable && !presentation.status;
  const shipping = card.querySelector<HTMLElement>('[data-release-shipping]')!;
  shipping.textContent = presentation.shipping;
  shipping.hidden = !presentation.shipping;
  const price = card.querySelector<HTMLElement>('[data-release-price]');
  if (price) {
    price.textContent = presentation.price;
    price.hidden = !presentation.price;
  }
  const terms = card.querySelector<HTMLElement>('[data-release-terms]');
  if (terms) terms.hidden = presentation.state !== 'preorder';
}

// Browser-read enrichment never enters the snapshot: each card returns to the state its HTML rendered.
export function sanitizeReleaseCatalogPresentation(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(releaseCardSelector).forEach((card) => {
    const entry = readReleaseEntry(card);
    const presentation = releasePresentation(entry, readProjectedListing(card));
    renderReleasePresentation(card, entry, presentation, releaseActionClassName(presentation));
  });
}
