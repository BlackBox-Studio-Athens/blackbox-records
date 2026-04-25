import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CheckoutOrderSummary, {
  CHECKOUT_ORDER_SUMMARY_COPY,
  createCheckoutOrderSummaryView,
  type CheckoutOrderSummaryInput,
} from './CheckoutOrderSummary';

const summaryInput: CheckoutOrderSummaryInput = {
  availabilityLabel: 'Available',
  canBuy: true,
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  itemHref: '/blackbox-records/store/disintegration-black-vinyl-lp/',
  optionLabel: 'Black Vinyl LP',
  priceDisplay: '€28.00',
  subtitle: 'Afterwise',
  title: 'Disintegration',
};

describe('CheckoutOrderSummary', () => {
  it('creates a direct-load order summary view from static item data', () => {
    expect(createCheckoutOrderSummaryView(summaryInput)).toEqual({
      ...summaryInput,
      securePaymentCopy: 'Payment is handled securely by Stripe.',
      subtotalDisplay: '€28.00',
    });
  });

  it('renders the familiar checkout summary copy and item line', () => {
    const markup = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);

    expect(markup).toContain(CHECKOUT_ORDER_SUMMARY_COPY.title);
    expect(markup).toContain('Disintegration');
    expect(markup).toContain('Afterwise');
    expect(markup).toContain('Black Vinyl LP');
    expect(markup).toContain('Subtotal');
    expect(markup).toContain('€28.00');
    expect(markup).toContain('Payment is handled securely by Stripe.');
    expect(markup).toContain('/blackbox-records/store/disintegration-black-vinyl-lp/');
  });

  it('keeps unavailable items visible without changing the subtotal source', () => {
    const view = createCheckoutOrderSummaryView({
      ...summaryInput,
      availabilityLabel: 'Sold Out',
      canBuy: false,
      priceDisplay: 'Price soon',
    });

    expect(view).toMatchObject({
      availabilityLabel: 'Sold Out',
      canBuy: false,
      subtotalDisplay: 'Price soon',
    });
  });

  it('does not require forbidden checkout, Stripe, D1, stock, order, or actor fields', () => {
    const view = createCheckoutOrderSummaryView(summaryInput);
    const serializedView = JSON.stringify(view);

    expect(serializedView).not.toContain('price_');
    expect(serializedView).not.toContain('sk_');
    expect(serializedView).not.toContain('store_item_option_');
    expect(serializedView).not.toContain('stockCount');
    expect(serializedView).not.toContain('clientSecret');
    expect(serializedView).not.toContain('orderState');
    expect(serializedView).not.toContain('actorEmail');
  });
});
