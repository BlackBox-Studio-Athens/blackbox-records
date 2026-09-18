import type { RequestIdentity } from './repositories/request-identity';

type CheckoutFingerprintLine = {
  quantity: number;
  storeItemSlug: string;
  variantId: string;
};

export function createCheckoutRequestFingerprint(input: {
  cancelUrl: string;
  lines: readonly CheckoutFingerprintLine[];
  newsletterOptIn?: boolean;
  successUrl: string;
}): string {
  const mergedLines = new Map<string, CheckoutFingerprintLine>();

  for (const line of input.lines) {
    const key = `${line.storeItemSlug}:${line.variantId}`;
    const existing = mergedLines.get(key);
    mergedLines.set(key, {
      quantity: (existing?.quantity ?? 0) + line.quantity,
      storeItemSlug: line.storeItemSlug,
      variantId: line.variantId,
    });
  }

  return JSON.stringify({
    cancelUrl: input.cancelUrl,
    lines: [...mergedLines.values()].sort(compareCheckoutLines),
    newsletterOptIn: input.newsletterOptIn === true,
    successUrl: input.successUrl,
    version: 1,
  });
}

export function createStockChangeRequestFingerprint(input: {
  notes: string | null;
  quantityDelta: number;
  reason: string;
  variantId: string;
}): string {
  return JSON.stringify({
    notes: input.notes,
    quantityDelta: input.quantityDelta,
    reason: input.reason,
    variantId: input.variantId,
    version: 1,
  });
}

export function createStockCountRequestFingerprint(input: {
  countedQuantity: number;
  expectedRevision: number | null;
  notes: string | null;
  onlineQuantity: number;
  variantId: string;
}): string {
  return JSON.stringify({
    countedQuantity: input.countedQuantity,
    expectedRevision: input.expectedRevision,
    notes: input.notes,
    onlineQuantity: input.onlineQuantity,
    variantId: input.variantId,
    version: 1,
  });
}

export async function createRequestIdentity(input: {
  idempotencyKey?: string;
  productEnvironment: string;
  requestFingerprint: string;
}): Promise<RequestIdentity | null> {
  const idempotencyKey = input.idempotencyKey?.trim();
  if (!idempotencyKey) return null;

  return {
    keyDigest: await sha256Hex(`idempotency-key:v1:${idempotencyKey}`),
    productEnvironment: input.productEnvironment,
    requestFingerprint: await sha256Hex(`request-fingerprint:v1:${input.requestFingerprint}`),
  };
}

function compareCheckoutLines(left: CheckoutFingerprintLine, right: CheckoutFingerprintLine): number {
  return (
    compareStrings(left.storeItemSlug, right.storeItemSlug) ||
    compareStrings(left.variantId, right.variantId) ||
    left.quantity - right.quantity
  );
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
