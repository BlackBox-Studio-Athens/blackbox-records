import type { OrderStateRepository } from '../../../domain/commerce/repositories/spi';
import { parseCheckoutSessionId } from '../../../domain/commerce';
import { reconcileCheckoutSession } from './reconcile-checkout-session';
import type { CheckoutGateway } from './spi';
import type { CheckoutState } from './types';

export async function readCheckoutState(
  checkoutGateway: CheckoutGateway,
  orders: OrderStateRepository,
  checkoutSessionId: unknown,
): Promise<CheckoutState> {
  const parsedCheckoutSessionId = parseCheckoutSessionId(checkoutSessionId);
  const [session, order] = await Promise.all([
    checkoutGateway.readCheckoutSession(parsedCheckoutSessionId),
    orders.findByCheckoutSessionId(parsedCheckoutSessionId),
  ]);

  return {
    ...reconcileCheckoutSession(session).checkoutState,
    shippingLocker: order?.shippingLocker ?? null,
  };
}
