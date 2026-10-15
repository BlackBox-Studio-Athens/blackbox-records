import { expect, test } from 'vitest';
import {
  catalogNumberFromOrdinal,
  catalogNumberOrdinal,
  nextFreeCatalogNumber,
  parseCatalogNumber,
} from '@blackbox/content-model';

test.each([1, 9, 99, 999, 1000, Number.MAX_SAFE_INTEGER])('catalog ordinal %s round trips', (ordinal) => {
  const value = catalogNumberFromOrdinal(ordinal)!;
  expect(value).toBe(`BBR#${String(ordinal).padStart(3, '0')}`);
  expect(parseCatalogNumber(value)).toBe(value);
  expect(catalogNumberOrdinal(value)).toBe(ordinal);
});

test.each([0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects ordinal %s', (ordinal) => {
  expect(catalogNumberFromOrdinal(ordinal)).toBeNull();
});

test('next free uses the maximum, preserves gaps and handles legacy integers without rounding', () => {
  expect(nextFreeCatalogNumber([])).toBe('BBR#001');
  expect(nextFreeCatalogNumber(new Set([1, 999, 3].map((n) => catalogNumberFromOrdinal(n)!)))).toBe('BBR#1000');
  const large = parseCatalogNumber('BBR#9007199254740992')!;
  expect(catalogNumberOrdinal(large)).toBeNull();
  expect(nextFreeCatalogNumber([large])).toBe('BBR#9007199254740993');
});
