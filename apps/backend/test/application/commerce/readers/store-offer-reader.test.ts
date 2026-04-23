import { describe, expect, it, vi } from 'vitest';

import type {
    ItemAvailabilityRecord,
    ItemAvailabilityRepository,
    StoreItemOptionRecord,
    StoreItemOptionRepository,
} from '../../../../src/domain/commerce/repositories';
import { StoreOfferReader } from '../../../../src/application/commerce/readers';

describe('StoreOfferReader', () => {
    it('returns null when no store item option exists', async () => {
        const storeItemOptions: StoreItemOptionRepository = {
            findByStoreItemSlug: vi.fn(async () => null),
            findBySource: vi.fn(async () => null),
        };
        const itemAvailability: ItemAvailabilityRepository = {
            findByVariantId: vi.fn(async () => null),
        };

        const reader = new StoreOfferReader(storeItemOptions, itemAvailability);

        await expect(reader.findByStoreItemSlug('unknown-slug')).resolves.toBeNull();
    });

    it('returns a conservative unavailable offer when availability is missing', async () => {
        const storeItemOption: StoreItemOptionRecord = {
            storeItemSlug: 'aftermaths',
            sourceKind: 'distro',
            sourceId: 'aftermaths',
            variantId: 'variant_aftermaths_standard',
        };
        const storeItemOptions: StoreItemOptionRepository = {
            findByStoreItemSlug: vi.fn(async () => storeItemOption),
            findBySource: vi.fn(async () => null),
        };
        const itemAvailability: ItemAvailabilityRepository = {
            findByVariantId: vi.fn(async () => null),
        };

        const reader = new StoreOfferReader(storeItemOptions, itemAvailability);

        await expect(reader.findByStoreItemSlug('aftermaths')).resolves.toEqual({
            storeItemSlug: 'aftermaths',
            variantId: 'variant_aftermaths_standard',
            availability: {
                status: 'sold_out',
                label: 'Unavailable',
            },
            canBuy: false,
        });
    });

    it('returns repository-backed offer availability for a mapped slug', async () => {
        const storeItemOption: StoreItemOptionRecord = {
            storeItemSlug: 'barren-point',
            sourceKind: 'release',
            sourceId: 'barren-point',
            variantId: 'variant_barren-point_standard',
        };
        const availability: ItemAvailabilityRecord = {
            variantId: 'variant_barren-point_standard',
            status: 'available',
            canBuy: true,
            updatedAt: new Date('2026-04-22T00:00:00.000Z'),
        };
        const storeItemOptions: StoreItemOptionRepository = {
            findByStoreItemSlug: vi.fn(async () => storeItemOption),
            findBySource: vi.fn(async () => null),
        };
        const itemAvailability: ItemAvailabilityRepository = {
            findByVariantId: vi.fn(async () => availability),
        };

        const reader = new StoreOfferReader(storeItemOptions, itemAvailability);

        await expect(reader.findByStoreItemSlug('barren-point')).resolves.toEqual({
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
            availability: {
                status: 'available',
                label: 'Available',
            },
            canBuy: true,
        });
    });
});
