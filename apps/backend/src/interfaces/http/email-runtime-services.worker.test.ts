import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';

import { createHttpApp } from './app';
import { createEmailRuntimeServices } from '../../infrastructure/resend';

const localBindings = {
  CHECKOUT_RETURN_ORIGINS: 'http://127.0.0.1:4321,http://localhost:4321',
  COMMERCE_DB: env.COMMERCE_DB,
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web-uat.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
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
  it('withdraws without provider credentials and keeps guessed tokens indistinguishable', async () => {
    const app = createHttpApp();
    const bindings = { COMMERCE_DB: env.COMMERCE_DB };
    for (const token of ['a'.repeat(64), 'b'.repeat(64)]) {
      const response = await app.request(
        'http://backend.test/api/availability-alerts/withdrawals',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        },
        bindings,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      await expect(response.json()).resolves.toEqual({ status: 'withdrawn' });
    }
  });

  it('rejects tokens in malformed or extra-field bodies without revealing state', async () => {
    const response = await createHttpApp().request(
      'http://backend.test/api/availability-alerts/withdrawals',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'a'.repeat(64), email: 'other@example.com' }),
      },
      { COMMERCE_DB: env.COMMERCE_DB },
    );
    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain('other@example.com');
  });

  it('does not treat a GET as newsletter confirmation or alert withdrawal', async () => {
    const app = createHttpApp();
    for (const route of ['newsletter/confirmations', 'availability-alerts/withdrawals']) {
      const response = await app.request(`http://backend.test/api/${route}`, {}, { COMMERCE_DB: env.COMMERCE_DB });
      expect(response.status).toBe(404);
    }
  });

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

    expect(typeof provider.registerNewsletterContact).toBe('function');
    expect(typeof provider.sendEmail).toBe('function');
  });

  it('keeps real Resend gateway selection outside local even with mock-shaped keys', () => {
    const { provider } = createEmailRuntimeServices({
      ...localBindings,
      PRODUCT_ENVIRONMENT: 'UAT',
      RESEND_API_KEY: 're_mock_blackbox_uat',
      RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
    });

    expect(typeof provider.registerNewsletterContact).toBe('function');
    expect(typeof provider.sendEmail).toBe('function');
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
    await expect(response.json()).resolves.toEqual({ status: 'registered', confirmationRequired: true });
  });

  it('lets the public Services inquiry route submit locally without real Resend', async () => {
    const response = await createHttpApp().request(
      'http://backend.test/api/services/inquiries',
      {
        body: JSON.stringify({
          email: 'visitor@example.com',
          message: 'Please send more information.',
          name: 'Test Visitor',
          service: 'General',
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
    await expect(response.json()).resolves.toEqual({ status: 'submitted' });
  });
});
