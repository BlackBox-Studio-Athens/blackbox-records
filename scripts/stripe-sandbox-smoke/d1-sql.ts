import type { LocalCheckoutOrderRow, RemoteD1ReadinessSummary } from '../smoke-stripe-sandbox';
import { smokeVariantId } from './constants';

type D1JsonResult = Array<{
  results?: unknown;
  success?: boolean;
}>;

export function createRemoteD1ReadinessSql(): string {
  return [
    'SELECT',
    '  (SELECT COUNT(*) FROM "VariantStripeMapping" WHERE "stripePriceId" LIKE \'price_%\' AND "stripePriceId" NOT LIKE \'price_mock_%\') AS "realStripeMappingCount",',
    '  (SELECT COUNT(*) FROM "Stock" WHERE "onlineQuantity" > 0) AS "availableStockCount",',
    `  (SELECT COALESCE(MAX("onlineQuantity"), 0) FROM "Stock" WHERE "variantId" = '${smokeVariantId}') AS "smokeVariantOnlineQuantity",`,
    `  (SELECT COALESCE(MAX("canBuy"), 0) FROM "ItemAvailability" WHERE "variantId" = '${smokeVariantId}') AS "smokeVariantCanBuy",`,
    '  (SELECT COUNT(*) FROM "CheckoutOrder") AS "checkoutOrderCount";',
  ].join('\n');
}

export function createSandboxSmokeStockTopUpSql(minimumQuantity: number): string {
  if (!Number.isInteger(minimumQuantity) || minimumQuantity < 1) {
    throw new Error('Sandbox smoke stock top-up quantity must be a positive integer.');
  }

  return [
    'UPDATE "Stock"',
    'SET',
    `  "quantity" = CASE WHEN "quantity" < ${minimumQuantity} THEN ${minimumQuantity} ELSE "quantity" END,`,
    `  "onlineQuantity" = CASE WHEN "onlineQuantity" < ${minimumQuantity} THEN ${minimumQuantity} ELSE "onlineQuantity" END,`,
    '  "updatedAt" = CURRENT_TIMESTAMP',
    `WHERE "variantId" = '${smokeVariantId}';`,
    '',
    'UPDATE "ItemAvailability"',
    'SET',
    '  "status" = \'available\',',
    '  "canBuy" = 1,',
    '  "updatedAt" = CURRENT_TIMESTAMP',
    `WHERE "variantId" = '${smokeVariantId}';`,
  ].join('\n');
}

export function createCheckoutOrderBySessionSql(checkoutSessionId: string): string {
  return [
    'SELECT',
    '  "id",',
    '  "checkoutSessionId",',
    '  "stripePaymentIntentId",',
    '  "shippingLockerId",',
    '  "shippingLockerCountryCode",',
    '  "shippingLockerNameOrLabel",',
    '  "status",',
    '  "createdAt",',
    '  "updatedAt",',
    '  "paidAt",',
    '  "notPaidAt",',
    '  "needsReviewAt"',
    'FROM "CheckoutOrder"',
    `WHERE "checkoutSessionId" = '${escapeSqlLiteral(checkoutSessionId)}'`,
    'LIMIT 1;',
  ].join('\n');
}

export function parseD1CheckoutOrderRows(jsonText: string): LocalCheckoutOrderRow[] {
  const parsed = JSON.parse(jsonText) as D1JsonResult;
  const firstResult = parsed[0];

  if (!firstResult?.success || !Array.isArray(firstResult.results)) {
    throw new Error('Wrangler did not return a successful D1 result set.');
  }

  return firstResult.results.map(toCheckoutOrderRow);
}

export function parseRemoteD1ReadinessSummary(jsonText: string): RemoteD1ReadinessSummary {
  const parsed = JSON.parse(jsonText) as D1JsonResult;
  const firstResult = parsed[0];
  const row = Array.isArray(firstResult?.results) ? firstResult.results[0] : null;

  if (!firstResult?.success || !row || typeof row !== 'object') {
    throw new Error('Wrangler did not return UAT D1 readiness rows.');
  }

  return {
    availableStockCount: readNumberField(row, 'availableStockCount'),
    checkoutOrderCount: readNumberField(row, 'checkoutOrderCount'),
    realStripeMappingCount: readNumberField(row, 'realStripeMappingCount'),
    smokeVariantCanBuy: readNumberField(row, 'smokeVariantCanBuy') === 1,
    smokeVariantOnlineQuantity: readNumberField(row, 'smokeVariantOnlineQuantity'),
  };
}

function readNumberField(row: object, field: keyof RemoteD1ReadinessSummary): number {
  const value = (row as Record<string, unknown>)[field];

  return typeof value === 'number' ? value : Number(value ?? 0);
}

function toCheckoutOrderRow(value: unknown): LocalCheckoutOrderRow {
  if (!value || typeof value !== 'object') {
    throw new Error('D1 returned a non-object checkout order row.');
  }

  const row = value as Record<string, unknown>;

  return {
    checkoutSessionId: readString(row, 'checkoutSessionId'),
    createdAt: readString(row, 'createdAt'),
    id: readString(row, 'id'),
    needsReviewAt: readNullableString(row, 'needsReviewAt'),
    notPaidAt: readNullableString(row, 'notPaidAt'),
    paidAt: readNullableString(row, 'paidAt'),
    shippingLockerCountryCode: readNullableString(row, 'shippingLockerCountryCode'),
    shippingLockerId: readNullableString(row, 'shippingLockerId'),
    shippingLockerNameOrLabel: readNullableString(row, 'shippingLockerNameOrLabel'),
    status: parseOrderStatus(readString(row, 'status')),
    stripePaymentIntentId: readNullableString(row, 'stripePaymentIntentId'),
    updatedAt: readString(row, 'updatedAt'),
  };
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];

  if (typeof value !== 'string') {
    throw new Error(`D1 checkout order row is missing string field ${key}.`);
  }

  return value;
}

function readNullableString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`D1 checkout order row has invalid nullable string field ${key}.`);
  }

  return value;
}

function parseOrderStatus(value: string): LocalCheckoutOrderRow['status'] {
  if (value === 'needs_review' || value === 'not_paid' || value === 'paid' || value === 'pending_payment') {
    return value;
  }

  throw new Error(`Unexpected checkout order status: ${value}`);
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}
