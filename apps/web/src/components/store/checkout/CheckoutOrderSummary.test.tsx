import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CheckoutOrderSummary, {
  CHECKOUT_ORDER_SUMMARY_COPY,
  type CheckoutOrderSummaryInput,
} from './CheckoutOrderSummary';

const summaryInput: CheckoutOrderSummaryInput = {
  availabilityLabel: 'Available',
  canBuy: true,
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  itemHref: '/blackbox-records/store/disintegration-black-vinyl-lp/',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2800,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€28.00',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('CheckoutOrderSummary', () => {
  it('renders the familiar checkout summary copy and item line', () => {
    const markup = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);

    expect(markup).toContain(CHECKOUT_ORDER_SUMMARY_COPY.title);
    expect(markup).toContain('Disintegration');
    expect(markup).toContain('Afterwise');
    expect(markup).toContain('Black Vinyl LP');
    expect(markup).toContain('€28.00');
    expect(markup).not.toContain('Back To Item');
  });

  it('uses Veneer only for checkout line item names', () => {
    const markup = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);

    expect(markup).toContain('brand-cart-line-title text-foreground');
    expect(markup.match(/brand-cart-line-title/g)).toHaveLength(1);
    expect(markup).toContain('€28.00');
  });

  it('does not require forbidden checkout, Stripe, D1, stock, order, or actor fields', () => {
    const serializedView = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);

    expect(serializedView).not.toContain('price_');
    expect(serializedView).not.toContain('sk_');
    expect(serializedView).not.toContain('store_item_option_');
    expect(serializedView).not.toContain('stockCount');
    expect(serializedView).not.toContain('clientSecret');
    expect(serializedView).not.toContain('orderState');
    expect(serializedView).not.toContain('actorEmail');
  });
});
