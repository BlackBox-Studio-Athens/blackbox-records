import {
  createCartQuantity,
  parseCheckoutSessionId,
  parseStoreItemSlug,
  parseStripePriceId,
  parseVariantId,
} from '../../src/domain/commerce';
import type { CurrentPaidCheckoutOrder } from '../../src/domain/commerce/repositories/spi';

export function currentPaidCheckoutOrder(newsletterOptIn = true): CurrentPaidCheckoutOrder {
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
