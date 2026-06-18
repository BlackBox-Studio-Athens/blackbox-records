import { describe, expect, it } from 'vitest';

import { reconcileCheckoutSession } from '../../../../src/application/commerce/checkout';
import type { StripeCheckoutSessionState } from '../../../../src/application/commerce/checkout/spi';
import { checkoutSessionId, paymentIntentId } from '../../../support/commerce-value-objects';

function session(input: Partial<StripeCheckoutSessionState>): StripeCheckoutSessionState {
  return {
    amountTotalMinor: null,
    checkoutSessionId: checkoutSessionId('cs_test_123'),
    currencyCode: null,
    customer: {
      email: null,
      name: null,
      phone: null,
    },
    newsletterOptIn: false,
    paymentStatus: 'unpaid',
    shippingAddress: null,
    status: 'open',
    ...input,
  };
}

describe('checkout reconciliation', () => {
  it('recommends paid when Stripe reports paid payment status', () => {
    expect(
      reconcileCheckoutSession(
        session({
          paymentStatus: 'paid',
          status: 'complete',
          stripePaymentIntentId: paymentIntentId('pi_test_123'),
        }),
      ),
    ).toEqual({
      checkoutState: {
        checkoutSessionId: 'cs_test_123',
        paymentStatus: 'paid',
        shippingLocker: null,
        state: 'paid',
        status: 'complete',
      },
      isAuthoritative: false,
      recommendedOrderStatus: 'paid',
      source: {
        amountTotalMinor: null,
        checkoutSessionId: 'cs_test_123',
        currencyCode: null,
        customer: {
          email: null,
          name: null,
          phone: null,
        },
        newsletterOptIn: false,
        shippingAddress: null,
        stripePaymentIntentId: 'pi_test_123',
      },
    });
  });

  it.each([
    {
      input: session({ paymentStatus: 'unpaid', status: 'open' }),
      orderStatus: 'pending_payment',
      state: 'open',
    },
    {
      input: session({ paymentStatus: 'unpaid', status: 'expired' }),
      orderStatus: 'not_paid',
      state: 'expired',
    },
    {
      input: session({ paymentStatus: 'unpaid', status: 'complete' }),
      orderStatus: 'pending_payment',
      state: 'processing',
    },
    {
      input: session({ paymentStatus: 'no_payment_required', status: 'complete' }),
      orderStatus: 'needs_review',
      state: 'unknown',
    },
    {
      input: session({ paymentStatus: 'unpaid', status: null }),
      orderStatus: 'needs_review',
      state: 'unknown',
    },
  ] as const)('maps $input.status/$input.paymentStatus to $state and $orderStatus', ({ input, orderStatus, state }) => {
    expect(reconcileCheckoutSession(input)).toEqual(
      expect.objectContaining({
        checkoutState: expect.objectContaining({
          state,
        }),
        isAuthoritative: false,
        recommendedOrderStatus: orderStatus,
      }),
    );
  });

  it('defaults missing backend-only Stripe source identifiers to null', () => {
    expect(reconcileCheckoutSession(session({})).source).toEqual({
      amountTotalMinor: null,
      checkoutSessionId: 'cs_test_123',
      currencyCode: null,
      customer: {
        email: null,
        name: null,
        phone: null,
      },
      newsletterOptIn: false,
      shippingAddress: null,
      stripePaymentIntentId: null,
    });
  });
});
