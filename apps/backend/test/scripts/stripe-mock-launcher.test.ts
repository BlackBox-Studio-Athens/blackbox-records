import { describe, expect, it } from 'vitest';

import { patchStripeMockRequest, patchStripeMockResponse } from '../../../../scripts/start-stripe-mock';

describe('stripe-mock local launcher proxy', () => {
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
        'metadata[variantId]': 'variant_barren-point_standard',
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
});
