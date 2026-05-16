import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CheckoutShippingStep from './CheckoutShippingStep';
import { createCheckoutShippingGateView } from './checkout-shipping-step-state';

describe('CheckoutShippingStep', () => {
  it('keeps manual BOX NOW fulfillment ready before payment opens', () => {
    expect(createCheckoutShippingGateView('stripe')).toMatchObject({
      badgeLabel: 'Manual BOX NOW',
      canContinueToPayment: true,
      title: 'Shipping Collected In Checkout',
      tone: 'ready',
    });
  });

  it('ignores the client mode because manual BOX NOW is collected by Stripe Checkout', () => {
    expect(createCheckoutShippingGateView('mock')).toMatchObject({
      canContinueToPayment: true,
      fulfillmentDetail: 'The label creates the BOX NOW shipment manually after the Stripe payment is confirmed.',
      shippingDetail: 'Greece only',
      tone: 'ready',
    });
  });

  it('renders the manual fulfillment state without BOX NOW credentials or picker controls', () => {
    const markup = renderToStaticMarkup(<CheckoutShippingStep checkoutClientMode="stripe" />);

    expect(markup).toContain('Shipping Collected In Checkout');
    expect(markup).toContain('Manual BOX NOW');
    expect(markup).toContain('Stripe collects the Greek shipping address and contact details before payment.');
    expect(markup).not.toContain('Use BOX NOW Test Locker');
    expect(markup).not.toContain('BOX_NOW_API');
    expect(markup).not.toContain('whsec_');
    expect(markup).not.toContain('sk_');
  });
});
