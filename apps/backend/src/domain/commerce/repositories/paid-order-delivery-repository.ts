export type PaidOrderDeliveryKind = 'newsletter_registration' | 'ops_fulfillment' | 'shopper_confirmation';
export type PaidOrderDeliveryStatus = 'delivered' | 'needs_review' | 'pending';

export type PaidOrderDeliverySafeReason =
  | 'configuration'
  | 'delivery_window_expired'
  | 'idempotency_conflict_invalid'
  | 'idempotency_conflict_retryable'
  | 'incomplete_paid_fulfillment'
  | 'provider_outcome_unknown'
  | 'provider_unavailable'
  | 'quota_exceeded'
  | 'rate_limited'
  | 'unknown'
  | 'validation';

export type ClaimedPaidOrderDelivery = {
  attemptCount: number;
  createdAt: Date;
  id: string;
  kind: PaidOrderDeliveryKind;
  leaseUntil: Date;
  nextAttemptAt: Date;
  orderId: string;
  status: 'pending';
  updatedAt: Date;
};

export type PaidOrderDeliverySummary = {
  attemptCount: number;
  createdAt: Date;
  deliveredAt: Date | null;
  id: string;
  kind: PaidOrderDeliveryKind;
  needsReviewAt: Date | null;
  nextAttemptAt: Date | null;
  orderId: string;
  safeReason: string | null;
  status: PaidOrderDeliveryStatus;
  updatedAt: Date;
};

export type ClaimDuePaidOrderDeliveryResult =
  { delivery: ClaimedPaidOrderDelivery; kind: 'claimed' } | { kind: 'not_claimed' };

export interface PaidOrderDeliveryRepository {
  claimDue(input: { claimedAt: Date; deliveryId: string | null }): Promise<ClaimDuePaidOrderDeliveryResult>;
  listSummaries(orderIds: string[]): Promise<PaidOrderDeliverySummary[]>;
  markDelivered(input: {
    deliveredAt: Date;
    delivery: ClaimedPaidOrderDelivery;
    providerMessageId: string | null;
  }): Promise<boolean>;
  markNeedsReview(input: {
    delivery: ClaimedPaidOrderDelivery;
    needsReviewAt: Date;
    safeReason: PaidOrderDeliverySafeReason;
  }): Promise<boolean>;
  reschedule(input: {
    delivery: ClaimedPaidOrderDelivery;
    nextAttemptAt: Date;
    safeReason: PaidOrderDeliverySafeReason;
    updatedAt: Date;
  }): Promise<boolean>;
}
