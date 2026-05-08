import type { CheckoutReconciliation } from '../checkout';
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

  const orderLines = readOrderLines(currentOrder);
  const finalizedOrderLines = reconcileFinalizedLineItems(orderLines, finalizedLineItems);

  if (!finalizedOrderLines) {
    try {
      const transitionResult = await transitionCheckoutOrder(orders, {
        checkoutSessionId,
        stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
        toStatus: 'needs_review',
        transitionedAt: appliedAt,
      });

      return {
        kind: 'needs_review',
        order: transitionResult.order,
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

  let transitionResult: Awaited<ReturnType<typeof transitionCheckoutOrder>>;

  try {
    transitionResult = await transitionCheckoutOrder(orders, {
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

  if (!transitionResult.transitioned) {
    return {
      kind: 'replay',
      order: transitionResult.order,
    };
  }

  const savedStockRecords: StockRecord[] = [];
  const stockChangeRecords: StockChangeRecord[] = [];

  for (const line of finalizedOrderLines) {
    const currentStock = await stock.findByVariantId(line.variantId);

    if (!currentStock || currentStock.quantity < line.quantity || currentStock.onlineQuantity < line.quantity) {
      return {
        kind: 'stock_unavailable',
        order: transitionResult.order,
        reason: 'Paid checkout cannot decrement unavailable stock.',
      };
    }

    const savedStock = await stock.save(line.variantId, {
      onlineQuantity: currentStock.onlineQuantity - line.quantity,
      quantity: currentStock.quantity - line.quantity,
    });
    const stockChange = await stockChanges.record({
      actorEmail: 'stripe-webhook',
      notes: `Checkout session ${checkoutSessionId}`,
      quantityDelta: -line.quantity,
      reason: 'checkout_paid',
      recordedAt: appliedAt,
      variantId: line.variantId,
    });

    savedStockRecords.push(savedStock);
    stockChangeRecords.push(stockChange);
  }

  return {
    kind: 'applied',
    order: transitionResult.order,
    stock: savedStockRecords[0]!,
    stockChange: stockChangeRecords[0]!,
  };
}

export type FinalizedPaidCheckoutLineItem = {
  quantity: number;
  stripePriceId: string;
};

function readOrderLines(order: CheckoutOrderRecord): CheckoutOrderLineRecord[] {
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

  for (const lineItem of finalizedLineItems) {
    if (!Number.isInteger(lineItem.quantity) || lineItem.quantity < 1) return null;

    finalizedQuantityByStripePriceId.set(
      lineItem.stripePriceId,
      (finalizedQuantityByStripePriceId.get(lineItem.stripePriceId) ?? 0) + lineItem.quantity,
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
