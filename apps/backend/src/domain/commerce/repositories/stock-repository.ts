import type { VariantId } from '../ids';
import type { StockPreorder } from '../preorder';
import type { StockStateValue, StockQuantity } from '../quantities';

export type StockRecord = {
  revision: number;
  variantId: VariantId;
  quantity: StockQuantity;
  onlineQuantity: StockQuantity;
  restockPlanned: boolean;
  showLowStock: boolean;
  preorder: StockPreorder | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StockState = StockStateValue;

export interface StockRepository {
  listOpenPreorders(): Promise<StockRecord[]>;
  findByVariantId(variantId: VariantId): Promise<StockRecord | null>;
  save(variantId: VariantId, state: StockState): Promise<StockRecord>;
}
