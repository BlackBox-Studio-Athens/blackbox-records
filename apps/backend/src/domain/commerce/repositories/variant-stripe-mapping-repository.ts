import type { StripePriceId, VariantId } from '../ids';

export type VariantStripeMappingRecord = {
  variantId: VariantId;
  stripePriceId: StripePriceId;
  stripeProductId?: string | null;
};

export interface VariantStripeMappingRepository {
  findByStripeProductId(productId: string): Promise<VariantStripeMappingRecord | null>;
  findByVariantId(variantId: VariantId): Promise<VariantStripeMappingRecord | null>;
  save(record: VariantStripeMappingRecord): Promise<VariantStripeMappingRecord>;
}
