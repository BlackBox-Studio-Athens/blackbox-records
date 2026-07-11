import { describe, expect, it } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';
import { createEmailRuntimeServices } from '../../src/interfaces/http/routes/email-runtime-services';
import { ResendEmailGateway } from '../../src/infrastructure/resend';

const localBindings = {
  CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321,http://localhost:4321',
  COMMERCE_DB: {} as D1Database,
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'LOCAL' as const,
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock_blackbox_checkout',
  STRIPE_SECRET_KEY: 'sk_test_mock',
};

describe('email runtime services', () => {
  it('uses a no-network email provider for local fake Resend config', async () => {
    const { provider } = createEmailRuntimeServices(localBindings);

    await expect(
      provider.registerNewsletterContact({
        email: 'fan@example.com',
        properties: {
          consentCopyVersion: 'blackbox-newsletter-v1',
        },
        segmentId: null,
        topicId: 'topic_mock_blackbox_newsletter',
      }),
    ).resolves.toEqual({ ok: true });

    await expect(
      provider.sendEmail({
        from: 'orders@blackboxrecordsathens.com',
        html: '<p>Paid</p>',
        idempotencyKey: 'blackbox:local:test',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Paid',
        tags: [],
        text: 'Paid',
        to: 'fan@example.com',
      }),
    ).resolves.toEqual({ ok: true });
  });

  it('keeps real Resend gateway selection for local non-mock keys', () => {
    const { provider } = createEmailRuntimeServices({
      ...localBindings,
      RESEND_API_KEY: 're_real_local_test_key',
    });

    expect(provider).toBeInstanceOf(ResendEmailGateway);
  });

  it('keeps real Resend gateway selection outside local even with mock-shaped keys', () => {
    const { provider } = createEmailRuntimeServices({
      ...localBindings,
      PRODUCT_ENVIRONMENT: 'UAT',
      RESEND_API_KEY: 're_mock_blackbox_uat',
      RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
    });

    expect(provider).toBeInstanceOf(ResendEmailGateway);
  });

  it('lets the public newsletter route register locally without real Resend', async () => {
    const response = await createHttpApp().request(
      'http://backend.test/api/newsletter/registrations',
      {
        body: JSON.stringify({
          consentAccepted: true,
          email: 'fan@example.com',
        }),
        headers: {
          'content-type': 'application/json',
          origin: 'http://127.0.0.1:4321',
        },
        method: 'POST',
      },
      localBindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ status: 'registered' });
  });
});
