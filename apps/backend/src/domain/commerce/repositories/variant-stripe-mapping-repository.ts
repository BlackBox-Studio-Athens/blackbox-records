import type { StripePriceId, VariantId } from '../ids';

export type VariantStripeMappingRecord = {
    variantId: VariantId;
    stripePriceId: StripePriceId;
};

export interface VariantStripeMappingRepository {
    findByVariantId(variantId: VariantId): Promise<VariantStripeMappingRecord | null>;
}
