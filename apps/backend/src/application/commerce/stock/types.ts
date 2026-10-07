import type {
  StockChangeRecord,
  StockCountRecord,
  StockRecord,
  StoreItemOptionRecord,
} from '../../../domain/commerce/repositories/spi';

export type VariantSummary = StoreItemOptionRecord;

export type VariantStockDetail = VariantSummary & {
  /** Shoppers waiting for an availability alert; a count only, never addresses. */
  availabilityAlertCount: number;
  stock: {
    revision: number | null;
    quantity: number;
    onlineQuantity: number;
    zeroStockState: StockRecord['zeroStockState'];
    expectedMonth: string | null;
    showLowStock: boolean;
    preorder: StockRecord['preorder'];
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
