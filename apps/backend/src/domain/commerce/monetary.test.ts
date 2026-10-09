import { describe, expect, it } from 'vitest';
import { resolveTaxCollectionMode, isAcceptedDeliveryCategory, quantityBandPolicyReferences } from './monetary';

describe('sale-time tax collection policies', () => {
  it.each([
    'synthetic-local-inclusive-v1',
    'synthetic-uat-inclusive-v1',
    'synthetic-v1',
    'owner-assumed-vinyl-packing-inclusive-tariff-prd-2026-10-08-v1',
  ])('retains inclusive agreement %s', (reference) => {
    expect(resolveTaxCollectionMode(reference)).toBe('STRIPE_AUTOMATIC_TAX');
  });
  it.each([
    'synthetic-local-no-tax-collected-2026-10-09-v1',
    ...Object.values(quantityBandPolicyReferences),
    'synthetic-uat-no-tax-collected-2026-10-09-v1',
    'owner-assumed-vinyl-packing-no-tax-collected-prd-2026-10-09-v1',
    'owner-assumed-universal-packing-no-tax-collected-prd-2026-10-09-v1',
  ])('recognizes explicit no-collection agreement %s', (reference) => {
    expect(resolveTaxCollectionMode(reference)).toBe('NO_TAX_COLLECTED');
  });
  it('keeps manual classification specific to the new explicit policy references', () => {
    for (const reference of Object.values(quantityBandPolicyReferences)) {
      expect(isAcceptedDeliveryCategory(reference, 'manual')).toBe(true);
      expect(isAcceptedDeliveryCategory(reference, 'small')).toBe(false);
      expect(isAcceptedDeliveryCategory(reference, null)).toBe(false);
    }
    expect(isAcceptedDeliveryCategory('synthetic-local-inclusive-v1', 'small')).toBe(true);
    expect(isAcceptedDeliveryCategory('synthetic-local-inclusive-v1', 'manual')).toBe(false);
    expect(isAcceptedDeliveryCategory('invented', 'manual')).toBe(false);
  });
  it.each([
    null,
    undefined,
    '',
    ' ',
    'toString',
    '__proto__',
    'new-inclusive-v1',
    'synthetic-uat-no-tax-collected-2026-10-09-v1-modified',
  ])('does not infer a mode for %s', (reference) => {
    expect(resolveTaxCollectionMode(reference)).toBeNull();
  });
});
