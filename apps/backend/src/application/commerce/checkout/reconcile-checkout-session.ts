import type { OrderStatus } from '../../../domain/commerce/repositories/spi';
import type { CheckoutSessionId, PaymentIntentId } from '../../../domain/commerce';
import type { StripeCheckoutSessionState } from './spi';
import type { CheckoutState } from './types';

export type CheckoutReconciliation = {
  checkoutState: CheckoutState;
  isAuthoritative: false;
  recommendedOrderStatus: OrderStatus;
  source: {
    monetary?: StripeCheckoutSessionState['monetary'];
    status?: StripeCheckoutSessionState['status'];
    paymentStatus?: StripeCheckoutSessionState['paymentStatus'];
    amountTotalMinor: number | null;
    checkoutSessionId: CheckoutSessionId;
    currencyCode: string | null;
    customer: StripeCheckoutSessionState['customer'];
    newsletterConsentCopyVersion: string | null;
    newsletterOptIn: boolean;
    orderId: string | null;
    shippingAddress: StripeCheckoutSessionState['shippingAddress'];
    shippingRecipientName: string | null;
    stripePaymentIntentId: PaymentIntentId | null;
  };
};

export function reconcileCheckoutSession(
  session: StripeCheckoutSessionState,
  eventType?: string,
): CheckoutReconciliation {
  return {
    checkoutState: {
      checkoutSessionId: session.checkoutSessionId,
      orderStatus: null,
      paymentStatus: session.paymentStatus,
      shippingLocker: null,
      state: mapCheckoutState(session),
      status: session.status,
    },
    isAuthoritative: false,
    recommendedOrderStatus: mapRecommendedOrderStatus(session, eventType),
    source: {
      monetary: session.monetary,
      status: session.status,
      paymentStatus: session.paymentStatus,
      amountTotalMinor: session.amountTotalMinor,
      checkoutSessionId: session.checkoutSessionId,
      currencyCode: session.currencyCode,
      customer: session.customer,
      newsletterConsentCopyVersion: session.newsletterConsentCopyVersion,
      newsletterOptIn: session.newsletterOptIn,
      orderId: session.orderId ?? null,
      shippingAddress: session.shippingAddress,
      shippingRecipientName: session.shippingRecipientName,
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

function mapRecommendedOrderStatus(session: StripeCheckoutSessionState, eventType?: string): OrderStatus {
  if (session.paymentStatus === 'paid') {
    return 'paid';
  }

  if (session.paymentStatus === 'no_payment_required') {
    return 'needs_review';
  }

  if (eventType === 'checkout.session.async_payment_failed') {
    return 'not_paid';
  }

  if (session.status === 'expired') {
    return 'not_paid';
  }

  if (session.status === 'open' || session.status === 'complete') {
    return 'pending_payment';
  }

  return 'needs_review';
}
