import type { VariantId } from '../ids';
import type { StockStateValue, StockQuantity } from '../quantities';

export type StockRecord = {
  variantId: VariantId;
  quantity: StockQuantity;
  onlineQuantity: StockQuantity;
  createdAt: Date;
  updatedAt: Date;
};

export type StockState = StockStateValue;

export interface StockRepository {
  findByVariantId(variantId: VariantId): Promise<StockRecord | null>;
  save(variantId: VariantId, state: StockState): Promise<StockRecord>;
}
