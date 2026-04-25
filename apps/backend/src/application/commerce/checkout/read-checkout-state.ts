import type { CheckoutGateway, CheckoutState, StripeCheckoutPaymentStatus, StripeCheckoutSessionStatus } from './types';

function mapCheckoutState(
  status: StripeCheckoutSessionStatus,
  paymentStatus: StripeCheckoutPaymentStatus,
): CheckoutState['state'] {
  if (paymentStatus === 'paid') {
    return 'paid';
  }

  if (status === 'open') {
    return 'open';
  }

  if (status === 'expired') {
    return 'expired';
  }

  if (status === 'complete') {
    return 'processing';
  }

  return 'unknown';
}

export async function readCheckoutState(
  checkoutGateway: CheckoutGateway,
  checkoutSessionId: string,
): Promise<CheckoutState> {
  const session = await checkoutGateway.readCheckoutSession(checkoutSessionId);

  return {
    checkoutSessionId: session.checkoutSessionId,
    paymentStatus: session.paymentStatus,
    state: mapCheckoutState(session.status, session.paymentStatus),
    status: session.status,
  };
}
