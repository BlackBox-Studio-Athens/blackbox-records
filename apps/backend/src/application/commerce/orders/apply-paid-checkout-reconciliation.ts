import type { CheckoutReconciliation } from '../checkout/reconcile-checkout-session';
import type {
  CheckoutOrderRecord,
  CheckoutOrderLineRecord,
  StockChangeRecord,
  StockRecord,
  OrderStateRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createCartQuantity,
  type CartQuantity,
  type CheckoutSessionId,
  type StripePriceId,
} from '../../../domain/commerce';
import { createCheckoutOrderPaidEvent, type CheckoutOrderPaid } from './checkout-order-paid-event';
import { InvalidOrderTransitionError } from './errors';
import type { PaidCheckoutFinalizationRepository } from './paid-checkout-finalization';
import { transitionCheckoutOrder } from './transition-checkout-order';

export type ApplyPaidCheckoutReconciliationResult =
  | {
      checkoutOrderPaid: CheckoutOrderPaid;
      kind: 'applied';
      order: CheckoutOrderRecord;
      stock: StockRecord;
      stockChange: StockChangeRecord;
    }
  | {
      kind: 'ignored';
      reason: 'not_paid_recommendation';
    }
  | {
      checkoutSessionId: CheckoutSessionId;
      kind: 'missing_order';
    }
  | {
      kind: 'rejected';
      reason: string;
    }
  | {
      kind: 'needs_review';
      order: CheckoutOrderRecord;
      reason: string;
    }
  | {
      kind: 'replay';
      order: CheckoutOrderRecord;
    }
  | {
      kind: 'stock_unavailable';
      order: CheckoutOrderRecord;
      reason: string;
    };

export async function applyPaidCheckoutReconciliation(
  orders: OrderStateRepository,
  paidCheckoutFinalizer: PaidCheckoutFinalizationRepository,
  reconciliation: CheckoutReconciliation,
  appliedAt = new Date(),
  finalizedLineItems: FinalizedPaidCheckoutLineItem[] = [],
): Promise<ApplyPaidCheckoutReconciliationResult> {
  if (reconciliation.recommendedOrderStatus !== 'paid') {
    return {
      kind: 'ignored',
      reason: 'not_paid_recommendation',
    };
  }

  const checkoutSessionId = reconciliation.source.checkoutSessionId;
  const currentOrder = await orders.findByCheckoutSessionId(checkoutSessionId);

  if (!currentOrder) {
    return {
      checkoutSessionId,
      kind: 'missing_order',
    };
  }

  const persistedOrderLines = readCheckoutOrderLines(currentOrder);
  const reconciledOrderLines = reconcileFinalizedLineItems(persistedOrderLines, finalizedLineItems);

  if (!reconciledOrderLines) {
    try {
      const orderTransitionResult = await transitionCheckoutOrder(orders, {
        checkoutSessionId,
        stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
        toStatus: 'needs_review',
        transitionedAt: appliedAt,
      });

      return {
        kind: 'needs_review',
        order: orderTransitionResult.order,
        reason: 'Paid checkout line items could not be reconciled.',
      };
    } catch (error) {
      if (error instanceof InvalidOrderTransitionError) {
        return {
          kind: 'rejected',
          reason: error.message,
        };
      }

      throw error;
    }
  }

  try {
    const finalizationResult = await paidCheckoutFinalizer.finalizePaidCheckout({
      checkoutSessionId,
      lineItems: reconciledOrderLines,
      stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
      transitionedAt: appliedAt,
    });

    if (finalizationResult.kind === 'replay') {
      return {
        kind: 'replay',
        order: finalizationResult.order,
      };
    }

    if (finalizationResult.kind === 'stock_unavailable') {
      return finalizationResult;
    }

    return {
      checkoutOrderPaid: createCheckoutOrderPaidEvent({
        lineItems: reconciledOrderLines,
        occurredAt: appliedAt,
        order: finalizationResult.order,
        reconciliation,
      }),
      kind: 'applied',
      order: finalizationResult.order,
      stock: finalizationResult.stock[0]!,
      stockChange: finalizationResult.stockChanges[0]!,
    };
  } catch (error) {
    if (error instanceof InvalidOrderTransitionError) {
      return {
        kind: 'rejected',
        reason: error.message,
      };
    }

    throw error;
  }
}

export type FinalizedPaidCheckoutLineItem = {
  quantity: CartQuantity;
  stripePriceId: StripePriceId;
};

function readCheckoutOrderLines(order: CheckoutOrderRecord): CheckoutOrderLineRecord[] {
  return order.lines?.length
    ? order.lines
    : [
        {
          createdAt: order.createdAt,
          id: order.id,
          orderId: order.id,
          quantity: createCartQuantity(1),
          storeItemSlug: order.storeItemSlug,
          stripePriceId: null,
          variantId: order.variantId,
        },
      ];
}

function reconcileFinalizedLineItems(
  orderLines: CheckoutOrderLineRecord[],
  finalizedLineItems: FinalizedPaidCheckoutLineItem[],
): CheckoutOrderLineRecord[] | null {
  if (finalizedLineItems.length === 0) return orderLines;

  const finalizedQuantityByStripePriceId = new Map<string, number>();

  for (const providerFinalizedLineItem of finalizedLineItems) {
    if (!Number.isInteger(providerFinalizedLineItem.quantity) || providerFinalizedLineItem.quantity < 1) return null;

    finalizedQuantityByStripePriceId.set(
      providerFinalizedLineItem.stripePriceId,
      (finalizedQuantityByStripePriceId.get(providerFinalizedLineItem.stripePriceId) ?? 0) +
        providerFinalizedLineItem.quantity,
    );
  }

  const reconciledLines: CheckoutOrderLineRecord[] = [];

  for (const line of orderLines) {
    if (!line.stripePriceId || !finalizedQuantityByStripePriceId.has(line.stripePriceId)) {
      return null;
    }

    reconciledLines.push({
      ...line,
      quantity: createCartQuantity(finalizedQuantityByStripePriceId.get(line.stripePriceId)!),
    });
  }

  if (reconciledLines.length !== finalizedQuantityByStripePriceId.size) {
    return null;
  }

  return reconciledLines;
}
