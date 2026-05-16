import { describe, expect, it, vi } from 'vitest';

import {
  createStripeClientOptions,
  StripeCheckoutGateway,
} from '../../../src/infrastructure/stripe/stripe-checkout-gateway';

describe('createStripeClientOptions', () => {
  it('uses real Stripe API defaults when no API base URL is configured', () => {
    const options = createStripeClientOptions();

    expect(options.host).toBeUndefined();
    expect(options.port).toBeUndefined();
    expect(options.protocol).toBeUndefined();
  });

  it('points the Stripe SDK to the local stripe-mock proxy when a local API base URL is configured', () => {
    const options = createStripeClientOptions('http://127.0.0.1:12110');

    expect(options.host).toBe('127.0.0.1');
    expect(options.port).toBe(12110);
    expect(options.protocol).toBe('http');
  });
});

describe('StripeCheckoutGateway', () => {
  it('creates embedded Checkout Sessions with adjustable quantities', async () => {
    const create = vi.fn(async () => ({
      client_secret: 'cs_test_secret',
      id: 'cs_test_123',
    }));
    const gateway = new StripeCheckoutGateway({
      checkout: {
        sessions: {
          create,
          retrieve: vi.fn(),
          listLineItems: vi.fn(),
        },
      },
    } as never);

    await expect(
      gateway.createEmbeddedCheckoutSession({
        lineItems: [
          {
            adjustableQuantityMaximum: 7,
            quantity: 2,
            storeItemSlug: 'disintegration-black-vinyl-lp',
            stripePriceId: 'price_test_barren_point',
            variantId: 'variant_barren-point_standard',
          },
        ],
        returnUrl: 'https://blackbox.example/return',
      }),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      clientSecret: 'cs_test_secret',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          {
            adjustable_quantity: {
              enabled: true,
              maximum: 7,
              minimum: 1,
            },
            price: 'price_test_barren_point',
            quantity: 2,
          },
        ],
        phone_number_collection: {
          enabled: true,
        },
        shipping_address_collection: {
          allowed_countries: ['GR'],
        },
      }),
    );
  });
});
