import type { CheckoutReconciliation } from '../checkout';
import type { CheckoutOrderRecord, OrderStateRepository, OrderStatus } from '../../../domain/commerce/repositories';
import { CheckoutOrderNotFoundError, InvalidOrderTransitionError } from './errors';
import { transitionCheckoutOrder } from './transition-checkout-order';

export type ApplyNonPaidCheckoutReconciliationResult =
  | {
      kind: 'ignored';
      reason: 'pending_or_paid_recommendation';
    }
  | {
      checkoutSessionId: string;
      kind: 'missing_order';
    }
  | {
      kind: 'rejected';
      reason: string;
    }
  | {
      kind: 'replay';
      order: CheckoutOrderRecord;
    }
  | {
      kind: 'transitioned';
      order: CheckoutOrderRecord;
    };

export async function applyNonPaidCheckoutReconciliation(
  orders: OrderStateRepository,
  reconciliation: CheckoutReconciliation,
  appliedAt = new Date(),
): Promise<ApplyNonPaidCheckoutReconciliationResult> {
  const toStatus = readNonPaidOrderStatus(reconciliation.recommendedOrderStatus);

  if (!toStatus) {
    return {
      kind: 'ignored',
      reason: 'pending_or_paid_recommendation',
    };
  }

  const checkoutSessionId = reconciliation.source.checkoutSessionId;

  try {
    const result = await transitionCheckoutOrder(orders, {
      checkoutSessionId,
      stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
      toStatus,
      transitionedAt: appliedAt,
    });

    return result.transitioned
      ? {
          kind: 'transitioned',
          order: result.order,
        }
      : {
          kind: 'replay',
          order: result.order,
        };
  } catch (error) {
    if (error instanceof CheckoutOrderNotFoundError) {
      return {
        checkoutSessionId,
        kind: 'missing_order',
      };
    }

    if (error instanceof InvalidOrderTransitionError) {
      return {
        kind: 'rejected',
        reason: error.message,
      };
    }

    throw error;
  }
}

function readNonPaidOrderStatus(recommendedOrderStatus: OrderStatus): 'needs_review' | 'not_paid' | null {
  if (recommendedOrderStatus === 'needs_review' || recommendedOrderStatus === 'not_paid') {
    return recommendedOrderStatus;
  }

  return null;
}
