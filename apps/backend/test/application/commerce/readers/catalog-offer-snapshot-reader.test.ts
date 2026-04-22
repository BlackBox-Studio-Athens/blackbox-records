import { describe, expect, it, vi } from 'vitest';

import type {
    CatalogItemMappingRecord,
    CatalogItemMappingRepository,
    InventoryRepository,
    InventorySnapshotRecord,
} from '../../../../src/domain/commerce/repositories';
import { CatalogOfferSnapshotReader } from '../../../../src/application/commerce/readers';

describe('CatalogOfferSnapshotReader', () => {
    it('returns null when no catalog item mapping exists', async () => {
        const catalogItemMappings: CatalogItemMappingRepository = {
            findByCatalogItemSlug: vi.fn(async () => null),
            findBySource: vi.fn(async () => null),
        };
        const inventory: InventoryRepository = {
            findByVariantId: vi.fn(async () => null),
        };

        const reader = new CatalogOfferSnapshotReader(catalogItemMappings, inventory);

        await expect(reader.findByCatalogItemSlug('unknown-slug')).resolves.toBeNull();
    });

    it('returns a conservative unavailable snapshot when inventory is missing', async () => {
        const mapping: CatalogItemMappingRecord = {
            catalogItemSlug: 'aftermaths',
            sourceKind: 'distro',
            sourceId: 'aftermaths',
            variantId: 'variant_aftermaths_standard',
        };
        const catalogItemMappings: CatalogItemMappingRepository = {
            findByCatalogItemSlug: vi.fn(async () => mapping),
            findBySource: vi.fn(async () => null),
        };
        const inventory: InventoryRepository = {
            findByVariantId: vi.fn(async () => null),
        };

        const reader = new CatalogOfferSnapshotReader(catalogItemMappings, inventory);

        await expect(reader.findByCatalogItemSlug('aftermaths')).resolves.toEqual({
            catalogItemSlug: 'aftermaths',
            variantId: 'variant_aftermaths_standard',
            availability: {
                status: 'sold_out',
                label: 'Unavailable',
            },
            canPurchase: false,
        });
    });

    it('returns repository-backed offer availability for a mapped slug', async () => {
        const mapping: CatalogItemMappingRecord = {
            catalogItemSlug: 'barren-point',
            sourceKind: 'release',
            sourceId: 'barren-point',
            variantId: 'variant_barren-point_standard',
        };
        const inventorySnapshot: InventorySnapshotRecord = {
            variantId: 'variant_barren-point_standard',
            status: 'available',
            canPurchase: true,
            updatedAt: new Date('2026-04-22T00:00:00.000Z'),
        };
        const catalogItemMappings: CatalogItemMappingRepository = {
            findByCatalogItemSlug: vi.fn(async () => mapping),
            findBySource: vi.fn(async () => null),
        };
        const inventory: InventoryRepository = {
            findByVariantId: vi.fn(async () => inventorySnapshot),
        };

        const reader = new CatalogOfferSnapshotReader(catalogItemMappings, inventory);

        await expect(reader.findByCatalogItemSlug('barren-point')).resolves.toEqual({
            catalogItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
            availability: {
                status: 'available',
                label: 'Available',
            },
            canPurchase: true,
        });
    });
});
