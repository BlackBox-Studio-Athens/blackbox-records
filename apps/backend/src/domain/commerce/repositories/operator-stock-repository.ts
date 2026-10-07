import type { CatalogOperation } from './catalog-operation-repository';
import type { StockQuantity } from '../quantities';
import type { RecordStockChangeInput, StockChangeRecord } from './stock-change-repository';
import type { RecordStockCountInput, StockCountRecord } from './stock-count-repository';
import type { StockRecord } from './stock-repository';

export interface OperatorStockRepository {
  initializeOpeningStock(
    operation: CatalogOperation,
    quantity: StockQuantity,
    zeroStock?: Pick<StockRecord, 'zeroStockState' | 'expectedMonth'>,
    now?: Date,
  ): Promise<boolean>;
  setZeroStockState(input: {
    expectedRevision: number | null;
    zeroStockState: StockRecord['zeroStockState'];
    expectedMonth: string | null;
    variantId: StockRecord['variantId'];
  }): Promise<StockRecord | null>;
  setShowLowStock(input: {
    expectedRevision: number | null;
    showLowStock: boolean;
    variantId: StockRecord['variantId'];
  }): Promise<StockRecord | null>;
  recordChange(input: RecordStockChangeInput): Promise<{ stock: StockRecord; entry: StockChangeRecord } | null>;
  setStockPreorder(input: {
    expectedRevision: number | null;
    preorder: StockRecord['preorder'];
    variantId: StockRecord['variantId'];
  }): Promise<StockRecord | null>;
  recordCount(input: RecordStockCountInput & { expectedRevision: number | null }): Promise<{
    stock: StockRecord;
    entry: StockCountRecord;
  } | null>;
}
