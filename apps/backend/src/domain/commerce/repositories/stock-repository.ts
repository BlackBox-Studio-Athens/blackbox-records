import type { VariantId } from '../ids';

export type StockRecord = {
  variantId: VariantId;
  quantity: number;
  onlineQuantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StockState = {
  quantity: number;
  onlineQuantity: number;
};

export interface StockRepository {
  findByVariantId(variantId: VariantId): Promise<StockRecord | null>;
  save(variantId: VariantId, state: StockState): Promise<StockRecord>;
}
