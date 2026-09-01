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
  checkoutSessionId: CheckoutSessionId | null;
  checkoutExpiresAt: Date;
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
  displayName: string | null;
  id: string;
  lineAmountMinor: number | null;
  optionLabel: string | null;
  orderId: string;
  stripePriceId: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  quantity: CartQuantity;
  unitAmountMinor: number | null;
  createdAt: Date;
};

export type CreatePendingCheckoutOrderInput = {
  lines?: CreatePendingCheckoutOrderLineInput[];
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: CheckoutSessionId;
  checkoutExpiresAt?: Date;
  shippingLocker: ShippingLockerSnapshot | null;
  stripePaymentIntentId?: PaymentIntentId | null;
  createdAt?: Date;
};

export type CreatePendingCheckoutOrderLineInput = {
  displayName: string | null;
  lineAmountMinor: number | null;
  optionLabel: string | null;
  quantity: CartQuantity;
  stripePriceId?: StripePriceId | null;
  storeItemSlug: StoreItemSlug;
  unitAmountMinor: number | null;
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
