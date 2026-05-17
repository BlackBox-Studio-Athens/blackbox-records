import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  addStoreCartItem,
  readStoreCartState,
  STORE_CART_OPEN_REQUESTED_EVENT,
  writeStoreCartState,
} from '@/lib/store-cart';
import CheckoutReturnStatus, {
  CHECKOUT_RETURN_ACTION_COPY,
  CheckoutReturnStatusScreen,
  CheckoutSuccessScreen,
  clearStoreCartAfterPaidCheckout,
  requestStoreCartOpen,
} from './CheckoutReturnStatus';
import { CHECKOUT_CART_UPDATED_EVENT } from './CheckoutOrderSummary';
import {
  createCheckoutReturnStatusView,
  loadCheckoutReturnState,
  readCheckoutSessionIdFromSearch,
} from './checkout-return-status-state';
import type { CheckoutState, PublicCheckoutApi } from '../../lib/backend/public-checkout-api';

const shippingLocker = {
  country_code: 'GR' as const,
  locker_id: '4',
  locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
};

const checkoutState = {
  checkoutSessionId: 'cs_mock_variant_barren-point_standard',
  paymentStatus: 'unpaid',
  shippingLocker,
  state: 'open',
  status: 'open',
} satisfies CheckoutState;

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe('CheckoutReturnStatus', () => {
  it('reads only session_id from the return query string', () => {
    expect(readCheckoutSessionIdFromSearch('?session_id=cs_test_123&redirect_status=succeeded')).toBe('cs_test_123');
    expect(readCheckoutSessionIdFromSearch('?redirect_status=succeeded')).toBeNull();
    expect(readCheckoutSessionIdFromSearch('?session_id=')).toBeNull();
  });

  it('loads ReadCheckoutState through the public checkout API seam', async () => {
    const api: Pick<PublicCheckoutApi, 'readCheckoutState'> = {
      readCheckoutState: vi.fn(async () => checkoutState),
    };

    await expect(loadCheckoutReturnState(api, 'cs_mock_variant_barren-point_standard')).resolves.toEqual({
      checkoutState,
      kind: 'ready',
    });
    expect(api.readCheckoutState).toHaveBeenCalledExactlyOnceWith('cs_mock_variant_barren-point_standard');
  });

  it('does not call the API when the return link has no checkout session', async () => {
    const api: Pick<PublicCheckoutApi, 'readCheckoutState'> = {
      readCheckoutState: vi.fn(),
    };

    await expect(loadCheckoutReturnState(api, null)).resolves.toEqual({ kind: 'missing_session' });
    expect(api.readCheckoutState).not.toHaveBeenCalled();
  });

  it.each([
    ['paid', 'Thanks for the order', 'Confirmed', true],
    ['open', 'Payment Not Finished', 'Open', false],
    ['processing', 'Payment Processing', 'Processing', false],
    ['expired', 'Checkout Expired', 'Expired', false],
    ['unknown', 'We Could Not Confirm Payment', 'Unknown', false],
  ] as const)('maps %s ReadCheckoutState output to app-owned shopper copy', (state, title, badgeLabel, isFinal) => {
    expect(
      createCheckoutReturnStatusView({
        checkoutState: {
          ...checkoutState,
          state,
        },
        kind: 'ready',
      }),
    ).toMatchObject({
      badgeLabel,
      isFinal,
      title,
    });
  });

  it('shows the Worker-owned selected BOX NOW locker in return recap state', () => {
    expect(
      createCheckoutReturnStatusView({
        checkoutState,
        kind: 'ready',
      }).shippingLocker,
    ).toEqual({
      detail: 'Locker ID 4 · Greece-only BOX NOW',
      kind: 'selected',
      label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
    });
  });

  it('hides manual BOX NOW recap when Worker state has no locker snapshot', () => {
    expect(
      createCheckoutReturnStatusView({
        checkoutState: {
          ...checkoutState,
          shippingLocker: null,
        },
        kind: 'ready',
      }).shippingLocker,
    ).toEqual({ kind: 'hidden' });
  });

  it('renders paid checkout as a distinct success screen with one shopping action', () => {
    const view = createCheckoutReturnStatusView({
      checkoutState: {
        ...checkoutState,
        shippingLocker: null,
        state: 'paid',
        status: 'complete',
      },
      kind: 'ready',
    });
    const html = renderToStaticMarkup(<CheckoutSuccessScreen storePath="/blackbox-records/store/" view={view} />);

    expect(html).toContain('Thanks for the order');
    expect(html).toContain('Confirmed');
    expect(html).toContain('Payment is confirmed and your order is recorded.');
    expect(html).toContain('Confirmation details');
    expect(html).toContain('Payment confirmed');
    expect(html).toContain('cs_mock_variant_barren-point_standard');
    expect(html).toContain('BOX NOW arranged manually by BlackBox');
    expect(html).toContain('Stripe will email the payment receipt if an email address was provided at checkout.');
    expect(html).toContain('What happens next');
    expect(html).toContain('BlackBox will prepare the shipment manually and contact you if anything is needed.');
    expect(html.match(/Continue Shopping/g)).toHaveLength(1);
    expect(html.match(/BOX NOW/g)).toHaveLength(1);
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.retryCheckout);
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.backToCart);
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.backToItem);
    expect(html).not.toContain('Need help');
    expect(html).not.toContain('Order Summary');
  });

  it('keeps recovery actions on non-final checkout states', () => {
    const view = createCheckoutReturnStatusView({
      checkoutState,
      kind: 'ready',
    });
    const html = renderToStaticMarkup(
      <CheckoutReturnStatusScreen
        checkoutPath="/blackbox-records/store/disintegration-black-vinyl-lp/checkout/"
        itemPath="/blackbox-records/store/disintegration-black-vinyl-lp/"
        storePath="/blackbox-records/store/"
        view={view}
      />,
    );

    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.continueShopping);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.retryCheckout);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.backToCart);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.backToItem);
    expect(html).not.toContain('Confirmation details');
    expect(html).not.toContain('Payment confirmed');
  });

  it('clears the browser-only StoreCart after paid checkout confirmation', () => {
    const storage = createMemoryStorage();
    const eventTarget = new EventTarget();
    const updated = vi.fn();
    eventTarget.addEventListener(CHECKOUT_CART_UPDATED_EVENT, updated);
    writeStoreCartState(
      storage,
      addStoreCartItem({
        availabilityLabel: 'Available',
        image: null,
        imageAlt: null,
        optionLabel: 'Black Vinyl LP',
        priceAmountMinor: 2800,
        priceCurrencyCode: 'EUR',
        priceDisplay: '€28.00',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        subtitle: 'Afterwise',
        title: 'Disintegration',
        variantId: 'variant_disintegration_black_vinyl_lp',
      }),
    );

    expect(readStoreCartState(storage).lines).toHaveLength(1);
    expect(clearStoreCartAfterPaidCheckout(eventTarget, storage)).toBe(true);
    expect(readStoreCartState(storage).lines).toHaveLength(0);
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('renders loading state actions without raw Stripe or implementation labels', () => {
    const html = renderToStaticMarkup(
      <CheckoutReturnStatus
        checkoutPath="/blackbox-records/store/disintegration-black-vinyl-lp/checkout/"
        itemPath="/blackbox-records/store/disintegration-black-vinyl-lp/"
        storePath="/blackbox-records/store/"
        api={{
          readCheckoutState: vi.fn(),
        }}
      />,
    );

    expect(html).toContain('Payment Status');
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.retryCheckout);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.backToCart);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.backToItem);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.continueShopping);
    expect(html).not.toContain('redirect_status');
    expect(html).not.toContain('payment_intent');
    expect(html).not.toContain('StartCheckout');
    expect(html).not.toContain('session_id');
    expect(html).not.toContain('Checkout State');
  });

  it('dispatches a browser-only cart open request', () => {
    const eventTarget = new EventTarget();
    let opened = false;
    eventTarget.addEventListener(STORE_CART_OPEN_REQUESTED_EVENT, () => {
      opened = true;
    });

    expect(requestStoreCartOpen(eventTarget)).toBe(true);
    expect(opened).toBe(true);
  });
});
