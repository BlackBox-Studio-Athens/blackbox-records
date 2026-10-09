export type TaxCollectionMode = 'STRIPE_AUTOMATIC_TAX' | 'NO_TAX_COLLECTED';

export const quantityBandPolicyReferences = Object.freeze({
  local: 'quantity-band-shipping-no-tax-collected-local-2026-10-09-v1',
  uat: 'quantity-band-shipping-no-tax-collected-uat-2026-10-09-v1',
  prd: 'quantity-band-shipping-no-tax-collected-prd-2026-10-09-v1',
});

// Immutable sale-time agreements. Never infer treatment from a name fragment or current settings.
const taxCollectionPolicies: Readonly<Record<string, TaxCollectionMode>> = Object.freeze({
  'synthetic-local-inclusive-v1': 'STRIPE_AUTOMATIC_TAX',
  'synthetic-uat-inclusive-v1': 'STRIPE_AUTOMATIC_TAX',
  'synthetic-v1': 'STRIPE_AUTOMATIC_TAX',
  'owner-assumed-vinyl-packing-inclusive-tariff-prd-2026-10-08-v1': 'STRIPE_AUTOMATIC_TAX',
  'synthetic-local-no-tax-collected-2026-10-09-v1': 'NO_TAX_COLLECTED',
  'synthetic-uat-no-tax-collected-2026-10-09-v1': 'NO_TAX_COLLECTED',
  'owner-assumed-vinyl-packing-no-tax-collected-prd-2026-10-09-v1': 'NO_TAX_COLLECTED',
  'owner-assumed-universal-packing-no-tax-collected-prd-2026-10-09-v1': 'NO_TAX_COLLECTED',
  [quantityBandPolicyReferences.local]: 'NO_TAX_COLLECTED',
  [quantityBandPolicyReferences.uat]: 'NO_TAX_COLLECTED',
  [quantityBandPolicyReferences.prd]: 'NO_TAX_COLLECTED',
});

export function resolveTaxCollectionMode(reference: string | null | undefined): TaxCollectionMode | null {
  return reference && Object.hasOwn(taxCollectionPolicies, reference) ? taxCollectionPolicies[reference]! : null;
}

export type AcceptedMonetaryPolicy = {
  acceptedDeliveryAmountMinor: number;
  acceptedParcelTier: 'small' | 'medium' | 'manual';
  monetaryPolicyReference: string;
};

export function isAcceptedDeliveryCategory(
  reference: string | null | undefined,
  category: string | null | undefined,
): category is AcceptedMonetaryPolicy['acceptedParcelTier'] {
  if (!resolveTaxCollectionMode(reference)) return false;
  return Object.values(quantityBandPolicyReferences).some((value) => value === reference)
    ? category === 'manual'
    : category === 'small' || category === 'medium';
}

export type OrderMonetarySnapshot = {
  merchandiseGrossMinor: number;
  deliveryGrossMinor: number;
  deliveryVatMinor: number;
  totalVatMinor: number;
};

export type OrderMonetaryFields = {
  [Key in keyof (AcceptedMonetaryPolicy & OrderMonetarySnapshot)]?:
    (AcceptedMonetaryPolicy & OrderMonetarySnapshot)[Key] | null;
};
