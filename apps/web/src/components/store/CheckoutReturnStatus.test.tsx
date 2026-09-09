import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { addStoreCartItem, readStoreCartState, writeStoreCartState } from '@/lib/store-cart';
import { CHECKOUT_CART_UPDATED_EVENT, STORE_CART_OPEN_REQUESTED_EVENT } from '@/lib/store-cart-events';
import CheckoutReturnStatus, {
  CHECKOUT_RETURN_ACTION_COPY,
  CheckoutReturnStatusScreen,
  CheckoutSuccessScreen,
  clearStoreCartAfterPaidCheckout,
  connectCheckoutReturnStatus,
  requestStoreCartOpen,
} from './CheckoutReturnStatus';
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
  checkoutSessionId: 'cs_mock_variant_disintegration-black-vinyl-lp_standard',
  orderStatus: 'pending_payment',
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
  it.each([null, 'pending_payment', 'needs_review', 'not_paid'] as const)(
    'does not confirm payment before a paid order exists: %s',
    (orderStatus) => {
      const view = createCheckoutReturnStatusView({
        kind: 'ready',
        checkoutState: {
          ...checkoutState,
          state: 'paid',
          paymentStatus: 'paid',
          orderStatus,
        },
      });
      expect(view.isFinal).toBe(false);
      expect(view.detail).not.toContain('order is recorded');
    },
  );
  it('reads only session_id from the return query string', () => {
    expect(readCheckoutSessionIdFromSearch('?session_id=cs_test_123&redirect_status=succeeded')).toBe('cs_test_123');
    expect(readCheckoutSessionIdFromSearch('?redirect_status=succeeded')).toBeNull();
    expect(readCheckoutSessionIdFromSearch('?session_id=')).toBeNull();
  });

  it('loads ReadCheckoutState through the public checkout API seam', async () => {
    const api: Pick<PublicCheckoutApi, 'readCheckoutState'> = {
      readCheckoutState: vi.fn(async () => checkoutState),
    };

    await expect(
      loadCheckoutReturnState(api, 'cs_mock_variant_disintegration-black-vinyl-lp_standard'),
    ).resolves.toEqual({
      checkoutState,
      kind: 'ready',
    });
    expect(api.readCheckoutState).toHaveBeenCalledExactlyOnceWith(
      'cs_mock_variant_disintegration-black-vinyl-lp_standard',
    );
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
          paymentStatus: state === 'paid' ? 'paid' : 'unpaid',
          orderStatus: state === 'paid' ? 'paid' : 'pending_payment',
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
        paymentStatus: 'paid',
        orderStatus: 'paid',
        status: 'complete',
      },
      kind: 'ready',
    });
    const html = renderToStaticMarkup(<CheckoutSuccessScreen storePath="/blackbox-records/store/" view={view} />);

    expect(html).toContain('Thanks for the order');
    expect(html).toContain('Confirmed');
    expect(html).toContain('Payment is confirmed and your order is recorded.');
    expect(html).toContain('What happens next');
    expect(html).toContain('Receipt');
    expect(html).toContain('Check the email used at checkout for the Stripe payment receipt.');
    expect(html).toContain('Fulfillment');
    expect(html).toContain('BlackBox will prepare the shipment manually.');
    expect(html).toContain('Delivery');
    expect(html).toContain('BOX NOW details will follow once the shipment is arranged.');
    expect(html.match(/Continue Shopping/g)).toHaveLength(1);
    expect(html.match(/BOX NOW/g)).toHaveLength(1);
    expect(html).not.toContain('Reference');
    expect(html).not.toContain('cs_mock');
    expect(html).not.toContain('cs_test');
    expect(html).not.toContain('cs_live');
    expect(html).not.toContain('checkoutSessionId');
    expect(html).not.toContain('Payment confirmed');
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
    expect(html).not.toContain('What happens next');
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
        priceKind: 'fixed',
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

  it('renders initial checkout resolution as a visible pending status before final or recovery state', () => {
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

    expect(html).toContain('data-checkout-return-pending');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Payment Status');
    expect(html).toContain('Confirming Payment');
    expect(html).toContain('We are confirming the latest payment status');
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.retryCheckout);
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.backToCart);
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.backToItem);
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.continueShopping);
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

  it('refreshes without overlap, confirms delayed orders, and stops on unmount', async () => {
    vi.useFakeTimers();
    const pending: CheckoutState = { ...checkoutState, paymentStatus: 'paid', state: 'paid' };
    let resolveRead!: (state: CheckoutState) => void;
    const api = {
      readCheckoutState: vi
        .fn()
        .mockResolvedValueOnce(pending)
        .mockImplementationOnce(
          () =>
            new Promise<CheckoutState>((resolve) => {
              resolveRead = resolve;
            }),
        ),
    };
    const onState = vi.fn();
    const connection = connectCheckoutReturnStatus(api, 'cs_test_123', onState);
    try {
      await vi.advanceTimersByTimeAsync(5000);
      expect(api.readCheckoutState).toHaveBeenCalledTimes(2);
      connection.refresh();
      await vi.advanceTimersByTimeAsync(15000);
      expect(api.readCheckoutState).toHaveBeenCalledTimes(2);
      resolveRead({ ...pending, orderStatus: 'paid' });
      await vi.advanceTimersByTimeAsync(60000);
      expect(createCheckoutReturnStatusView(onState.mock.lastCall![0]).isFinal).toBe(true);
      expect(api.readCheckoutState).toHaveBeenCalledTimes(2);
    } finally {
      connection.stop();
      vi.useRealTimers();
    }
  });

  it.each(['budget', 'error', 'review', 'unmount'] as const)(
    'stops refresh on %s and preserves payment facts',
    async (ending) => {
      vi.useFakeTimers();
      const pending: CheckoutState = { ...checkoutState, state: 'paid', paymentStatus: 'paid' };
      const api = { readCheckoutState: vi.fn().mockResolvedValue(pending) };
      if (ending === 'error')
        api.readCheckoutState.mockResolvedValueOnce(pending).mockRejectedValueOnce(new Error('offline'));
      if (ending === 'review') api.readCheckoutState.mockResolvedValueOnce({ ...pending, orderStatus: 'needs_review' });
      const onState = vi.fn();
      const connection = connectCheckoutReturnStatus(api, 'cs_test_123', onState);
      try {
        await vi.advanceTimersByTimeAsync(0);
        if (ending === 'unmount') connection.stop();
        await vi.advanceTimersByTimeAsync(120000);
        expect(api.readCheckoutState).toHaveBeenCalledTimes(ending === 'budget' ? 13 : ending === 'error' ? 2 : 1);
        const view = createCheckoutReturnStatusView(onState.mock.lastCall![0]);
        expect(view.isFinal).toBe(false);
        expect(view.supportOnly).toBe(true);
        if (ending !== 'unmount') expect(view.autoRefresh).not.toBe(true);
        if (ending === 'error') expect(view.detail).toContain('Payment was received');
      } finally {
        connection.stop();
        vi.useRealTimers();
      }
    },
  );
});
