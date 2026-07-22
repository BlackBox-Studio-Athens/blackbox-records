import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { apiClientMswBaseUrl, publicCheckoutFixtures } from '@blackbox/api-client/test/msw-handlers';
import { webMswServer } from '@/test/msw-server';
import {
  type BackendErrorResponse,
  createPublicCheckoutApi,
  type PublicCheckoutApiError,
  type NewsletterRegistrationBody,
  type NewsletterRegistrationResponse,
  resolvePublicCheckoutApiBaseUrl,
  type ServicesInquiryBody,
  type ServicesInquiryResponse,
  submitPublicServicesInquiry,
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

  it('posts Services inquiry fields through the generated public client', async () => {
    const body: ServicesInquiryBody = {
      bandOrProject: 'Mass Culture',
      email: 'alex@example.com',
      message: 'We need vinyl help.',
      name: 'Alex',
      service: 'Vinyl Printing',
    };
    let receivedBody: ServicesInquiryBody | null = null;
    webMswServer.use(
      http.post<Record<string, never>, ServicesInquiryBody, ServicesInquiryResponse>(
        '*/api/services/inquiries',
        async ({ request }) => {
          receivedBody = (await request.json()) as ServicesInquiryBody;

          return HttpResponse.json({ status: 'submitted' });
        },
      ),
    );

    const result = await submitPublicServicesInquiry(body, apiClientMswBaseUrl);

    expect(result).toEqual({ status: 'submitted' });
    expect(receivedBody).toEqual(body);
  });

  it.each([
    [400, 'invalid_request', 'Invalid Services inquiry.'],
    [503, 'email_unavailable', 'Services inquiry is temporarily unavailable.'],
  ] as const)('surfaces Services inquiry %i responses as public API errors', async (status, code, error) => {
    const body: ServicesInquiryBody = {
      email: 'alex@example.com',
      message: 'General question.',
      name: 'Alex',
      service: 'General',
    };
    webMswServer.use(
      http.post<Record<string, never>, ServicesInquiryBody, BackendErrorResponse>('*/api/services/inquiries', () =>
        HttpResponse.json({ code, error, requestId: 'req_services_inquiry' }, { status }),
      ),
    );

    await expect(submitPublicServicesInquiry(body, apiClientMswBaseUrl)).rejects.toMatchObject({
      body: { code, error, requestId: 'req_services_inquiry' },
      message: error,
      name: 'PublicCheckoutApiError',
      status,
    } satisfies Partial<PublicCheckoutApiError>);
  });

  it('surfaces Services inquiry network failures without provider details', async () => {
    webMswServer.use(http.post('*/api/services/inquiries', () => HttpResponse.error()));

    await expect(
      submitPublicServicesInquiry(
        {
          email: 'alex@example.com',
          message: 'General question.',
          name: 'Alex',
          service: 'General',
        },
        apiClientMswBaseUrl,
      ),
    ).rejects.toMatchObject({
      name: 'PublicCheckoutApiError',
      status: 0,
    } satisfies Partial<PublicCheckoutApiError>);
  });

  it('surfaces visible API error objects with status and response body', async () => {
    webMswServer.use(
      http.post<Record<string, never>, StartCheckoutBody, BackendErrorResponse>('*/api/checkout/sessions', () =>
        HttpResponse.json(publicCheckoutFixtures.checkoutUnavailable, { status: 409 }),
      ),
    );

    const api = createPublicCheckoutApi(apiClientMswBaseUrl);

    await expect(api.startCheckout(publicCheckoutFixtures.startCheckoutBody)).rejects.toMatchObject({
      body: {
        code: 'checkout_unavailable',
        error: 'Checkout unavailable or not configured.',
        requestId: 'req_test_checkout_unavailable',
      },
      message: 'Checkout unavailable or not configured.',
      name: 'PublicCheckoutApiError',
      status: 409,
    } satisfies Partial<PublicCheckoutApiError>);
  });

  it('keeps reading legacy error message bodies during deploy skew', async () => {
    webMswServer.use(
      http.post<Record<string, never>, StartCheckoutBody, { error: string }>('*/api/checkout/sessions', () =>
        HttpResponse.json({ error: 'Legacy checkout error.' }, { status: 409 }),
      ),
    );

    const api = createPublicCheckoutApi(apiClientMswBaseUrl);

    await expect(api.startCheckout(publicCheckoutFixtures.startCheckoutBody)).rejects.toMatchObject({
      message: 'Legacy checkout error.',
      status: 409,
    } satisfies Partial<PublicCheckoutApiError>);
  });
});
