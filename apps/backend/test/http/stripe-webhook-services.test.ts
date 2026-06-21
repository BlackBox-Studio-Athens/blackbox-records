import { describe, expect, it } from 'vitest';

import { createCheckoutOrderReferenceToken, type CheckoutOrderPaid } from '../../src/application/commerce/orders';
import { toPaidOrderEmailInput } from '../../src/interfaces/http/routes/stripe-webhook-services';

describe('stripe webhook email handoff', () => {
  it('adds catalog-backed product image context to paid order email input', () => {
    const input = toPaidOrderEmailInput(checkoutOrderPaidEvent());

    expect(input.lineItems[0]).toEqual({
      productImage: {
        altText: 'Disintegration Black Vinyl Lp product image',
        url: 'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
      },
      quantity: 1,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(input.shippingAddress).toEqual({
      city: 'Athens',
      country: 'GR',
      line1: 'Long Street 1',
      line2: 'Apartment 2',
      postalCode: '10558',
      state: null,
    });
    expect(input.shopperContact).toEqual({
      email: 'buyer@example.com',
      phone: '+302100000000',
    });
  });

  it('keeps line item live text when catalog image context is unavailable', () => {
    const input = toPaidOrderEmailInput(
      checkoutOrderPaidEvent({
        lineItems: [
          {
            quantity: 1,
            storeItemSlug: 'unknown-item',
            stripePriceId: null,
            variantId: 'variant_unknown-item_standard',
          },
        ],
      }),
    );

    expect(input.lineItems[0]).toEqual({
      productImage: null,
      quantity: 1,
      storeItemSlug: 'unknown-item',
      variantId: 'variant_unknown-item_standard',
    });
  });
});

function checkoutOrderPaidEvent(overrides: Partial<CheckoutOrderPaid> = {}): CheckoutOrderPaid {
  const occurredAt = new Date('2026-04-25T11:00:00.000Z');

  return {
    amountTotalMinor: 2500,
    checkoutSessionId: 'cs_test_123',
    currencyCode: 'EUR',
    customerName: 'Buyer Name',
    lineItems: [
      {
        quantity: 1,
        storeItemSlug: 'disintegration-black-vinyl-lp',
        stripePriceId: 'price_test_123',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ],
    newsletterOptIn: false,
    occurredAt,
    orderId: 'order_1',
    orderReference: createCheckoutOrderReferenceToken({
      checkoutSessionId: 'cs_test_123',
      orderId: 'order_1',
      referenceDate: occurredAt,
    }),
    paidAt: occurredAt,
    paymentStatus: 'paid',
    shippingAddress: {
      city: 'Athens',
      country: 'GR',
      line1: 'Long Street 1',
      line2: 'Apartment 2',
      postalCode: '10558',
      state: null,
    },
    shopperContact: {
      email: 'buyer@example.com',
      phone: '+302100000000',
    },
    stripePaymentIntentId: null,
    ...overrides,
  };
}
