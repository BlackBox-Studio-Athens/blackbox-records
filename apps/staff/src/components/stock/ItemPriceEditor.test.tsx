import { expect, test } from 'vitest';
import { euroMinor } from './ItemPriceEditor';

test('converts EUR input exactly and rejects ambiguous or unsupported amounts', () => {
  expect(euroMinor('27')).toBe(2700);
  expect(euroMinor('27,05')).toBe(2705);
  expect(euroMinor('0.29')).toBe(29);
  expect(euroMinor('999999.99')).toBe(99999999);
  for (const value of ['0', '-1', '1.001', '1e3', 'NaN', '', '1000000', '1,000.00'])
    expect(() => euroMinor(value)).toThrow();
});
