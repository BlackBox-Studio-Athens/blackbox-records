import type { CatalogOperation } from './catalog-operation-repository';
import type { StockQuantity } from '../quantities';
import type { RecordStockChangeInput, StockChangeRecord } from './stock-change-repository';
import type { RecordStockCountInput, StockCountRecord } from './stock-count-repository';
import type { StockRecord } from './stock-repository';

export interface OperatorStockRepository {
  initializeOpeningStock(operation: CatalogOperation, quantity: StockQuantity, now?: Date): Promise<boolean>;
  recordChange(input: RecordStockChangeInput): Promise<{ stock: StockRecord; entry: StockChangeRecord } | null>;
  recordCount(input: RecordStockCountInput & { expectedRevision: number | null }): Promise<{
    stock: StockRecord;
    entry: StockCountRecord;
  } | null>;
}
