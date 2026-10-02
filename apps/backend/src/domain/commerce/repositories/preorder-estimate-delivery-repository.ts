import type { PreorderShipEstimate } from '../preorder';
import type { PaidOrderDeliverySafeReason, PaidOrderDeliveryStatus } from './paid-order-delivery-repository';

export type PreorderEstimateDeliveryRecord = {
  id: string;
  orderId: string;
  variantId: string;
  shipEstimate: PreorderShipEstimate;
  sequence: number;
  status: PaidOrderDeliveryStatus;
  attemptCount: number;
  nextAttemptAt: Date | null;
  leaseUntil: Date | null;
  providerMessageId: string | null;
  safeReason: string | null;
  deliveredAt: Date | null;
  needsReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClaimedPreorderEstimateDelivery = PreorderEstimateDeliveryRecord & {
  status: 'pending';
  nextAttemptAt: Date;
  leaseUntil: Date;
};

export type ClaimDuePreorderEstimateDeliveryResult =
  { kind: 'claimed'; delivery: ClaimedPreorderEstimateDelivery } | { kind: 'not_claimed' };

export interface PreorderEstimateDeliveryRepository {
  claimDue(input: { claimedAt: Date; deliveryId: string | null }): Promise<ClaimDuePreorderEstimateDeliveryResult>;
  findById(deliveryId: string): Promise<PreorderEstimateDeliveryRecord | null>;
  markDelivered(input: {
    delivery: ClaimedPreorderEstimateDelivery;
    deliveredAt: Date;
    providerMessageId: string | null;
  }): Promise<boolean>;
  reschedule(input: {
    delivery: ClaimedPreorderEstimateDelivery;
    nextAttemptAt: Date;
    safeReason: PaidOrderDeliverySafeReason;
    updatedAt: Date;
  }): Promise<boolean>;
  markNeedsReview(input: {
    delivery: ClaimedPreorderEstimateDelivery;
    needsReviewAt: Date;
    safeReason: PaidOrderDeliverySafeReason;
  }): Promise<boolean>;
}
