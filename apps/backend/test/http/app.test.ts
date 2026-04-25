import { describe, expect, it } from 'vitest';

import type { AppBindings } from '../../src/env';
import { createHttpApp } from '../../src/interfaces/http/app';

const testBindings: AppBindings = {
  APP_ENV: 'local',
  CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321,http://localhost:4321',
  COMMERCE_DB: {} as D1Database,
  STRIPE_SECRET_KEY: 'sk_test_mock',
};

describe('createHttpApp', () => {
  it('returns 404 for unmatched routes', async () => {
    const app = createHttpApp();

    const response = await app.request('http://backend.test/nope');

    expect(response.status).toBe(404);
  });

  it('returns a JSON fallback body for unmatched routes', async () => {
    const app = createHttpApp();

    const response = await app.request('http://backend.test/nope');

    await expect(response.json()).resolves.toEqual({
      error: 'Not Found',
    });
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
