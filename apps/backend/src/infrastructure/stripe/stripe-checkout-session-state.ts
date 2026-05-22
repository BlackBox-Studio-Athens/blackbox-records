import type Stripe from 'stripe';

import type {
  StripeCheckoutPaymentStatus,
  StripeCheckoutSessionState,
  StripeCheckoutSessionStatus,
} from '../../application/commerce/checkout/spi';
import {
  parseCheckoutSessionId,
  parsePaymentIntentId,
  type PaymentIntentId,
} from '../../application/commerce/checkout';

export function toStripeCheckoutSessionState(session: Stripe.Checkout.Session): StripeCheckoutSessionState {
  return {
    checkoutSessionId: parseCheckoutSessionId(session.id),
    paymentStatus: session.payment_status as StripeCheckoutPaymentStatus,
    status: session.status as StripeCheckoutSessionStatus,
    stripePaymentIntentId: readStripePaymentIntentId(session.payment_intent),
  };
}

function readStripePaymentIntentId(paymentIntent: Stripe.Checkout.Session['payment_intent']): PaymentIntentId | null {
  if (!paymentIntent) {
    return null;
  }

  return parsePaymentIntentId(typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id);
}
