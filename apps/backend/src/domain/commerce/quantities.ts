import { z } from 'zod';

export const MAX_CART_QUANTITY = 9;

const cartQuantitySchema = z.number().int().min(1).max(MAX_CART_QUANTITY).brand<'CartQuantity'>();
const stockQuantitySchema = z.number().int().min(0).brand<'StockQuantity'>();
const stockChangeDeltaSchema = z
  .number()
  .int()
  .refine((value) => value !== 0, {
    message: 'Stock change delta must not be zero.',
  })
  .brand<'StockChangeDelta'>();

export type CartQuantity = z.infer<typeof cartQuantitySchema>;
export type StockQuantity = z.infer<typeof stockQuantitySchema>;
export type OnlineStockQuantity = StockQuantity;
export type StockChangeDelta = z.infer<typeof stockChangeDeltaSchema>;

export type StockStateValue = {
  onlineQuantity: OnlineStockQuantity;
  quantity: StockQuantity;
};

export function createCartQuantity(value: unknown): CartQuantity {
  return cartQuantitySchema.parse(value);
}

export function createStockQuantity(value: unknown): StockQuantity {
  return stockQuantitySchema.parse(value);
}

export function createOnlineStockQuantity(value: unknown): OnlineStockQuantity {
  return createStockQuantity(value);
}

export function createStockChangeDelta(value: unknown): StockChangeDelta {
  return stockChangeDeltaSchema.parse(value);
}

export function createStockState(input: { onlineQuantity: unknown; quantity: unknown }): StockStateValue {
  const quantity = createStockQuantity(input.quantity);
  const onlineQuantity = createOnlineStockQuantity(input.onlineQuantity);

  if (onlineQuantity > quantity) {
    throw new Error('Online stock cannot exceed stock quantity.');
  }

  return {
    onlineQuantity,
    quantity,
  };
}
