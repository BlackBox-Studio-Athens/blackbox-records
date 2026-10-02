import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';
import {
  formatStoreLowStockLabel,
  resolvePublicCheckoutApiBaseUrl,
} from '@/components/store/checkout/public-checkout-presentation';
import type { StoreItemCartSeed } from '@/components/store/checkout/StoreItemPurchaseActions';
import { preorderBadges } from '@/platform/lib/preorder-estimate';

export const STORE_LISTING_PRICE_COPY = {
  loading: 'Checking price',
  unavailable: 'Price unavailable',
  availabilityLoading: 'Checking availability',
  availabilityUnknown: 'Availability unknown',
  soldOut: 'Sold Out',
  outOfStock: 'Out of Stock',
  currentlyUnavailable: 'Currently Unavailable',
  buy: 'Buy',
  adding: 'Adding',
  preorder: 'Pre-order',
  outNow: 'Out now',
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
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-controls]').forEach((controls) => {
    controls.hidden = false;
    controls.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = true;
    });
  });
}

const availabilityCopy: Record<PublicStoreListingPrice['availabilityState'], string> = {
  stocked: '',
  sold_out: STORE_LISTING_PRICE_COPY.soldOut,
  out_of_stock: STORE_LISTING_PRICE_COPY.outOfStock,
  unavailable: STORE_LISTING_PRICE_COPY.currentlyUnavailable,
};

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
    button.removeAttribute('aria-busy');
    button.classList.remove('preorder-action');
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

// Status is information, not a control: the card says why it cannot be bought and focus stays in the card.
function showStoreCardStatus(button: HTMLButtonElement, label: string, statusTone: 'neutral' | 'sold-out') {
  const status = button.parentElement?.querySelector<HTMLElement>(availabilitySelector);
  if (status) {
    status.hidden = false;
    status.dataset.storeListingAvailabilityState = statusTone === 'sold-out' ? 'sold_out' : 'unavailable';
    status.textContent = label;
  }
  button.hidden = true;
  button.closest('.store-item-card--listing')?.querySelector<HTMLElement>('.prose-card-link')?.focus();
}

// Cards are not islands, so the purchase code loads on the first press; the Worker offer stays the authority.
async function buyFromStoreCard(button: HTMLButtonElement, confirmationTimers: Map<HTMLButtonElement, number>) {
  if (button.getAttribute('aria-busy') === 'true') return;
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
      showStoreCardStatus(button, result.label ?? STORE_LISTING_PRICE_COPY.currentlyUnavailable, result.statusTone);
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
        const availabilityState = record && 'availabilityState' in record ? record.availabilityState : undefined;
        const recognizedState =
          typeof availabilityState === 'string' && Object.hasOwn(availabilityCopy, availabilityState)
            ? (availabilityState as PublicStoreListingPrice['availabilityState'])
            : undefined;

        const lowStockLabel =
          recognizedState === 'stocked' && record?.presentationState === 'ready'
            ? formatStoreLowStockLabel(record.lowStockQuantity)
            : null;

        placeholder.removeAttribute('aria-busy');
        placeholder.dataset.storeListingAvailabilityState = lowStockLabel
          ? 'low_stock'
          : (recognizedState ?? 'unknown');
        placeholder.hidden = recognizedState === 'stocked' && !lowStockLabel;
        placeholder.textContent =
          lowStockLabel ??
          (recognizedState ? availabilityCopy[recognizedState] : STORE_LISTING_PRICE_COPY.availabilityUnknown);

        const card = placeholder.closest<HTMLElement>('.store-item-card--listing');
        if (card && record?.preorder) {
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
        button.hidden = !(record?.presentationState === 'ready' && record.availabilityState === 'stocked');
        button.dataset.storeCardBuyLabel = record?.preorder
          ? STORE_LISTING_PRICE_COPY.preorder
          : STORE_LISTING_PRICE_COPY.buy;
        button.textContent = button.dataset.storeCardBuyLabel;
        button.classList.toggle('preorder-action', Boolean(record?.preorder));
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
