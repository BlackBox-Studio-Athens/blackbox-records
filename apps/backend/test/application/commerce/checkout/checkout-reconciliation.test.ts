import { describe, expect, it } from 'vitest';

import {
  reconcileCheckoutSession,
  type StripeCheckoutSessionState,
} from '../../../../src/application/commerce/checkout';

function session(input: Partial<StripeCheckoutSessionState>): StripeCheckoutSessionState {
  return {
    checkoutSessionId: 'cs_test_123',
    paymentStatus: 'unpaid',
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
          stripePaymentIntentId: 'pi_test_123',
        }),
      ),
    ).toEqual({
      checkoutState: {
        checkoutSessionId: 'cs_test_123',
        paymentStatus: 'paid',
        state: 'paid',
        status: 'complete',
      },
      isAuthoritative: false,
      recommendedOrderStatus: 'paid',
      source: {
        checkoutSessionId: 'cs_test_123',
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
      checkoutSessionId: 'cs_test_123',
      stripePaymentIntentId: null,
    });
  });
});
