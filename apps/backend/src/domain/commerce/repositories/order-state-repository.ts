import type { CheckoutSessionId, PaymentIntentId, StoreItemSlug, StripePriceId, VariantId } from '../ids';
import type { CartQuantity } from '../quantities';

export type OrderStatus = 'pending_payment' | 'paid' | 'not_paid' | 'needs_review';

export type ShippingLockerSnapshot = {
  locker_id: string;
  country_code: 'GR';
  locker_name_or_label: string;
};

export type CheckoutOrderRecord = {
  id: string;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: CheckoutSessionId;
  stripePaymentIntentId: PaymentIntentId | null;
  shippingLocker: ShippingLockerSnapshot | null;
  status: OrderStatus;
  statusUpdatedAt: Date;
  paidAt: Date | null;
  notPaidAt: Date | null;
  needsReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: CheckoutOrderLineRecord[];
};

export type CheckoutOrderLineRecord = {
  id: string;
  orderId: string;
  stripePriceId: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  quantity: CartQuantity;
  createdAt: Date;
};

export type CreatePendingCheckoutOrderInput = {
  lines?: CreatePendingCheckoutOrderLineInput[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: CheckoutSessionId;
  shippingLocker: ShippingLockerSnapshot | null;
  stripePaymentIntentId?: PaymentIntentId | null;
  createdAt?: Date;
};

export type CreatePendingCheckoutOrderLineInput = {
  quantity: CartQuantity;
  stripePriceId?: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

export type CheckoutOrderTransitionInput = {
  status: OrderStatus;
  statusUpdatedAt: Date;
  stripePaymentIntentId?: PaymentIntentId | null;
};

export type ListRecentCheckoutOrdersInput = {
  limit: number;
  status?: OrderStatus | null;
};

export interface OrderStateRepository {
  createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord>;
  findByCheckoutSessionId(checkoutSessionId: CheckoutSessionId): Promise<CheckoutOrderRecord | null>;
  listRecent(input: ListRecentCheckoutOrdersInput): Promise<CheckoutOrderRecord[]>;
  saveTransition(
    checkoutSessionId: CheckoutSessionId,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null>;
}
