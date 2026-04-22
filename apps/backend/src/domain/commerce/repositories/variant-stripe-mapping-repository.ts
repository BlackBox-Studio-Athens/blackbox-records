export type VariantStripeMappingRecord = {
    variantId: string;
    stripeProductId: string | null;
    stripePriceId: string | null;
};

export interface VariantStripeMappingRepository {
    findByVariantId(variantId: string): Promise<VariantStripeMappingRecord | null>;
}
