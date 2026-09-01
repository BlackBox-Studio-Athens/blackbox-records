export type PaidOrderDeliveryKind = 'newsletter_registration' | 'ops_fulfillment' | 'shopper_confirmation';

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

export type ClaimDuePaidOrderDeliveryResult =
  { delivery: ClaimedPaidOrderDelivery; kind: 'claimed' } | { kind: 'not_claimed' };

export interface PaidOrderDeliveryRepository {
  claimDue(input: { claimedAt: Date; deliveryId: string | null }): Promise<ClaimDuePaidOrderDeliveryResult>;
}
