import {
  InvalidStockOperationError,
  readVariantStock,
  readVariantStockHistory,
  recordStockChange,
  recordStockCount,
  searchVariants,
  VariantNotFoundError,
} from '../../../application/commerce/stock';
import type { AppBindings } from '../../../env';
import {
  createPrismaClient,
  PrismaStockChangeRepository,
  PrismaStockCountRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
} from '../../../infrastructure/persistence/prisma';

export function createInternalStockServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const storeItemOptions = new PrismaStoreItemOptionRepository(prisma);
  const stock = new PrismaStockRepository(prisma);
  const stockChanges = new PrismaStockChangeRepository(prisma);
  const stockCounts = new PrismaStockCountRepository(prisma);

  return {
    disconnect: async () => prisma.$disconnect(),
    errors: {
      InvalidStockOperationError,
      VariantNotFoundError,
    },
    readVariantStock: async (variantId: string) => readVariantStock(storeItemOptions, stock, variantId),
    readVariantStockHistory: async (variantId: string, limit: number) =>
      readVariantStockHistory(storeItemOptions, stockChanges, stockCounts, variantId, limit),
    recordStockChange: async (command: {
      actorEmail: string;
      notes: string | null;
      quantityDelta: number;
      reason: string;
      variantId: string;
    }) => recordStockChange(storeItemOptions, stock, stockChanges, command),
    recordStockCount: async (command: {
      actorEmail: string;
      countedQuantity: number;
      notes: string | null;
      onlineQuantity: number;
      variantId: string;
    }) => recordStockCount(storeItemOptions, stock, stockCounts, command),
    searchVariants: async (query: string | null, limit: number) => searchVariants(storeItemOptions, query, limit),
  };
}
