import { DIGITAL_RELEASE_BADGE, type ReleaseBadge, type Tracklist } from '@blackbox/content-model';
import type { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import type { OpenPreorder } from '@/lib/open-preorders';
import { isReleaseOutNow } from '@/lib/release-feature';
import { availabilityLabel, expectedMonthText, isNotifiable } from '@/platform/lib/availability-copy';
import { preorderBadges, shipEstimateText } from '@/platform/lib/preorder-estimate';

export type Listing = Awaited<ReturnType<typeof readPublicStoreListingPrices>>[number];
type ReleaseEdition =
  | { kind: 'native'; storeSlug: string; format: Tracklist['format'] }
  | { kind: 'announced'; format: Tracklist['format'] }
  | { kind: 'none' };
export type ReleasePresentationEntry = {
  id: string;
  priority?: number | undefined;
  releaseDate?: string | undefined;
  edition: ReleaseEdition;
};
export type ReleasePresentation = { badges: ReleaseBadge[]; price: string } & (
  | { state: 'preorder'; action: `Pre-order ${string}`; shipping: string; preorder: NonNullable<Listing['preorder']> }
  | { state: 'available'; action: `Buy ${string}`; shipping: '' }
  | {
      state: 'announced' | 'editorial' | 'coming_soon' | 'repressing' | 'sold_out' | 'unknown';
      action: `${(typeof MEDIUM)[keyof typeof MEDIUM]} edition` | 'View edition';
      shipping: string;
    }
);

const MEDIUM = { vinyl: 'Vinyl', cd: 'CD', cassette: 'Cassette' } as const;

// '2026-11-14' -> 'Out 14 November 2026'
function futureDigitalBadge(releaseDate: string): ReleaseBadge {
  const date = new Date(`${releaseDate.slice(0, 10)}T00:00:00Z`);
  return `Out ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
}

// Release stage describes the music only; the physical badge comes from the edition's offer.
export function neutralReleasePresentation(
  entry: ReleasePresentationEntry,
  today = new Date(),
): Exclude<ReleasePresentation, { state: 'preorder' | 'available' }> {
  const digitalOut = isReleaseOutNow(entry.releaseDate ? new Date(entry.releaseDate) : undefined, today);
  const digitalBadges: ReleaseBadge[] = digitalOut
    ? [DIGITAL_RELEASE_BADGE]
    : entry.releaseDate
      ? [futureDigitalBadge(entry.releaseDate)]
      : [];
  if (entry.edition.kind === 'none')
    return { state: 'editorial', badges: digitalBadges, action: 'View edition', shipping: '', price: '' };
  const action = `${MEDIUM[entry.edition.format]} edition` as const;
  // An announced edition has no Store Item and no offer to read.
  if (entry.edition.kind === 'announced')
    return {
      state: 'announced',
      badges: [...digitalBadges, `${MEDIUM[entry.edition.format]} Coming Soon`],
      action,
      shipping: '',
      price: '',
    };
  // No physical badge and no price until the offer arrives.
  return { state: 'unknown', badges: digitalBadges, action, shipping: '', price: '' };
}

export function releasePresentation(
  entry: ReleasePresentationEntry,
  record?: Listing,
  today = new Date(),
): ReleasePresentation {
  const neutral = neutralReleasePresentation(entry, today);
  if (entry.edition.kind !== 'native' || record?.storeItemSlug !== entry.edition.storeSlug) return neutral;
  // The Store card rule: a ready record shows its price whatever its availability, a paused one included.
  const price = record.presentationState === 'ready' ? record.displayPrice : '';
  const medium = MEDIUM[entry.edition.format];
  const state: unknown = record.availabilityState;
  if (state === 'stocked' && record.presentationState === 'ready') {
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
        price,
      };
    return {
      state: 'available',
      badges: [...neutral.badges, `${medium} available`],
      action: `Buy ${formatLabel}`,
      shipping: '',
      price,
    };
  }
  const label = availabilityLabel(state);
  // Unavailable and unrecognised states keep the neutral detail path with no physical badge.
  if (!label || (state !== 'coming_soon' && state !== 'repressing' && state !== 'sold_out'))
    return { ...neutral, price };
  return {
    ...neutral,
    state,
    badges: [...neutral.badges, `${medium} ${label}`],
    shipping: isNotifiable(state) ? expectedMonthText(record.expectedMonth) : '',
    price,
  };
}

// The non-buyable edition action is a bracketed text link; Buy and Pre-order keep their buttons.
export const RELEASE_DETAIL_LINK_CLASS = 'release-detail-link';

export function releaseActionClassName(presentation: ReleasePresentation) {
  return presentation.state === 'preorder' || presentation.state === 'available'
    ? buttonVariants({
        className: presentation.state === 'preorder' ? 'preorder-action' : 'purchase-action',
      })
    : RELEASE_DETAIL_LINK_CLASS;
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

// The zero-stock state a presentation's physical badge (its last badge) carries, for the shared tone.
export function physicalBadgeState(
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
    releaseDate: card.dataset.releaseDate || undefined,
    edition,
  };
}

export function renderReleasePresentation(
  card: HTMLElement,
  entry: ReleasePresentationEntry,
  presentation: ReleasePresentation,
  actionClassName?: string,
) {
  const badges = card.querySelector<HTMLElement>('[data-release-badges]')!;
  const physicalState = physicalBadgeState(presentation);
  badges.replaceChildren(
    ...presentation.badges.map((text, index) => {
      const badge = card.ownerDocument.createElement('span');
      badge.className = text.startsWith('Pre-order') ? 'preorder-badge' : 'store-item-card__release-status';
      if (physicalState && index === presentation.badges.length - 1) badge.dataset.availabilityState = physicalState;
      badge.textContent = text;
      return badge;
    }),
  );
  const action = card.querySelector<HTMLAnchorElement>('[data-release-purchase]');
  if (action && entry.edition.kind === 'native') {
    // The label has its own span so label writes keep a catalog card's record mark.
    (action.querySelector?.<HTMLElement>('[data-release-purchase-label]') ?? action).textContent = presentation.action;
    action.className = actionClassName ?? RELEASE_DETAIL_LINK_CLASS;
    // The accessible name starts with the visible label and adds the release, so repeated actions stay distinct.
    const releaseName = card.dataset.releaseName;
    if (releaseName) action.setAttribute('aria-label', `${presentation.action}, ${releaseName}`);
  }
  const shipping = card.querySelector<HTMLElement>('[data-release-shipping]')!;
  shipping.textContent = presentation.shipping;
  shipping.hidden = !presentation.shipping;
  const price = card.querySelector<HTMLElement>('[data-release-price]');
  if (price) {
    price.textContent = presentation.price;
    price.hidden = !presentation.price;
  }
  // Only an open pre-order links to the pre-order and delivery terms. The line keeps its space while inert, so the
  // rows below do not move when offers arrive.
  const terms = card.querySelector<HTMLElement>('[data-release-terms]');
  if (terms) terms.inert = presentation.state !== 'preorder';
}

// Browser-read enrichment never enters the snapshot: each card returns to the state its HTML rendered.
export function sanitizeReleaseCatalogPresentation(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(releaseCardSelector).forEach((card) => {
    const entry = readReleaseEntry(card);
    const presentation = releasePresentation(entry, readProjectedListing(card));
    renderReleasePresentation(card, entry, presentation, releaseActionClassName(presentation));
  });
}
