import { describe, expect, it, vi } from 'vitest';

import {
  EmailConfigurationError,
  readEmailRuntimeConfig,
  registerNewsletterContact,
  routeTransactionalEmailRecipient,
  sendTransactionalEmail,
} from '../../../src/application/email';
import type { EmailProviderGateway } from '../../../src/application/email/spi';
import { productEnvironmentProfiles } from '../../../src/env';

const localBindings = {
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'LOCAL' as const,
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
};

const sandboxBindings = {
  ...localBindings,
  PRODUCT_ENVIRONMENT: 'UAT' as const,
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
};

describe('email application module', () => {
  it('validates required runtime config without exposing provider values in errors', () => {
    expect(readEmailRuntimeConfig(localBindings)).toEqual({
      apiKey: 're_mock_blackbox_local',
      emailBrandHomeUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
      emailBrandLogoUrl:
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
      fromEmail: 'orders@blackboxrecordsathens.com',
      newsletterSegmentId: null,
      newsletterTopicId: 'topic_mock_blackbox_newsletter',
      opsToEmail: 'blackboxrecordsathens@gmail.com',
      productEnvironmentProfile: productEnvironmentProfiles.LOCAL,
      replyToEmail: 'support@blackboxrecordsathens.com',
      uatRecipientOverrideEmail: null,
    });

    expect(() =>
      readEmailRuntimeConfig({
        ...sandboxBindings,
        RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'wrong@example.com',
      }),
    ).toThrow(EmailConfigurationError);
    expect(() =>
      readEmailRuntimeConfig({
        ...sandboxBindings,
        EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web.pages.dev/',
      }),
    ).toThrow(EmailConfigurationError);
  });

  it('routes sandbox email to the UAT sink and production/local email to the intended recipient', () => {
    expect(routeTransactionalEmailRecipient(readEmailRuntimeConfig(sandboxBindings), 'buyer@example.com')).toEqual({
      intendedRecipient: 'buyer@example.com',
      isSinkRouted: true,
      to: 'uat-sink@ambkime.resend.app',
    });

    expect(routeTransactionalEmailRecipient(readEmailRuntimeConfig(localBindings), 'buyer@example.com')).toEqual({
      intendedRecipient: 'buyer@example.com',
      isSinkRouted: false,
      to: 'buyer@example.com',
    });
  });

  it('uses the configured support reply-to when a transactional command omits an override', async () => {
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(),
      sendEmail: vi.fn(async () => ({ ok: true as const })),
    };
    const result = await sendTransactionalEmail(provider, readEmailRuntimeConfig(sandboxBindings), {
      content: {
        html: '<p>Paid</p>',
        subject: 'Order paid',
        text: 'Paid',
      },
      idempotencyEntityId: 'cs_test_123',
      purpose: 'paid-order-shopper',
      tags: [{ name: 'order reference', value: 'BBR 123' }],
      to: 'buyer@example.com',
    });

    expect(result).toEqual(
      expect.objectContaining({
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
        status: 'sent',
      }),
    );
    expect(provider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
        replyTo: 'support@blackboxrecordsathens.com',
        tags: expect.arrayContaining([
          { name: 'purpose', value: 'paid-order-shopper' },
          { name: 'sink_routed', value: 'true' },
          { name: 'order-reference', value: 'BBR-123' },
        ]),
        to: 'uat-sink@ambkime.resend.app',
      }),
    );
  });

  it('uses a validated transactional command reply-to when provided', async () => {
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(),
      sendEmail: vi.fn(async () => ({ ok: true as const })),
    };

    await sendTransactionalEmail(provider, readEmailRuntimeConfig(sandboxBindings), {
      content: {
        html: '<p>Inquiry</p>',
        subject: 'Services inquiry',
        text: 'Inquiry',
      },
      idempotencyEntityId: 'inquiry_123',
      purpose: 'services-inquiry',
      replyTo: ' visitor@example.com ',
      to: 'info@blackboxrecordsathens.com',
    });

    expect(provider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'visitor@example.com',
      }),
    );
  });

  it('rejects an invalid transactional command reply-to before provider delivery', async () => {
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(),
      sendEmail: vi.fn(async () => ({ ok: true as const })),
    };

    await expect(
      sendTransactionalEmail(provider, readEmailRuntimeConfig(sandboxBindings), {
        content: {
          html: '<p>Inquiry</p>',
          subject: 'Services inquiry',
          text: 'Inquiry',
        },
        idempotencyEntityId: 'inquiry_123',
        purpose: 'services-inquiry',
        replyTo: 'not-an-email',
        to: 'info@blackboxrecordsathens.com',
      }),
    ).rejects.toThrow();
    expect(provider.sendEmail).not.toHaveBeenCalled();
  });

  it('registers newsletter Contacts through the sink in sandbox while preserving safe consent evidence', async () => {
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(async () => ({ ok: true as const })),
      sendEmail: vi.fn(),
    };
    const result = await registerNewsletterContact(provider, readEmailRuntimeConfig(sandboxBindings), {
      consentCopyVersion: 'newsletter-v1',
      consentSource: 'site-form',
      consentedAt: new Date('2026-06-07T10:00:00.000Z'),
      email: 'subscriber@example.com',
    });

    expect(result).toEqual(
      expect.objectContaining({
        contactRouting: {
          contactEmail: 'uat-sink@ambkime.resend.app',
          intendedSubscriberEmail: 'subscriber@example.com',
          isSinkRouted: true,
        },
        status: 'registered',
      }),
    );
    expect(provider.registerNewsletterContact).toHaveBeenCalledWith({
      email: 'uat-sink@ambkime.resend.app',
      properties: {
        consentCopyVersion: 'newsletter-v1',
        consentSource: 'site-form',
        consentedAt: '2026-06-07T10:00:00.000Z',
        intendedSubscriberEmail: 'subscriber@example.com',
        newsletterTopicId: 'topic_mock_blackbox_newsletter',
      },
      segmentId: null,
      topicId: 'topic_mock_blackbox_newsletter',
    });
  });

  it('does not send synthetic intended-subscriber evidence for direct newsletter Contacts', async () => {
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(async () => ({ ok: true as const })),
      sendEmail: vi.fn(),
    };

    await registerNewsletterContact(provider, readEmailRuntimeConfig(localBindings), {
      consentCopyVersion: 'newsletter-v1',
      consentSource: 'site-form',
      consentedAt: new Date('2026-06-07T10:00:00.000Z'),
      email: 'subscriber@example.com',
    });

    expect(provider.registerNewsletterContact).toHaveBeenCalledWith({
      email: 'subscriber@example.com',
      properties: {
        consentCopyVersion: 'newsletter-v1',
        consentSource: 'site-form',
        consentedAt: '2026-06-07T10:00:00.000Z',
        newsletterTopicId: 'topic_mock_blackbox_newsletter',
      },
      segmentId: null,
      topicId: 'topic_mock_blackbox_newsletter',
    });
  });
});
