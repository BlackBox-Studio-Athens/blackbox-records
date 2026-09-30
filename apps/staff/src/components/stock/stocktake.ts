import { z } from 'zod';
import type { InternalStockChangeBody } from '../../lib/backend/internal-stock-api';

export type StockChangeReason = InternalStockChangeBody['reason'];
export const stockChangeReasons: Record<StockChangeReason, string> = {
  manual_adjustment: 'Other stock change',
  show_sale: 'Sold at a show',
  delivery: 'New delivery',
  gift: 'Gift or promo copy',
};

export const stocktakeSchema = z
  .object({
    items: z.array(z.object({ variantId: z.string().min(1).max(128) })).max(10000),
    index: z.number().int().nonnegative(),
    confirmed: z.array(z.string()),
    skipped: z.array(z.string()),
    area: z.string(),
    format: z.string(),
    q: z.string(),
  })
  .refine((value) => value.items.length > 0 && value.index < value.items.length);
export type Stocktake = z.infer<typeof stocktakeSchema>;
export const stocktakeKey = 'blackbox-stocktake';
export const pendingCountKey = 'blackbox-pending-count';
export const pendingChangeKey = 'blackbox-pending-change';
export const pendingChangeSchema = z.object({
  variantId: z.string().min(1),
  delta: z
    .number()
    .int()
    .refine((value) => value !== 0),
  reason: z.enum(Object.keys(stockChangeReasons) as [StockChangeReason, ...StockChangeReason[]]),
  notes: z.string().nullable(),
  idempotencyKey: z.string().uuid(),
});
export const pendingCountSchema = z.object({
  variantId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative().nullable(),
  countedQuantity: z.string(),
  onlineQuantity: z.string(),
  notes: z.string().nullable(),
  idempotencyKey: z.string().uuid(),
});

export function recordProgress(session: Stocktake, status: 'confirmed' | 'skipped'): Stocktake {
  const id = session.items[session.index]!.variantId;
  return {
    ...session,
    confirmed: [...session.confirmed.filter((value) => value !== id), ...(status === 'confirmed' ? [id] : [])],
    skipped: [...session.skipped.filter((value) => value !== id), ...(status === 'skipped' ? [id] : [])],
    index: Math.min(session.index + 1, session.items.length - 1),
  };
}
