import type { VariantId } from '../ids';

export type StockChangeRecord = {
    id: string;
    variantId: VariantId;
    quantityDelta: number;
    reason: string;
    notes: string | null;
    actorEmail: string;
    recordedAt: Date;
};

export type RecordStockChangeInput = {
    variantId: VariantId;
    quantityDelta: number;
    reason: string;
    notes: string | null;
    actorEmail: string;
    recordedAt?: Date;
};

export interface StockChangeRepository {
    listByVariantId(variantId: VariantId, limit: number): Promise<StockChangeRecord[]>;
    record(input: RecordStockChangeInput): Promise<StockChangeRecord>;
}
