import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { apiClientMswBaseUrl, publicCheckoutFixtures } from '@blackbox/api-client/test/msw-handlers';
import { webMswServer } from '@/test/msw-server';
import {
  createPublicCheckoutApi,
  type PublicCommerceError,
  type PublicCheckoutApiError,
  type NewsletterRegistrationBody,
  type NewsletterRegistrationResponse,
  resolvePublicCheckoutApiBaseUrl,
  type StartCheckoutBody,
  type StartCheckoutResponse,
} from './public-checkout-api';

describe('resolvePublicCheckoutApiBaseUrl', () => {
  it('defaults to same-origin checkout calls when PUBLIC_BACKEND_BASE_URL is unset', () => {
    expect(resolvePublicCheckoutApiBaseUrl(undefined)).toBe('');
  });

  it('normalizes the configured backend base URL for local split-port development', () => {
    expect(resolvePublicCheckoutApiBaseUrl('http://127.0.0.1:8787/')).toBe('http://127.0.0.1:8787');
  });
});

describe('createPublicCheckoutApi', () => {
  it('reads browser-safe store capabilities through the public Worker route', async () => {
    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    const result = await api.readStoreCapabilities();

    expect(result).toEqual(publicCheckoutFixtures.storeCapabilities);
  });

  it('reads store offers through public Worker routes', async () => {
    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    const result = await api.readStoreOffer('disintegration-black-vinyl-lp');

    expect(result).toEqual(publicCheckoutFixtures.storeOffer);
  });

  it('uses the configured backend base URL for split-port development', async () => {
    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    const result = await api.readStoreOfferVariants('disintegration-black-vinyl-lp');

    expect(result).toEqual([publicCheckoutFixtures.storeOffer]);
  });

  it('posts checkout payloads as JSON and returns the hosted checkout URL', async () => {
    let receivedBody: StartCheckoutBody | null = null;
    webMswServer.use(
      http.post<Record<string, never>, StartCheckoutBody, StartCheckoutResponse>(
        '*/api/checkout/sessions',
        async ({ request }) => {
          receivedBody = (await request.json()) as StartCheckoutBody;

          return HttpResponse.json(publicCheckoutFixtures.startCheckoutResponse);
        },
      ),
    );

    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    const result = await api.startCheckout(publicCheckoutFixtures.startCheckoutBody);

    expect(result).toEqual(publicCheckoutFixtures.startCheckoutResponse);
    expect(receivedBody).toEqual(publicCheckoutFixtures.startCheckoutBody);
  });

  it('reads ReadCheckoutState with the Worker-owned shipping recap', async () => {
    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    const result = await api.readCheckoutState('cs_test_123');

    expect(result).toEqual(publicCheckoutFixtures.checkoutState);
  });

  it('posts newsletter signup consent through the public Worker route', async () => {
    let receivedBody: NewsletterRegistrationBody | null = null;
    webMswServer.use(
      http.post<Record<string, never>, NewsletterRegistrationBody, NewsletterRegistrationResponse>(
        '*/api/newsletter/registrations',
        async ({ request }) => {
          receivedBody = (await request.json()) as NewsletterRegistrationBody;

          return HttpResponse.json(publicCheckoutFixtures.newsletterRegistrationResponse);
        },
      ),
    );

    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    const result = await api.registerNewsletterSignup(publicCheckoutFixtures.newsletterRegistrationBody);

    expect(result).toEqual(publicCheckoutFixtures.newsletterRegistrationResponse);
    expect(receivedBody).toEqual(publicCheckoutFixtures.newsletterRegistrationBody);
  });

  it('surfaces visible API error objects with status and response body', async () => {
    webMswServer.use(
      http.post<Record<string, never>, StartCheckoutBody, PublicCommerceError>('*/api/checkout/sessions', () =>
        HttpResponse.json(publicCheckoutFixtures.checkoutUnavailable, { status: 409 }),
      ),
    );

    const api = createPublicCheckoutApi(apiClientMswBaseUrl);

    await expect(api.startCheckout(publicCheckoutFixtures.startCheckoutBody)).rejects.toMatchObject({
      body: {
        error: 'Checkout unavailable or not configured.',
      },
      message: 'Checkout unavailable or not configured.',
      name: 'PublicCheckoutApiError',
      status: 409,
    } satisfies Partial<PublicCheckoutApiError>);
  });
});
