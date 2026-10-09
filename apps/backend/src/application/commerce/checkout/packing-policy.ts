import type { ItemPackingProfile, PackagePackingProfile, PackingPolicy } from './packing';
import { deliveryCharges } from '@blackbox/api-client/public';

export { deliveryCharges, priceDisclosure, taxCollectionDisclosure } from '@blackbox/api-client/public';

export const hostedMonetaryPolicyReference = 'owner-assumed-vinyl-packing-no-tax-collected-prd-2026-10-09-v1';

export function currentMonetaryPolicyReference(target: 'local' | 'uat' | 'prd'): string {
  return target === 'prd'
    ? hostedMonetaryPolicyReference
    : target === 'uat'
      ? 'synthetic-uat-no-tax-collected-2026-10-09-v1'
      : 'synthetic-local-no-tax-collected-2026-10-09-v1';
}

// Owner-authorized assumptions for the explicitly assigned LP editions; real measurements remain unknown.
const assumedReference = { measurementReference: 'owner-assumed-vinyl-parcel-2026-10-08' };
const assumedItemProfile: ItemPackingProfile = {
  ...assumedReference,
  lengthMm: 315,
  widthMm: 315,
  thicknessMm: 8,
  weightGrams: 220,
};
const assumedPackages: PackagePackingProfile[] = [
  {
    ...assumedReference,
    tier: 'small',
    innerLengthMm: 330,
    innerWidthMm: 330,
    innerHeightMm: 65,
    outerLengthMm: 340,
    outerWidthMm: 340,
    outerHeightMm: 75,
    tareGrams: 150,
    maxGrossWeightGrams: 2000,
  },
  {
    ...assumedReference,
    tier: 'medium',
    innerLengthMm: 330,
    innerWidthMm: 330,
    innerHeightMm: 155,
    outerLengthMm: 340,
    outerWidthMm: 340,
    outerHeightMm: 165,
    tareGrams: 250,
    maxGrossWeightGrams: 5000,
  },
];
const assumedItems = new Map<string, ItemPackingProfile>([
  ['variant_disintegration-black-vinyl-lp_standard', assumedItemProfile],
  ['variant_barren-point_standard', assumedItemProfile],
]);
const syntheticReference = { measurementReference: 'synthetic-test-2026-09-11', synthetic: true };
const syntheticItemProfile = { ...assumedItemProfile, ...syntheticReference };
const syntheticPackages = assumedPackages.map((pack) => ({ ...pack, ...syntheticReference }));

export function createPackingPolicy(target: 'local' | 'uat' | 'prd' = 'prd', stripeTestMode = false): PackingPolicy {
  const allowSynthetic = target === 'local' || (target === 'uat' && stripeTestMode);
  return {
    allowSynthetic,
    charges: deliveryCharges,
    items: allowSynthetic
      ? { get: () => syntheticItemProfile }
      : target === 'prd'
        ? assumedItems
        : new Map<string, ItemPackingProfile>(),
    packages: allowSynthetic ? syntheticPackages : target === 'prd' ? assumedPackages : [],
  };
}
