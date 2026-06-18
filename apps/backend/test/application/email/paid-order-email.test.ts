import { describe, expect, it, vi } from 'vitest';

import {
  buildPaidOrderEmailPreviews,
  readEmailRuntimeConfig,
  sendPaidOrderEmailNotifications,
} from '../../../src/application/email';
import type { EmailProviderGateway, ProviderEmailMessage } from '../../../src/application/email/spi';
import type { PaidOrderEmailInput } from '../../../src/application/email';

const sandboxConfig = readEmailRuntimeConfig({
  APP_ENV: 'sandbox',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'blackboxrecordsathens+TESTING@gmail.com',
});

const productionConfig = readEmailRuntimeConfig({
  APP_ENV: 'production',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'blackboxrecordsathens+TESTING@gmail.com',
});

describe('paid-order email notifications', () => {
  it('sends shopper and ops emails through the UAT sink with deterministic keys, tags, and designed content', async () => {
    const { provider, sendEmail } = createProvider();
    const logger = createLogger();

    const result = await sendPaidOrderEmailNotifications({
      config: sandboxConfig,
      logger,
      order: paidOrder(),
      provider,
    });

    expect(result.shopper.status).toBe('sent');
    expect(result.ops.status).toBe('sent');
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        idempotencyKey: 'blackbox:sandbox:paid-order-shopper:cs_test_123',
        subject: 'Payment received - BBR-ORDER1',
        tags: expect.arrayContaining([
          { name: 'purpose', value: 'paid-order-shopper' },
          { name: 'category', value: 'paid-order' },
          { name: 'audience', value: 'shopper' },
        ]),
        to: 'blackboxrecordsathens+TESTING@gmail.com',
      }),
    );
    expect(sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idempotencyKey: 'blackbox:sandbox:paid-order-ops:cs_test_123',
        subject: 'Fulfill BBR-ORDER1 - paid checkout',
        tags: expect.arrayContaining([
          { name: 'purpose', value: 'paid-order-ops' },
          { name: 'audience', value: 'ops' },
        ]),
        to: 'blackboxrecordsathens+TESTING@gmail.com',
      }),
    );

    const shopperMessage = sentMessage(sendEmail, 0);
    expect(shopperMessage.html).toContain('UAT sink delivery. Intended shopper recipient: buyer@example.com.');
    expect(shopperMessage.html).toContain('Payment received');
    expect(shopperMessage.html).toContain('Disintegration Black Vinyl Lp');
    expect(shopperMessage.html).toContain('€25.00');
    expect(shopperMessage.html).toContain('not a tax invoice or VAT receipt');
    expect(shopperMessage.html).toContain('color-scheme');
    expect(shopperMessage.html).toContain('@media (max-width: 600px)');
    expect(shopperMessage.text).toContain('Support: support@blackboxrecordsathens.com');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'blackbox:sandbox:paid-order-shopper:cs_test_123',
        orderReference: 'BBR-ORDER1',
        purpose: 'paid-order-shopper',
        status: 'sent',
      }),
    );
  });

  it('skips shopper confirmation when Stripe has no shopper email and warns ops', async () => {
    const { provider, sendEmail } = createProvider();
    const logger = createLogger();

    const result = await sendPaidOrderEmailNotifications({
      config: sandboxConfig,
      logger,
      order: paidOrder({ customerEmail: null }),
      provider,
    });

    expect(result.shopper).toEqual({
      idempotencyKey: 'blackbox:sandbox:paid-order-shopper:cs_test_123',
      reason: 'missing_shopper_email',
      status: 'skipped',
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sentMessage(sendEmail, 0).html).toContain(
      'Shopper email was unavailable; shopper confirmation was skipped.',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'paid-order-shopper',
        safeReason: 'missing_shopper_email',
        status: 'skipped',
      }),
    );
  });

  it('keeps ops notification when shopper send fails and records a provider-safe reason', async () => {
    const sendEmail = vi
      .fn<EmailProviderGateway['sendEmail']>()
      .mockResolvedValueOnce({
        ok: false,
        reason: 'rate_limited',
        retryable: true,
      })
      .mockResolvedValueOnce({ ok: true });
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(),
      sendEmail,
    };
    const logger = createLogger();

    const result = await sendPaidOrderEmailNotifications({
      config: productionConfig,
      logger,
      order: paidOrder({
        customerName: 'Buyer <Name>',
        shippingAddress: null,
      }),
      provider,
    });

    expect(result.shopper).toEqual(
      expect.objectContaining({
        providerSafeReason: 'rate_limited',
        retryable: true,
        status: 'failed',
      }),
    );
    expect(result.ops.status).toBe('sent');
    expect(sentMessage(sendEmail, 0).to).toBe('buyer@example.com');
    expect(sentMessage(sendEmail, 1).to).toBe('blackboxrecordsathens@gmail.com');
    expect(sentMessage(sendEmail, 1).html).toContain('Shopper confirmation was not sent: rate_limited.');
    expect(sentMessage(sendEmail, 1).html).toContain('Buyer &lt;Name&gt;');
    expect(sentMessage(sendEmail, 1).html).not.toContain('Buyer <Name>');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'paid-order-shopper',
        safeReason: 'rate_limited',
        status: 'failed',
      }),
    );
  });

  it('builds preview fixtures for long content, mobile-safe markup, and missing contact warnings', () => {
    const previews = buildPaidOrderEmailPreviews();

    expect(previews.map((preview) => preview.name)).toEqual([
      'shopper-long-content',
      'ops-ready',
      'ops-missing-contact',
    ]);

    for (const preview of previews) {
      expect(preview.message.subject).toContain(preview.order.orderReference);
      expect(preview.message.preheader).toBeTruthy();
      expect(preview.message.html).toContain('color-scheme');
      expect(preview.message.html).toContain('@media (max-width: 600px)');
      expect(preview.message.text).toContain(preview.order.orderReference);
    }

    const shopperPreview = previews.find((preview) => preview.name === 'shopper-long-content');
    expect(shopperPreview?.message.html).toContain('Disintegration Black Vinyl Lp With Extra Long Preview Title');
    expect(shopperPreview?.message.text).toContain('support@blackboxrecordsathens.com');

    const opsPreview = previews.find((preview) => preview.name === 'ops-ready');
    expect(opsPreview?.message.html).toContain('Long Preview Street 125');

    const missingContactPreview = previews.find((preview) => preview.name === 'ops-missing-contact');
    expect(missingContactPreview?.message.html).toContain(
      'Shopper email was unavailable; shopper confirmation was skipped.',
    );
    expect(missingContactPreview?.message.html).toContain('Shipping address was unavailable in the checkout session.');
    expect(missingContactPreview?.message.text).toContain('Shopper phone was unavailable');
    expect(
      previews.map((preview) => ({
        html: preview.message.html,
        name: preview.name,
        text: preview.message.text,
      })),
    ).toMatchSnapshot('paid-order-email-previews');
  });
});

