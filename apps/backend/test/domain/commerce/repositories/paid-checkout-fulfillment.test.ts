import { describe, expect, it } from 'vitest';

import {
  readPaidCheckoutFulfillment,
  type CheckoutOrderRecord,
} from '../../../../src/domain/commerce/repositories/spi';
import {
  cartQuantity,
  checkoutSessionId,
  paymentIntentId,
  storeItemSlug,
  stripePriceId,
  variantId,
} from '../../../support/commerce-value-objects';

type InvalidPaidOrderCase = [string, (order: CheckoutOrderRecord) => void];

describe('paid checkout fulfillment repository result', () => {
  it('exposes only complete current paid fulfillment', () => {
    const result = readPaidCheckoutFulfillment(currentPaidOrder());

    expect(result.kind).toBe('current');
    if (result.kind !== 'current') return;

    expect(result.order.currencyCode).toBe('EUR');
    expect(result.order.lines[0].displayName).toBe('Disintegration Black Vinyl LP');
  });

  it('keeps non-paid rows outside paid fulfillment', () => {
    expect(readPaidCheckoutFulfillment({ ...currentPaidOrder(), status: 'pending_payment' }).kind).toBe('not_paid');
  });

  it.each<InvalidPaidOrderCase>([
    ['missing amount', (order) => (order.amountTotalMinor = null)],
    ['non-positive amount', (order) => (order.amountTotalMinor = 0)],
    ['missing checkout session', (order) => (order.checkoutSessionId = null)],
    ['wrong currency', (order) => (order.currencyCode = 'USD')],
    ['missing paid timestamp', (order) => (order.paidAt = null)],
    ['invalid paid timestamp', (order) => (order.paidAt = new Date('invalid'))],
    ['missing recipient', (order) => (order.recipientName = null)],
    ['blank recipient', (order) => (order.recipientName = ' ')],
    ['missing shopper email', (order) => (order.shopperEmail = null)],
    ['blank shopper email', (order) => (order.shopperEmail = ' ')],
    ['blank optional shopper phone', (order) => (order.shopperPhone = ' ')],
    ['missing city', (order) => (order.shippingAddressCity = null)],
    ['blank city', (order) => (order.shippingAddressCity = ' ')],
    ['wrong country', (order) => (order.shippingAddressCountryCode = 'US')],
    ['missing address line', (order) => (order.shippingAddressLine1 = null)],
    ['blank address line', (order) => (order.shippingAddressLine1 = ' ')],
    ['blank optional second address line', (order) => (order.shippingAddressLine2 = ' ')],
    ['missing postal code', (order) => (order.shippingAddressPostalCode = null)],
    ['blank postal code', (order) => (order.shippingAddressPostalCode = ' ')],
    ['blank optional state', (order) => (order.shippingAddressState = ' ')],
    ['missing newsletter choice', (order) => (order.newsletterOptIn = null)],
    [
      'unexpected newsletter consent when declined',
      (order) => {
        order.newsletterConsentAt = new Date('2026-09-01T10:00:00.000Z');
        order.newsletterConsentCopyVersion = 'newsletter-v1';
      },
    ],
    [
      'missing newsletter consent timestamp when accepted',
      (order) => {
        order.newsletterOptIn = true;
        order.newsletterConsentCopyVersion = 'newsletter-v1';
      },
    ],
    [
      'missing newsletter consent copy when accepted',
      (order) => {
        order.newsletterOptIn = true;
        order.newsletterConsentAt = new Date('2026-09-01T10:00:00.000Z');
      },
    ],
    [
      'blank newsletter consent copy when accepted',
      (order) => {
        order.newsletterOptIn = true;
        order.newsletterConsentAt = new Date('2026-09-01T10:00:00.000Z');
        order.newsletterConsentCopyVersion = ' ';
      },
    ],
    [
      'invalid newsletter consent timestamp when accepted',
      (order) => {
        order.newsletterOptIn = true;
        order.newsletterConsentAt = new Date('invalid');
        order.newsletterConsentCopyVersion = 'newsletter-v1';
      },
    ],
    ['missing lines', (order) => (order.lines = undefined)],
    ['empty lines', (order) => (order.lines = [])],
    ['missing display name', (order) => (order.lines![0]!.displayName = null)],
    ['blank display name', (order) => (order.lines![0]!.displayName = ' ')],
    ['blank optional option label', (order) => (order.lines![0]!.optionLabel = ' ')],
    ['missing unit amount', (order) => (order.lines![0]!.unitAmountMinor = null)],
    ['non-positive unit amount', (order) => (order.lines![0]!.unitAmountMinor = 0)],
    ['missing line amount', (order) => (order.lines![0]!.lineAmountMinor = null)],
    ['non-positive line amount', (order) => (order.lines![0]!.lineAmountMinor = 0)],
    ['inconsistent line amount', (order) => (order.lines![0]!.lineAmountMinor = 2400)],
  ])('rejects %s', (_, mutate) => {
    const order = currentPaidOrder();
    mutate(order);

    expect(readPaidCheckoutFulfillment(order)).toEqual({
      kind: 'incomplete',
      order,
      reason: 'incomplete_paid_fulfillment',
    });
  });

  it('accepts complete newsletter consent', () => {
    const order = currentPaidOrder();
    order.newsletterOptIn = true;
    order.newsletterConsentAt = new Date('2026-09-01T10:00:00.000Z');
    order.newsletterConsentCopyVersion = 'newsletter-v1';

    expect(readPaidCheckoutFulfillment(order).kind).toBe('current');
  });
});

function currentPaidOrder(): CheckoutOrderRecord {
  const createdAt = new Date('2026-09-01T09:00:00.000Z');
  const paidAt = new Date('2026-09-01T10:00:00.000Z');

  return {
    amountTotalMinor: 2500,
    checkoutExpiresAt: new Date('2026-09-01T09:30:00.000Z'),
    checkoutSessionId: checkoutSessionId('cs_test_paid_fulfillment'),
    createdAt,
    currencyCode: 'EUR',
    id: 'order_paid_fulfillment',
    lines: [
      {
        createdAt,
        displayName: 'Disintegration Black Vinyl LP',
        id: 'line_paid_fulfillment',
        lineAmountMinor: 2500,
        optionLabel: null,
        orderId: 'order_paid_fulfillment',
        quantity: cartQuantity(1),
        storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
        stripePriceId: stripePriceId('price_test_paid_fulfillment'),
        unitAmountMinor: 2500,
        variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
      },
    ],
    needsReviewAt: null,
    newsletterConsentAt: null,
    newsletterConsentCopyVersion: null,
    newsletterOptIn: false,
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
    shopperPhone: null,
    status: 'paid',
    statusUpdatedAt: paidAt,
    storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
    stripePaymentIntentId: paymentIntentId('pi_test_paid_fulfillment'),
    updatedAt: paidAt,
    variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
  };
}
