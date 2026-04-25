import type { VariantId } from '../ids';

export type StockCountRecord = {
  id: string;
  variantId: VariantId;
  countedQuantity: number;
  onlineQuantity: number;
  notes: string | null;
  actorEmail: string;
  recordedAt: Date;
};

export type RecordStockCountInput = {
  variantId: VariantId;
  countedQuantity: number;
  onlineQuantity: number;
  notes: string | null;
  actorEmail: string;
  recordedAt?: Date;
};

export interface StockCountRepository {
  listByVariantId(variantId: VariantId, limit: number): Promise<StockCountRecord[]>;
  record(input: RecordStockCountInput): Promise<StockCountRecord>;
}
