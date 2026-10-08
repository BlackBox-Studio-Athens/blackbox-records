import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';
import { DIGITAL_RELEASE_BADGE } from '@blackbox/content-model';
import {
  formatStoreLowStockLabel,
  resolvePublicCheckoutApiBaseUrl,
} from '@/components/store/checkout/public-checkout-presentation';
import type { StoreItemCartSeed } from '@/components/store/checkout/StoreItemPurchaseActions';
import { preorderBadges } from '@/platform/lib/preorder-estimate';
import { availabilityChipText } from '@/platform/lib/availability-copy';

import { resetStoreArtistControls, resetStoreArtistsTrigger } from './store-artist-options';

export const STORE_LISTING_PRICE_COPY = {
  loading: 'Checking price',
  unavailable: 'Price unavailable',
  availabilityLoading: 'Checking availability',
  buy: 'Buy',
  adding: 'Adding',
  preorder: 'Pre-order',
  outNow: DIGITAL_RELEASE_BADGE,
} as const;

type ConnectStoreListingPricePresentationOptions = {
  readListingPrices?: (signal: AbortSignal) => Promise<PublicStoreListingPrice[]>;
  root?: ParentNode;
};

const placeholderSelector = '[data-store-listing-price]';
const availabilitySelector = '[data-store-listing-availability]';
const buySelector = '[data-store-card-buy]';
const preorderSelector = '[data-store-listing-preorder]';
const releaseStatusSelector = '[data-store-listing-release-status]';

// The label lives in its own span so label writes keep the leading record mark.
function setStoreCardBuyLabel(button: HTMLButtonElement, label: string) {
  (button.querySelector?.<HTMLElement>('[data-store-card-buy-label]') ?? button).textContent = label;
}

/** Resets the Artists checklist, its phone sheet and the toolbar Artists chip to their disabled server state. */
export function sanitizeStoreArtistChrome(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-store-artists]').forEach(resetStoreArtistControls);
  root.querySelectorAll<HTMLButtonElement>('[data-store-artists-trigger]').forEach(resetStoreArtistsTrigger);
}

/** Snapshots keep the server chrome and reset its state before the next enhancement. */
export function sanitizeStoreSearchChrome(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-store-search-toolbar]').forEach((toolbar) => {
    toolbar.removeAttribute('data-store-search-ready');
    const input = toolbar.querySelector<HTMLInputElement>('input[type="search"]');
    if (input) {
      input.disabled = true;
      input.value = '';
      input.removeAttribute('value');
    }
    const summary = toolbar.querySelector<HTMLElement>('[data-store-search-summary]');
    if (summary) summary.textContent = '';
    toolbar.querySelectorAll<HTMLButtonElement>('button:not([data-store-artists-trigger])').forEach((button) => {
      button.disabled = true;
      button.hidden = true;
    });
  });
  sanitizeStoreArtistChrome(root);
  root.querySelectorAll<HTMLElement>('[data-store-empty-results], [data-store-result-total]').forEach((element) => {
    element.hidden = true;
  });
  root.querySelectorAll<HTMLElement>('[data-store-preorder-notes]').forEach((element) => {
    element.hidden = true;
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-controls]').forEach((controls) => {
    controls.hidden = false;
    controls.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = true;
    });
  });
}

export function sanitizeStoreListingPricePlaceholders(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(placeholderSelector).forEach((placeholder) => {
    placeholder.dataset.storeListingPriceState = 'loading';
    placeholder.setAttribute('aria-busy', 'true');
    placeholder.textContent = STORE_LISTING_PRICE_COPY.loading;
  });
  root.querySelectorAll<HTMLElement>(availabilitySelector).forEach((placeholder) => {
    placeholder.dataset.storeListingAvailabilityState = 'pending';
    placeholder.setAttribute('aria-busy', 'true');
    placeholder.hidden = false;
    placeholder.textContent = STORE_LISTING_PRICE_COPY.availabilityLoading;
  });
  root.querySelectorAll<HTMLButtonElement>(buySelector).forEach((button) => {
    button.hidden = true;
    button.disabled = true;
    button.removeAttribute('aria-busy');
    button.classList.remove('preorder-action');
    button.classList.remove('purchase-action');
    button.dataset.storeCardBuyLabel = STORE_LISTING_PRICE_COPY.buy;
    setStoreCardBuyLabel(button, STORE_LISTING_PRICE_COPY.buy);
  });
  root.querySelectorAll<HTMLElement>('[data-store-preorder]').forEach((card) => {
    delete card.dataset.storePreorder;
  });
  root.querySelectorAll<HTMLElement>(preorderSelector).forEach((badge) => {
    badge.hidden = true;
    badge.textContent = '';
  });
  root.querySelectorAll<HTMLElement>(releaseStatusSelector).forEach((badge) => {
    badge.hidden = true;
    badge.textContent = STORE_LISTING_PRICE_COPY.outNow;
  });
}

