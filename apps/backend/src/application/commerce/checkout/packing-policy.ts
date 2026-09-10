import { currentCatalogProductProjectionEntries } from '../catalog-sync';
import type { ItemPackingProfile, PackagePackingProfile, PackingPolicy } from './packing';

export const deliveryCharges = { small: 250, medium: 350 };
export const vatDisclosure = 'VAT included. Shipping calculated in your cart.';

// Replace with measured, explicitly assigned profiles before production acceptance.
const measuredItems = new Map<string, ItemPackingProfile>();
const measuredPackages: PackagePackingProfile[] = [];
export const hostedMonetaryPolicyReference: string | null = null;

const syntheticReference = { measurementReference: 'synthetic-test-2026-09-11', synthetic: true };
export const syntheticItemProfile: ItemPackingProfile = {
  ...syntheticReference,
  lengthMm: 315,
  widthMm: 315,
  thicknessMm: 8,
  weightGrams: 220,
};
export const syntheticPackages: PackagePackingProfile[] = [
  {
    ...syntheticReference,
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
    ...syntheticReference,
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

export function createPackingPolicy(target: 'local' | 'uat' | 'prd' = 'prd', stripeTestMode = false): PackingPolicy {
  const allowSynthetic = target === 'local' || (target === 'uat' && stripeTestMode);
  return {
    allowSynthetic,
    charges: deliveryCharges,
    items: allowSynthetic
      ? new Map(currentCatalogProductProjectionEntries.map(({ variantId }) => [variantId, syntheticItemProfile]))
      : measuredItems,
    packages: allowSynthetic ? syntheticPackages : measuredPackages,
  };
}
