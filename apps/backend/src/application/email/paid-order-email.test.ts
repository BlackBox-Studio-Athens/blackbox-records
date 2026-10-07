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
    const shopper = sentMessage(sendEmail, 0);
    expect(shopper.text).toContain('Items: €24.80');
    expect(shopper.text).toContain('Delivery: €2.50');
    expect(shopper.text).toContain('Total paid: €27.30');
    const ops = sentMessage(sendEmail, 1);
    expect(ops.text).toContain('Merchandise: €24.80');
    expect(ops.text).toContain('BOX NOW Small locker delivery: €2.50');
    expect(ops.text).toContain('Including VAT: €5.28');
    expect(ops.text).toContain('Total paid: €27.30');
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
        subject: 'Payment received · BBR-ORDER1',
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
    expect(shopperMessage.html).toContain('alt="BlackBox Records"');
    expect(shopperMessage.html).not.toContain('>BlackBox Records</span>');
    expect(shopperMessage.html).not.toContain('Open the site');
    expect(shopperMessage.html).toContain('Payment received');
    expect(shopperMessage.html).toContain('Disintegration Black Vinyl LP');
    expect(shopperMessage.html).not.toContain('variant_disintegration-black-vinyl-lp_standard</td>');
    expect(shopperMessage.html).toContain('€25.00');
    expect(shopperMessage.html).not.toContain('Payment document');
    expect(shopperMessage.text).toContain(
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
      'availability-alert-available',
      'availability-alert-preorder',
    ]);

    for (const preview of previews) {
      if (preview.order) expect(preview.message.subject).toContain(preview.order.orderReference);
      expect(preview.message.preheader).toBeTruthy();
      expect(preview.message.html).toContain('class="email-logo"');
      expect(preview.message.html).toContain('alt="BlackBox Records"');
      expect(preview.message.html).not.toContain('>BlackBox Records</span>');
      expect(preview.message.html).not.toContain('Open the site');
      if (preview.name.startsWith('ops-')) {
        expect(preview.message.html).toContain('BlackBox Records, Athens</td>');
        expect(preview.message.html).toContain(
          'alt="Disintegration Black Vinyl Lp With Extra Long Preview Title product image"',
        );
      }
      expect(preview.message.html).toContain('color-scheme');
      expect(preview.message.html).toContain('@media (max-width: 600px)');
      expect(preview.message.html).toContain('email-stack');
      if (preview.order) expect(preview.message.text).toContain(preview.order.orderReference);
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
      'Your order includes a pre-order. Everything is sent in one parcel when the pre-orders arrive, expected on 20 November 2026. We email you if that changes.',
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
      'Everything is sent in one parcel when the pre-orders arrive. We email you if that changes.',
    );
    expect(withheldOps.text).toContain('Ship nothing until the pre-order copies arrive.');
    expect(withheldOps.text).not.toContain('(expected');
    const withoutPreorder = {
      ...preview.order!,
      lineItems: preview.order!.lineItems.map((line) => ({ ...line, preorder: null })),
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
    expect(notice.text).toContain('Was (at order): To be confirmed');
    expect(notice.text).toContain('Now expected: around late November 2026');
    expect(notice.text).toContain('with your whole order in one parcel.');
  });

  it('uses immutable item, format, quantity and money facts without inventing missing amounts', () => {
    const order = paidOrder({
      amountTotalMinor: 4750,
      merchandiseGrossMinor: 4500,
      deliveryGrossMinor: 250,
      lineItems: [
        { ...paidOrder().lineItems[0]!, displayName: 'BlackBox shirt', optionLabel: 'T-shirt · Large', quantity: 3 },
      ],
    });
    const before = structuredClone(order);
    const message = shopperEmail(order);
    for (const body of [message.html, message.text]) {
      expect(body).toContain('BlackBox shirt · T-shirt · Large × 3');
      expect(body).toContain('In stock');
      expect(body).toContain('€45.00');
      expect(body).toContain('€2.50');
      expect(body).toContain('€47.50');
      expect(body).not.toContain('sent with the pre-order');
      expect(body).not.toContain('when the pre-order');
    }
    expect(order).toEqual(before);
    const missing = shopperEmail(paidOrder());
    expect(missing.text).toContain('Items: Not recorded');
    expect(missing.text).toContain('Delivery: Not recorded');
    expect(missing.text).toContain('Total paid: €25.00');
    expect(shopperEmail({ ...order, deliveryGrossMinor: 0 }).text).toContain('Delivery: €0.00');
  });

  it('marks ordinary waiting only in mixed orders and uses a whole-order unknown estimate', () => {
    const ordinary = paidOrder().lineItems[0]!;
    const preorder = { ...ordinary, displayName: 'LOTUS', optionLabel: 'Vinyl', preorder: { shipEstimate: null } };
    const mixed = shopperEmail(paidOrder({ lineItems: [preorder, ordinary] }));
    for (const body of [mixed.html, mixed.text]) {
      expect(body).toContain('In stock, sent with the pre-order');
      expect(body).toContain('Pre-order, expected to ship: To be confirmed');
      expect(body).toContain('Everything is sent in one parcel when LOTUS arrives. We email you if that changes.');
      expect(body).not.toContain('expected around');
    }
    const only = shopperEmail(paidOrder({ lineItems: [preorder] }));
    for (const body of [only.html, only.text]) {
      expect(body).not.toContain('In stock');
      expect(body).not.toContain('in-stock items');
      expect(body).toContain('when LOTUS arrives');
    }
  });

  it.each([
    { kind: 'date' as const, date: '2026-11-12', expected: 'on 12 November 2026' },
    { kind: 'month' as const, month: '2026-11', part: null, expected: 'around November 2026' },
    { kind: 'month' as const, month: '2026-11', part: 'early' as const, expected: 'around early November 2026' },
    { kind: 'month' as const, month: '2026-11', part: 'mid' as const, expected: 'around mid November 2026' },
    { kind: 'month' as const, month: '2026-11', part: 'late' as const, expected: 'around late November 2026' },
  ])('keeps saved ship estimate wording for $expected', ({ expected, ...shipEstimate }) => {
    const message = shopperEmail(
      paidOrder({
        lineItems: [{ ...paidOrder().lineItems[0]!, preorder: { shipEstimate } }],
      }),
    );
    for (const body of [message.html, message.text]) expect(body).toContain(`Pre-order, expected to ship ${expected}`);
  });

  it.each([
    { kind: 'month' as const, month: '2026-09', part: null },
    { kind: 'month' as const, month: '2026-11', part: 'late' as const },
    { kind: 'date' as const, date: '2026-10-05' },
    null,
  ])(
    'describes earlier, later, exact and withheld updates without an unsupported cause or direction',
    (shipEstimate) => {
      const whenOrdered = { kind: 'month' as const, month: '2026-10', part: null };
      const notice = buildPreorderEstimateEmail({
        brand: { homeUrl: sandboxConfig.emailBrandHomeUrl, logoUrl: sandboxConfig.emailBrandLogoUrl },
        replyToEmail: sandboxConfig.replyToEmail,
        orderReference: 'BBR-ORDER1',
        itemName: 'BlackBox T-shirt',
        whenOrdered,
        shipEstimate,
      });
      expect(notice.text).toContain('Was (at order): around October 2026');
      expect(whenOrdered.month).toBe('2026-10');
      for (const body of [notice.html, notice.text]) {
        expect(body).toContain('BlackBox T-shirt');
        expect(body).toContain('Was (at order)');
        expect(body).toContain('one parcel');
        expect(body).not.toMatch(/pressing plant|ships later|ships earlier|delay|vinyl|record copies/i);
      }
      if (!shipEstimate) expect(notice.text).toContain('Now expected: To be confirmed');
      expect(notice.html).not.toContain('Subject:');
    },
  );

  it('escapes dynamic line, reference and brand attributes while leaving meaningful plain text', () => {
    const title = 'Shirt <img src=x onerror="alert(1)"> & friend';
    const order = paidOrder({
      orderReference: 'BBR-<>&"\'',
      lineItems: [{ ...paidOrder().lineItems[0]!, displayName: title, optionLabel: '<Large> & "Black"' }],
    });
    const message = buildPaidOrderShopperEmail({
      brand: {
        homeUrl: 'https://example.test/?q="<>&',
        logoUrl: 'https://example.test/assets/images/brand/logo.png?q="<>&',
      },
      order,
      recipient: { intendedRecipient: order.shopperContact.email, isSinkRouted: false },
      replyToEmail: 'reply@example.test',
    });
    expect(message.html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; friend');
    expect(message.html).toContain('BBR-&lt;&gt;&amp;&quot;&#39;');
    expect(message.html).toContain('href="https://example.test/?q=&quot;&lt;&gt;&amp;"');
    expect(message.html).toContain('src="https://example.test/assets/images/brand/logo.png?q=&quot;&lt;&gt;&amp;"');
    expect(message.html).not.toContain('<img src=x');
    expect(message.text).toContain(title);
    expect(message.text).toContain('<Large> & "Black"');
    expect(message.html).toContain('href="mailto:reply@example.test"');
    expect(message.html).not.toContain('Subject:');
  });
});

function shopperEmail(order: PaidOrderEmailInput) {
  return buildPaidOrderShopperEmail({
    brand: { homeUrl: sandboxConfig.emailBrandHomeUrl, logoUrl: sandboxConfig.emailBrandLogoUrl },
    order,
    recipient: { intendedRecipient: order.shopperContact.email, isSinkRouted: false },
    replyToEmail: sandboxConfig.replyToEmail,
  });
}

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
