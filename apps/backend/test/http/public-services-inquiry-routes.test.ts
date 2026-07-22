import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EmailProviderOperationResult } from '../../src/application/email';
import type { AppBindings } from '../../src/env';
import { ResendEmailGateway } from '../../src/infrastructure/resend';
import { createHttpApp } from '../../src/interfaces/http/app';

const localBindings: AppBindings = {
  CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321',
  COMMERCE_DB: env.COMMERCE_DB,
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'LOCAL',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock_blackbox_checkout',
  STRIPE_SECRET_KEY: 'sk_test_mock',
};

const prdBindings: AppBindings = {
  ...localBindings,
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'PRD',
  RESEND_API_KEY: 're_test_blackbox_prd',
};

const uatBindings: AppBindings = {
  ...localBindings,
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_test_blackbox_uat',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
};

const validInquiry = {
  bandOrProject: 'BlackBox Test',
  email: 'visitor@example.com',
  message: 'Please send more information.',
  name: 'Test Visitor',
  service: 'General',
  serviceDetails: 'Athens',
};

const serviceRoutes = [
  ['General', 'info@blackboxrecordsathens.com'],
  ['Tour Booking', 'booking@blackboxrecordsathens.com'],
  ['Merch Printing', 'merch@blackboxrecordsathens.com'],
  ['Vinyl Printing', 'vinyl@blackboxrecordsathens.com'],
] as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('public Services inquiry HTTP route', () => {
  it.each(serviceRoutes)('routes %s inquiries to %s with the visitor Reply-To', async (service, recipient) => {
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail').mockResolvedValue({ ok: true });

    const response = await submitInquiry(
      {
        ...validInquiry,
        service,
      },
      prdBindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ status: 'submitted' });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail.mock.calls[0]?.[0]).toMatchObject({
      replyTo: validInquiry.email,
      to: recipient,
    });
  });

  it.each([
    ['blank required field', { ...validInquiry, name: '   ' }],
    ['invalid email', { ...validInquiry, email: 'not-an-email' }],
    ['unknown service', { ...validInquiry, service: 'Mastering' }],
    ['overlong message', { ...validInquiry, message: 'x'.repeat(2_001) }],
    ['extra field', { ...validInquiry, marketingConsent: true }],
    ['recipient override', { ...validInquiry, recipient: 'attacker@example.com' }],
    ['to override', { ...validInquiry, to: 'attacker@example.com' }],
    ['to-like override', { ...validInquiry, toEmail: 'attacker@example.com' }],
  ])('rejects %s before provider delivery', async (_label, inquiry) => {
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail').mockResolvedValue({ ok: true });

    const response = await submitInquiry(inquiry, prdBindings);

    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      code: 'invalid_request',
      error: 'Invalid request.',
      requestId: expect.any(String),
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('accepts Local inquiries through the no-network mock provider', async () => {
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail');

    const response = await submitInquiry(validInquiry, localBindings);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'submitted' });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('routes UAT inquiries to the managed sink without logging visitor content', async () => {
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail').mockResolvedValue({ ok: true });
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const inquiry = {
      ...validInquiry,
      email: 'visitor+uat@example.com',
      message: 'Private UAT visitor message.',
      service: 'Tour Booking',
    };

    const response = await submitInquiry(inquiry, uatBindings);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'submitted' });
    expect(sendEmail.mock.calls[0]?.[0]).toMatchObject({
      replyTo: inquiry.email,
      to: 'uat-sink@ambkime.resend.app',
    });
    const logs = JSON.stringify([...info.mock.calls, ...warn.mock.calls]);
    expect(logs).not.toContain(inquiry.email);
    expect(logs).not.toContain(inquiry.message);
  });

  it('returns a provider-safe 503 when email runtime configuration is unavailable', async () => {
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail');
    const bindings = {
      ...localBindings,
      RESEND_API_KEY: undefined,
    };

    const response = await submitInquiry(validInquiry, bindings);

    await expectUnavailableResponse(response);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('maps provider rejection to a provider-safe 503', async () => {
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail').mockResolvedValue({
      ok: false,
      reason: 'provider_unavailable',
      retryable: true,
    });

    const response = await submitInquiry(
      {
        ...validInquiry,
        email: 'private@example.com',
        message: 'Private provider rejection details.',
      },
      prdBindings,
    );

    await expectUnavailableResponse(response);
    const body = JSON.stringify(await response.clone().json());
    expect(body).not.toContain('provider_unavailable');
    expect(body).not.toContain('private@example.com');
    expect(body).not.toContain('Private provider rejection details.');
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it('does not return submitted status before provider acceptance', async () => {
    let acceptProvider!: (result: EmailProviderOperationResult) => void;
    const providerResult = new Promise<EmailProviderOperationResult>((resolve) => {
      acceptProvider = resolve;
    });
    const sendEmail = vi.spyOn(ResendEmailGateway.prototype, 'sendEmail').mockReturnValue(providerResult);

    let responseSettled = false;
    const responsePromise = submitInquiry(validInquiry, prdBindings).then((response) => {
      responseSettled = true;
      return response;
    });

    await vi.waitFor(() => expect(sendEmail).toHaveBeenCalledOnce());
    await Promise.resolve();
    expect(responseSettled).toBe(false);

    acceptProvider({ ok: true });
    const response = await responsePromise;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'submitted' });
  });
});

async function submitInquiry(inquiry: unknown, bindings: AppBindings): Promise<Response> {
  return createHttpApp().request(
    'http://backend.test/api/services/inquiries',
    {
      body: JSON.stringify(inquiry),
      headers: {
        'content-type': 'application/json',
        origin: 'http://127.0.0.1:4321',
      },
      method: 'POST',
    },
    bindings,
  );
}

async function expectUnavailableResponse(response: Response): Promise<void> {
  expect(response.status).toBe(503);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  await expect(response.clone().json()).resolves.toEqual({
    code: 'services_inquiry_unavailable',
    error: 'Services inquiry submission is temporarily unavailable.',
    requestId: expect.any(String),
  });
}
