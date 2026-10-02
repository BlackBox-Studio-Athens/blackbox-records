import type { StockRecord, StockRepository, StockState } from '../../../domain/commerce/repositories/spi';
import { createStockQuantity, parseVariantId, stockPreorderFromColumns } from '../../../domain/commerce';
import type { PrismaClient } from '../../../generated/prisma/client';

type PrismaStockClient = Pick<PrismaClient, 'stock'>;

function mapStock(record: {
  revision: number;
  createdAt: Date;
  onlineQuantity: number;
  quantity: number;
  restockPlanned: boolean;
  showLowStock: boolean;
  preorderStartedAt: string | null;
  preorderShipMonth: string | null;
  preorderShipPart: string | null;
  preorderShipDate: string | null;
  updatedAt: Date;
  variantId: string;
}): StockRecord {
  return {
    revision: record.revision,
    createdAt: record.createdAt,
    onlineQuantity: createStockQuantity(record.onlineQuantity),
    quantity: createStockQuantity(record.quantity),
    restockPlanned: record.restockPlanned,
    showLowStock: record.showLowStock,
    preorder: stockPreorderFromColumns(record),
    updatedAt: record.updatedAt,
    variantId: parseVariantId(record.variantId),
  };
}

export class PrismaStockRepository implements StockRepository {
  public constructor(private readonly prisma: PrismaStockClient) {}

  public async findByVariantId(variantId: string): Promise<StockRecord | null> {
    const record = await this.prisma.stock.findUnique({
      where: { variantId },
    });

    return record ? mapStock(record) : null;
  }

  public async save(variantId: string, state: StockState): Promise<StockRecord> {
    const record = await this.prisma.stock.upsert({
      create: {
        onlineQuantity: state.onlineQuantity,
        quantity: state.quantity,
        variantId,
      },
      update: {
        revision: { increment: 1 },
        onlineQuantity: state.onlineQuantity,
        quantity: state.quantity,
      },
      where: { variantId },
    });

    return mapStock(record);
  }
}
