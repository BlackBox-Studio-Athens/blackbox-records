import type { CheckoutReconciliation } from '../checkout';
import type {
  CheckoutOrderRecord,
  StockChangeRecord,
  StockChangeRepository,
  StockRecord,
  StockRepository,
  OrderStateRepository,
} from '../../../domain/commerce/repositories';
import { CheckoutOrderNotFoundError, InvalidOrderTransitionError } from './errors';
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
): Promise<ApplyPaidCheckoutReconciliationResult> {
  if (reconciliation.recommendedOrderStatus !== 'paid') {
    return {
      kind: 'ignored',
      reason: 'not_paid_recommendation',
    };
  }

  const checkoutSessionId = reconciliation.source.checkoutSessionId;

  let transitionResult: Awaited<ReturnType<typeof transitionCheckoutOrder>>;

  try {
    transitionResult = await transitionCheckoutOrder(orders, {
      checkoutSessionId,
      stripePaymentIntentId: reconciliation.source.stripePaymentIntentId,
      toStatus: 'paid',
      transitionedAt: appliedAt,
    });
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

  if (!transitionResult.transitioned) {
    return {
      kind: 'replay',
      order: transitionResult.order,
    };
  }

  const currentStock = await stock.findByVariantId(transitionResult.order.variantId);

  if (!currentStock || currentStock.quantity <= 0 || currentStock.onlineQuantity <= 0) {
    return {
      kind: 'stock_unavailable',
      order: transitionResult.order,
      reason: 'Paid checkout cannot decrement unavailable stock.',
    };
  }

  const savedStock = await stock.save(transitionResult.order.variantId, {
    onlineQuantity: currentStock.onlineQuantity - 1,
    quantity: currentStock.quantity - 1,
  });
  const stockChange = await stockChanges.record({
    actorEmail: 'stripe-webhook',
    notes: `Checkout session ${checkoutSessionId}`,
    quantityDelta: -1,
    reason: 'checkout_paid',
    recordedAt: appliedAt,
    variantId: transitionResult.order.variantId,
  });

  return {
    kind: 'applied',
    order: transitionResult.order,
    stock: savedStock,
    stockChange,
  };
}
