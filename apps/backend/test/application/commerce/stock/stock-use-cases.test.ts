import { beforeEach, describe, expect, it } from 'vitest';

import {
  InvalidStockOperationError,
  readVariantStock,
  readVariantStockHistory,
  recordStockChange,
  recordStockCount,
  searchVariants,
  VariantNotFoundError,
} from '../../../../src/application/commerce/stock';
import type {
  RecordStockChangeInput,
  RecordStockCountInput,
  StockChangeRecord,
  StockChangeRepository,
  StockCountRecord,
  StockCountRepository,
  StockRecord,
  StockRepository,
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
} from '../../../../src/domain/commerce/repositories';

class InMemoryStoreItemOptionRepository implements StoreItemOptionRepository {
  public constructor(private readonly storeItems: StoreItemOptionRecord[]) {}

  public async findBySource(source: StoreItemSourceRef): Promise<StoreItemOptionRecord | null> {
    return (
      this.storeItems.find(
        (storeItem) => storeItem.sourceKind === source.sourceKind && storeItem.sourceId === source.sourceId,
      ) ?? null
    );
  }

  public async findByStoreItemSlug(storeItemSlug: string): Promise<StoreItemOptionRecord | null> {
    return this.storeItems.find((storeItem) => storeItem.storeItemSlug === storeItemSlug) ?? null;
  }

  public async findByVariantId(variantId: string): Promise<StoreItemOptionRecord | null> {
    return this.storeItems.find((storeItem) => storeItem.variantId === variantId) ?? null;
  }

  public async search(query: string | null, limit: number): Promise<StoreItemOptionRecord[]> {
    const trimmedQuery = query?.trim().toLowerCase() ?? '';
    const results =
      trimmedQuery.length === 0
        ? this.storeItems
        : this.storeItems.filter((storeItem) =>
            [storeItem.storeItemSlug, storeItem.sourceId, storeItem.variantId].some((value) =>
              value.toLowerCase().includes(trimmedQuery),
            ),
          );

    return results.slice(0, limit);
  }
}

class InMemoryStockRepository implements StockRepository {
  public readonly records = new Map<string, StockRecord>();

  public async findByVariantId(variantId: string): Promise<StockRecord | null> {
    return this.records.get(variantId) ?? null;
  }

  public async save(variantId: string, state: { onlineQuantity: number; quantity: number }): Promise<StockRecord> {
    const existing = this.records.get(variantId);
    const record: StockRecord = {
      createdAt: existing?.createdAt ?? new Date('2026-04-24T10:00:00.000Z'),
      onlineQuantity: state.onlineQuantity,
      quantity: state.quantity,
      updatedAt: new Date('2026-04-24T11:00:00.000Z'),
      variantId,
    };

    this.records.set(variantId, record);

    return record;
  }
}

class InMemoryStockChangeRepository implements StockChangeRepository {
  public readonly records: StockChangeRecord[] = [];

  public async listByVariantId(variantId: string, limit: number): Promise<StockChangeRecord[]> {
    return this.records.filter((record) => record.variantId === variantId).slice(0, limit);
  }

  public async record(input: RecordStockChangeInput): Promise<StockChangeRecord> {
    const record: StockChangeRecord = {
      actorEmail: input.actorEmail,
      id: `change_${this.records.length + 1}`,
      notes: input.notes,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      recordedAt: input.recordedAt ?? new Date(`2026-04-24T10:0${this.records.length}:00.000Z`),
      variantId: input.variantId,
    };

    this.records.unshift(record);

    return record;
  }
}

class InMemoryStockCountRepository implements StockCountRepository {
  public readonly records: StockCountRecord[] = [];

  public async listByVariantId(variantId: string, limit: number): Promise<StockCountRecord[]> {
    return this.records.filter((record) => record.variantId === variantId).slice(0, limit);
  }

  public async record(input: RecordStockCountInput): Promise<StockCountRecord> {
    const record: StockCountRecord = {
      actorEmail: input.actorEmail,
      countedQuantity: input.countedQuantity,
      id: `count_${this.records.length + 1}`,
      notes: input.notes,
      onlineQuantity: input.onlineQuantity,
      recordedAt: input.recordedAt ?? new Date(`2026-04-24T10:1${this.records.length}:00.000Z`),
      variantId: input.variantId,
    };

    this.records.unshift(record);

    return record;
  }
}

