import type { OrderStatus } from '../../../domain/commerce/repositories';
import type { CheckoutState, StripeCheckoutSessionState } from './types';

export type CheckoutReconciliation = {
  checkoutState: CheckoutState;
  isAuthoritative: false;
  recommendedOrderStatus: OrderStatus;
  source: {
    checkoutSessionId: string;
    stripePaymentIntentId: string | null;
  };
};

export function reconcileCheckoutSession(session: StripeCheckoutSessionState): CheckoutReconciliation {
  return {
    checkoutState: {
      checkoutSessionId: session.checkoutSessionId,
      paymentStatus: session.paymentStatus,
      state: mapCheckoutState(session),
      status: session.status,
    },
    isAuthoritative: false,
    recommendedOrderStatus: mapRecommendedOrderStatus(session),
    source: {
      checkoutSessionId: session.checkoutSessionId,
      stripePaymentIntentId: session.stripePaymentIntentId ?? null,
    },
  };
}

function mapCheckoutState(session: StripeCheckoutSessionState): CheckoutState['state'] {
  if (session.paymentStatus === 'paid') {
    return 'paid';
  }

  if (session.paymentStatus === 'no_payment_required') {
    return 'unknown';
  }

  if (session.status === 'expired') {
    return 'expired';
  }

  if (session.status === 'open') {
    return 'open';
  }

  if (session.status === 'complete') {
    return 'processing';
  }

  return 'unknown';
}

function mapRecommendedOrderStatus(session: StripeCheckoutSessionState): OrderStatus {
  if (session.paymentStatus === 'paid') {
    return 'paid';
  }

  if (session.paymentStatus === 'no_payment_required') {
    return 'needs_review';
  }

  if (session.status === 'expired') {
    return 'not_paid';
  }

  if (session.status === 'open' || session.status === 'complete') {
    return 'pending_payment';
  }

  return 'needs_review';
}
