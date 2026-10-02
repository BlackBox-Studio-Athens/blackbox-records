import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InvalidStockOperationError,
  readVariantStock,
  readVariantStockHistory,
  recordStockChange,
  recordStockCount,
  searchVariants,
  setStockPreorder,
  StockConflictError,
  VariantNotFoundError,
} from './';
import type {
  OperatorStockRepository,
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
} from '../../../domain/commerce/repositories/spi';
import {
  stockChangeDelta,
  stockQuantity,
  storeItemSlug,
  variantId as toVariantId,
} from '../../../../test/support/commerce-value-objects';

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
      revision: (existing?.revision ?? -1) + 1,
      createdAt: existing?.createdAt ?? new Date('2026-04-24T10:00:00.000Z'),
      onlineQuantity: stockQuantity(state.onlineQuantity),
      quantity: stockQuantity(state.quantity),
      restockPlanned: existing?.restockPlanned ?? false,
      showLowStock: existing?.showLowStock ?? false,
      preorder: existing?.preorder ?? null,
      updatedAt: new Date('2026-04-24T11:00:00.000Z'),
      variantId: toVariantId(variantId),
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
    sourceId: 'disintegration',
    sourceKind: 'release' as const,
    storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
    variantId: toVariantId('variant_disintegration-black-vinyl-lp_standard'),
  };

  let storeItems: InMemoryStoreItemOptionRepository;
  let stock: InMemoryStockRepository;
  let stockChanges: InMemoryStockChangeRepository;
  let stockCounts: InMemoryStockCountRepository;
  let operatorStock: Pick<OperatorStockRepository, 'recordChange' | 'recordCount'>;

  beforeEach(() => {
    storeItems = new InMemoryStoreItemOptionRepository([storeItem]);
    stock = new InMemoryStockRepository();
    stockChanges = new InMemoryStockChangeRepository();
    stockCounts = new InMemoryStockCountRepository();
    operatorStock = {
      recordChange: async (input) => {
        const current = await stock.findByVariantId(input.variantId);
        const quantity = (current?.quantity ?? 0) + input.quantityDelta;
        if (quantity < 0) return null;
        return {
          stock: await stock.save(input.variantId, {
            quantity,
            onlineQuantity: Math.min(quantity, Math.max(0, (current?.onlineQuantity ?? 0) + input.quantityDelta)),
          }),
          entry: await stockChanges.record(input),
        };
      },
      recordCount: async (input) => {
        const current = await stock.findByVariantId(input.variantId);
        if ((current?.revision ?? null) !== input.expectedRevision) return null;
        return {
          stock: await stock.save(input.variantId, {
            quantity: input.countedQuantity,
            onlineQuantity: input.onlineQuantity,
          }),
          entry: await stockCounts.record(input),
        };
      },
    };
  });

  it('searches variants through the shared store item mapping seam', async () => {
    await expect(searchVariants(storeItems, 'disintegration', 20)).resolves.toEqual([storeItem]);
  });

  it('returns zero stock when the variant exists but has no stock row yet', async () => {
    await expect(readVariantStock(storeItems, stock, storeItem.variantId)).resolves.toEqual({
      ...storeItem,
      stock: {
        revision: null,
        onlineQuantity: 0,
        quantity: 0,
        restockPlanned: false,
        showLowStock: false,
        preorder: null,
        updatedAt: null,
      },
    });
  });

  it('starts, edits, ends and restarts a pre-order without changing stock quantities', async () => {
    const now = new Date('2026-10-02T10:00:00Z');
    const month = { kind: 'month', month: '2026-10', part: null } as const;
    const write = vi.fn(async (input: Parameters<OperatorStockRepository['setStockPreorder']>[0]) => {
      const old = await stock.findByVariantId(input.variantId);
      const record = await stock.save(input.variantId, {
        quantity: old?.quantity ?? 0,
        onlineQuantity: old?.onlineQuantity ?? 0,
      });
      record.preorder = input.preorder;
      return record;
    });
    const command = { variantId: storeItem.variantId, expectedRevision: null, shipEstimate: month };
    const start = await setStockPreorder(storeItems, stock, { setStockPreorder: write }, command, now);
    expect(start).toMatchObject({
      quantity: 0,
      onlineQuantity: 0,
      revision: 0,
      preorder: { startedAt: now.toISOString(), shipEstimate: month },
    });
    await setStockPreorder(storeItems, stock, { setStockPreorder: write }, { ...command, expectedRevision: 0 }, now);
    expect(write).toHaveBeenCalledTimes(1);
    await expect(setStockPreorder(storeItems, stock, { setStockPreorder: write }, command, now)).rejects.toBeInstanceOf(
      StockConflictError,
    );
    const changed = await setStockPreorder(
      storeItems,
      stock,
      { setStockPreorder: write },
      { ...command, expectedRevision: 0, shipEstimate: { kind: 'date', date: '2026-10-20' } },
      now,
    );
    expect(changed?.preorder?.startedAt).toBe(now.toISOString());
    const restarted = await setStockPreorder(
      storeItems,
      stock,
      { setStockPreorder: write },
      { ...command, expectedRevision: 1, shipEstimate: { kind: 'month', month: '2026-11', part: 'late' } },
      new Date('2026-10-21T10:00:00Z'),
    );
    expect(restarted?.preorder?.startedAt).toBe('2026-10-21T10:00:00.000Z');
    const ended = await setStockPreorder(
      storeItems,
      stock,
      { setStockPreorder: write },
      { ...command, expectedRevision: 2, shipEstimate: null },
      now,
    );
    expect(ended).toMatchObject({ preorder: null, quantity: 0, onlineQuantity: 0, revision: 3 });
    for (const shipEstimate of [
      undefined,
      {},
      { kind: 'month', month: '2026-09', part: null },
      { kind: 'date', date: '2026-10-02' },
      { kind: 'date', date: '2026-02-30' },
    ]) {
      await expect(
        setStockPreorder(
          storeItems,
          stock,
          { setStockPreorder: write },
          { ...command, expectedRevision: 3, shipEstimate },
          now,
        ),
      ).rejects.toBeInstanceOf(InvalidStockOperationError);
    }
    for (const expectedRevision of [undefined, -1, 1.5, '0', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(
        setStockPreorder(storeItems, stock, { setStockPreorder: write }, { ...command, expectedRevision }, now),
      ).rejects.toBeInstanceOf(InvalidStockOperationError);
    }
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        { ...command, variantId: 'variant_missing' },
        now,
      ),
    ).rejects.toBeInstanceOf(VariantNotFoundError);
    expect(write).toHaveBeenCalledTimes(4);
  });

  it('keeps an open cycle through month, part and date edits without changing stock or history', async () => {
    await stock.save(storeItem.variantId, { quantity: 9, onlineQuantity: 4 });
    const now = new Date('2026-10-02T10:00:00Z');
    const write = vi.fn(async (input: Parameters<OperatorStockRepository['setStockPreorder']>[0]) => {
      const current = stock.records.get(input.variantId)!;
      const updated = await stock.save(input.variantId, current);
      updated.preorder = input.preorder;
      return updated;
    });
    for (const [index, shipEstimate] of [
      { kind: 'month', month: '2026-10', part: null },
      { kind: 'month', month: '2026-10', part: 'early' },
      { kind: 'month', month: '2026-11', part: 'early' },
      { kind: 'date', date: '2026-11-20' },
    ].entries()) {
      const result = await setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          variantId: storeItem.variantId,
          expectedRevision: index,
          shipEstimate,
        },
        new Date(now.getTime() + index * 1000),
      );
      expect(result).toMatchObject({
        quantity: 9,
        onlineQuantity: 4,
        revision: index + 1,
        preorder: { startedAt: now.toISOString(), shipEstimate },
      });
    }
    const current = stock.records.get(storeItem.variantId)!;
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          variantId: storeItem.variantId,
          expectedRevision: 4,
          shipEstimate: { kind: 'date', date: '2026-11-20' },
        },
        now,
      ),
    ).resolves.toBe(current);
    expect(write).toHaveBeenCalledTimes(4);
    expect(stockChanges.records).toHaveLength(0);
    expect(stockCounts.records).toHaveLength(0);
  });

  it('ends an absent pre-order without writing and rejects races after the initial revision read', async () => {
    const write = vi.fn(async () => null);
    const command = { variantId: storeItem.variantId, expectedRevision: null, shipEstimate: null };
    await expect(setStockPreorder(storeItems, stock, { setStockPreorder: write }, command)).resolves.toBeNull();
    expect(write).not.toHaveBeenCalled();
    const current = await stock.save(storeItem.variantId, { quantity: 9, onlineQuantity: 4 });
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          ...command,
          expectedRevision: 0,
        },
      ),
    ).resolves.toBe(current);
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          ...command,
          expectedRevision: null,
        },
      ),
    ).rejects.toBeInstanceOf(StockConflictError);
    expect(write).not.toHaveBeenCalled();
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          ...command,
          expectedRevision: 0,
          shipEstimate: { kind: 'month', month: '2026-10', part: null },
        },
        new Date('2026-10-02T10:00:00Z'),
      ),
    ).rejects.toBeInstanceOf(StockConflictError);
    expect(write).toHaveBeenCalledTimes(1);
    expect(stock.records.get(storeItem.variantId)).toBe(current);
  });

  it('validates against Athens midnight and starts a new cycle on the old exact date', async () => {
    const now = new Date('2026-10-31T22:30:00Z'); // Already 1 November in Athens.
    const current = await stock.save(storeItem.variantId, { quantity: 5, onlineQuantity: 2 });
    current.preorder = { startedAt: '2026-09-01T10:00:00.000Z', shipEstimate: { kind: 'date', date: '2026-11-01' } };
    const write = vi.fn(async (input: Parameters<OperatorStockRepository['setStockPreorder']>[0]) => ({
      ...current,
      revision: 1,
      preorder: input.preorder,
    }));
    const command = { variantId: storeItem.variantId, expectedRevision: 0 };
    for (const shipEstimate of [
      { kind: 'month', month: '2026-10', part: null },
      { kind: 'date', date: '2026-10-31' },
      { kind: 'date', date: '2026-11-01' },
      { kind: 'month', month: '2026-13', part: null },
      { kind: 'month', month: '2026-11', part: 'later' },
    ]) {
      await expect(
        setStockPreorder(
          storeItems,
          stock,
          { setStockPreorder: write },
          {
            ...command,
            shipEstimate,
          },
          now,
        ),
      ).rejects.toBeInstanceOf(InvalidStockOperationError);
    }
    expect(write).not.toHaveBeenCalled();
    const shipEstimate = { kind: 'month', month: '2026-11', part: null } as const;
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          ...command,
          shipEstimate,
        },
        now,
      ),
    ).resolves.toMatchObject({ preorder: { startedAt: now.toISOString(), shipEstimate } });
    current.preorder = {
      startedAt: '2026-09-01T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2026-10', part: null },
    };
    await expect(
      setStockPreorder(
        storeItems,
        stock,
        { setStockPreorder: write },
        {
          ...command,
          shipEstimate,
        },
        now,
      ),
    ).resolves.toMatchObject({ preorder: { startedAt: current.preorder.startedAt, shipEstimate } });
  });

  it('records a stock change and updates current stock totals', async () => {
    const result = await recordStockChange(storeItems, operatorStock, {
      actorEmail: 'operator@blackboxrecords.example',
      notes: 'Initial delivery',
      quantityDelta: stockChangeDelta(3),
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

  it('baseline: repeated keyless stock changes repeat the ledger effect', async () => {
    const command = {
      actorEmail: 'operator@blackboxrecords.example',
      notes: null,
      quantityDelta: stockChangeDelta(1),
      reason: 'delivery',
      variantId: storeItem.variantId,
    };

    await recordStockChange(storeItems, operatorStock, command);
    await recordStockChange(storeItems, operatorStock, command);

    expect(stockChanges.records).toHaveLength(2);
    expect((await readVariantStock(storeItems, stock, storeItem.variantId)).stock.quantity).toBe(2);
  });

  it('rejects stock changes that would drive stock below zero', async () => {
    await expect(
      recordStockChange(storeItems, operatorStock, {
        actorEmail: 'operator@blackboxrecords.example',
        notes: null,
        quantityDelta: stockChangeDelta(-1),
        reason: 'sale',
        variantId: storeItem.variantId,
      }),
    ).rejects.toBeInstanceOf(InvalidStockOperationError);
  });

  it('records a stock count and resets total and online stock', async () => {
    await recordStockChange(storeItems, operatorStock, {
      actorEmail: 'operator@blackboxrecords.example',
      notes: null,
      quantityDelta: stockChangeDelta(5),
      reason: 'delivery',
      variantId: storeItem.variantId,
    });

    const result = await recordStockCount(storeItems, operatorStock, {
      expectedRevision: 0,
      actorEmail: 'operator@blackboxrecords.example',
      countedQuantity: stockQuantity(2),
      notes: 'Shelf recount',
      onlineQuantity: stockQuantity(1),
      variantId: storeItem.variantId,
    });

    expect(result.stock.quantity).toBe(2);
    expect(result.stock.onlineQuantity).toBe(1);
    expect(result.entry.countedQuantity).toBe(2);
  });

  it('returns immutable combined stock history entries ordered by most recent first', async () => {
    await recordStockChange(storeItems, operatorStock, {
      actorEmail: 'operator@blackboxrecords.example',
      notes: null,
      quantityDelta: stockChangeDelta(5),
      reason: 'delivery',
      variantId: storeItem.variantId,
    });
    await recordStockCount(storeItems, operatorStock, {
      expectedRevision: 0,
      actorEmail: 'operator@blackboxrecords.example',
      countedQuantity: stockQuantity(4),
      notes: 'Recounted after prep',
      onlineQuantity: stockQuantity(2),
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
    await expect(readVariantStock(storeItems, stock, toVariantId('variant_missing'))).rejects.toBeInstanceOf(
      VariantNotFoundError,
    );
  });
});
