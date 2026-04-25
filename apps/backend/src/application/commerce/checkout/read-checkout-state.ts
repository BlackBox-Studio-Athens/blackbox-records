import { reconcileCheckoutSession } from './reconcile-checkout-session';
import type { CheckoutGateway, CheckoutState } from './types';

export async function readCheckoutState(
  checkoutGateway: CheckoutGateway,
  checkoutSessionId: string,
): Promise<CheckoutState> {
  const session = await checkoutGateway.readCheckoutSession(checkoutSessionId);

  return reconcileCheckoutSession(session).checkoutState;
}
