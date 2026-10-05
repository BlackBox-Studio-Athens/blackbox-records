import { DIGITAL_RELEASE_BADGE, type ReleaseBadge, type Tracklist } from '@blackbox/content-model';
import type { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { isReleaseOutNow } from '@/lib/release-feature';

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
export type ReleasePresentation = { badges: ReleaseBadge[] } & (
  | { state: 'preorder'; action: `Pre-order ${string}`; shipping: string; preorder: NonNullable<Listing['preorder']> }
  | { state: 'available'; action: `Buy ${string}`; shipping: '' }
  | {
      state: 'announced' | 'editorial' | 'sold_out' | 'out_of_stock' | 'unavailable' | 'unknown';
      action: 'View vinyl details' | 'View edition';
      shipping: '';
    }
);

export function neutralReleasePresentation(
  entry: ReleasePresentationEntry,
  today = new Date(),
): Exclude<ReleasePresentation, { state: 'preorder' | 'available' }> {
  const digitalOut = isReleaseOutNow(entry.releaseDate ? new Date(entry.releaseDate) : undefined, today);
  const digitalBadge = digitalOut ? DIGITAL_RELEASE_BADGE : entry.releaseDate ? 'Album upcoming' : null;
  const digitalBadges: ReleaseBadge[] = digitalBadge ? [digitalBadge] : [];
  if (entry.edition.kind === 'none')
    return { state: 'editorial', badges: digitalBadges, action: 'View edition', shipping: '' };
  const medium = ({ vinyl: 'Vinyl', cd: 'CD', cassette: 'Cassette' } as const)[entry.edition.format];
  const action = entry.edition.format === 'vinyl' ? 'View vinyl details' : 'View edition';
  if (entry.edition.kind === 'announced')
    return { state: 'announced', badges: [...digitalBadges, `${medium} coming later`], action, shipping: '' };
  return { state: 'unknown', badges: [...digitalBadges, 'Physical availability unconfirmed'], action, shipping: '' };
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
  badges.replaceChildren(
    ...presentation.badges.map((text) => {
      const badge = card.ownerDocument.createElement('span');
      badge.className = text.startsWith('Pre-order') ? 'preorder-badge' : 'store-item-card__release-status';
      badge.textContent = text;
      return badge;
    }),
  );
  const action = card.querySelector<HTMLAnchorElement>('[data-release-purchase]');
  if (action && entry.edition.kind === 'native') {
    action.textContent = presentation.action;
    action.className = actionClassName ?? action.dataset.releaseNeutralClass ?? '';
  }
  const shipping = card.querySelector<HTMLElement>('[data-release-shipping]')!;
  shipping.textContent = presentation.shipping;
  shipping.hidden = !presentation.shipping;
}

export function sanitizeReleaseCatalogPresentation(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(releaseCardSelector).forEach((card) => {
    const entry = readReleaseEntry(card);
    renderReleasePresentation(card, entry, neutralReleasePresentation(entry));
  });
}
