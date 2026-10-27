import { describe, expect, it } from 'vitest';
import { inventoryName, isLowStock } from './inventory-row';

describe('inventory rows', () => {
  it('drops the label name and the repeated format from shop product names', () => {
    const row = (displayName: string | undefined, itemType: string | null = 'CD') => ({
      displayName,
      storeItemSlug: 'mass-culture-lp',
      itemType,
    });
    expect(inventoryName(row('BlackBox Records - Disintegration - Black Vinyl LP', 'Black Vinyl LP'))).toBe(
      'Disintegration',
    );
    expect(inventoryName(row('BlackBox Records - Anima Triste - CD'))).toBe('Anima Triste');
    expect(inventoryName(row('Other Label - Split - CD'))).toBe('Other Label - Split');
    expect(inventoryName(row('BlackBox Records - CD'))).toBe('CD');
    expect(inventoryName(row(undefined, null))).toBe('mass culture lp');
  });

  it('marks low stock from one copy up to the shopper notice threshold', () => {
    expect([null, undefined, 0, 1, 5, 6].map(isLowStock)).toEqual([false, false, false, true, true, false]);
  });
});
