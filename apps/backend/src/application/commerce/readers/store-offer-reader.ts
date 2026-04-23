import type {
    ItemAvailabilityRecord,
    ItemAvailabilityRepository,
    StoreItemOptionRepository,
    StoreItemSlug,
    VariantId,
} from '../../../domain/commerce/repositories';

export type StoreOffer = {
    storeItemSlug: StoreItemSlug;
    variantId: VariantId;
    availability: {
        status: ItemAvailabilityRecord['status'];
        label: string;
    };
    canBuy: boolean;
};

function createAvailabilityLabel(status: ItemAvailabilityRecord['status']): string {
    return status === 'available' ? 'Available' : 'Unavailable';
}

export class StoreOfferReader {
    public constructor(
        private readonly storeItemOptions: StoreItemOptionRepository,
        private readonly itemAvailability: ItemAvailabilityRepository,
    ) {}

    public async findByStoreItemSlug(storeItemSlug: StoreItemSlug): Promise<StoreOffer | null> {
        const storeItemOption = await this.storeItemOptions.findByStoreItemSlug(storeItemSlug);

        if (!storeItemOption) {
            return null;
        }

        const availability = await this.itemAvailability.findByVariantId(storeItemOption.variantId);

        if (!availability) {
            return {
                storeItemSlug: storeItemOption.storeItemSlug,
                variantId: storeItemOption.variantId,
                availability: {
                    status: 'sold_out',
                    label: 'Unavailable',
                },
                canBuy: false,
            };
        }

        return {
            storeItemSlug: storeItemOption.storeItemSlug,
            variantId: storeItemOption.variantId,
            availability: {
                status: availability.status,
                label: createAvailabilityLabel(availability.status),
            },
            canBuy: availability.canBuy,
        };
    }
}
