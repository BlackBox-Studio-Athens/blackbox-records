import { describe, expect, it } from 'vitest';

import { apiClientMswBaseUrl, internalStockFixtures, publicCheckoutFixtures } from './test/msw-handlers';
import { createInternalApiFetcher } from './internal-client';
import { createPublicApiFetcher } from './public-client';

describe('api client fetchers', () => {
  it('creates a public API fetcher', () => {
    const fetcher = createPublicApiFetcher('http://127.0.0.1:8787');

    expect(fetcher).toBeDefined();
    expect(typeof fetcher.configure).toBe('function');
  });

  it('creates an internal API fetcher', () => {
    const fetcher = createInternalApiFetcher('https://sandbox.example.workers.dev');

    expect(fetcher).toBeDefined();
    expect(typeof fetcher.configure).toBe('function');
  });

  it('reads a public checkout response through MSW using generated API shapes', async () => {
    const fetcher = createPublicApiFetcher(apiClientMswBaseUrl);
    const startCheckout = fetcher.path('/api/checkout/sessions').method('post').create();

    await expect(startCheckout(publicCheckoutFixtures.startCheckoutBody)).resolves.toMatchObject({
      data: publicCheckoutFixtures.startCheckoutResponse,
      ok: true,
      status: 200,
    });
  });

  it('reads an internal stock response through MSW using generated API shapes', async () => {
    const fetcher = createInternalApiFetcher(apiClientMswBaseUrl);
    const readStock = fetcher.path('/api/internal/variants/{variantId}/stock').method('get').create();

    await expect(readStock({ variantId: internalStockFixtures.variant.variantId })).resolves.toMatchObject({
      data: internalStockFixtures.stockDetail,
      ok: true,
      status: 200,
    });
  });
});
