import type { CheckoutSessionId, StoreItemSlug, StripePriceId, VariantId } from '../ids';
import type { CartQuantity, StockQuantity } from '../quantities';
import type { AcceptedMonetaryPolicy } from '../monetary';
import type { CheckoutOrderLineRecord, CheckoutOrderRecord } from './order-state-repository';
import type { RequestIdentity } from './request-identity';
import type { OrderStatus } from './order-state-repository';

export type CheckoutStockHoldLineInput = {
  displayName: string;
  lineAmountMinor: number | null;
  optionLabel: string | null;
  quantity: CartQuantity;
  storeItemSlug: StoreItemSlug;
  stripePriceId: StripePriceId;
  unitAmountMinor: number | null;
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
  checkoutCancelUrl?: string;
  monetaryPolicy?: AcceptedMonetaryPolicy;
  checkoutExpiresAt: Date;
  createdAt: Date;
  checkoutSuccessUrl?: string;
  lines: [CheckoutStockHoldLineInput, ...CheckoutStockHoldLineInput[]];
  newsletterConsentAt?: Date | null;
  newsletterConsentCopyVersion?: string | null;
  newsletterOptIn?: boolean;
  orderId: string;
  requestIdentity?: RequestIdentity | null;
};

export type CreateCheckoutStockHoldResult =
  | { hold: SessionlessPendingCheckoutOrder; kind: 'created' }
  | { attempt: CheckoutRetryAttempt; kind: 'existing' }
  | { kind: 'unavailable' };

export type CheckoutRetryAttempt = {
  acceptedDeliveryAmountMinor: number | null;
  acceptedParcelTier: 'small' | 'medium' | null;
  checkoutCancelUrl: string | null;
  checkoutExpiresAt: Date;
  checkoutSessionId: CheckoutSessionId | null;
  checkoutSuccessUrl: string | null;
  checkoutUrl: string | null;
  id: string;
  idempotencyFingerprint: string | null;
  lines: CheckoutOrderLineRecord[];
  monetaryPolicyReference: string | null;
  newsletterOptIn: boolean | null;
  status: OrderStatus;
};

export interface CheckoutStockHoldRepository {
  bindCheckoutSession(
    hold: SessionlessPendingCheckoutOrder,
    checkoutSessionId: CheckoutSessionId,
    boundAt: Date,
    checkoutExpiresAt?: Date,
    checkoutUrl?: string,
  ): Promise<SessionBoundPendingCheckoutOrder | null>;
  claimCheckoutProvider(
    orderId: string,
    claimToken: string,
    claimedAt: Date,
    leaseUntil: Date,
  ): Promise<'claimed' | 'in_progress' | 'unavailable'>;
  findByRequestIdentity(identity: RequestIdentity): Promise<CheckoutRetryAttempt | null>;
  createPendingHold(input: CreateCheckoutStockHoldInput): Promise<CreateCheckoutStockHoldResult>;
  findEffectiveAvailability(variantId: VariantId): Promise<StockQuantity | null>;
  listOldestExpiredSessionBoundHolds(
    variantIds: [VariantId, ...VariantId[]],
    expiredAt: Date,
  ): Promise<ExpiredSessionBoundCheckoutHold[]>;
  recoverCheckoutSession(
    orderId: string,
    checkoutSessionId: CheckoutSessionId,
    recoveredAt: Date,
    checkoutExpiresAt?: Date,
    checkoutUrl?: string,
  ): Promise<boolean>;
  releaseSessionBoundHold(hold: ExpiredSessionBoundCheckoutHold, releasedAt: Date): Promise<boolean>;
  releaseSessionlessHold(
    hold: SessionlessPendingCheckoutOrder,
    releasedAt: Date,
  ): Promise<SessionlessNotPaidCheckoutOrder | null>;
}
