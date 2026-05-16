import type { OrderStateRepository } from '../../../domain/commerce/repositories/spi';
import { reconcileCheckoutSession } from './reconcile-checkout-session';
import type { CheckoutGateway } from './spi';
import type { CheckoutState } from './types';

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
