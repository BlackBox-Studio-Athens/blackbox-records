import type {
    StockChangeRecord,
    StockCountRecord,
    StockRecord,
    StoreItemOptionRecord,
} from '../../../domain/commerce/repositories';

export type VariantSummary = StoreItemOptionRecord;

export type VariantStockDetail = VariantSummary & {
    stock: {
        quantity: number;
        onlineQuantity: number;
        updatedAt: Date | null;
    };
};

export type VariantStockHistoryEntry =
    | {
          type: 'change';
          id: string;
          variantId: string;
          quantityDelta: number;
          reason: string;
          notes: string | null;
          actorEmail: string;
          recordedAt: Date;
      }
    | {
          type: 'count';
          id: string;
          variantId: string;
          countedQuantity: number;
          onlineQuantity: number;
          notes: string | null;
          actorEmail: string;
          recordedAt: Date;
      };

export type RecordedStockChange = {
    entry: StockChangeRecord;
    stock: StockRecord;
};

export type RecordedStockCount = {
    entry: StockCountRecord;
    stock: StockRecord;
};
