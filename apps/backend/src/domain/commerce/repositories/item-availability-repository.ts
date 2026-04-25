import type { VariantId } from '../ids';

export type ItemAvailabilityStatus = 'available' | 'sold_out';

export type ItemAvailabilityRecord = {
  variantId: VariantId;
  status: ItemAvailabilityStatus;
  canBuy: boolean;
  updatedAt: Date;
};

export interface ItemAvailabilityRepository {
  findByVariantId(variantId: VariantId): Promise<ItemAvailabilityRecord | null>;
}
