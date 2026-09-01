import type { EmailProviderGateway, EmailRuntimeConfig } from '../../email';
import {
  readPaidCheckoutFulfillment,
  type CheckoutOrderRecord,
  type CurrentPaidCheckoutOrder,
} from '../../../domain/commerce/repositories/spi';
import {
  attemptPaidOrderDelivery,
  createPaidOrderDeliveryId,
  type ClaimedPaidOrderDelivery,
  type PaidOrderDeliveryRepository,
  type PaidOrderDeliverySafeReason,
} from './paid-order-delivery';

const DELIVERY_RETRY_DELAY_MS = 15 * 60 * 1000;
const DELIVERY_WINDOW_MS = 24 * 60 * 60 * 1000;
const SCHEDULED_DELIVERY_LIMIT = 5;

type PaidOrderReader = {
  findById(orderId: string): Promise<CheckoutOrderRecord | null>;
};

type PaidOrderSource = { order: CurrentPaidCheckoutOrder; orders?: never } | { order?: never; orders: PaidOrderReader };

type PaidOrderDeliveryProcessingInput = PaidOrderSource & {
  attemptedAt?: Date;
  config: EmailRuntimeConfig;
  deliveryId: string | null;
  logger?: Pick<Console, 'info' | 'warn'>;
  provider: EmailProviderGateway;
  repository: PaidOrderDeliveryRepository;
};

export type ProcessPaidOrderDeliveryResult =
  | { kind: 'delivered'; deliveryId: string }
  | { kind: 'lease_lost'; deliveryId: string }
  | { kind: 'needs_review'; deliveryId: string; safeReason: PaidOrderDeliverySafeReason }
  | { kind: 'no_due_delivery' }
  | { kind: 'rescheduled'; deliveryId: string; nextAttemptAt: Date; safeReason: PaidOrderDeliverySafeReason };

export async function processPaidOrderDelivery(
  input: PaidOrderDeliveryProcessingInput,
): Promise<ProcessPaidOrderDeliveryResult> {
  const attemptedAt = input.attemptedAt ?? new Date();
  const claim = await input.repository.claimDue({ claimedAt: attemptedAt, deliveryId: input.deliveryId });

  if (claim.kind === 'not_claimed') return { kind: 'no_due_delivery' };

  const delivery = claim.delivery;

  if (deliveryExpired(delivery, attemptedAt)) {
    return markNeedsReview(input.repository, delivery, attemptedAt, 'delivery_window_expired');
  }

  const order = await readCurrentPaidOrder(input, delivery.orderId);

  if (!order) {
    return markNeedsReview(input.repository, delivery, attemptedAt, 'incomplete_paid_fulfillment');
  }

  try {
    const attempt = await attemptPaidOrderDelivery({
      config: input.config,
      delivery,
      logger: input.logger,
      order,
      provider: input.provider,
    });

    if (attempt.kind === 'delivered') {
      const updated = await input.repository.markDelivered({
        deliveredAt: attemptedAt,
        delivery,
        providerMessageId: attempt.providerMessageId,
      });

      return updated ? { deliveryId: delivery.id, kind: 'delivered' } : { deliveryId: delivery.id, kind: 'lease_lost' };
    }

    if (attempt.retryable && delivery.attemptCount < 5) {
      const nextAttemptAt = new Date(attemptedAt.getTime() + DELIVERY_RETRY_DELAY_MS);
      const updated = await input.repository.reschedule({
        delivery,
        nextAttemptAt,
        safeReason: attempt.safeReason,
        updatedAt: attemptedAt,
      });

      return updated
        ? { deliveryId: delivery.id, kind: 'rescheduled', nextAttemptAt, safeReason: attempt.safeReason }
        : { deliveryId: delivery.id, kind: 'lease_lost' };
    }

    return markNeedsReview(input.repository, delivery, attemptedAt, attempt.safeReason);
  } catch {
    return markNeedsReview(input.repository, delivery, attemptedAt, 'provider_outcome_unknown');
  }
}

export async function processPaidOrderDeliveriesForOrder(
  input: Omit<PaidOrderDeliveryProcessingInput, 'deliveryId' | 'orders'> & { order: CurrentPaidCheckoutOrder },
): Promise<ProcessPaidOrderDeliveryResult[]> {
  const kinds = input.order.newsletterOptIn
    ? (['shopper_confirmation', 'ops_fulfillment', 'newsletter_registration'] as const)
    : (['shopper_confirmation', 'ops_fulfillment'] as const);
  const results: ProcessPaidOrderDeliveryResult[] = [];

  for (const kind of kinds) {
    results.push(
      await processPaidOrderDelivery({
        ...input,
        deliveryId: createPaidOrderDeliveryId(input.order.id, kind),
      }),
    );
  }

  return results;
}

export async function drainDuePaidOrderDeliveries(
  input: Omit<PaidOrderDeliveryProcessingInput, 'deliveryId' | 'order'> & { orders: PaidOrderReader },
): Promise<ProcessPaidOrderDeliveryResult[]> {
  const results: ProcessPaidOrderDeliveryResult[] = [];

  for (let processed = 0; processed < SCHEDULED_DELIVERY_LIMIT; processed += 1) {
    const result = await processPaidOrderDelivery({ ...input, deliveryId: null });

    if (result.kind === 'no_due_delivery') break;
    results.push(result);
  }

  return results;
}

async function readCurrentPaidOrder(input: PaidOrderSource, orderId: string): Promise<CurrentPaidCheckoutOrder | null> {
  if (input.order) return input.order.id === orderId ? input.order : null;

  const order = await input.orders.findById(orderId);
  if (!order) return null;

  const fulfillment = readPaidCheckoutFulfillment(order);
  return fulfillment.kind === 'current' ? fulfillment.order : null;
}

async function markNeedsReview(
  repository: PaidOrderDeliveryRepository,
  delivery: ClaimedPaidOrderDelivery,
  needsReviewAt: Date,
  safeReason: PaidOrderDeliverySafeReason,
): Promise<ProcessPaidOrderDeliveryResult> {
  const updated = await repository.markNeedsReview({ delivery, needsReviewAt, safeReason });

  return updated
    ? { deliveryId: delivery.id, kind: 'needs_review', safeReason }
    : { deliveryId: delivery.id, kind: 'lease_lost' };
}

function deliveryExpired(delivery: ClaimedPaidOrderDelivery, attemptedAt: Date): boolean {
  return attemptedAt.getTime() - delivery.createdAt.getTime() >= DELIVERY_WINDOW_MS;
}
