import { z } from 'zod';

const storeItemSlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .brand<'StoreItemSlug'>();

const variantIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^variant_[A-Za-z0-9_-]+$/)
  .brand<'VariantId'>();

const stripePriceIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^price_[A-Za-z0-9_-]+$/)
  .brand<'StripePriceId'>();

const checkoutSessionIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^cs_[A-Za-z0-9_-]+$/)
  .brand<'CheckoutSessionId'>();

const paymentIntentIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^pi_[A-Za-z0-9_-]+$/)
  .brand<'PaymentIntentId'>();

export type StoreItemSlug = z.infer<typeof storeItemSlugSchema>;
export type VariantId = z.infer<typeof variantIdSchema>;
export type StripePriceId = z.infer<typeof stripePriceIdSchema>;
export type CheckoutSessionId = z.infer<typeof checkoutSessionIdSchema>;
export type PaymentIntentId = z.infer<typeof paymentIntentIdSchema>;

export function parseStoreItemSlug(value: unknown): StoreItemSlug {
  return storeItemSlugSchema.parse(value);
}

export function parseVariantId(value: unknown): VariantId {
  return variantIdSchema.parse(value);
}

export function parseStripePriceId(value: unknown): StripePriceId {
  return stripePriceIdSchema.parse(value);
}

export function parseCheckoutSessionId(value: unknown): CheckoutSessionId {
  return checkoutSessionIdSchema.parse(value);
}

export function parsePaymentIntentId(value: unknown): PaymentIntentId {
  return paymentIntentIdSchema.parse(value);
}
