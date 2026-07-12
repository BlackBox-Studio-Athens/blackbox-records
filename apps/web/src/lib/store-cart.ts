import { z } from 'zod';

import { createMoney, formatMoney, moneyToCurrencyCode, moneyToMinorAmount } from './money';
export { STORE_CART_ADD_ITEM_EVENT, STORE_CART_OPEN_REQUESTED_EVENT } from './store-cart-events';

export const STORE_CART_STORAGE_KEY = 'blackbox.storeCart.v2';
const LEGACY_STORE_CART_STORAGE_KEY = 'blackbox.storeCart.v1';
export const STORE_CART_MAX_QUANTITY = 9;

const cartQuantitySchema = z.number().int().min(1).max(STORE_CART_MAX_QUANTITY).brand<'CartQuantity'>();

export type CartLineItemSnapshot = {
  availabilityLabel: string;
  image: string | null;
  imageAlt: string | null;
  optionLabel: string | null;
  priceAmountMinor: number | null;
  priceCurrencyCode: string;
  priceDisplay: string;
  priceKind: 'fixed' | 'pay_what_you_want';
  storeItemSlug: string;
  subtitle: string;
  title: string;
  variantId: string;
};

export type CartQuantity = z.infer<typeof cartQuantitySchema>;

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

const CART_MONEY_FORMAT_LOCALE = 'en-US';
const CUSTOM_PRICE_SUBTOTAL_DISPLAY = 'Set in Checkout';

const nullableStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const cartLineItemSnapshotSchema = z
  .object({
    availabilityLabel: z.string().trim().min(1),
    image: nullableStringSchema,
    imageAlt: nullableStringSchema,
    optionLabel: nullableStringSchema,
    priceAmountMinor: z.number().int().min(0).nullable(),
    priceCurrencyCode: z.string().trim().length(3),
    priceDisplay: z.string().trim().min(1),
    priceKind: z.enum(['fixed', 'pay_what_you_want']).optional(),
    storeItemSlug: z.string().trim().min(1),
    subtitle: z.string(),
    title: z.string().trim().min(1),
    variantId: z.string().trim().min(1),
  })
  .transform((snapshot, context): CartLineItemSnapshot => {
    const priceKind = snapshot.priceKind ?? 'fixed';

    if (priceKind === 'pay_what_you_want') {
      return {
        ...snapshot,
        priceAmountMinor: null,
        priceCurrencyCode: snapshot.priceCurrencyCode.toUpperCase(),
        priceKind,
      };
    }

    if (snapshot.priceAmountMinor === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Fixed cart line price amount is missing.' });
      return z.NEVER;
    }

    const price = createMoney({ amountMinor: snapshot.priceAmountMinor, currencyCode: snapshot.priceCurrencyCode });
    return {
      ...snapshot,
      priceAmountMinor: moneyToMinorAmount(price),
      priceCurrencyCode: moneyToCurrencyCode(price),
      priceKind,
    };
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function createEmptyStoreCartState(): StoreCartState {
  return { primaryLineItem: null, lines: [] };
}

export function getStoreCartCount(state: StoreCartState): number {
  return normalizeStoreCartState(state).lines.reduce((total, line) => total + line.quantity, 0);
}

export function createCartCheckoutPath(): string {
  return '/store/checkout/';
}

export function parseCartLineItemSnapshot(value: unknown): CartLineItemSnapshot | null {
  const result = cartLineItemSnapshotSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function createCartQuantity(value: unknown): CartQuantity {
  return cartQuantitySchema.parse(value);
}

function sanitizeCartQuantity(value: unknown): CartQuantity {
  if (typeof value !== 'number' || !Number.isFinite(value)) return createCartQuantity(1);
  return createCartQuantity(Math.min(STORE_CART_MAX_QUANTITY, Math.max(1, Math.floor(value))));
}

function parseCartLine(value: unknown): CartLine | null {
  const lineItemSnapshot = parseCartLineItemSnapshot(value);
  if (!lineItemSnapshot) return null;

  const quantity = isRecord(value) ? sanitizeCartQuantity(value.quantity) : createCartQuantity(1);
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
        priceKind: firstLine.priceKind,
        priceDisplay: firstLine.priceDisplay,
        storeItemSlug: firstLine.storeItemSlug,
        subtitle: firstLine.subtitle,
        title: firstLine.title,
        variantId: firstLine.variantId,
        priceAmountMinor: firstLine.priceAmountMinor,
        priceCurrencyCode: firstLine.priceCurrencyCode,
      } satisfies CartLineItemSnapshot)
    : null;

  return { primaryLineItem, lines };
}

function formatCartMoney(amountMinor: number, currencyCode: string): string {
  return formatMoney(createMoney({ amountMinor, currencyCode }), CART_MONEY_FORMAT_LOCALE);
}

export function getCartLineTotalDisplay(line: CartLine): string {
  if (line.priceKind === 'pay_what_you_want' || line.priceAmountMinor === null) {
    return line.priceDisplay;
  }

  return formatCartMoney(line.priceAmountMinor * line.quantity, line.priceCurrencyCode);
}

export function getCartSubtotalDisplay(lines: CartLine[]): string | null {
  if (!lines.length) return null;
  if (lines.some((line) => line.priceKind === 'pay_what_you_want' || line.priceAmountMinor === null)) {
    return CUSTOM_PRICE_SUBTOTAL_DISPLAY;
  }

  const currencyCode = lines[0]?.priceCurrencyCode;
  const canCalculateSubtotal = Boolean(currencyCode && lines.every((line) => line.priceCurrencyCode === currencyCode));

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
    lines: [...currentState.lines, { ...parsedLineItemSnapshot, quantity: createCartQuantity(1) }],
  });
}

function setCartLineQuantityByVariant(
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

    return normalizeStoreCartState({ lines: [{ ...legacyLineItemSnapshot, quantity: createCartQuantity(1) }] });
  } catch {
    return createEmptyStoreCartState();
  }
}

function serializeStoreCartState(state: StoreCartState): string {
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
