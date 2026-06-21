import { describe, expect, it, vi } from 'vitest';

import {
  buildPaidOrderEmailPreviews,
  readEmailRuntimeConfig,
  sendPaidOrderEmailNotifications,
} from '../../../src/application/email';
import type { EmailProviderGateway, ProviderEmailMessage } from '../../../src/application/email/spi';
import type { PaidOrderEmailInput } from '../../../src/application/email';

const sandboxConfig = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'blackboxrecordsathens+TESTING@gmail.com',
});

const productionConfig = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'PRD',
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
    expect(shopperMessage.html).not.toContain('UAT sink delivery');
    expect(shopperMessage.html).toContain(
      'src="https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png"',
    );
    expect(shopperMessage.html).toContain('width="180" height="44" alt="BlackBox Records"');
    expect(shopperMessage.html).not.toContain('>BlackBox Records</span>');
    expect(shopperMessage.html).not.toContain('Open the site');
    expect(shopperMessage.html).toContain('Payment received');
    expect(shopperMessage.html).toContain('Disintegration Black Vinyl Lp');
    expect(shopperMessage.html).toContain(
      'src="https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp"',
    );
    expect(shopperMessage.html).toContain('alt="Disintegration Black Vinyl Lp product image"');
    expect(shopperMessage.html).not.toContain('variant_disintegration-black-vinyl-lp_standard</td>');
    expect(shopperMessage.html).toContain('€25.00');
    expect(shopperMessage.html).not.toContain('Payment document');
    expect(shopperMessage.html).toContain(
      'This email confirms that payment was received. It is not a tax invoice or VAT receipt.',
    );
    expect(shopperMessage.html).toContain(
      'Thank you for your order. We have received your payment and will prepare everything for manual fulfillment.',
    );
    expect(shopperMessage.html).toContain('color-scheme');
    expect(shopperMessage.html).toContain('prefers-color-scheme');
    expect(shopperMessage.html).toContain('@media (max-width: 600px)');
    expect(shopperMessage.html).toContain('email-stack');
    expect(shopperMessage.text).toContain('Support: support@blackboxrecordsathens.com');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'blackbox:sandbox:paid-order-shopper:cs_test_123',
        orderReference: 'BBR-ORDER1',
        purpose: 'paid-order-shopper',
        status: 'sent',
      }),
    );
    expect(sentMessage(sendEmail, 1).html).toContain('Order to ship');
    expect(sentMessage(sendEmail, 1).html).toContain('Shipping address');
    expect(sentMessage(sendEmail, 1).html).toContain('<div>Long Street 1</div>');
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

  it('builds preview fixtures for long content and mobile-safe markup', () => {
    const previews = buildPaidOrderEmailPreviews();

    expect(previews.map((preview) => preview.name)).toEqual(['shopper-long-content', 'ops-ready']);

    for (const preview of previews) {
      expect(preview.message.subject).toContain(preview.order.orderReference);
      expect(preview.message.preheader).toBeTruthy();
      expect(preview.message.html).toContain('class="email-logo"');
      expect(preview.message.html).toContain('alt="BlackBox Records"');
      expect(preview.message.html).not.toContain('>BlackBox Records</span>');
      expect(preview.message.html).not.toContain('Open the site');
      expect(preview.message.html).toContain('BlackBox Records, Athens</td>');
      expect(preview.message.html).toContain(
        'alt="Disintegration Black Vinyl Lp With Extra Long Preview Title product image"',
      );
      expect(preview.message.html).toContain('color-scheme');
      expect(preview.message.html).toContain('@media (max-width: 600px)');
      expect(preview.message.html).toContain('email-stack');
      expect(preview.message.text).toContain(preview.order.orderReference);
    }

    const shopperPreview = previews.find((preview) => preview.name === 'shopper-long-content');
    expect(shopperPreview?.message.html).toContain('Disintegration Black Vinyl Lp With Extra Long Preview Title');
    expect(shopperPreview?.message.html).not.toContain(
      'variant_disintegration-black-vinyl-lp_standard_preview_long_identifier',
    );
    expect(shopperPreview?.message.text).toContain('support@blackboxrecordsathens.com');

    const opsPreview = previews.find((preview) => preview.name === 'ops-ready');
    expect(opsPreview?.message.html).toContain('Long Preview Street 125');
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
    customerName: 'Buyer Name',
    lineItems: [
      {
        productImage: {
          altText: 'Disintegration Black Vinyl Lp product image',
          url: 'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
        },
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
    shopperContact: {
      email: 'buyer@example.com',
      phone: '+302100000000',
    },
    ...overrides,
  };
}

function sentMessage(sendEmail: ReturnType<typeof vi.fn<EmailProviderGateway['sendEmail']>>, index: number) {
  return sendEmail.mock.calls[index]?.[0] as ProviderEmailMessage;
}
