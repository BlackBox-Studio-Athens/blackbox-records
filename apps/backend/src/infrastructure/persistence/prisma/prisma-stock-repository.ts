import type { StockRecord, StockRepository, StockState } from '../../../domain/commerce/repositories';
import type { PrismaClient } from '../../../generated/prisma/client';

function mapStock(record: {
  createdAt: Date;
  onlineQuantity: number;
  quantity: number;
  updatedAt: Date;
  variantId: string;
}): StockRecord {
  return {
    createdAt: record.createdAt,
    onlineQuantity: record.onlineQuantity,
    quantity: record.quantity,
    updatedAt: record.updatedAt,
    variantId: record.variantId,
  };
}

export class PrismaStockRepository implements StockRepository {
  public constructor(private readonly prisma: PrismaClient) {}

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
        onlineQuantity: state.onlineQuantity,
        quantity: state.quantity,
      },
      where: { variantId },
    });

    return mapStock(record);
  }
}
