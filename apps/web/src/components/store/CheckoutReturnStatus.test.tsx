import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { STORE_CART_OPEN_REQUESTED_EVENT } from '@/lib/store-cart';
import CheckoutReturnStatus, { CHECKOUT_RETURN_ACTION_COPY, requestStoreCartOpen } from './CheckoutReturnStatus';
import {
  createCheckoutReturnStatusView,
  loadCheckoutReturnState,
  readCheckoutSessionIdFromSearch,
} from './checkout-return-status-state';
import type { CheckoutState, PublicCheckoutApi } from '../../lib/backend/public-checkout-api';

const checkoutState = {
  checkoutSessionId: 'cs_mock_variant_barren-point_standard',
  paymentStatus: 'unpaid',
  state: 'open',
  status: 'open',
} satisfies CheckoutState;

describe('CheckoutReturnStatus', () => {
  it('reads only session_id from the return query string', () => {
    expect(readCheckoutSessionIdFromSearch('?session_id=cs_test_123&redirect_status=succeeded')).toBe('cs_test_123');
    expect(readCheckoutSessionIdFromSearch('?redirect_status=succeeded')).toBeNull();
    expect(readCheckoutSessionIdFromSearch('?session_id=')).toBeNull();
  });

  it('loads checkout state through the public checkout API seam', async () => {
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
    ['paid', 'Payment Confirmed', 'Paid', true],
    ['open', 'Checkout Still Open', 'Open', false],
    ['processing', 'Payment Processing', 'Processing', false],
    ['expired', 'Checkout Expired', 'Expired', false],
    ['unknown', 'Checkout State Unknown', 'Unknown', false],
  ] as const)('maps %s checkout state to app-owned shopper copy', (state, title, badgeLabel, isFinal) => {
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

    expect(html).toContain('Checkout Return');
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.retryCheckout);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.backToCart);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.backToItem);
    expect(html).toContain(CHECKOUT_RETURN_ACTION_COPY.continueShopping);
    expect(html).not.toContain('redirect_status');
    expect(html).not.toContain('payment_intent');
    expect(html).not.toContain('StartCheckout');
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
