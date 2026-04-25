export const STORE_CART_STORAGE_KEY = 'blackbox.storeCart.v1';
export const STORE_CART_ADD_ITEM_EVENT = 'blackbox:store-cart:add-item';

export type StoreCartItem = {
  availabilityLabel: string;
  image: string | null;
  imageAlt: string | null;
  optionLabel: string | null;
  priceDisplay: string;
  storeItemSlug: string;
  subtitle: string;
  title: string;
  variantId: string;
};

export type StoreCartState = {
  item: StoreCartItem | null;
};

type StoreCartStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

const REQUIRED_STRING_FIELDS = [
  'availabilityLabel',
  'priceDisplay',
  'storeItemSlug',
  'subtitle',
  'title',
  'variantId',
] as const satisfies readonly (keyof StoreCartItem)[];

const OPTIONAL_STRING_FIELDS = ['image', 'imageAlt', 'optionLabel'] as const satisfies readonly (keyof StoreCartItem)[];

function readStringField(value: Record<string, unknown>, field: keyof StoreCartItem) {
  const fieldValue = value[field];
  return typeof fieldValue === 'string' ? fieldValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function createEmptyStoreCartState(): StoreCartState {
  return { item: null };
}

export function getStoreCartCount(state: StoreCartState): 0 | 1 {
  return state.item ? 1 : 0;
}

export function createStoreCartCheckoutPath(item: StoreCartItem): string {
  return `/store/${item.storeItemSlug}/checkout/`;
}

export function sanitizeStoreCartItem(value: unknown): StoreCartItem | null {
  if (!isRecord(value)) return null;

  const item = {} as StoreCartItem;
  for (const field of REQUIRED_STRING_FIELDS) {
    const fieldValue = readStringField(value, field);
    if (!fieldValue) return null;
    item[field] = fieldValue;
  }
  for (const field of OPTIONAL_STRING_FIELDS) {
    item[field] = readStringField(value, field);
  }

  return item;
}

export function addStoreCartItem(item: StoreCartItem): StoreCartState {
  const sanitizedItem = sanitizeStoreCartItem(item);
  return { item: sanitizedItem };
}

export function removeStoreCartItem(): StoreCartState {
  return createEmptyStoreCartState();
}

export function parseStoreCartState(serializedState: string | null): StoreCartState {
  if (!serializedState) return createEmptyStoreCartState();

  try {
    const parsedState = JSON.parse(serializedState) as unknown;
    if (!isRecord(parsedState)) return createEmptyStoreCartState();

    return { item: sanitizeStoreCartItem(parsedState.item) };
  } catch {
    return createEmptyStoreCartState();
  }
}

export function serializeStoreCartState(state: StoreCartState): string {
  return JSON.stringify({ item: sanitizeStoreCartItem(state.item) });
}

export function readStoreCartState(storage: StoreCartStorage | undefined): StoreCartState {
  if (!storage) return createEmptyStoreCartState();

  try {
    return parseStoreCartState(storage.getItem(STORE_CART_STORAGE_KEY));
  } catch {
    return createEmptyStoreCartState();
  }
}

export function writeStoreCartState(storage: StoreCartStorage | undefined, state: StoreCartState) {
  if (!storage) return;

  try {
    const cartCount = getStoreCartCount(state);
    if (cartCount === 0) {
      storage.removeItem(STORE_CART_STORAGE_KEY);
      return;
    }

    storage.setItem(STORE_CART_STORAGE_KEY, serializeStoreCartState(state));
  } catch {
    // Cart state is a browser convenience only; storage failures must not block checkout browsing.
  }
}
