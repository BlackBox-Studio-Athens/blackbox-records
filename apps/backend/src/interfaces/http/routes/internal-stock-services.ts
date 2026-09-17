import {
  InvalidStockOperationError,
  StockConflictError,
  readVariantStock,
  readVariantStockHistory,
  recordStockChange,
  recordStockCount,
  searchVariants,
  VariantNotFoundError,
} from '../../../application/commerce/stock';
import type { AppBindings } from '../../../env';
import type { InventoryQuery } from '../../../application/commerce/stock';
import {
  createPrismaClient,
  D1OperatorStockRepository,
  PrismaStockChangeRepository,
  PrismaStockCountRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
} from '../../../infrastructure/persistence/prisma';

export function createInternalStockServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const storeItemOptions = new PrismaStoreItemOptionRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const operatorStock = new D1OperatorStockRepository(bindings.COMMERCE_DB);
  const stockChanges = new PrismaStockChangeRepository(prisma);
  const stockCounts = new PrismaStockCountRepository(prisma);

  return {
    readInventory: (query: InventoryQuery) => storeItemOptions.readInventory(query),
    disconnect: async () => prisma.$disconnect(),
    errors: {
      InvalidStockOperationError,
      StockConflictError,
      VariantNotFoundError,
    },
    readVariantStock: async (variantId: string) => {
      const { stock: state, ...item } = await readVariantStock(storeItemOptions, stock, variantId);
      const record = await storeItemOptions.findByStoreItem(item);
      const name = (record?.productProjection as { name?: unknown } | null)?.name;
      return {
        ...item,
        stock: state,
        itemType: record?.itemType ?? null,
        ...(typeof name === 'string' && name.trim() ? { displayName: name } : {}),
      };
    },
    readVariantStockHistory: async (variantId: string, limit: number) =>
      readVariantStockHistory(storeItemOptions, stockChanges, stockCounts, variantId, limit),
    recordStockChange: async (command: {
      actorEmail: string;
      notes: string | null;
      quantityDelta: number;
      reason: string;
      variantId: string;
    }) => recordStockChange(storeItemOptions, operatorStock, command),
    recordStockCount: async (command: {
      expectedRevision: number | null;
      actorEmail: string;
      countedQuantity: number;
      notes: string | null;
      onlineQuantity: number;
      variantId: string;
    }) => recordStockCount(storeItemOptions, operatorStock, command),
    searchVariants: async (query: string | null, limit: number) => searchVariants(storeItemOptions, query, limit),
  };
}
