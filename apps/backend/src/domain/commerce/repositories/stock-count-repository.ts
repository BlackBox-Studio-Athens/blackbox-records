import type { VariantId } from '../ids';
import type { StockQuantity } from '../quantities';
import type { RequestIdentity } from './request-identity';

export type StockCountRecord = {
  id: string;
  variantId: VariantId;
  countedQuantity: StockQuantity;
  onlineQuantity: StockQuantity;
  notes: string | null;
  actorEmail: string;
  recordedAt: Date;
};

export type RecordStockCountInput = {
  variantId: VariantId;
  countedQuantity: StockQuantity;
  onlineQuantity: StockQuantity;
  notes: string | null;
  actorEmail: string;
  recordedAt?: Date;
  requestIdentity?: RequestIdentity | null;
};

export interface StockCountRepository {
  listByVariantId(variantId: VariantId, limit: number): Promise<StockCountRecord[]>;
  record(input: RecordStockCountInput): Promise<StockCountRecord>;
}
