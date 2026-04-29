import type { OrderStateRepository } from '../../../domain/commerce/repositories';
import { reconcileCheckoutSession } from './reconcile-checkout-session';
import type { CheckoutGateway, CheckoutState } from './types';

export async function readCheckoutState(
  checkoutGateway: CheckoutGateway,
  orders: OrderStateRepository,
  checkoutSessionId: string,
): Promise<CheckoutState> {
  const [session, order] = await Promise.all([
    checkoutGateway.readCheckoutSession(checkoutSessionId),
    orders.findByCheckoutSessionId(checkoutSessionId),
  ]);

  return {
    ...reconcileCheckoutSession(session).checkoutState,
    shippingLocker: order?.shippingLocker ?? null,
  };
}
