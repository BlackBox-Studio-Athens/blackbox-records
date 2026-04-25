import { describe, expect, it } from 'vitest';

import { patchStripeMockRequest, patchStripeMockResponse } from '../../../../scripts/start-stripe-mock';

describe('stripe-mock local launcher proxy', () => {
  it('rewrites only the current SDK embedded Checkout enum for stripe-mock compatibility', () => {
    const body = new URLSearchParams({
      mode: 'payment',
      return_url: 'http://127.0.0.1:4321/return',
      ui_mode: 'embedded_page',
    }).toString();

    expect(
      new URLSearchParams(
        patchStripeMockRequest({
          body,
          method: 'POST',
          url: '/v1/checkout/sessions',
        }),
      ).get('ui_mode'),
    ).toBe('embedded');
  });

  it('leaves non-checkout requests unchanged', () => {
    expect(
      patchStripeMockRequest({
        body: 'ui_mode=embedded_page',
        method: 'POST',
        url: '/v1/charges',
      }),
    ).toBe('ui_mode=embedded_page');
  });

  it('adds a local-only client secret when stripe-mock returns null for embedded checkout', () => {
    const patched = patchStripeMockResponse({
      body: JSON.stringify({
        client_secret: null,
        id: 'cs_test_fixture',
        object: 'checkout.session',
      }),
      method: 'POST',
      requestBody: new URLSearchParams({
        'metadata[variantId]': 'variant_barren-point_standard',
      }).toString(),
      url: '/v1/checkout/sessions',
    });

    expect(JSON.parse(patched) as unknown).toEqual(
      expect.objectContaining({
        client_secret: 'cs_mock_secret_variant_barren_point_standard',
        id: 'cs_test_fixture',
      }),
    );
  });
});
