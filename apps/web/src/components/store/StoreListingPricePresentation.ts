import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';
import {
  formatStoreLowStockLabel,
  resolvePublicCheckoutApiBaseUrl,
} from '@/components/store/checkout/public-checkout-api';
import type { StoreItemCartSeed } from '@/components/store/checkout/StoreItemPurchaseActions';

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
} as const;

type ConnectStoreListingPricePresentationOptions = {
  readListingPrices?: (signal: AbortSignal) => Promise<PublicStoreListingPrice[]>;
  root?: ParentNode;
};

const placeholderSelector = '[data-store-listing-price]';
const availabilitySelector = '[data-store-listing-availability]';
const buySelector = '[data-store-card-buy]';
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
    button.textContent = STORE_LISTING_PRICE_COPY.buy;
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

  let label: string = STORE_LISTING_PRICE_COPY.buy;
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
        button.textContent = STORE_LISTING_PRICE_COPY.buy;
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
      });

      // The projection only decides whether Buy is offered; pressing it reads the authoritative offer.
      buyButtons.forEach((button) => {
        const record = recordsBySlug.get(button.dataset.storeItemSlug || '');
        button.hidden = !(record?.presentationState === 'ready' && record.availabilityState === 'stocked');
      });
    });

  return () => {
    abortController.abort();
    buyButtons.forEach((button) => button.removeEventListener('click', handleBuyClick));
    confirmationTimers.forEach((timer) => window.clearTimeout(timer));
  };
}

export async function readPublicStoreListingPrices(signal?: AbortSignal): Promise<PublicStoreListingPrice[]> {
  const backendBaseUrl = resolvePublicCheckoutApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${backendBaseUrl}/api/store/listing-prices`, {
    headers: { accept: 'application/json' },
    signal: signal ?? null,
  });

  if (!response.ok) throw new Error(`Listing-price request failed with HTTP ${response.status}.`);
  return response.json() as Promise<PublicStoreListingPrice[]>;
}