// A card whose offer stopped being buyable shows its status (or none) beside the price and drops Buy.
function showStoreCardStatus(button: HTMLButtonElement, label: string | null, availabilityState: string | undefined) {
  const status = button.parentElement?.querySelector<HTMLElement>(availabilitySelector);
  if (status) {
    status.hidden = !label;
    status.dataset.storeListingAvailabilityState = availabilityState ?? 'unavailable';
    status.textContent = label ?? '';
  }
  button.disabled = true;
  button.hidden = true;
  button.classList.remove('purchase-action', 'preorder-action');
  button.closest('.store-item-card--listing')?.querySelector<HTMLElement>('.prose-card-link')?.focus();
}

// One flick on press, mouse entry or keyboard focus. global.css plays it without reduced motion; it starts at speed
// because on phones the bag covers the card about half a second after the tap.
function flickStoreCardBuyIcon(button: HTMLElement) {
  button.dataset.storeCardBuyFlick ??= '';
}

// Cards are not islands, so the purchase code loads on the first press; the Worker offer stays the authority.
async function buyFromStoreCard(button: HTMLButtonElement, confirmationTimers: Map<HTMLButtonElement, number>) {
  if (button.disabled || button.getAttribute('aria-busy') === 'true') return;
  flickStoreCardBuyIcon(button);
  window.clearTimeout(confirmationTimers.get(button));
  button.setAttribute('aria-busy', 'true');
  setStoreCardBuyLabel(button, STORE_LISTING_PRICE_COPY.adding);

  let label: string = button.dataset.storeCardBuyLabel ?? STORE_LISTING_PRICE_COPY.buy;
  try {
    const purchase = await import('@/components/store/checkout/StoreItemPurchaseActions');
    const result = await purchase.requestStoreCartAddFromSeed(
      JSON.parse(button.dataset.storeCardBuy ?? '') as StoreItemCartSeed,
    );
    if (!result.cartItem) {
      showStoreCardStatus(button, result.label, result.availabilityState);
    } else if (!result.isQueued) {
      label = purchase.STORE_ITEM_PURCHASE_ACTION_COPY.added;
      const resetLabel = () => {
        setStoreCardBuyLabel(button, button.dataset.storeCardBuyLabel ?? STORE_LISTING_PRICE_COPY.buy);
      };
      confirmationTimers.set(button, window.setTimeout(resetLabel, purchase.STORE_ITEM_ADDED_CONFIRMATION_MS));
    }
  } catch {
    // The purchase code could not load: Buy stays available for another press.
  }
  button.removeAttribute('aria-busy');
  setStoreCardBuyLabel(button, label);
}

