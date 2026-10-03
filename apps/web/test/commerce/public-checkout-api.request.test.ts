import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { apiClientMswBaseUrl, publicCheckoutFixtures } from '@blackbox/api-client/test/msw-handlers';
import { webMswServer } from '@/test/msw-server';
import { loadStoreOfferPriceDisplayView } from '@/components/store/StoreOfferPriceDisplay';
import { loadStoreItemPurchaseActionState } from '@/components/store/checkout/StoreItemPurchaseActions';
import {
  type BackendErrorResponse,
  createPublicCheckoutApi,
  readDeliveryQuote,
  type PublicCheckoutApiError,
  type NewsletterRegistrationBody,
  type NewsletterRegistrationResponse,
  resolvePublicCheckoutApiBaseUrl,
  type ServicesInquiryBody,
  type ServicesInquiryResponse,
  submitPublicServicesInquiry,
  type StartCheckoutBody,
  type StartCheckoutResponse,
} from '../../src/components/store/checkout/public-checkout-api';

describe('resolvePublicCheckoutApiBaseUrl', () => {
  it('defaults to same-origin checkout calls when PUBLIC_BACKEND_BASE_URL is unset', () => {
    expect(resolvePublicCheckoutApiBaseUrl(undefined)).toBe('');
  });

  it('normalizes the configured backend base URL for local split-port development', () => {
    expect(resolvePublicCheckoutApiBaseUrl('http://127.0.0.1:8787/')).toBe('http://127.0.0.1:8787');
  });
});

describe('createPublicCheckoutApi', () => {
  it('passes delivery cancellation to the underlying no-store request', async () => {
    let received!: (request: Request) => void;
    let release!: () => void;
    const started = new Promise<Request>((resolve) => {
      received = resolve;
    });
    const response = new Promise<void>((resolve) => {
      release = resolve;
    });
    webMswServer.use(
      http.post('*/api/store/delivery-quote', async ({ request }) => {
        received(request);
        await response;
        return HttpResponse.json({ quote: null });
      }),
    );
    vi.stubEnv('PUBLIC_BACKEND_BASE_URL', apiClientMswBaseUrl);
    try {
      const controller = new AbortController();
      const result = readDeliveryQuote(
        [{ storeItemSlug: 'record', variantId: 'variant_record', quantity: 1 }],
        controller.signal,
      );
      const failed = expect(result).rejects.toMatchObject({ status: 0 });
      const request = await started;
      expect(request.cache).toBe('no-store');
      controller.abort();
      expect(request.signal.aborted).toBe(true);
      await failed;
    } finally {
      release();
      vi.unstubAllEnvs();
    }
  });
  it('rejects an unhandled MSW request', async () => {
    await expect(fetch('https://unmocked.invalid/')).rejects.toThrow();
  });

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

  it('serves one item view price and purchase control from one offer request', async () => {
    let requests = 0;
    webMswServer.use(
      http.get('*/api/store/items/:slug', () => {
        requests++;
        return HttpResponse.json(publicCheckoutFixtures.storeOffer);
      }),
    );
    const slug = publicCheckoutFixtures.storeOffer.storeItemSlug;
    const [price, purchase] = await Promise.all([
      loadStoreOfferPriceDisplayView(createPublicCheckoutApi(apiClientMswBaseUrl), slug),
      loadStoreItemPurchaseActionState(createPublicCheckoutApi(apiClientMswBaseUrl), {
        availabilityLabel: 'Available',
        image: '/cart-176.webp',
        imageAlt: 'Record',
        optionLabel: null,
        storeItemSlug: slug,
        subtitle: 'Artist',
        title: 'Record',
        variantId: publicCheckoutFixtures.storeOffer.variantId,
      }),
    ]);
    expect(requests).toBe(1);
    expect(price.tone).toBe('ready');
    expect(purchase.cartItem?.image).toBe('/cart-176.webp');
  });

  it.each([false, true])(
    'shares concurrent offer reads and releases them after settlement (failure=%s)',
    async (failure) => {
      let requests = 0;
      const caches: RequestCache[] = [];
      webMswServer.use(
        http.get('*/api/store/items/:slug', ({ request }) => {
          requests++;
          caches.push(request.cache);
          return failure && requests === 1
            ? HttpResponse.error()
            : HttpResponse.json(publicCheckoutFixtures.storeOffer);
        }),
      );
      const price = createPublicCheckoutApi(apiClientMswBaseUrl);
      const purchase = createPublicCheckoutApi(apiClientMswBaseUrl);
      const first = price.readStoreOffer('shared-view');
      const second = purchase.readStoreOffer('shared-view');
      expect(second).toBe(first);
      const results = await Promise.allSettled([first, second]);
      expect(results.map(({ status }) => status)).toEqual(
        failure ? ['rejected', 'rejected'] : ['fulfilled', 'fulfilled'],
      );
      expect(requests).toBe(1);
      await expect(price.readStoreOffer('shared-view')).resolves.toEqual(publicCheckoutFixtures.storeOffer);
      expect(requests).toBe(2);
      expect(caches).toEqual(['no-store', 'no-store']);
    },
  );

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
      service: 'Vinyl Pressing',
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
        HttpResponse.json(
          {
            type: `/problems/${code}`,
            title: 'Request failed.',
            status,
            detail: error,
            code,
            error,
            requestId: 'req_services_inquiry',
          },
          { status },
        ),
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
      message: 'Checkout is unavailable right now.',
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

  it('does not surface foreign problem types or HTML auth documents', async () => {
    webMswServer.use(
      http.post<Record<string, never>, StartCheckoutBody>('*/api/checkout/sessions', () =>
        HttpResponse.json(
          {
            type: 'https://provider.example/problems/internal',
            detail: 'Provider secret details.',
            error: 'Provider secret details.',
          },
          { status: 503 },
        ),
      ),
    );
    const api = createPublicCheckoutApi(apiClientMswBaseUrl);
    await expect(api.startCheckout(publicCheckoutFixtures.startCheckoutBody)).rejects.toMatchObject({
      message: 'Could not start checkout.',
      status: 503,
    } satisfies Partial<PublicCheckoutApiError>);

    webMswServer.use(
      http.post<Record<string, never>, StartCheckoutBody>(
        '*/api/checkout/sessions',
        () => new HttpResponse('<html>Sign in</html>', { status: 503, headers: { 'content-type': 'text/html' } }),
      ),
    );
    await expect(api.startCheckout(publicCheckoutFixtures.startCheckoutBody)).rejects.toMatchObject({
      message: 'Could not start checkout.',
      status: 503,
    } satisfies Partial<PublicCheckoutApiError>);
  });
});
