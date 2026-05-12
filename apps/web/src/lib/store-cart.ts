export const STORE_CART_STORAGE_KEY = 'blackbox.storeCart.v2';
export const LEGACY_STORE_CART_STORAGE_KEY = 'blackbox.storeCart.v1';
export const STORE_CART_ADD_ITEM_EVENT = 'blackbox:store-cart:add-item';
export const STORE_CART_OPEN_REQUESTED_EVENT = 'blackbox:store-cart:open-requested';

export type CartLineItemSnapshot = {
  availabilityLabel: string;
  image: string | null;
  imageAlt: string | null;
  optionLabel: string | null;
  priceAmountMinor?: number | undefined;
  priceCurrencyCode?: string | undefined;
  priceDisplay: string;
  storeItemSlug: string;
  subtitle: string;
  title: string;
  variantId: string;
};

export type CartQuantity = number;

export type CartLine = CartLineItemSnapshot & {
  quantity: CartQuantity;
};

export type CartDraft = {
  lines: CartLine[];
};

export type StoreCartState = {
  lines: CartLine[];
  primaryLineItem: CartLineItemSnapshot | null;
};

type StoreCartStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

const REQUIRED_STRING_FIELDS = [
  'availabilityLabel',
  'priceDisplay',
  'storeItemSlug',
  'subtitle',
  'title',
  'variantId',
] as const satisfies readonly (keyof CartLineItemSnapshot)[];

const OPTIONAL_STRING_FIELDS = [
  'image',
  'imageAlt',
  'optionLabel',
] as const satisfies readonly (keyof CartLineItemSnapshot)[];

export const STORE_CART_MAX_QUANTITY = 9;
const CART_MONEY_FORMAT_LOCALE = 'en-US';

function readStringField(value: Record<string, unknown>, field: keyof CartLineItemSnapshot) {
  const fieldValue = value[field];
  return typeof fieldValue === 'string' ? fieldValue : null;
}

