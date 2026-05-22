import type { CheckoutOrderRecord, OrderStateRepository, OrderStatus } from '../../../domain/commerce/repositories/spi';
import type { CheckoutSessionId, PaymentIntentId } from '../../../domain/commerce';
import { CheckoutOrderNotFoundError, InvalidOrderTransitionError } from './errors';
import { evaluateOrderTransition, type OrderTransitionOrigin } from './order-state';

export type TransitionCheckoutOrderCommand = {
  checkoutSessionId: CheckoutSessionId;
  toStatus: OrderStatus;
  transitionedAt?: Date;
  stripePaymentIntentId?: PaymentIntentId | null;
  origin?: OrderTransitionOrigin;
};

export type TransitionCheckoutOrderResult = {
  order: CheckoutOrderRecord;
  transitioned: boolean;
};

export async function transitionCheckoutOrder(
  orders: OrderStateRepository,
  command: TransitionCheckoutOrderCommand,
): Promise<TransitionCheckoutOrderResult> {
  const currentOrder = await orders.findByCheckoutSessionId(command.checkoutSessionId);

  if (!currentOrder) {
    throw new CheckoutOrderNotFoundError(command.checkoutSessionId);
  }

  const decision = evaluateOrderTransition({
    fromStatus: currentOrder.status,
    origin: command.origin,
    toStatus: command.toStatus,
  });

  if (decision.kind === 'rejected') {
    throw new InvalidOrderTransitionError(decision.reason);
  }

  if (decision.kind === 'noop') {
    return {
      order: currentOrder,
      transitioned: false,
    };
  }

  const transitionedOrder = await orders.saveTransition(command.checkoutSessionId, {
    status: command.toStatus,
    statusUpdatedAt: command.transitionedAt ?? new Date(),
    stripePaymentIntentId: command.stripePaymentIntentId,
  });

  if (!transitionedOrder) {
    throw new CheckoutOrderNotFoundError(command.checkoutSessionId);
  }

  return {
    order: transitionedOrder,
    transitioned: true,
  };
}
