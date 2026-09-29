import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

import { reconcileCheckoutSession } from '../../../src/application/commerce/checkout';
import { readStripeCollectedPaidOrderFulfillmentDetails } from '../../../src/application/commerce/orders/checkout-order-paid-event';
import { toStripeCheckoutSessionState } from '../../../src/infrastructure/stripe/stripe-checkout-session-state';

describe('collected shipping fulfillment', () => {
  const shipping = {
    name: 'Shipping Recipient',
    address: { city: 'Athens', country: 'GR', line1: 'Shipping 12', line2: null, postal_code: '10558', state: null },
  };
  const session = {
    id: 'cs_test_shipping',
    amount_total: 2500,
    currency: 'eur',
    status: 'complete',
    payment_status: 'paid',
    customer_details: {
      name: 'Billing Buyer',
      email: 'buyer@example.com',
      phone: '+441234567890',
      address: {
        city: 'London',
        country: 'GB',
        line1: 'Billing 99',
        line2: null,
        postal_code: 'SW1A 1AA',
        state: null,
      },
    },
    collected_information: { shipping_details: shipping },
  } as Stripe.Checkout.Session;

  it('uses Greek shipping independently of British billing and keeps buyer contact', () => {
    const result = readStripeCollectedPaidOrderFulfillmentDetails(
      reconcileCheckoutSession(toStripeCheckoutSessionState(session)),
    );
    expect(result).toEqual({
      recipientName: 'Shipping Recipient',
      shippingAddress: {
        city: 'Athens',
        country: 'GR',
        line1: 'Shipping 12',
        line2: null,
        postalCode: '10558',
        state: null,
      },
      shopperContact: { email: 'buyer@example.com', phone: '+441234567890' },
    });
  });

  it.each([null, { ...shipping, address: { ...shipping.address, country: 'GB' } }, { ...shipping, name: '' }])(
    'never substitutes billing for missing or unsupported shipping %#',
    (shippingDetails) => {
      const invalid = {
        ...session,
        customer_details: { ...session.customer_details, address: { ...shipping.address } },
        collected_information: { shipping_details: shippingDetails },
      } as Stripe.Checkout.Session;
      expect(() =>
        readStripeCollectedPaidOrderFulfillmentDetails(reconcileCheckoutSession(toStripeCheckoutSessionState(invalid))),
      ).toThrow('fulfillment details are incomplete');
    },
  );
});