function readPositiveIntegerField(value: Record<string, unknown>, field: keyof CartLineItemSnapshot) {
  const fieldValue = value[field];
  return typeof fieldValue === 'number' && Number.isInteger(fieldValue) && fieldValue >= 0 ? fieldValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function createEmptyStoreCartState(): StoreCartState {
  return { primaryLineItem: null, lines: [] };
}

export function getStoreCartCount(state: StoreCartState): number {
  return normalizeStoreCartState(state).lines.reduce((total, line) => total + line.quantity, 0);
}

export function createCheckoutPathForCartLineItem(item: CartLineItemSnapshot): string {
  return `/store/${item.storeItemSlug}/checkout/`;
}

export function parseCartLineItemSnapshot(value: unknown): CartLineItemSnapshot | null {
  if (!isRecord(value)) return null;

  const lineItemSnapshot = {} as CartLineItemSnapshot;
  for (const field of REQUIRED_STRING_FIELDS) {
    const fieldValue = readStringField(value, field);
    if (!fieldValue) return null;
    lineItemSnapshot[field] = fieldValue;
  }
  for (const field of OPTIONAL_STRING_FIELDS) {
    lineItemSnapshot[field] = readStringField(value, field);
  }
  const priceAmountMinor = readPositiveIntegerField(value, 'priceAmountMinor');
  const priceCurrencyCode = readStringField(value, 'priceCurrencyCode')?.trim().toUpperCase() ?? null;
  if (priceAmountMinor !== null && priceCurrencyCode) {
    lineItemSnapshot.priceAmountMinor = priceAmountMinor;
    lineItemSnapshot.priceCurrencyCode = priceCurrencyCode;
  }

  return lineItemSnapshot;
}

export function sanitizeCartQuantity(value: unknown): CartQuantity {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  return Math.min(STORE_CART_MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

export function parseCartLine(value: unknown): CartLine | null {
  const lineItemSnapshot = parseCartLineItemSnapshot(value);
  if (!lineItemSnapshot) return null;

  const quantity = isRecord(value) ? sanitizeCartQuantity(value.quantity) : 1;
  return { ...lineItemSnapshot, quantity };
}

export function normalizeStoreCartState(state: StoreCartState | CartDraft): StoreCartState {
  const lines = Array.isArray(state.lines)
    ? state.lines.map(parseCartLine).filter((line): line is CartLine => line !== null)
    : [];
  const firstLine = lines[0] ?? null;
  const primaryLineItem = firstLine
    ? ({
        availabilityLabel: firstLine.availabilityLabel,
        image: firstLine.image,
        imageAlt: firstLine.imageAlt,
        optionLabel: firstLine.optionLabel,
        priceDisplay: firstLine.priceDisplay,
        storeItemSlug: firstLine.storeItemSlug,
        subtitle: firstLine.subtitle,
        title: firstLine.title,
        variantId: firstLine.variantId,
        ...(typeof firstLine.priceAmountMinor === 'number' && firstLine.priceCurrencyCode
          ? {
              priceAmountMinor: firstLine.priceAmountMinor,
              priceCurrencyCode: firstLine.priceCurrencyCode,
            }
          : {}),
      } satisfies CartLineItemSnapshot)
    : null;

  return { primaryLineItem, lines };
}

export function formatCartMoney(amountMinor: number, currencyCode: string): string {
  return new Intl.NumberFormat(CART_MONEY_FORMAT_LOCALE, {
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
    style: 'currency',
  }).format(amountMinor / 100);
}

export function getCartLineTotalDisplay(line: CartLine): string {
  if (typeof line.priceAmountMinor === 'number' && line.priceCurrencyCode) {
    return formatCartMoney(line.priceAmountMinor * line.quantity, line.priceCurrencyCode);
  }

  return line.quantity > 1 ? `${line.priceDisplay} x ${line.quantity}` : line.priceDisplay;
}

export function getCartSubtotalDisplay(lines: CartLine[]): string | null {
  if (!lines.length) return null;

  const currencyCode = lines[0]?.priceCurrencyCode;
  const canCalculateSubtotal = Boolean(
    currencyCode &&
    lines.every((line) => typeof line.priceAmountMinor === 'number' && line.priceCurrencyCode === currencyCode),
  );

  if (canCalculateSubtotal && currencyCode) {
    return formatCartMoney(
      lines.reduce((total, line) => total + (line.priceAmountMinor ?? 0) * line.quantity, 0),
      currencyCode,
    );
  }

  if (lines.length === 1) {
    return getCartLineTotalDisplay(lines[0]!);
  }

  return `${lines.reduce((total, line) => total + line.quantity, 0)} items`;
}

export function addStoreCartItem(
  lineItemSnapshot: CartLineItemSnapshot,
  state: StoreCartState = createEmptyStoreCartState(),
): StoreCartState {
  const parsedLineItemSnapshot = parseCartLineItemSnapshot(lineItemSnapshot);
  if (!parsedLineItemSnapshot) return normalizeStoreCartState(state);

  const currentState = normalizeStoreCartState(state);
  const existingLine = currentState.lines.find((line) => line.variantId === parsedLineItemSnapshot.variantId);

  if (existingLine) {
    return normalizeStoreCartState({
      lines: currentState.lines.map((line) =>
        line.variantId === parsedLineItemSnapshot.variantId
          ? { ...line, ...parsedLineItemSnapshot, quantity: sanitizeCartQuantity(line.quantity + 1) }
          : line,
      ),
    });
  }

  return normalizeStoreCartState({
    lines: [...currentState.lines, { ...parsedLineItemSnapshot, quantity: 1 }],
  });
}

export function setCartLineQuantityByVariant(
  variantId: string,
  quantity: unknown,
  state: StoreCartState = createEmptyStoreCartState(),
): StoreCartState {
  const sanitizedQuantity = sanitizeCartQuantity(quantity);
  const currentState = normalizeStoreCartState(state);

  return normalizeStoreCartState({
    lines: currentState.lines.map((line) =>
      line.variantId === variantId ? { ...line, quantity: sanitizedQuantity } : line,
    ),
  });
}

export function incrementCartLineQuantityByVariant(
  variantId: string,
  state: StoreCartState = createEmptyStoreCartState(),
): StoreCartState {
  const currentState = normalizeStoreCartState(state);
  const line = currentState.lines.find((candidate) => candidate.variantId === variantId);
  if (!line) return currentState;

  return setCartLineQuantityByVariant(variantId, line.quantity + 1, currentState);
}

export function decrementCartLineQuantityByVariant(
  variantId: string,
  state: StoreCartState = createEmptyStoreCartState(),
): StoreCartState {
  const currentState = normalizeStoreCartState(state);
  const line = currentState.lines.find((candidate) => candidate.variantId === variantId);
  if (!line) return currentState;

  if (line.quantity <= 1) return removeCartLineByVariant(variantId, currentState);

  return setCartLineQuantityByVariant(variantId, line.quantity - 1, currentState);
}

export function clearStoreCart(): StoreCartState {
  return createEmptyStoreCartState();
}

export function removeCartLineByVariant(
  variantId?: string,
  state: StoreCartState = createEmptyStoreCartState(),
): StoreCartState {
  if (!variantId) return createEmptyStoreCartState();

  return normalizeStoreCartState({
    lines: normalizeStoreCartState(state).lines.filter((line) => line.variantId !== variantId),
  });
}

export function parseSerializedStoreCartState(serializedState: string | null): StoreCartState {
  if (!serializedState) return createEmptyStoreCartState();

  try {
    const parsedState = JSON.parse(serializedState) as unknown;
    if (!isRecord(parsedState)) return createEmptyStoreCartState();

    if (Array.isArray(parsedState.lines)) {
      return normalizeStoreCartState({
        lines: parsedState.lines.map(parseCartLine).filter((line): line is CartLine => line !== null),
      });
    }

    const legacyLineItemSnapshot = parseCartLineItemSnapshot(parsedState.item);
    if (!legacyLineItemSnapshot) return createEmptyStoreCartState();

    return normalizeStoreCartState({ lines: [{ ...legacyLineItemSnapshot, quantity: 1 }] });
  } catch {
    return createEmptyStoreCartState();
  }
}

export function serializeStoreCartState(state: StoreCartState): string {
  return JSON.stringify({ lines: normalizeStoreCartState(state).lines });
}

export function readStoreCartState(storage: StoreCartStorage | undefined): StoreCartState {
  if (!storage) return createEmptyStoreCartState();

  try {
    return parseSerializedStoreCartState(
      storage.getItem(STORE_CART_STORAGE_KEY) ?? storage.getItem(LEGACY_STORE_CART_STORAGE_KEY),
    );
  } catch {
    return createEmptyStoreCartState();
  }
}

export function writeStoreCartState(storage: StoreCartStorage | undefined, state: StoreCartState) {
  if (!storage) return;

  try {
    const normalizedState = normalizeStoreCartState(state);
    const cartCount = getStoreCartCount(normalizedState);
    if (cartCount === 0) {
      storage.removeItem(STORE_CART_STORAGE_KEY);
      storage.removeItem(LEGACY_STORE_CART_STORAGE_KEY);
      return;
    }

    storage.setItem(STORE_CART_STORAGE_KEY, serializeStoreCartState(normalizedState));
    storage.removeItem(LEGACY_STORE_CART_STORAGE_KEY);
  } catch {
    // Cart state is a browser convenience only; storage failures must not block checkout browsing.
  }
}
