import { describe, expect, it } from 'vitest';

import {
  ELECTRONICALLY_SUPPLIED_SERVICES_STRIPE_TAX_CODE,
  GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE,
  stripeTaxCodeForStoreItem,
  stripeTaxCodeForTaxCategory,
  type PhysicalGoodsStripeTaxCode,
  type StoreItemTaxCategory,
} from './store-tax-category';

describe('store item tax category Stripe Tax policy', () => {
  it('maps physical goods to General - Tangible Goods', () => {
    expect(stripeTaxCodeForTaxCategory('physical_goods')).toBe(GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE);
    expect(stripeTaxCodeForStoreItem({ taxCategory: 'physical_goods' })).toBe(GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE);
  });

  it('keeps tax categories and Stripe tax-code mappings exhaustive at compile time', () => {
    const taxCodeByTaxCategory = {
      physical_goods: GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE,
    } satisfies Record<StoreItemTaxCategory, PhysicalGoodsStripeTaxCode>;

    expect(taxCodeByTaxCategory.physical_goods).toBe(GENERAL_TANGIBLE_GOODS_STRIPE_TAX_CODE);
  });

  it('keeps the digital services code named only as an explicit rejection case', () => {
    expect(ELECTRONICALLY_SUPPLIED_SERVICES_STRIPE_TAX_CODE).toBe('txcd_10000000');
    expect(stripeTaxCodeForTaxCategory('physical_goods')).not.toBe(ELECTRONICALLY_SUPPLIED_SERVICES_STRIPE_TAX_CODE);
  });
});