function createProvider() {
  const sendEmail = vi.fn<EmailProviderGateway['sendEmail']>(async () => ({ ok: true }));
  const provider: EmailProviderGateway = {
    registerNewsletterContact: vi.fn(),
    sendEmail,
  };

  return {
    provider,
    sendEmail,
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
  };
}

function paidOrder(overrides: Partial<PaidOrderEmailInput> = {}): PaidOrderEmailInput {
  return {
    amountTotalMinor: 2500,
    checkoutSessionId: 'cs_test_123',
    currencyCode: 'EUR',
    customerEmail: 'buyer@example.com',
    customerName: 'Buyer Name',
    customerPhone: '+302100000000',
    lineItems: [
      {
        quantity: 1,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ],
    orderReference: 'BBR-ORDER1',
    paidAt: new Date('2026-04-25T11:00:00.000Z'),
    shippingAddress: {
      city: 'Athens',
      country: 'GR',
      line1: 'Long Street 1',
      line2: 'Apartment with a very long delivery note',
      postalCode: '10558',
      state: null,
    },
    ...overrides,
  };
}

function sentMessage(sendEmail: ReturnType<typeof vi.fn<EmailProviderGateway['sendEmail']>>, index: number) {
  return sendEmail.mock.calls[index]?.[0] as ProviderEmailMessage;
}
