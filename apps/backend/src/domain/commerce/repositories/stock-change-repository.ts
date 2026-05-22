import type { VariantId } from '../ids';
import type { StockChangeDelta } from '../quantities';

export type StockChangeRecord = {
  id: string;
  variantId: VariantId;
  quantityDelta: StockChangeDelta;
  reason: string;
  notes: string | null;
  actorEmail: string;
  recordedAt: Date;
};

export type RecordStockChangeInput = {
  variantId: VariantId;
  quantityDelta: StockChangeDelta;
  reason: string;
  notes: string | null;
  actorEmail: string;
  recordedAt?: Date;
};

export interface StockChangeRepository {
  listByVariantId(variantId: VariantId, limit: number): Promise<StockChangeRecord[]>;
  record(input: RecordStockChangeInput): Promise<StockChangeRecord>;
}
