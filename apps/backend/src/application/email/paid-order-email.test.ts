import { describe, expect, it, vi } from 'vitest';

import { buildPaidOrderEmailPreviews, readEmailRuntimeConfig, sendPaidOrderEmailNotifications } from './';
import type { EmailProviderGateway, ProviderEmailMessage } from './spi';
import type { PaidOrderEmailInput } from './';
import { buildPaidOrderOpsEmail, buildPaidOrderShopperEmail } from './paid-order-templates';
import { buildPreorderEstimateEmail } from './preorder-estimate-email';

const sandboxConfig = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web-uat.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
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
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
});

describe('paid-order email notifications', () => {
  it('uses the persisted inclusive breakdown in both confirmations without claiming a Fiscal Document', async () => {
    const { provider, sendEmail } = createProvider();
    await sendPaidOrderEmailNotifications({
      config: sandboxConfig,
      provider,
      logger: createLogger(),
      order: {
        ...paidOrder(),
        amountTotalMinor: 2730,
        merchandiseGrossMinor: 2480,
        deliveryGrossMinor: 250,
        totalVatMinor: 528,
        acceptedParcelTier: 'small',
      },
    });
    for (const index of [0, 1]) {
      const message = sentMessage(sendEmail, index);
      expect(message.text).toContain('Merchandise: €24.80');
      expect(message.text).toContain('BOX NOW Small locker delivery: €2.50');
      expect(message.text).toContain('Including VAT: €5.28');
      expect(message.text).toContain('Total paid: €27.30');
    }
    expect(sentMessage(sendEmail, 0).text).toContain('not a tax invoice or VAT receipt');
  });
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
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Payment received - BBR-ORDER1',
        tags: expect.arrayContaining([
          { name: 'purpose', value: 'paid-order-shopper' },
          { name: 'category', value: 'paid-order' },
          { name: 'audience', value: 'shopper' },
        ]),
        to: 'uat-sink@ambkime.resend.app',
      }),
    );
    expect(sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idempotencyKey: 'blackbox:uat:paid-order-ops:cs_test_123',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Fulfill BBR-ORDER1 - paid checkout',
        tags: expect.arrayContaining([
          { name: 'purpose', value: 'paid-order-ops' },
          { name: 'audience', value: 'ops' },
        ]),
        to: 'uat-sink@ambkime.resend.app',
      }),
    );

    const shopperMessage = sentMessage(sendEmail, 0);
    expect(shopperMessage.html).not.toContain('UAT sink delivery');
    expect(shopperMessage.html).toContain(
      'src="https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png"',
    );
    expect(shopperMessage.html).toContain('width="180" height="44" alt="BlackBox Records"');
    expect(shopperMessage.html).not.toContain('>BlackBox Records</span>');
    expect(shopperMessage.html).not.toContain('Open the site');
    expect(shopperMessage.html).toContain('Payment received');
    expect(shopperMessage.html).toContain('Disintegration Black Vinyl Lp');
    expect(shopperMessage.html).toContain(
      'src="https://blackbox-records-web-uat.pages.dev/assets/catalog/releases/afterwise-album-cover-distro-mockup.webp"',
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
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
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

    expect(previews.map((preview) => preview.name)).toEqual([
      'shopper-long-content',
      'ops-ready',
      'shopper-preorder',
      'ops-preorder',
      'preorder-estimate-changed',
    ]);

    for (const preview of previews) {
      expect(preview.message.subject).toContain(preview.order.orderReference);
      expect(preview.message.preheader).toBeTruthy();
      expect(preview.message.html).toContain('class="email-logo"');
      expect(preview.message.html).toContain('alt="BlackBox Records"');
      expect(preview.message.html).not.toContain('>BlackBox Records</span>');
      expect(preview.message.html).not.toContain('Open the site');
      expect(preview.message.html).toContain('BlackBox Records, Athens</td>');
      if (preview.name !== 'preorder-estimate-changed') {
        expect(preview.message.html).toContain(
          'alt="Disintegration Black Vinyl Lp With Extra Long Preview Title product image"',
        );
      }
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
  it('marks mixed pre-order lines and holds the whole parcel until the latest estimate', () => {
    const ordinary = paidOrder().lineItems[0]!;
    const order = paidOrder({
      lineItems: [
        ordinary,
        {
          ...ordinary,
          displayName: 'First pressing',
          preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
        },
        {
          ...ordinary,
          displayName: 'Later pressing',
          preorder: { shipEstimate: { kind: 'date', date: '2026-11-20' } },
        },
      ],
    });
    const preview = buildPaidOrderEmailPreviews()[0]!;
    const brand = { homeUrl: sandboxConfig.emailBrandHomeUrl, logoUrl: sandboxConfig.emailBrandLogoUrl };
    const recipient = { intendedRecipient: order.shopperContact.email, isSinkRouted: false };
    const shopper = buildPaidOrderShopperEmail({ brand, order, recipient, replyToEmail: sandboxConfig.replyToEmail });
    const ops = buildPaidOrderOpsEmail({ brand, order, recipient });
    for (const body of [shopper.html, shopper.text, ops.html, ops.text]) {
      expect(body).toContain('Pre-order, expected to ship around October 2026');
      expect(body).toContain('Pre-order, expected to ship on 20 November 2026');
    }
    expect(shopper.text).toContain('We have received your payment in full.');
    expect(shopper.text).toContain(
      'Your order includes a pre-order. Everything is sent in one parcel when it arrives, expected on 20 November 2026. We email you if that changes.',
    );
    expect(ops.html).toContain('Order to hold');
    expect(ops.html).toContain('Paid order · awaiting stock');
    expect(ops.text).toContain('Ship nothing until the pre-order copies arrive (expected on 20 November 2026).');
    expect(ops.text).toContain('Find it in Orders under Awaiting stock.');
    expect(ops.text).not.toContain('Pack the paid item.');
    const withheld = { ...order, lineItems: [...order.lineItems, { ...ordinary, preorder: { shipEstimate: null } }] };
    const withheldShopper = buildPaidOrderShopperEmail({
      brand,
      order: withheld,
      recipient,
      replyToEmail: sandboxConfig.replyToEmail,
    });
    const withheldOps = buildPaidOrderOpsEmail({ brand, order: withheld, recipient });
    expect(withheldShopper.text).toContain('Pre-order, expected to ship: To be confirmed');
    expect(withheldShopper.text).toContain(
      'Everything is sent in one parcel when it arrives. We email you if that changes.',
    );
    expect(withheldOps.text).toContain('Ship nothing until the pre-order copies arrive.');
    expect(withheldOps.text).not.toContain('(expected');
    const withoutPreorder = {
      ...preview.order,
      lineItems: preview.order.lineItems.map((line) => ({ ...line, preorder: null })),
    };
    expect(
      buildPaidOrderShopperEmail({
        brand,
        order: withoutPreorder,
        recipient,
        replyToEmail: sandboxConfig.replyToEmail,
      }),
    ).toEqual(preview.message);
  });

  it('escapes notice fields and states both estimates, including unknown estimates', () => {
    const notice = buildPreorderEstimateEmail({
      brand: { homeUrl: sandboxConfig.emailBrandHomeUrl, logoUrl: sandboxConfig.emailBrandLogoUrl },
      orderReference: 'BBR-ORDER1',
      itemName: '<script>record</script>',
      whenOrdered: null,
      shipEstimate: { kind: 'month', month: '2026-11', part: 'late' },
      replyToEmail: sandboxConfig.replyToEmail,
    });
    expect(notice.subject).toBe('New ship estimate for your pre-order · BBR-ORDER1');
    expect(notice.html).toContain('&lt;script&gt;record&lt;/script&gt;');
    expect(notice.html).not.toContain('<script>record</script>');
    expect(notice.text).toContain('When you ordered: To be confirmed');
    expect(notice.text).toContain('Now expected: around late November 2026');
    expect(notice.text).toContain(
      'Nothing else changes: everything is still sent in one parcel when the pre-order arrives. If you have a question, reply to this email.',
    );
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
        displayName: 'Disintegration Black Vinyl LP',
        optionLabel: null,
        productImage: {
          altText: 'Disintegration Black Vinyl Lp product image',
          url: 'https://blackbox-records-web-uat.pages.dev/assets/catalog/releases/afterwise-album-cover-distro-mockup.webp',
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
