export const GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE = 'txcd_99999999';
export const ELECTRONICALLY_SUPPLIED_SERVICES_STRIPE_TAX_CODE = 'txcd_10000000';

export type StoreItemTaxCategory = 'physical_goods';
export type PhysicalGoodsStripeTaxCode = typeof GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE;
export type RejectedStripeProductTaxCode = typeof ELECTRONICALLY_SUPPLIED_SERVICES_STRIPE_TAX_CODE;
export type StripeProductTaxCode = PhysicalGoodsStripeTaxCode | RejectedStripeProductTaxCode;

const stripeTaxCodeByTaxCategory = {
  physical_goods: GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE,
} satisfies Record<StoreItemTaxCategory, PhysicalGoodsStripeTaxCode>;

export function stripeTaxCodeForTaxCategory(taxCategory: StoreItemTaxCategory): PhysicalGoodsStripeTaxCode {
  return stripeTaxCodeByTaxCategory[taxCategory];
}

export function stripeTaxCodeForStoreItem(storeItem: {
  taxCategory: StoreItemTaxCategory;
}): PhysicalGoodsStripeTaxCode {
  return stripeTaxCodeForTaxCategory(storeItem.taxCategory);
}
