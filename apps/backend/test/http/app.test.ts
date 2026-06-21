import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import type { AppBindings } from '../../src/env';
import { createHttpApp } from '../../src/interfaces/http/app';

const testBindings: AppBindings = {
  PRODUCT_ENVIRONMENT: 'LOCAL',
  CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321,http://localhost:4321',
  COMMERCE_DB: env.COMMERCE_DB,
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_test_blackbox_checkout',
  STRIPE_SECRET_KEY: 'sk_test_mock',
};

function expectNoStoreCacheControl(response: Response): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

describe('createHttpApp', () => {
  it('returns 404 for unmatched routes', async () => {
    const app = createHttpApp();

    const response = await app.request('http://backend.test/nope');

    expect(response.status).toBe(404);
    expectNoStoreCacheControl(response);
  });

  it('returns a JSON fallback body for unmatched routes', async () => {
    const app = createHttpApp();

    const response = await app.request('http://backend.test/nope');

    await expect(response.json()).resolves.toEqual({
      error: 'Not Found',
    });
    expectNoStoreCacheControl(response);
  });

  it('returns JSON content type for unmatched routes', async () => {
    const app = createHttpApp();

    const response = await app.request('http://backend.test/nope');

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('allows configured browser origins to call local API routes', async () => {
    const app = createHttpApp();

    const response = await app.request(
      'http://backend.test/api/nope',
      {
        headers: {
          Origin: 'http://127.0.0.1:4321',
        },
      },
      testBindings,
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:4321');
  });

  it('allows browser origins when checkout return config includes a base path', async () => {
    const app = createHttpApp();

    const response = await app.request(
      'http://backend.test/api/nope',
      {
        headers: {
          Origin: 'https://blackbox-studio-athens.github.io',
        },
      },
      {
        ...testBindings,
        CHECKOUT_RETURN_ORIGINS: 'https://blackbox-studio-athens.github.io/blackbox-records',
      },
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('https://blackbox-studio-athens.github.io');
  });

  it('keeps CORS preflight headers intact on API routes', async () => {
    const app = createHttpApp();

    const response = await app.request(
      'http://backend.test/api/store/capabilities',
      {
        headers: {
          'Access-Control-Request-Method': 'GET',
          Origin: 'http://127.0.0.1:4321',
        },
        method: 'OPTIONS',
      },
      testBindings,
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:4321');
    expect(response.headers.get('access-control-allow-methods')).toContain('GET');
    expect(response.headers.get('access-control-allow-methods')).toContain('OPTIONS');
  });

  it('does not allow arbitrary browser origins on API routes', async () => {
    const app = createHttpApp();

    const response = await app.request(
      'http://backend.test/api/nope',
      {
        headers: {
          Origin: 'https://example.invalid',
        },
      },
      testBindings,
    );

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
