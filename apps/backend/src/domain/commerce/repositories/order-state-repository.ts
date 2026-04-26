import type { StoreItemSlug, VariantId } from '../ids';

export type OrderStatus = 'pending_payment' | 'paid' | 'not_paid' | 'needs_review';

export type CheckoutOrderRecord = {
  id: string;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: string;
  stripePaymentIntentId: string | null;
  status: OrderStatus;
  statusUpdatedAt: Date;
  paidAt: Date | null;
  notPaidAt: Date | null;
  needsReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePendingCheckoutOrderInput = {
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
  checkoutSessionId: string;
  stripePaymentIntentId?: string | null;
  createdAt?: Date;
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
