import type { StoreItemSlug, StripePriceId, VariantId } from '../ids';

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
  checkoutSessionId: string;
  stripePaymentIntentId: string | null;
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
  quantity: number;
  createdAt: Date;
};

export type CreatePendingCheckoutOrderInput = {
  lines?: CreatePendingCheckoutOrderLineInput[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: string;
  shippingLocker: ShippingLockerSnapshot;
  stripePaymentIntentId?: string | null;
  createdAt?: Date;
};

export type CreatePendingCheckoutOrderLineInput = {
  quantity: number;
  stripePriceId?: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

export type CheckoutOrderTransitionInput = {
  status: OrderStatus;
  statusUpdatedAt: Date;
  stripePaymentIntentId?: string | null;
};

export type ListRecentCheckoutOrdersInput = {
  limit: number;
  status?: OrderStatus | null;
};

export interface OrderStateRepository {
  createPending(input: CreatePendingCheckoutOrderInput): Promise<CheckoutOrderRecord>;
  findByCheckoutSessionId(checkoutSessionId: string): Promise<CheckoutOrderRecord | null>;
  listRecent(input: ListRecentCheckoutOrdersInput): Promise<CheckoutOrderRecord[]>;
  saveTransition(
    checkoutSessionId: string,
    transition: CheckoutOrderTransitionInput,
  ): Promise<CheckoutOrderRecord | null>;
}
