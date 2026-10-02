import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCartQuantity, type CartLine } from '@/components/store/cart/store-cart';

import CheckoutOrderSummary, {
  CHECKOUT_ORDER_SUMMARY_COPY,
  type CheckoutOrderSummaryInput,
} from './CheckoutOrderSummary';

const cartState = vi.hoisted(() => {
  const state: { lines: CartLine[] } = { lines: [] };
  return state;
});
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useState: (initialValue: unknown) =>
      actual.useState<unknown>(Array.isArray(initialValue) ? cartState.lines : initialValue),
  };
});

const ordinaryLine: CartLine = {
  availabilityLabel: 'Available',
  image: '/blackbox-records/assets/disintegration.jpg',
  imageAlt: 'Disintegration by Afterwise',
  optionLabel: 'Black Vinyl LP',
  priceAmountMinor: 2800,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€28.00',
  priceKind: 'fixed',
  quantity: createCartQuantity(1),
  storeItemSlug: 'disintegration-black-vinyl-lp',
  subtitle: 'Afterwise',
  title: 'Disintegration',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

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
  beforeEach(() => {
    cartState.lines = [];
  });
  it('renders the familiar checkout summary copy and item line', () => {
    const markup = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);

    expect(markup).toContain(CHECKOUT_ORDER_SUMMARY_COPY.title);
    expect(markup).toContain('Disintegration');
    expect(markup).toContain('Afterwise');
    expect(markup).toContain('Black Vinyl LP');
    expect(markup).toContain('€28.00');
    expect(markup).not.toContain('Back To Item');
    expect(markup).not.toContain('preorder-badge');
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

  it.each([
    {
      preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: 'mid' } },
      chip: 'Pre-order · ships around mid October 2026',
    },
    {
      preorder: { shipEstimate: { kind: 'date', date: '2026-10-20' } },
      chip: 'Pre-order · ships 20 Oct 2026',
    },
    { preorder: { shipEstimate: null }, chip: 'Pre-order' },
  ] satisfies { preorder: CartLine['preorder']; chip: string }[])(
    'marks only the preorder line with $chip',
    ({ preorder, chip }) => {
      cartState.lines = [
        ordinaryLine,
        {
          ...ordinaryLine,
          preorder,
          title: 'Incoming record',
          variantId: 'variant_incoming_record',
          quantity: createCartQuantity(2),
        },
      ];
      const markup = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);

      expect(markup.match(/class="preorder-badge"/g)).toHaveLength(1);
      expect(markup).toContain(chip);
      expect(markup).toContain('Disintegration');
      expect(markup).toContain('Incoming record');
      expect(markup).toContain('€56.00');
      expect(markup).toContain('Decrease quantity for Incoming record');
      expect(markup).toContain('Increase quantity for Incoming record');
      expect(markup.match(/brand-cart-line-title/g)).toHaveLength(2);
      expect(markup).not.toContain('Pre-order in this order');
    },
  );

  it('keeps old and explicitly ordinary cart lines free of preorder chips', () => {
    cartState.lines = [ordinaryLine, { ...ordinaryLine, variantId: 'variant_ordinary', preorder: null }];
    const markup = renderToStaticMarkup(<CheckoutOrderSummary {...summaryInput} />);
    expect(markup.match(/brand-cart-line-title/g)).toHaveLength(2);
    expect(markup).not.toContain('preorder-badge');
    expect(markup).not.toContain('Pre-order');
  });
});
