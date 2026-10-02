import type { OrderStateRepository } from '../../../domain/commerce/repositories/spi';
import { latestShipEstimate, parseCheckoutSessionId } from '../../../domain/commerce';
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
  const estimates = order?.lines?.flatMap((line) => (line.preorder ? [line.preorder.shipEstimate] : [])) ?? [];

  return {
    ...reconcileCheckoutSession(session).checkoutState,
    orderStatus: order?.status ?? null,
    preorder: estimates.length ? { shipEstimate: latestShipEstimate(estimates) } : null,
    shippingLocker: order?.shippingLocker ?? null,
  };
}
