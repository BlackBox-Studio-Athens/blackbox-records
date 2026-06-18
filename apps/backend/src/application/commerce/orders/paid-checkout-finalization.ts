import type {
  CheckoutOrderRecord,
  OrderStateRepository,
  StockChangeRecord,
  StockChangeRepository,
  StockRecord,
  StockRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createStockChangeDelta,
  createStockQuantity,
  type CartQuantity,
  type CheckoutSessionId,
  type PaymentIntentId,
  type VariantId,
} from '../../../domain/commerce';
import { CheckoutOrderNotFoundError, InvalidOrderTransitionError } from './errors';
import { evaluateOrderTransition } from './order-state';

export type PaidCheckoutFinalizationLineItem = {
  quantity: CartQuantity;
  variantId: VariantId;
};

export type FinalizePaidCheckoutCommand = {
  checkoutSessionId: CheckoutSessionId;
  lineItems: PaidCheckoutFinalizationLineItem[];
  stripePaymentIntentId: PaymentIntentId | null;
  transitionedAt: Date;
};

export type PaidCheckoutFinalizationResult =
  | {
      kind: 'replay';
      order: CheckoutOrderRecord;
    }
  | {
      kind: 'stock_unavailable';
      order: CheckoutOrderRecord;
      reason: string;
    }
  | {
      kind: 'transitioned';
      order: CheckoutOrderRecord;
      stock: StockRecord[];
      stockChanges: StockChangeRecord[];
    };

export interface PaidCheckoutFinalizationRepository {
  finalizePaidCheckout(command: FinalizePaidCheckoutCommand): Promise<PaidCheckoutFinalizationResult>;
}

export async function finalizePaidCheckoutWithRepositories(
  orders: OrderStateRepository,
  stock: StockRepository,
  stockChanges: StockChangeRepository,
  command: FinalizePaidCheckoutCommand,
): Promise<PaidCheckoutFinalizationResult> {
  const currentOrder = await orders.findByCheckoutSessionId(command.checkoutSessionId);

  if (!currentOrder) {
    throw new CheckoutOrderNotFoundError(command.checkoutSessionId);
  }

  const transitionDecision = evaluateOrderTransition({
    fromStatus: currentOrder.status,
    toStatus: 'paid',
  });

  if (transitionDecision.kind === 'rejected') {
    throw new InvalidOrderTransitionError(transitionDecision.reason);
  }

  if (transitionDecision.kind === 'noop') {
    return {
      kind: 'replay',
      order: currentOrder,
    };
  }

  const stockUpdates: Array<{
    currentStock: StockRecord;
    lineItem: PaidCheckoutFinalizationLineItem;
  }> = [];

  for (const lineItem of command.lineItems) {
    const currentStock = await stock.findByVariantId(lineItem.variantId);

    if (!currentStock || currentStock.quantity < lineItem.quantity || currentStock.onlineQuantity < lineItem.quantity) {
      return {
        kind: 'stock_unavailable',
        order: currentOrder,
        reason: 'Paid checkout cannot decrement unavailable stock.',
      };
    }

    stockUpdates.push({ currentStock, lineItem });
  }

  const updatedStockRecords: StockRecord[] = [];
  const recordedStockChangeRecords: StockChangeRecord[] = [];

  for (const { currentStock, lineItem } of stockUpdates) {
    const updatedStock = await stock.save(lineItem.variantId, {
      onlineQuantity: createStockQuantity(currentStock.onlineQuantity - lineItem.quantity),
      quantity: createStockQuantity(currentStock.quantity - lineItem.quantity),
    });
    const recordedStockChange = await stockChanges.record({
      actorEmail: 'stripe-webhook',
      notes: `Checkout session ${command.checkoutSessionId}`,
      quantityDelta: createStockChangeDelta(Number(lineItem.quantity) * -1),
      reason: 'checkout_paid',
      recordedAt: command.transitionedAt,
      variantId: lineItem.variantId,
    });

    updatedStockRecords.push(updatedStock);
    recordedStockChangeRecords.push(recordedStockChange);
  }

  const transitionedOrder = await orders.saveTransition(command.checkoutSessionId, {
    status: 'paid',
    statusUpdatedAt: command.transitionedAt,
    stripePaymentIntentId: command.stripePaymentIntentId,
  });

  if (!transitionedOrder) {
    throw new CheckoutOrderNotFoundError(command.checkoutSessionId);
  }

  return {
    kind: 'transitioned',
    order: transitionedOrder,
    stock: updatedStockRecords,
    stockChanges: recordedStockChangeRecords,
  };
}
