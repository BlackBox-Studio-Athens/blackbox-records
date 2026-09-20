import os from 'node:os';

// Keep this list explicit: a new application/domain test stays in Workers until reviewed.
export const backendNodeTestFiles = [
  'test/application/email/email-application.test.ts',
  'test/application/email/services-inquiry.test.ts',
  'test/application/email/paid-order-email.test.ts',
  'test/application/commerce/stock/stock-use-cases.test.ts',
  'test/application/commerce/checkout/packing.test.ts',
  'test/application/commerce/checkout/checkout-use-cases.test.ts',
  'test/application/commerce/checkout/checkout-reconciliation.test.ts',
  'test/application/commerce/catalog-sync/field-ownership.test.ts',
  'test/application/commerce/catalog-sync/catalog-reconciler.test.ts',
  'test/application/commerce/orders/non-paid-checkout-reconciliation.test.ts',
  'test/application/commerce/orders/order-readback.test.ts',
  'test/application/commerce/orders/order-state.test.ts',
  'test/application/commerce/orders/paid-order-delivery.test.ts',
  'test/application/commerce/orders/paid-order-delivery-processing.test.ts',
  'test/application/commerce/orders/order-reference-token.test.ts',
  'test/application/commerce/orders/paid-checkout-reconciliation.test.ts',
  'test/application/commerce/orders/order-use-cases.test.ts',
  'test/application/commerce/readers/store-offer-reader.test.ts',
  'test/application/commerce/readers/store-listing-price-reader.test.ts',
  'test/domain/commerce/value-objects.test.ts',
  'test/domain/commerce/repositories/paid-checkout-fulfillment.test.ts',
] as const;

export function resolveBackendWorkerMaxWorkers({
  override = process.env.BLACKBOX_BACKEND_WORKERS,
  cpuCount = os.cpus().length,
  memoryBytes = os.totalmem(),
} = {}) {
  if (override !== undefined && !/^[1-3]$/.test(override.trim())) {
    throw new Error('BLACKBOX_BACKEND_WORKERS must be 1, 2, or 3.');
  }
  if (override !== undefined) return Number(override);
  return cpuCount >= 6 && memoryBytes >= 24 * 1024 ** 3 ? 3 : 2;
}
