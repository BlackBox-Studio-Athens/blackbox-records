import { describe, expect, it } from 'vitest';

import { createMoney, formatMoney, moneyToCurrencyCode, moneyToMinorAmount } from './money';

describe('Money value object', () => {
  it('stores money in minor units and normalizes ISO currency code', () => {
    const money = createMoney({ amountMinor: 2800, currencyCode: 'eur' });

    expect(moneyToMinorAmount(money)).toBe(2800);
    expect(moneyToCurrencyCode(money)).toBe('EUR');
  });

  it('formats money through a single helper', () => {
    expect(formatMoney(createMoney({ amountMinor: 2800, currencyCode: 'EUR' }))).toBe('€28.00');
  });

  it('rejects float-style and malformed money inputs', () => {
    expect(() => createMoney({ amountMinor: 28.5, currencyCode: 'EUR' })).toThrow();
    expect(() => createMoney({ amountMinor: 2800, currencyCode: 'EURO' })).toThrow();
    expect(() => createMoney({ amountMinor: -1, currencyCode: 'EUR' })).toThrow();
  });
});
