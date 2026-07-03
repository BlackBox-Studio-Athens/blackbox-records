import { describe, expect, it } from 'vitest';

import { CheckoutConfigurationError } from '../../src/application/commerce/checkout';
import {
  createPublicCheckoutCancelUrl,
  createPublicCheckoutReturnUrl,
  readAllowedCheckoutReturnOrigins,
} from '../../src/interfaces/http/routes/public-checkout-return-url';

describe('public checkout return URL policy', () => {
  it('normalizes an allowed item checkout referer to cart checkout including a base path', () => {
    const headers = new Headers({
      origin: 'https://blackbox.example',
      referer: 'https://blackbox.example/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
    });

    expect(
      createPublicCheckoutReturnUrl(
        headers,
        'http://backend.test/api/checkout/sessions',
        'disintegration-black-vinyl-lp',
        'https://blackbox.example/blackbox-records',
      ),
    ).toBe('https://blackbox.example/blackbox-records/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}');
  });

  it('falls back to the allowed site base when the referer is malformed', () => {
    const headers = new Headers({
      origin: 'https://blackbox.example',
      referer: 'not-a-url',
    });

    expect(
      createPublicCheckoutReturnUrl(
        headers,
        'http://backend.test/api/checkout/sessions',
        'disintegration-black-vinyl-lp',
        'https://blackbox.example/blackbox-records',
      ),
    ).toBe('https://blackbox.example/blackbox-records/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}');
  });

  it('falls back to the configured GitHub Pages base path when only the origin is available', () => {
    const headers = new Headers({
      origin: 'https://blackbox-studio-athens.github.io',
    });

    expect(
      createPublicCheckoutReturnUrl(
        headers,
        'http://backend.test/api/checkout/sessions',
        'disintegration-black-vinyl-lp',
        'https://blackbox-studio-athens.github.io/blackbox-records',
      ),
    ).toBe(
      'https://blackbox-studio-athens.github.io/blackbox-records/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}',
    );
  });

  it('falls back to the configured site base for cancel URLs too', () => {
    const headers = new Headers({
      origin: 'https://blackbox-studio-athens.github.io',
    });

    expect(
      createPublicCheckoutCancelUrl(
        headers,
        'http://backend.test/api/checkout/sessions',
        'disintegration-black-vinyl-lp',
        'https://blackbox-studio-athens.github.io/blackbox-records',
      ),
    ).toBe('https://blackbox-studio-athens.github.io/blackbox-records/store/checkout/');
  });

  it('rejects fallback origins outside the configured allowlist', () => {
    const headers = new Headers({
      origin: 'https://evil.example',
      referer: 'https://evil.example/store/disintegration-black-vinyl-lp/checkout/',
    });

    expect(() =>
      createPublicCheckoutReturnUrl(
        headers,
        'http://backend.test/api/checkout/sessions',
        'disintegration-black-vinyl-lp',
        'https://blackbox.example',
      ),
    ).toThrow(CheckoutConfigurationError);
  });

  it('ignores malformed configured origins and normalizes allowed origins', () => {
    expect([
      ...readAllowedCheckoutReturnOrigins(' https://blackbox.example/path , not-a-url, http://127.0.0.1:4321 '),
    ]).toEqual(['https://blackbox.example', 'http://127.0.0.1:4321']);
  });
});
