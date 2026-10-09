import { describe, expect, it } from 'vitest';

import { quoteDelivery, type PackingPolicy } from './packing';
import { createPackingPolicy, currentMonetaryPolicyReference, hostedMonetaryPolicyReference } from './packing-policy';

const reference = { measurementReference: 'synthetic-design-example-2026-09-11', synthetic: true };
const record = { ...reference, lengthMm: 315, widthMm: 315, thicknessMm: 8, weightGrams: 220 };
const policy: PackingPolicy = {
  allowSynthetic: true,
  charges: { small: 250, medium: 350 },
  items: new Map([
    ['record', record],
    ['cd', { ...reference, lengthMm: 142, widthMm: 125, thicknessMm: 12, weightGrams: 110 }],
  ]),
  packages: [
    {
      ...reference,
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
      ...reference,
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
  ],
};
const records = (quantity: number) => [{ variantId: 'record', quantity }];

describe('protected flat-stack Delivery Charge', () => {
  it('keeps catch-all synthetic packing limited to Local and test-mode UAT', () => {
    for (const target of ['local', 'uat', 'prd'] as const) {
      for (const testMode of [false, true]) {
        const configured = createPackingPolicy(target, testMode);
        expect(configured.allowSynthetic).toBe(target === 'local' || (target === 'uat' && testMode));
        const variantId = 'variant_new_runtime_item';
        const quote = quoteDelivery([{ variantId, quantity: 1 }], configured);
        expect(configured.items.get(variantId)?.synthetic === true).toBe(configured.allowSynthetic);
        expect(quote?.amountMinor ?? null).toBe(target !== 'uat' || testMode ? 300 : null);
      }
    }
  });
  it('preserves both previously supported PRD LPs at the Small and Medium boundary', () => {
    const configured = { ...createPackingPolicy('prd'), quantityBased: false };
    const disintegration = { variantId: 'variant_disintegration-black-vinyl-lp_standard', quantity: 7 };
    const barrenPoint = { variantId: 'variant_barren-point_standard', quantity: 1 };
    expect(quoteDelivery([disintegration, barrenPoint], configured)).toEqual({
      tier: 'small',
      amountMinor: 250,
      currencyCode: 'EUR',
    });
    expect(quoteDelivery([{ ...disintegration, quantity: 8 }, barrenPoint], configured)).toEqual({
      tier: 'medium',
      amountMinor: 350,
      currencyCode: 'EUR',
    });
    expect(configured.items.get(disintegration.variantId)?.measurementReference).toBe(
      'owner-assumed-vinyl-parcel-2026-10-08',
    );
    expect(
      configured.packages.every((pack) => pack.measurementReference === 'owner-assumed-vinyl-parcel-2026-10-08'),
    ).toBe(true);
    expect(quoteDelivery([disintegration, barrenPoint], createPackingPolicy('uat', false))).toBeNull();
  });

  it.each([
    'variant_atopia-atopia-cd_standard',
    'variant_example-cassette_standard',
    'variant_example-box-set_standard',
    'variant_new_runtime_item',
  ])('uses the same owner-assumed PRD profile for %s and mixed carts', (variantId) => {
    const configured = createPackingPolicy('prd');
    const disintegration = { variantId: 'variant_disintegration-black-vinyl-lp_standard', quantity: 7 };
    const item = { variantId, quantity: 1 };
    expect(configured.items.get(variantId)).toBe(configured.items.get(disintegration.variantId));
    expect(configured.items.get(variantId)?.synthetic).not.toBe(true);
    expect(quoteDelivery([item], configured)?.amountMinor).toBe(300);
    expect(quoteDelivery([disintegration, item], configured)?.amountMinor).toBe(600);
    expect(quoteDelivery([disintegration, { ...item, quantity: 2 }], configured)?.amountMinor).toBe(1000);
    expect(quoteDelivery([item, disintegration], configured)).toEqual(
      quoteDelivery([disintegration, item], configured),
    );
  });

  it('versions each environment separately for quantity tariffs', () => {
    expect(currentMonetaryPolicyReference('prd')).toBe(hostedMonetaryPolicyReference);
    expect(hostedMonetaryPolicyReference).toBe('quantity-band-shipping-no-tax-collected-prd-2026-10-09-v1');
    expect(currentMonetaryPolicyReference('local')).toBe('quantity-band-shipping-no-tax-collected-local-2026-10-09-v1');
    expect(currentMonetaryPolicyReference('uat')).toBe('quantity-band-shipping-no-tax-collected-uat-2026-10-09-v1');
  });

  it.each([
    [8, 'small', 250],
    [9, 'medium', 350],
    [19, 'medium', 350],
    [20, null, null],
  ])('quotes %i protected records', (quantity, tier, amountMinor) => {
    expect(quoteDelivery(records(quantity as number), policy)).toEqual(
      tier ? { tier, amountMinor, currencyCode: 'EUR' } : null,
    );
    expect(quoteDelivery(records(quantity as number), { ...createPackingPolicy('prd'), quantityBased: false })).toEqual(
      tier ? { tier, amountMinor, currencyCode: 'EUR' } : null,
    );
  });

  it.each([
    [4, 300],
    [5, 600],
    [8, 600],
    [9, 1000],
    [20, 1000],
    [1_000_000, 1000],
  ])('quotes %i product units with manual dispatch', (quantity, amountMinor) => {
    for (const configured of [
      createPackingPolicy('local'),
      createPackingPolicy('uat', true),
      createPackingPolicy('prd'),
    ]) {
      expect(quoteDelivery(records(quantity!), configured)).toEqual({
        tier: 'manual',
        amountMinor,
        currencyCode: 'EUR',
      });
    }
  });

  it('counts mixed and duplicate lines safely without deriving disc or parcel counts', () => {
    const configured = createPackingPolicy('prd');
    const lines = [...records(2), { variantId: 'cd', quantity: 3 }, ...records(3)];
    expect(quoteDelivery(lines, configured)?.amountMinor).toBe(600);
    expect(quoteDelivery(lines.toReversed(), configured)).toEqual(quoteDelivery(lines, configured));
    expect(quoteDelivery([...lines, { variantId: 'box-set', quantity: 1 }], configured)?.amountMinor).toBe(1000);
    for (const quantity of [0, -1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(quoteDelivery(records(quantity), configured)).toBeNull();
    }
    expect(
      quoteDelivery([...records(Number.MAX_SAFE_INTEGER), { variantId: 'cd', quantity: 1 }], configured),
    ).toBeNull();
  });

  it('aggregates repeated variants and is independent of order, including mixed CDs', () => {
    const lines = [...records(4), { variantId: 'cd', quantity: 1 }, ...records(3)];
    expect(quoteDelivery(lines, policy)?.tier).toBe('medium');
    expect(quoteDelivery(lines.toReversed(), policy)).toEqual(quoteDelivery(lines, policy));
    expect(quoteDelivery([...records(4), ...records(4)], policy)).toEqual(quoteDelivery(records(8), policy));
  });

  it('allows rotation and exact limits but rejects over height, weight and footprint', () => {
    const pack = {
      ...policy.packages[0]!,
      innerLengthMm: 320,
      innerWidthMm: 150,
      innerHeightMm: 12,
      maxGrossWeightGrams: 260,
    };
    const item = { ...record, lengthMm: 150, widthMm: 320, thicknessMm: 12, weightGrams: 110 };
    const exact = { ...policy, packages: [pack, policy.packages[1]!], items: new Map([['record', item]]) };
    expect(quoteDelivery(records(1), exact)?.tier).toBe('small');
    for (const changed of [{ thicknessMm: 13 }, { weightGrams: 111 }, { lengthMm: 151 }]) {
      expect(quoteDelivery(records(1), { ...exact, items: new Map([['record', { ...item, ...changed }]]) })?.tier).toBe(
        'medium',
      );
    }
    expect(quoteDelivery(records(1), { ...exact, items: new Map([['record', { ...item, widthMm: 700 }]]) })).toBeNull();
  });

  it('fails closed for unknown, unmeasured, invalid, synthetic hosted and overflowing inputs', () => {
    expect(quoteDelivery([], policy)).toBeNull();
    expect(quoteDelivery([{ variantId: 'unknown', quantity: 1 }], policy)).toBeNull();
    expect(quoteDelivery(records(1), { ...policy, allowSynthetic: false })).toBeNull();
    for (const quantity of [0, -1, 0.5, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(quoteDelivery(records(quantity), policy)).toBeNull();
    }
    for (const item of [
      { ...record, measurementReference: '' },
      { ...record, thicknessMm: 0 },
    ]) {
      expect(quoteDelivery(records(1), { ...policy, items: new Map([['record', item]]) })).toBeNull();
    }
    for (const pack of [
      { ...policy.packages[0]!, outerHeightMm: 81 },
      { ...policy.packages[0]!, outerLengthMm: 329 },
      { ...policy.packages[0]!, maxGrossWeightGrams: 0 },
    ]) {
      expect(quoteDelivery(records(1), { ...policy, packages: [pack, policy.packages[1]!] })).toBeNull();
    }
    expect(quoteDelivery(records(1), { ...policy, charges: { small: 0, medium: 350 } })).toBeNull();
    expect(quoteDelivery(records(1), { ...policy, charges: { small: 275, medium: 375 } })?.amountMinor).toBe(275);
  });
});
