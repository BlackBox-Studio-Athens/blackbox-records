import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCartQuantity } from '@/components/store/cart/store-cart';
import CheckoutOfferStatus from './CheckoutOfferStatus';
import CheckoutOrderSummary from './CheckoutOrderSummary';

const item = {
  availabilityLabel: 'Available',
  label: 'Available',
  canBuy: true,
  image: null,
  imageAlt: 'Saved record',
  itemHref: '/store/saved-record/',
  optionLabel: 'LP',
  priceAmountMinor: 2000,
  priceCurrencyCode: 'EUR',
  priceDisplay: '€20.00',
  priceKind: 'fixed' as const,
  quantity: createCartQuantity(1),
  storeItemSlug: 'saved-record',
  subtitle: 'Saved artist',
  title: 'Saved record',
  variantId: 'saved-record_standard',
};

afterEach(() => vi.unstubAllGlobals());

describe('checkout initial cart render', () => {
  it.each([false, true])('waits for the saved cart before selecting fallback=%s', (withFallback) => {
    const readStorage = vi.fn(() => {
      throw new Error('Storage must not be read during rendering');
    });
    vi.stubGlobal('window', {
      get localStorage() {
        return readStorage();
      },
    });

    const markup = renderToString(
      <>
        <CheckoutOfferStatus initialAvailability={item} {...(withFallback ? { fallbackLineItem: item } : {})} />
        <CheckoutOrderSummary
          {...item}
          {...(!withFallback ? { priceAmountMinor: undefined, priceCurrencyCode: undefined } : {})}
        />
      </>,
    );

    expect(readStorage).not.toHaveBeenCalled();
    expect(markup).toContain('Loading your cart');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('Calculating delivery and current prices');
    expect(markup).not.toMatch(/cart is empty|Add a priced item|Delivery (?:is )?unavailable/i);
    expect(markup).not.toContain('Edit quantities');
    expect(markup).not.toContain('data-checkout-pay-state');
    expect(markup).not.toContain('Saved record');
    expect(markup).not.toContain('€20.00');
  });

  it('keeps server and initial browser markup identical with a populated local cart', () => {
    const render = () =>
      renderToString(
        <>
          <CheckoutOfferStatus initialAvailability={item} />
          <CheckoutOrderSummary {...item} />
        </>,
      );
    const serverMarkup = render();
    const getItem = vi.fn(() => JSON.stringify({ lines: [item] }));
    vi.stubGlobal('window', { localStorage: { getItem } });

    expect(render()).toBe(serverMarkup);
    expect(getItem).not.toHaveBeenCalled();
  });
});
