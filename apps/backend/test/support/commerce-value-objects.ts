import {
  createCartQuantity,
  createStockChangeDelta,
  createStockQuantity,
  parseCheckoutSessionId,
  parsePaymentIntentId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../src/domain/commerce';

export const cartQuantity = createCartQuantity;
export const checkoutSessionId = parseCheckoutSessionId;
export const paymentIntentId = parsePaymentIntentId;
export const stockChangeDelta = createStockChangeDelta;
export const stockQuantity = createStockQuantity;
export const storeItemSlug = parseStoreItemSlug;
export const stripePriceId = parseStripePriceId;
export const variantId = parseVariantId;
