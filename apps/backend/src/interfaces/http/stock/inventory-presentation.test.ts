import { expect, it } from 'vitest';
import { presentInventory } from './inventory-presentation';
import type { InventoryItem } from '../../../domain/commerce/repositories/spi';

it('reports accepted listing state and the shopper stock class without exposing internal inputs', () => {
  const base: InventoryItem = {
    variantId: 'variant_test',
    storeItemSlug: 'listed',
    sourceId: 'test',
    sourceKind: 'distro',
    cmsSourceId: null,
    displayName: 'Test',
    itemType: null,
    quantity: 0,
    onlineQuantity: 0,
    zeroStockState: 'sold_out',
    availabilityStatus: 'available',
    availabilityCanBuy: true,
  };
  const page = {
    before: '2026-01-01',
    items: [
      base,
      { ...base, storeItemSlug: 'coming', zeroStockState: 'coming_soon' as const },
      { ...base, storeItemSlug: 'repressing', zeroStockState: 'repressing' as const },
      { ...base, storeItemSlug: 'preorder', onlineQuantity: 1 },
      { ...base, storeItemSlug: 'unavailable', availabilityStatus: null },
    ],
  };
  const result = presentInventory(page, new Set(['listed']));
  expect(result.items.map(({ websiteListing, availabilityState }) => [websiteListing, availabilityState])).toEqual([
    ['listed', 'sold_out'],
    ['not_listed', 'coming_soon'],
    ['not_listed', 'repressing'],
    ['not_listed', 'stocked'],
    ['not_listed', 'unavailable'],
  ]);
  expect(result.items[0]).not.toHaveProperty('availabilityCanBuy');
  expect(presentInventory(page, null).items.every((item) => item.websiteListing === 'unknown')).toBe(true);
});
