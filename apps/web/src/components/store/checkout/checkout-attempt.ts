import type { CartLine } from '@/components/store/cart/store-cart';
import type { BoxNowLocker } from './boxnow-locker';

export const checkoutAttemptKey = 'blackbox-checkout-attempt';

type CheckoutAttempt = {
  fingerprint: string;
  idempotencyKey: string;
};

type CheckoutAttemptInput = {
  lines: CartLine[];
  /** A changed locker must start a new attempt; the Worker refuses a reused key with a different body. */
  locker?: BoxNowLocker | 'fallback' | undefined;
  newsletterOptIn: boolean;
  storeItemSlug: string;
  variantId: string;
};

export function checkoutAttemptFingerprint(input: CheckoutAttemptInput): string {
  const merged = new Map<string, { quantity: number; storeItemSlug: string; variantId: string }>();
  for (const line of input.lines) {
    const key = line.storeItemSlug + ':' + line.variantId;
    const current = merged.get(key);
    merged.set(key, {
      quantity: (current?.quantity ?? 0) + line.quantity,
      storeItemSlug: line.storeItemSlug,
      variantId: line.variantId,
    });
  }

  return JSON.stringify({
    lines: [...merged.values()].sort(
      (left, right) =>
        left.storeItemSlug.localeCompare(right.storeItemSlug) || left.variantId.localeCompare(right.variantId),
    ),
    ...(input.locker ? { locker: input.locker } : {}),
    newsletterOptIn: input.newsletterOptIn,
    returnContext:
      typeof window === 'undefined' ? '' : window.location.origin + window.location.pathname + window.location.search,
    storeItemSlug: input.storeItemSlug,
    variantId: input.variantId,
    version: 1,
  });
}

export function getOrCreateCheckoutAttempt(input: CheckoutAttemptInput, storage: Storage = sessionStorage): string {
  const fingerprint = checkoutAttemptFingerprint(input);
  try {
    const current = readCheckoutAttempt(storage);
    if (current?.fingerprint === fingerprint) return current.idempotencyKey;

    const next = { fingerprint, idempotencyKey: crypto.randomUUID() };
    storage.setItem(checkoutAttemptKey, JSON.stringify(next));
    return next.idempotencyKey;
  } catch {
    return crypto.randomUUID();
  }
}

export function clearCheckoutAttempt(storage: Storage = sessionStorage): void {
  try {
    storage.removeItem(checkoutAttemptKey);
  } catch {
    // Session storage is optional; the Worker remains the authority.
  }
}

function readCheckoutAttempt(storage: Storage): CheckoutAttempt | null {
  const parsed: unknown = JSON.parse(storage.getItem(checkoutAttemptKey) ?? 'null');
  if (!parsed || typeof parsed !== 'object') return null;
  const value = parsed as Partial<CheckoutAttempt>;
  return typeof value.fingerprint === 'string' && typeof value.idempotencyKey === 'string'
    ? (value as CheckoutAttempt)
    : null;
}
