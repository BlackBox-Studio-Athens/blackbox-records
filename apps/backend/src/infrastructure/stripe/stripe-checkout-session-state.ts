import type Stripe from 'stripe';

import type {
  StripeCheckoutAddressSnapshot,
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
    amountTotalMinor: readAmountTotalMinor(session.amount_total),
    checkoutSessionId: parseCheckoutSessionId(session.id),
    currencyCode: readOptionalString(session.currency)?.toUpperCase() ?? null,
    customer: {
      email:
        readOptionalString(session.customer_details?.email) ??
        readOptionalString(typeof session.customer_email === 'string' ? session.customer_email : null),
      name: readOptionalString(session.customer_details?.name),
      phone: readOptionalString(session.customer_details?.phone),
    },
    newsletterOptIn: session.metadata?.newsletterOptIn === 'true',
    paymentStatus: session.payment_status as StripeCheckoutPaymentStatus,
    shippingAddress: readAddressSnapshot(session.customer_details?.address ?? null),
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

function readAmountTotalMinor(amountTotal: Stripe.Checkout.Session['amount_total']): number | null {
  return typeof amountTotal === 'number' && Number.isInteger(amountTotal) ? amountTotal : null;
}

function readAddressSnapshot(
  address: NonNullable<Stripe.Checkout.Session['customer_details']>['address'],
): StripeCheckoutAddressSnapshot | null {
  if (!address) {
    return null;
  }

  return {
    city: readOptionalString(address.city),
    country: readOptionalString(address.country),
    line1: readOptionalString(address.line1),
    line2: readOptionalString(address.line2),
    postalCode: readOptionalString(address.postal_code),
    state: readOptionalString(address.state),
  };
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
