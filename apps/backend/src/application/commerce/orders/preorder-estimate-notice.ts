import { sendPreorderEstimateEmail, type EmailProviderGateway, type EmailRuntimeConfig } from '../../email';
import {
  readPaidCheckoutFulfillment,
  type CheckoutOrderRecord,
  type PaidOrderDeliverySafeReason,
  type PreorderEstimateDeliveryRepository,
} from '../../../domain/commerce/repositories/spi';
import { createCheckoutOrderReferenceToken } from '../../../domain/commerce';
import {
  DELIVERY_RETRY_DELAY_MS,
  DELIVERY_WINDOW_MS,
  type ProcessPaidOrderDeliveryResult,
} from './paid-order-delivery-processing';

export async function drainDuePreorderEstimateNotices(input: {
  attemptedAt?: Date;
  config: EmailRuntimeConfig;
  limit: number;
  orders: { findById(orderId: string): Promise<CheckoutOrderRecord | null> };
  provider: EmailProviderGateway;
  repository: PreorderEstimateDeliveryRepository;
}): Promise<ProcessPaidOrderDeliveryResult[]> {
  const startedAt = Date.now();
  const attemptedAt = input.attemptedAt ?? new Date();
  const results: ProcessPaidOrderDeliveryResult[] = [];

  for (let processed = 0; processed < input.limit; processed += 1) {
    const claim = await input.repository.claimDue({ claimedAt: attemptedAt, deliveryId: null });
    if (claim.kind === 'not_claimed') break;
    const delivery = claim.delivery;
    const review = async (safeReason: PaidOrderDeliverySafeReason): Promise<ProcessPaidOrderDeliveryResult> => {
      const updated = await input.repository.markNeedsReview({ delivery, needsReviewAt: attemptedAt, safeReason });
      return updated
        ? { deliveryId: delivery.id, kind: 'needs_review', safeReason }
        : { deliveryId: delivery.id, kind: 'lease_lost' };
    };

    if (attemptedAt.getTime() - delivery.createdAt.getTime() >= DELIVERY_WINDOW_MS) {
      results.push(await review('delivery_window_expired'));
      continue;
    }

    const record = await input.orders.findById(delivery.orderId);
    const current = await input.repository.findById(delivery.id);
    // Advance the supplied attempt time by the elapsed reads before starting provider work.
    const sendingAt = attemptedAt.getTime() + Date.now() - startedAt;
    if (
      !current ||
      current.status !== 'pending' ||
      current.sequence !== delivery.sequence ||
      current.attemptCount !== delivery.attemptCount ||
      !current.leaseUntil ||
      current.leaseUntil.getTime() !== delivery.leaseUntil.getTime() ||
      current.leaseUntil.getTime() <= sendingAt
    ) {
      results.push({ deliveryId: delivery.id, kind: 'lease_lost' });
      continue;
    }
    if (sendingAt - delivery.createdAt.getTime() >= DELIVERY_WINDOW_MS) {
      results.push(await review('delivery_window_expired'));
      continue;
    }
    const fulfillment = record ? readPaidCheckoutFulfillment(record) : null;
    const order = fulfillment?.kind === 'current' ? fulfillment.order : null;
    const line = order?.lines.find((line) => line.variantId === delivery.variantId);
    if (!order || !line?.preorder) {
      results.push(await review('incomplete_paid_fulfillment'));
      continue;
    }

    try {
      const attempt = await sendPreorderEstimateEmail({
        config: input.config,
        provider: input.provider,
        shopperEmail: order.shopperEmail,
        idempotencyEntityId: `${delivery.id}-${delivery.sequence}`,
        orderReference: createCheckoutOrderReferenceToken({
          checkoutSessionId: order.checkoutSessionId,
          orderId: order.id,
          referenceDate: order.paidAt,
        }),
        itemName: line.displayName,
        whenOrdered: line.preorder.shipEstimate,
        shipEstimate: delivery.shipEstimate,
      });
      if (attempt.status === 'sent') {
        const updated = await input.repository.markDelivered({
          delivery,
          deliveredAt: attemptedAt,
          providerMessageId: null,
        });
        results.push({ deliveryId: delivery.id, kind: updated ? 'delivered' : 'lease_lost' });
      } else if (attempt.retryable && delivery.attemptCount < 5) {
        const safeReason = attempt.providerSafeReason ?? 'unknown';
        const nextAttemptAt = new Date(attemptedAt.getTime() + DELIVERY_RETRY_DELAY_MS);
        const updated = await input.repository.reschedule({
          delivery,
          nextAttemptAt,
          safeReason,
          updatedAt: attemptedAt,
        });
        results.push(
          updated
            ? { deliveryId: delivery.id, kind: 'rescheduled', nextAttemptAt, safeReason }
            : { deliveryId: delivery.id, kind: 'lease_lost' },
        );
      } else {
        results.push(await review(attempt.providerSafeReason ?? 'unknown'));
      }
    } catch {
      results.push(await review('provider_outcome_unknown'));
    }
  }

  return results;
}
