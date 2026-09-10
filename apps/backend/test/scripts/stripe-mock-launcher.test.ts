import { describe, expect, it } from 'vitest';

import { patchStripeMockRequest, patchStripeMockResponse } from '../../../../scripts/start-stripe-mock';

describe('stripe-mock local launcher proxy', () => {
  it('retains synthetic inclusive amounts and accepted delivery across Session reads', () => {
    const checkoutSessions = new Map();
    const checkoutLineItems = new Map();
    const created = JSON.parse(
      patchStripeMockResponse({
        body: JSON.stringify({ id: 'cs_test_money', object: 'checkout.session' }),
        checkoutSessions,
        checkoutLineItems,
        method: 'POST',
        url: '/v1/checkout/sessions',
        requestBody: new URLSearchParams({
          'line_items[0][price]': 'price_mock_disintegration_black_vinyl_lp',
          'line_items[0][quantity]': '1',
          'automatic_tax[enabled]': 'true',
          'shipping_options[0][shipping_rate_data][fixed_amount][amount]': '250',
          'metadata[parcelTier]': 'small',
          'metadata[monetaryPolicyReference]': 'synthetic-v1',
        }).toString(),
      }),
    );
    expect(created).toMatchObject({
      amount_total: 3050,
      automatic_tax: { enabled: true, status: 'complete' },
      shipping_cost: { amount_total: 250, amount_tax: 48 },
      total_details: { amount_tax: 590, amount_discount: 0 },
    });
    expect(
      JSON.parse(
        patchStripeMockResponse({
          body: '{}',
          checkoutSessions,
          method: 'GET',
          url: '/v1/checkout/sessions/cs_test_money',
          requestBody: '',
        }),
      ),
    ).toEqual(created);
    expect(
      JSON.parse(
        patchStripeMockResponse({
          body: '{"status":"expired"}',
          checkoutSessions,
          method: 'POST',
          url: '/v1/checkout/sessions/cs_test_money/expire',
          requestBody: '',
        }),
      ),
    ).toMatchObject({ status: 'expired', amount_total: 3050 });
    expect(checkoutSessions.get('cs_test_money')?.status).toBe('expired');
  });
  it('returns the requested local expiry rather than the static fixture deadline', () => {
    const patched = patchStripeMockResponse({
      body: JSON.stringify({ id: 'cs_test_expiry', object: 'checkout.session', expires_at: 1, url: null }),
      method: 'POST',
      requestBody: 'expires_at=1777026600',
      url: '/v1/checkout/sessions',
    });
    expect(JSON.parse(patched)).toMatchObject({ expires_at: 1777026600 });
  });
  it('leaves hosted Checkout requests unchanged', () => {
    const body = new URLSearchParams({
      cancel_url: 'http://127.0.0.1:4321/checkout',
      mode: 'payment',
      success_url: 'http://127.0.0.1:4321/return',
    }).toString();

    expect(
      patchStripeMockRequest({
        body,
        method: 'POST',
        url: '/v1/checkout/sessions',
      }),
    ).toBe(body);
  });

  it('leaves non-checkout requests unchanged', () => {
    expect(
      patchStripeMockRequest({
        body: 'mode=payment',
        method: 'POST',
        url: '/v1/charges',
      }),
    ).toBe('mode=payment');
  });

  it('adds a local-only hosted Checkout URL when stripe-mock returns null for redirect checkout', () => {
    const patched = patchStripeMockResponse({
      body: JSON.stringify({
        id: 'cs_test_fixture',
        object: 'checkout.session',
        url: null,
      }),
      method: 'POST',
      requestBody: new URLSearchParams({
        'metadata[variantId]': 'variant_disintegration-black-vinyl-lp_standard',
      }).toString(),
      url: '/v1/checkout/sessions',
    });

    expect(JSON.parse(patched) as unknown).toEqual(
      expect.objectContaining({
        id: 'cs_test_fixture',
        url: 'https://checkout.stripe.test/session/cs_test_fixture',
      }),
    );
  });

  it('rewrites stripe-mock hosted Checkout URLs to the local-only test origin', () => {
    const patched = patchStripeMockResponse({
      body: JSON.stringify({
        id: 'cs_test_fixture',
        object: 'checkout.session',
        url: 'https://checkout.stripe.com/pay/c/cs_test_fixture',
      }),
      method: 'POST',
      requestBody: new URLSearchParams({
        'metadata[variantId]': 'variant_disintegration-black-vinyl-lp_standard',
      }).toString(),
      url: '/v1/checkout/sessions',
    });

    expect(JSON.parse(patched) as unknown).toEqual(
      expect.objectContaining({
        id: 'cs_test_fixture',
        url: 'https://checkout.stripe.test/session/cs_test_fixture',
      }),
    );
  });

  it('returns the Price IDs and quantities used to create each local Checkout Session', () => {
    const checkoutLineItems = new Map();

    patchStripeMockResponse({
      body: JSON.stringify({ id: 'cs_test_fixture', object: 'checkout.session', url: null }),
      checkoutLineItems,
      method: 'POST',
      requestBody: new URLSearchParams({
        'line_items[0][price]': 'price_mock_disintegration_black_vinyl_lp',
        'line_items[0][quantity]': '2',
      }).toString(),
      url: '/v1/checkout/sessions',
    });

    const patched = patchStripeMockResponse({
      body: JSON.stringify({
        data: [{ price: { id: 'price_unrelated_fixture' }, quantity: 1 }],
        object: 'list',
      }),
      checkoutLineItems,
      method: 'GET',
      requestBody: '',
      url: '/v1/checkout/sessions/cs_test_fixture/line_items?limit=100',
    });

    expect(JSON.parse(patched) as unknown).toEqual(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            amount_total: 5600,
            price: expect.objectContaining({ id: 'price_mock_disintegration_black_vinyl_lp' }),
            quantity: 2,
          }),
        ],
      }),
    );
  });
});
