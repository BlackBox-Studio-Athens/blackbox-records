import { describe, expect, it, vi } from 'vitest';

import { attemptPaidOrderDelivery, type ClaimedPaidOrderDelivery } from '../../../../src/application/commerce/orders';
import { readEmailRuntimeConfig, type EmailProviderGateway } from '../../../../src/application/email';
import {
  createCartQuantity,
  parseCheckoutSessionId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../../../src/domain/commerce';
import type { CurrentPaidCheckoutOrder } from '../../../../src/domain/commerce/repositories/spi';

const config = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
});

describe('paid order delivery routing', () => {
  it('routes fixed kinds independently and keeps email identities stable', async () => {
    const sendEmail = vi.fn<EmailProviderGateway['sendEmail']>(async (message) =>
      message.tags.some(({ name, value }) => name === 'purpose' && value === 'paid-order-shopper')
        ? { ok: false, reason: 'rate_limited', retryable: true }
        : { ok: true },
    );
    const registerNewsletterContact = vi.fn<EmailProviderGateway['registerNewsletterContact']>(async () => ({
      ok: true,
    }));
    const provider = { registerNewsletterContact, sendEmail };
    const logger = { info: vi.fn(), warn: vi.fn() };
    const order = paidOrder();

    const shopper = await attemptPaidOrderDelivery({
      config,
      delivery: claimedDelivery('shopper_confirmation'),
      logger,
      order,
      provider,
    });
    const shopperReplay = await attemptPaidOrderDelivery({
      config,
      delivery: claimedDelivery('shopper_confirmation'),
      logger,
      order,
      provider,
    });
    const ops = await attemptPaidOrderDelivery({
      config,
      delivery: claimedDelivery('ops_fulfillment'),
      logger,
      order,
      provider,
    });
    const newsletter = await attemptPaidOrderDelivery({
      config,
      delivery: claimedDelivery('newsletter_registration'),
      logger,
      order,
      provider,
    });

    expect(shopper).toEqual({ kind: 'not_delivered', retryable: true, safeReason: 'rate_limited' });
    expect(shopperReplay).toEqual(shopper);
    expect(ops).toEqual({ kind: 'delivered' });
    expect(newsletter).toEqual({ kind: 'delivered' });
    expect(sendEmail.mock.calls[0]?.[0].idempotencyKey).toBe('blackbox:uat:paid-order-shopper:cs_test_paid');
    expect(sendEmail.mock.calls[1]?.[0].idempotencyKey).toBe(sendEmail.mock.calls[0]?.[0].idempotencyKey);
    expect(sendEmail.mock.calls[2]?.[0]).toEqual(
      expect.objectContaining({
        idempotencyKey: 'blackbox:uat:paid-order-ops:cs_test_paid',
        to: 'uat-sink@ambkime.resend.app',
      }),
    );
    expect(sendEmail.mock.calls[2]?.[0].html).not.toContain('Shopper confirmation was not sent');
    expect(registerNewsletterContact).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'uat-sink@ambkime.resend.app',
        properties: expect.objectContaining({
          consentCopyVersion: 'blackbox-newsletter-v1',
          intendedSubscriberEmail: 'buyer@example.com',
        }),
      }),
    );
  });

  it('rejects a newsletter row without matching order consent before provider work', async () => {
    const provider: EmailProviderGateway = {
      registerNewsletterContact: vi.fn(),
      sendEmail: vi.fn(),
    };

    const result = await attemptPaidOrderDelivery({
      config,
      delivery: claimedDelivery('newsletter_registration'),
      logger: { info: vi.fn(), warn: vi.fn() },
      order: paidOrder(false),
      provider,
    });

    expect(result).toEqual({ kind: 'not_delivered', retryable: false, safeReason: 'validation' });
    expect(provider.registerNewsletterContact).not.toHaveBeenCalled();
  });
});

function claimedDelivery(kind: ClaimedPaidOrderDelivery['kind']): ClaimedPaidOrderDelivery {
  return {
    attemptCount: 1,
    createdAt: new Date('2026-08-31T10:00:00.000Z'),
    id: `delivery_${kind}`,
    kind,
    leaseUntil: new Date('2026-08-31T10:10:00.000Z'),
    nextAttemptAt: new Date('2026-08-31T10:00:00.000Z'),
    orderId: 'order_paid',
    status: 'pending',
    updatedAt: new Date('2026-08-31T10:00:00.000Z'),
  };
}

function paidOrder(newsletterOptIn = true): CurrentPaidCheckoutOrder {
  const createdAt = new Date('2026-08-31T09:55:00.000Z');
  const paidAt = new Date('2026-08-31T10:00:00.000Z');

  return {
    amountTotalMinor: 2500,
    checkoutExpiresAt: new Date('2026-08-31T10:25:00.000Z'),
    checkoutSessionId: parseCheckoutSessionId('cs_test_paid'),
    createdAt,
    currencyCode: 'EUR',
    id: 'order_paid',
    lines: [
      {
        createdAt,
        displayName: 'Disintegration Black Vinyl LP',
        id: 'line_paid',
        lineAmountMinor: 2500,
        optionLabel: 'Standard',
        orderId: 'order_paid',
        quantity: createCartQuantity(1),
        storeItemSlug: parseStoreItemSlug('disintegration-black-vinyl-lp'),
        stripePriceId: parseStripePriceId('price_test_paid'),
        unitAmountMinor: 2500,
        variantId: parseVariantId('variant_disintegration-black-vinyl-lp_standard'),
      },
    ],
    needsReviewAt: null,
    newsletterConsentAt: newsletterOptIn ? paidAt : null,
    newsletterConsentCopyVersion: newsletterOptIn ? 'blackbox-newsletter-v1' : null,
    newsletterOptIn,
    notPaidAt: null,
    paidAt,
    recipientName: 'Buyer Name',
    shippingAddressCity: 'Athens',
    shippingAddressCountryCode: 'GR',
    shippingAddressLine1: 'Long Street 1',
    shippingAddressLine2: null,
    shippingAddressPostalCode: '10558',
    shippingAddressState: null,
    shippingLocker: null,
    shopperEmail: 'buyer@example.com',
    shopperPhone: '+302100000000',
    status: 'paid',
    statusUpdatedAt: paidAt,
    storeItemSlug: parseStoreItemSlug('disintegration-black-vinyl-lp'),
    stripePaymentIntentId: null,
    updatedAt: paidAt,
    variantId: parseVariantId('variant_disintegration-black-vinyl-lp_standard'),
  } as CurrentPaidCheckoutOrder;
}
