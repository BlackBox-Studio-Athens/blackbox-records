import type { CheckoutSessionId, StoreItemSlug, StripePriceId, VariantId } from '../ids';
import type { CartQuantity, StockQuantity } from '../quantities';
import type { CheckoutOrderLineRecord, CheckoutOrderRecord } from './order-state-repository';

export type CheckoutStockHoldLineInput = {
  quantity: CartQuantity;
  storeItemSlug: StoreItemSlug;
  stripePriceId: StripePriceId;
  variantId: VariantId;
};

export type SessionlessPendingCheckoutOrder = Omit<
  CheckoutOrderRecord,
  'checkoutSessionId' | 'lines' | 'needsReviewAt' | 'notPaidAt' | 'paidAt' | 'status'
> & {
  checkoutSessionId: null;
  lines: CheckoutOrderLineRecord[];
  needsReviewAt: null;
  notPaidAt: null;
  paidAt: null;
  status: 'pending_payment';
};

export type SessionBoundPendingCheckoutOrder = Omit<SessionlessPendingCheckoutOrder, 'checkoutSessionId'> & {
  checkoutSessionId: CheckoutSessionId;
};

export type ExpiredSessionBoundCheckoutHold = Pick<
  SessionBoundPendingCheckoutOrder,
  'checkoutExpiresAt' | 'checkoutSessionId' | 'id'
>;

export type SessionlessNotPaidCheckoutOrder = Omit<
  SessionlessPendingCheckoutOrder,
  'notPaidAt' | 'status' | 'statusUpdatedAt' | 'updatedAt'
> & {
  notPaidAt: Date;
  status: 'not_paid';
  statusUpdatedAt: Date;
  updatedAt: Date;
};

export type CreateCheckoutStockHoldInput = {
  checkoutExpiresAt: Date;
  createdAt: Date;
  lines: [CheckoutStockHoldLineInput, ...CheckoutStockHoldLineInput[]];
  orderId: string;
};

export type CreateCheckoutStockHoldResult =
  { hold: SessionlessPendingCheckoutOrder; kind: 'created' } | { kind: 'unavailable' };

export interface CheckoutStockHoldRepository {
  bindCheckoutSession(
    hold: SessionlessPendingCheckoutOrder,
    checkoutSessionId: CheckoutSessionId,
    boundAt: Date,
  ): Promise<SessionBoundPendingCheckoutOrder | null>;
  createPendingHold(input: CreateCheckoutStockHoldInput): Promise<CreateCheckoutStockHoldResult>;
  findEffectiveAvailability(variantId: VariantId): Promise<StockQuantity | null>;
  listOldestExpiredSessionBoundHolds(
    variantIds: [VariantId, ...VariantId[]],
    expiredAt: Date,
  ): Promise<ExpiredSessionBoundCheckoutHold[]>;
  recoverCheckoutSession(orderId: string, checkoutSessionId: CheckoutSessionId, recoveredAt: Date): Promise<boolean>;
  releaseSessionBoundHold(hold: ExpiredSessionBoundCheckoutHold, releasedAt: Date): Promise<boolean>;
  releaseSessionlessHold(
    hold: SessionlessPendingCheckoutOrder,
    releasedAt: Date,
  ): Promise<SessionlessNotPaidCheckoutOrder | null>;
}
