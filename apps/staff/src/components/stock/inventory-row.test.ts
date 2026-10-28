import { describe, expect, it } from 'vitest';
import { inventoryName, isLowStock, isSoldOutOnWebsite } from './inventory-row';

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

  it('tags sold out only while the item is listed on the website', () => {
    const row = (websiteListing: string, availabilityState: string, onlineQuantity = 0) => ({
      websiteListing,
      availabilityState,
      onlineQuantity,
    });
    expect(isSoldOutOnWebsite(row('listed', 'sold_out'))).toBe(true);
    expect(isSoldOutOnWebsite(row('not_listed', 'sold_out'))).toBe(false);
    // An unreadable publication must not claim either state.
    expect(isSoldOutOnWebsite(row('unknown', 'sold_out'))).toBe(false);
    expect(isSoldOutOnWebsite(row('listed', 'coming_soon'))).toBe(false);
    expect(isSoldOutOnWebsite(row('listed', 'repressing'))).toBe(false);
    // Stock added on this page outdates the read until the next inventory refresh.
    expect(isSoldOutOnWebsite(row('listed', 'sold_out', 3))).toBe(false);
  });
});
