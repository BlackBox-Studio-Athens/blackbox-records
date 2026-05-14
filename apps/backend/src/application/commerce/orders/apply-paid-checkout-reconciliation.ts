import type { CheckoutReconciliation } from '../checkout/reconcile-checkout-session';
import type {
  CheckoutOrderRecord,
  CheckoutOrderLineRecord,
  StockChangeRecord,
  StockChangeRepository,
  StockRecord,
  StockRepository,
  OrderStateRepository,
} from '../../../domain/commerce/repositories';
import { InvalidOrderTransitionError } from './errors';
import { transitionCheckoutOrder } from './transition-checkout-order';

export type ApplyPaidCheckoutReconciliationResult =
  | {
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
      checkoutSessionId: string;
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
  stock: StockRepository,
  stockChanges: StockChangeRepository,
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

  let orderTransitionResult: Awaited<ReturnType<typeof transitionCheckoutOrder>>;

  try {
    orderTransitionResult = await transitionCheckoutOrder(orders, {
      checkoutSessionId,
      stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
      toStatus: 'paid',
      transitionedAt: appliedAt,
    });
  } catch (error) {
    if (error instanceof InvalidOrderTransitionError) {
      return {
        kind: 'rejected',
        reason: error.message,
      };
    }

    throw error;
  }

  if (!orderTransitionResult.transitioned) {
    return {
      kind: 'replay',
      order: orderTransitionResult.order,
    };
  }

  const updatedStockRecords: StockRecord[] = [];
  const recordedStockChangeRecords: StockChangeRecord[] = [];

  for (const orderLine of reconciledOrderLines) {
    const currentStock = await stock.findByVariantId(orderLine.variantId);

    if (
      !currentStock ||
      currentStock.quantity < orderLine.quantity ||
      currentStock.onlineQuantity < orderLine.quantity
    ) {
      return {
        kind: 'stock_unavailable',
        order: orderTransitionResult.order,
        reason: 'Paid checkout cannot decrement unavailable stock.',
      };
    }

    const updatedStock = await stock.save(orderLine.variantId, {
      onlineQuantity: currentStock.onlineQuantity - orderLine.quantity,
      quantity: currentStock.quantity - orderLine.quantity,
    });
    const recordedStockChange = await stockChanges.record({
      actorEmail: 'stripe-webhook',
      notes: `Checkout session ${checkoutSessionId}`,
      quantityDelta: -orderLine.quantity,
      reason: 'checkout_paid',
      recordedAt: appliedAt,
      variantId: orderLine.variantId,
    });

    updatedStockRecords.push(updatedStock);
    recordedStockChangeRecords.push(recordedStockChange);
  }

  return {
    kind: 'applied',
    order: orderTransitionResult.order,
    stock: updatedStockRecords[0]!,
    stockChange: recordedStockChangeRecords[0]!,
  };
}

export type FinalizedPaidCheckoutLineItem = {
  quantity: number;
  stripePriceId: string;
};

function readCheckoutOrderLines(order: CheckoutOrderRecord): CheckoutOrderLineRecord[] {
  return order.lines?.length
    ? order.lines
    : [
        {
          createdAt: order.createdAt,
          id: order.id,
          orderId: order.id,
          quantity: 1,
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
      quantity: finalizedQuantityByStripePriceId.get(line.stripePriceId)!,
    });
  }

  if (reconciledLines.length !== finalizedQuantityByStripePriceId.size) {
    return null;
  }

  return reconciledLines;
}
