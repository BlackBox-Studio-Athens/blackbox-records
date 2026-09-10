import { describe, expect, it } from 'vitest';

import { quoteDelivery, type PackingPolicy } from '../../../../src/application/commerce/checkout/packing';
import { createPackingPolicy } from '../../../../src/application/commerce/checkout/packing-policy';

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
  it('allows provisional packing only locally or in UAT with a test-mode provider', () => {
    for (const target of ['local', 'uat', 'prd'] as const) {
      for (const testMode of [false, true]) {
        const configured = createPackingPolicy(target, testMode);
        const variantId = createPackingPolicy('local').items.keys().next().value!;
        const quote = quoteDelivery([{ variantId, quantity: 1 }], configured);
        expect(quote?.amountMinor ?? null).toBe(target === 'local' || (target === 'uat' && testMode) ? 250 : null);
      }
    }
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
