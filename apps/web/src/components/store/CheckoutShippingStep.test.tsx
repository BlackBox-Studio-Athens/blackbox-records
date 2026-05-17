import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CheckoutShippingStep from './CheckoutShippingStep';
import { createCheckoutShippingGateView } from './checkout-shipping-step-state';

describe('CheckoutShippingStep', () => {
  it('keeps manual BOX NOW fulfillment ready before payment opens', () => {
    expect(createCheckoutShippingGateView('stripe')).toMatchObject({
      badgeLabel: 'Greece only',
      canContinueToPayment: true,
      title: 'Shipping',
      tone: 'ready',
    });
  });

  it('ignores the client mode because manual BOX NOW is collected by Stripe Checkout', () => {
    expect(createCheckoutShippingGateView('mock')).toMatchObject({
      canContinueToPayment: true,
      detail: 'Stripe collects the shipping address. The label arranges BOX NOW after payment.',
      tone: 'ready',
    });
  });

  it('renders the manual fulfillment state without BOX NOW credentials or picker controls', () => {
    const markup = renderToStaticMarkup(<CheckoutShippingStep checkoutClientMode="stripe" />);

    expect(markup).toContain('Shipping');
    expect(markup).toContain('Greece only');
    expect(markup).toContain('Stripe collects the shipping address. The label arranges BOX NOW after payment.');
    expect(markup).toContain('No locker selection is needed before payment.');
    expect(markup).not.toContain('Use BOX NOW Test Locker');
    expect(markup).not.toContain('BOX_NOW_API');
    expect(markup).not.toContain('whsec_');
    expect(markup).not.toContain('sk_');
  });
});