describe('commerce stock use cases', () => {
  const storeItem = {
    sourceId: 'barren-point',
    sourceKind: 'release' as const,
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  };

  let storeItems: InMemoryStoreItemOptionRepository;
  let stock: InMemoryStockRepository;
  let stockChanges: InMemoryStockChangeRepository;
  let stockCounts: InMemoryStockCountRepository;

  beforeEach(() => {
    storeItems = new InMemoryStoreItemOptionRepository([storeItem]);
    stock = new InMemoryStockRepository();
    stockChanges = new InMemoryStockChangeRepository();
    stockCounts = new InMemoryStockCountRepository();
  });

  it('searches variants through the shared store item mapping seam', async () => {
    await expect(searchVariants(storeItems, 'barren', 20)).resolves.toEqual([storeItem]);
  });

  it('returns zero stock when the variant exists but has no stock row yet', async () => {
    await expect(readVariantStock(storeItems, stock, storeItem.variantId)).resolves.toEqual({
      ...storeItem,
      stock: {
        onlineQuantity: 0,
        quantity: 0,
        updatedAt: null,
      },
    });
  });

  it('records a stock change and updates current stock totals', async () => {
    const result = await recordStockChange(storeItems, stock, stockChanges, {
      actorEmail: 'operator@blackboxrecords.example',
      notes: 'Initial delivery',
      quantityDelta: 3,
      reason: 'delivery',
      variantId: storeItem.variantId,
    });

    expect(result.stock.quantity).toBe(3);
    expect(result.stock.onlineQuantity).toBe(3);
    expect(result.entry.actorEmail).toBe('operator@blackboxrecords.example');

    await expect(readVariantStock(storeItems, stock, storeItem.variantId)).resolves.toMatchObject({
      stock: {
        onlineQuantity: 3,
        quantity: 3,
      },
    });
  });

  it('rejects stock changes that would drive stock below zero', async () => {
    await expect(
      recordStockChange(storeItems, stock, stockChanges, {
        actorEmail: 'operator@blackboxrecords.example',
        notes: null,
        quantityDelta: -1,
        reason: 'sale',
        variantId: storeItem.variantId,
      }),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);
  });

  it('records a stock count and resets total and online stock', async () => {
    await recordStockChange(storeItems, stock, stockChanges, {
      actorEmail: 'operator@blackboxrecords.example',
      notes: null,
      quantityDelta: 5,
      reason: 'delivery',
      variantId: storeItem.variantId,
    });

    const result = await recordStockCount(storeItems, stock, stockCounts, {
      actorEmail: 'operator@blackboxrecords.example',
      countedQuantity: 2,
      notes: 'Shelf recount',
      onlineQuantity: 1,
      variantId: storeItem.variantId,
    });

    expect(result.stock.quantity).toBe(2);
    expect(result.stock.onlineQuantity).toBe(1);
    expect(result.entry.countedQuantity).toBe(2);
  });

  it('returns immutable combined stock history entries ordered by most recent first', async () => {
    await recordStockChange(storeItems, stock, stockChanges, {
      actorEmail: 'operator@blackboxrecords.example',
      notes: null,
      quantityDelta: 5,
      reason: 'delivery',
      variantId: storeItem.variantId,
    });
    await recordStockCount(storeItems, stock, stockCounts, {
      actorEmail: 'operator@blackboxrecords.example',
      countedQuantity: 4,
      notes: 'Recounted after prep',
      onlineQuantity: 2,
      variantId: storeItem.variantId,
    });

    await expect(
      readVariantStockHistory(storeItems, stockChanges, stockCounts, storeItem.variantId, 10),
    ).resolves.toEqual([
      expect.objectContaining({
        countedQuantity: 4,
        type: 'count',
      }),
      expect.objectContaining({
        quantityDelta: 5,
        type: 'change',
      }),
    ]);
    expect(stockChanges.records).toHaveLength(1);
    expect(stockCounts.records).toHaveLength(1);
  });

  it('throws a variant-not-found error for unknown variants', async () => {
    await expect(readVariantStock(storeItems, stock, 'variant_missing')).rejects.toBeInstanceOf(VariantNotFoundError);
  });
});
