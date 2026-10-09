import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { addStoreCartItem, readStoreCartState, writeStoreCartState } from '@/components/store/cart/store-cart';
import {
  CHECKOUT_CART_UPDATED_EVENT,
  STORE_CART_OPEN_REQUESTED_EVENT,
} from '@/components/store/cart/store-cart-events';
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
import type { CheckoutState, PublicCheckoutApi } from './public-checkout-api';

const shippingLocker = {
  country_code: 'GR' as const,
  locker_id: '4',
  locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
};

const checkoutState = {
  checkoutSessionId: 'cs_mock_variant_disintegration-black-vinyl-lp_standard',
  orderStatus: 'pending_payment',
  paymentStatus: 'unpaid',
  preorder: null,
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
          orderSnapshot: { reference: 'BBR-FIXTURE', lines: [] },
        },
      });
      expect(view.isFinal).toBe(false);
      expect(view.detail).not.toContain('order is recorded');
      expect(view).not.toHaveProperty('orderSnapshot');
    },
  );
  it.each([
    { name: 'mixed', ordinary: true, shipEstimate: { kind: 'month', month: '2026-11', part: null } },
    { name: 'pre-order only', ordinary: false, shipEstimate: { kind: 'date', date: '2026-11-20' } },
    { name: 'unknown estimate', ordinary: false, shipEstimate: null },
  ] satisfies {
    name: string;
    ordinary: boolean;
    shipEstimate: NonNullable<CheckoutState['preorder']>['shipEstimate'];
  }[])('renders immutable paid $name facts and safe published media', ({ ordinary, shipEstimate }) => {
    const preorder = { shipEstimate };
    const view = createCheckoutReturnStatusView({
      kind: 'ready',
      checkoutState: {
        ...checkoutState,
        orderStatus: 'paid',
        paymentStatus: 'paid',
        state: 'paid',
        status: 'complete',
        shippingLocker: null,
        preorder,
        orderSnapshot: {
          reference: 'BBR-FIXTURE',
          lines: [
            {
              displayName: 'Saved <Record>',
              optionLabel: 'Vinyl',
              quantity: 2,
              storeItemSlug: 'saved-record',
              preorder,
            },
            ...(ordinary
              ? [
                  {
                    displayName: 'Ordinary record',
                    optionLabel: null,
                    quantity: 1,
                    storeItemSlug: 'ordinary',
                    preorder: null,
                  },
                ]
              : []),
          ],
        },
      },
    });
    const html = renderToStaticMarkup(
      <CheckoutSuccessScreen
        storePath="/blackbox-records/store/"
        view={view}
        releasedMediaByStoreItem={{
          'saved-record': [
            { title: 'Released <Single>', url: 'https://example.test/single' },
            { title: 'Unsafe link', url: 'javascript:alert(1)' },
          ],
        }}
      />,
    );
    expect(html).toContain('Payment received for order BBR-FIXTURE. A confirmation email is on its way.');
    expect(html).toContain('Saved &lt;Record&gt;');
    expect(html).toContain('Vinyl');
    expect(html).toContain('× 2');
    expect(html.includes('In stock, sent with the pre-order')).toBe(ordinary);
    expect(html).toContain('One BOX NOW locker parcel. We contact you to arrange the locker before dispatch.');
    expect(html).toContain('Released &lt;Single&gt;');
    expect(html).toContain('href="https://example.test/single"');
    expect(html).not.toContain('Unsafe link');
    expect(html).not.toContain('javascript:');
    if (!shipEstimate) {
      expect(html).toContain('ship estimate to be announced');
      expect(html).not.toContain('November');
      expect(html).not.toContain('ship month');
    }
    expect(renderToStaticMarkup(<CheckoutSuccessScreen storePath="/store/" view={view} />)).not.toContain(
      'Out now, while you wait',
    );
  });

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
    expect(html).not.toContain('preorder-edge');
    expect(view).not.toHaveProperty('isPreorder');
  });

  it.each([
    {
      estimate: 'month',
      shipEstimate: { kind: 'month', month: '2026-10', part: null },
      fulfillment:
        'Your whole order is sent together when the pre-order arrives, expected around October 2026. We email you if that changes.',
    },
    {
      estimate: 'month part',
      shipEstimate: { kind: 'month', month: '2026-10', part: 'mid' },
      fulfillment:
        'Your whole order is sent together when the pre-order arrives, expected around mid October 2026. We email you if that changes.',
    },
    {
      estimate: 'exact date',
      shipEstimate: { kind: 'date', date: '2026-10-20' },
      fulfillment:
        'Your whole order is sent together when the pre-order arrives, expected on 20 October 2026. We email you if that changes.',
    },
    {
      estimate: 'withheld',
      shipEstimate: null,
      fulfillment: 'Your whole order is sent together when the pre-order arrives. We email you if that changes.',
    },
  ] satisfies {
    estimate: string;
    shipEstimate: NonNullable<CheckoutState['preorder']>['shipEstimate'];
    fulfillment: string;
  }[])('confirms a paid preorder with a $estimate estimate', ({ shipEstimate, fulfillment }) => {
    const paidPreorder: CheckoutState = {
      ...checkoutState,
      state: 'paid',
      paymentStatus: 'paid',
      orderStatus: 'paid',
      status: 'complete',
      preorder: { shipEstimate },
    };
    const view = createCheckoutReturnStatusView({ checkoutState: paidPreorder, kind: 'ready' });
    expect(view).toMatchObject({
      badgeLabel: 'Confirmed',
      detail: 'Payment is confirmed and your pre-order is recorded.',
      isFinal: true,
      isPreorder: true,
      title: 'Pre-order confirmed',
      tone: 'success',
    });
    expect(view.nextSteps).toEqual({
      heading: 'What happens next',
      items: [
        {
          icon: 'receipt',
          label: 'Receipt',
          value: 'Check the email used at checkout for the Stripe payment receipt.',
        },
        { icon: 'fulfillment', label: 'Fulfillment', value: fulfillment },
        { icon: 'delivery', label: 'Delivery', value: 'BOX NOW details will follow once the shipment is arranged.' },
      ],
    });

    const html = renderToStaticMarkup(<CheckoutSuccessScreen storePath="/blackbox-records/store/" view={view} />);
    expect(html).toContain('Pre-order confirmed');
    expect(html).toContain('Payment is confirmed and your pre-order is recorded.');
    expect(html).toContain(fulfillment);
    expect(html).toContain('preorder-edge');
    expect(html.match(/Continue Shopping/g)).toHaveLength(1);
    expect(html).not.toContain('Thanks for the order');
    expect(html).not.toContain('BlackBox will prepare the shipment manually.');
    expect(html).not.toContain('cs_mock');
    expect(html).not.toContain(CHECKOUT_RETURN_ACTION_COPY.retryCheckout);
  });

  it.each([
    { ...checkoutState },
    { ...checkoutState, state: 'processing' },
    { ...checkoutState, state: 'expired', orderStatus: 'not_paid' },
    { ...checkoutState, state: 'unknown', orderStatus: null },
    { ...checkoutState, state: 'paid', paymentStatus: 'paid', orderStatus: null },
    { ...checkoutState, state: 'paid', paymentStatus: 'paid' },
    { ...checkoutState, state: 'paid', paymentStatus: 'paid', orderStatus: 'needs_review' },
    { ...checkoutState, state: 'paid', paymentStatus: 'paid', orderStatus: 'not_paid' },
    { ...checkoutState, state: 'processing', orderStatus: 'not_paid' },
    { ...checkoutState, state: 'paid', orderStatus: 'paid' },
  ] satisfies CheckoutState[])(
    'keeps non-final preorder state unchanged: $state/$paymentStatus/$orderStatus',
    (nonFinalState) => {
      const ordinaryView = createCheckoutReturnStatusView({ checkoutState: nonFinalState, kind: 'ready' });
      const view = createCheckoutReturnStatusView({
        checkoutState: { ...nonFinalState, preorder: { shipEstimate: null } },
        kind: 'ready',
      });
      expect(view).toEqual(ordinaryView);
      expect(view.isFinal).toBe(false);
      expect(view).not.toHaveProperty('isPreorder');
      const html = renderToStaticMarkup(
        <CheckoutReturnStatusScreen checkoutPath="/store/checkout/" storePath="/store/" view={view} />,
      );
      expect(html).not.toContain('Pre-order confirmed');
      expect(html).not.toContain('preorder-edge');
    },
  );

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