export function connectStoreListingPricePresentation({
  readListingPrices = readPublicStoreListingPrices,
  root = document,
}: ConnectStoreListingPricePresentationOptions = {}): () => void {
  const placeholders = [...root.querySelectorAll<HTMLElement>(placeholderSelector)];
  const availabilityPlaceholders = [...root.querySelectorAll<HTMLElement>(availabilitySelector)];
  const buyButtons = [...root.querySelectorAll<HTMLButtonElement>(buySelector)];
  if (placeholders.length === 0 && availabilityPlaceholders.length === 0) return () => {};

  sanitizeStoreListingPricePlaceholders(root);
  const abortController = new AbortController();
  const confirmationTimers = new Map<HTMLButtonElement, number>();
  const handleBuyClick = (event: Event) =>
    void buyFromStoreCard(event.currentTarget as HTMLButtonElement, confirmationTimers);
  // Mouse entry or keyboard focus; a touch entry has no focus ring and waits for the press.
  const handleBuyAttention = (event: Event) => {
    const button = event.currentTarget as HTMLElement;
    if ((event as PointerEvent).pointerType === 'mouse' || button.matches?.(':focus-visible')) {
      flickStoreCardBuyIcon(button);
    }
  };
  const handleBuyFlickEnd = (event: Event) => {
    delete (event.currentTarget as HTMLElement).dataset.storeCardBuyFlick;
  };
  const { signal } = abortController;
  buyButtons.forEach((button) => {
    button.addEventListener('click', handleBuyClick, { signal });
    button.addEventListener('pointerenter', handleBuyAttention, { signal });
    button.addEventListener('focus', handleBuyAttention, { signal });
    button.addEventListener('animationend', handleBuyFlickEnd, { signal });
  });

  void readListingPrices(abortController.signal)
    .catch(() => [])
    .then((records) => {
      if (abortController.signal.aborted) return;
      const recordsBySlug = new Map(records.map((record) => [record.storeItemSlug, record]));

      placeholders.forEach((placeholder) => {
        const record = recordsBySlug.get(placeholder.dataset.storeItemSlug || '');
        placeholder.removeAttribute('aria-busy');
        placeholder.dataset.storeListingPriceState = record?.presentationState ?? 'unavailable';
        placeholder.textContent =
          record?.presentationState === 'ready' ? record.displayPrice : STORE_LISTING_PRICE_COPY.unavailable;
      });

      availabilityPlaceholders.forEach((placeholder) => {
        const record = recordsBySlug.get(placeholder.dataset.storeItemSlug || '');
        const availabilityState: unknown = record?.availabilityState;
        const stocked = availabilityState === 'stocked';
        const lowStockLabel =
          stocked && record?.presentationState === 'ready' ? formatStoreLowStockLabel(record.lowStockQuantity) : null;
        // Unavailable, unknown or missing records show the price only: no chip and no Buy.
        const chipText = lowStockLabel ?? availabilityChipText(availabilityState, record?.expectedMonth);

        placeholder.removeAttribute('aria-busy');
        placeholder.dataset.storeListingAvailabilityState = lowStockLabel
          ? 'low_stock'
          : typeof availabilityState === 'string'
            ? availabilityState
            : 'unknown';
        placeholder.hidden = !chipText;
        placeholder.textContent = chipText;

        // A pre-order whose copies ran out reads like any zero-stock card.
        const card = placeholder.closest<HTMLElement>('.store-item-card--listing');
        if (card && stocked && record?.preorder) {
          const badges = preorderBadges({
            releaseDate: placeholder.dataset.storeReleaseDate,
            shipEstimate: record.preorder.shipEstimate,
            today: new Date(),
          });
          card.dataset.storePreorder = '';
          const preorderBadge = card.querySelector<HTMLElement>(preorderSelector);
          if (preorderBadge) {
            preorderBadge.textContent = badges[badges.length - 1] ?? '';
            preorderBadge.hidden = false;
          }
          const releaseStatus = card.querySelector<HTMLElement>(releaseStatusSelector);
          if (releaseStatus) releaseStatus.hidden = badges.length < 2;
        }
      });

      // The projection only decides whether Buy is offered; pressing it reads the authoritative offer.
      buyButtons.forEach((button) => {
        const record = recordsBySlug.get(button.dataset.storeItemSlug || '');
        const buyable = record?.presentationState === 'ready' && record.availabilityState === 'stocked';
        const preorder = buyable && Boolean(record.preorder);
        button.hidden = !buyable;
        button.disabled = !buyable;
        const label = preorder ? STORE_LISTING_PRICE_COPY.preorder : STORE_LISTING_PRICE_COPY.buy;
        button.dataset.storeCardBuyLabel = label;
        setStoreCardBuyLabel(button, label);
        button.classList.toggle('preorder-action', preorder);
        button.classList.toggle('purchase-action', buyable && !preorder);
      });
      document.dispatchEvent(new Event('blackbox:store-listing-applied'));
    });

  return () => {
    abortController.abort();
    confirmationTimers.forEach((timer) => window.clearTimeout(timer));
  };
}

export async function readPublicStoreListingPrices(
  signal?: AbortSignal,
  options?: { scope: 'preorders' },
): Promise<PublicStoreListingPrice[]> {
  const backendBaseUrl = resolvePublicCheckoutApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(
    `${backendBaseUrl}/api/store/listing-prices${options?.scope === 'preorders' ? '?scope=preorders' : ''}`,
    {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: signal ?? null,
    },
  );

  if (!response.ok) throw new Error(`Listing-price request failed with HTTP ${response.status}.`);
  return response.json() as Promise<PublicStoreListingPrice[]>;
}
