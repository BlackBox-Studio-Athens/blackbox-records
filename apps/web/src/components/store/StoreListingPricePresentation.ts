import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';
import { DIGITAL_RELEASE_BADGE } from '@blackbox/content-model';
import {
  formatStoreLowStockLabel,
  resolvePublicCheckoutApiBaseUrl,
} from '@/components/store/checkout/public-checkout-presentation';
import type { StoreItemCartSeed } from '@/components/store/checkout/StoreItemPurchaseActions';
import { preorderBadges } from '@/platform/lib/preorder-estimate';
import { availabilityChipText } from '@/platform/lib/availability-copy';

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
    toolbar.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = true;
      button.hidden = true;
    });
  });
  root.querySelectorAll<HTMLElement>('[data-store-artists]').forEach((host) => {
    const select = host.querySelector<HTMLSelectElement>('select');
    if (select) {
      select.disabled = true;
      select.value = '';
    }
    const fieldset = host.querySelector<HTMLFieldSetElement>('fieldset');
    if (fieldset) fieldset.disabled = true;
    host.querySelectorAll<HTMLInputElement>('input[name="store-artist"]').forEach((radio) => {
      radio.checked = radio.value === '';
      radio.toggleAttribute('checked', radio.value === '');
    });
  });
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
    button.textContent = STORE_LISTING_PRICE_COPY.buy;
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

// Cards are not islands, so the purchase code loads on the first press; the Worker offer stays the authority.
async function buyFromStoreCard(button: HTMLButtonElement, confirmationTimers: Map<HTMLButtonElement, number>) {
  if (button.disabled || button.getAttribute('aria-busy') === 'true') return;
  window.clearTimeout(confirmationTimers.get(button));
  button.setAttribute('aria-busy', 'true');
  button.textContent = STORE_LISTING_PRICE_COPY.adding;

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
        button.textContent = button.dataset.storeCardBuyLabel ?? STORE_LISTING_PRICE_COPY.buy;
      };
      confirmationTimers.set(button, window.setTimeout(resetLabel, purchase.STORE_ITEM_ADDED_CONFIRMATION_MS));
    }
  } catch {
    // The purchase code could not load: Buy stays available for another press.
  }
  button.removeAttribute('aria-busy');
  button.textContent = label;
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
  buyButtons.forEach((button) => button.addEventListener('click', handleBuyClick));

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
        button.dataset.storeCardBuyLabel = preorder ? STORE_LISTING_PRICE_COPY.preorder : STORE_LISTING_PRICE_COPY.buy;
        button.textContent = button.dataset.storeCardBuyLabel;
        button.classList.toggle('preorder-action', preorder);
        button.classList.toggle('purchase-action', buyable && !preorder);
      });
      document.dispatchEvent(new Event('blackbox:store-listing-applied'));
    });

  return () => {
    abortController.abort();
    buyButtons.forEach((button) => button.removeEventListener('click', handleBuyClick));
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
