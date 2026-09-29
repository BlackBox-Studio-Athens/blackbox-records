import type { PublicStoreListingPrice } from '@/components/store/checkout/public-checkout-api';
import { resolvePublicCheckoutApiBaseUrl } from '@/components/store/checkout/public-checkout-api';

export const STORE_LISTING_PRICE_COPY = {
  loading: 'Checking price',
  unavailable: 'Price unavailable',
  availabilityLoading: 'Checking availability',
  availabilityUnknown: 'Availability unknown',
  soldOut: 'Sold Out',
  outOfStock: 'Out of Stock',
  currentlyUnavailable: 'Currently Unavailable',
} as const;

type ConnectStoreListingPricePresentationOptions = {
  readListingPrices?: (signal: AbortSignal) => Promise<PublicStoreListingPrice[]>;
  root?: ParentNode;
};

const placeholderSelector = '[data-store-listing-price]';
const availabilitySelector = '[data-store-listing-availability]';
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
}

export function connectStoreListingPricePresentation({
  readListingPrices = readPublicStoreListingPrices,
  root = document,
}: ConnectStoreListingPricePresentationOptions = {}): () => void {
  const placeholders = [...root.querySelectorAll<HTMLElement>(placeholderSelector)];
  const availabilityPlaceholders = [...root.querySelectorAll<HTMLElement>(availabilitySelector)];
  if (placeholders.length === 0 && availabilityPlaceholders.length === 0) return () => {};

  sanitizeStoreListingPricePlaceholders(root);
  const abortController = new AbortController();

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

        placeholder.removeAttribute('aria-busy');
        placeholder.dataset.storeListingAvailabilityState = recognizedState ?? 'unknown';
        placeholder.hidden = recognizedState === 'stocked';
        placeholder.textContent = recognizedState
          ? availabilityCopy[recognizedState]
          : STORE_LISTING_PRICE_COPY.availabilityUnknown;
      });
    });

  return () => abortController.abort();
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
