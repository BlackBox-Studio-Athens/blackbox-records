import { describe, expect, it, vi } from 'vitest';

import { CheckoutConfigurationError } from '../../../src/application/commerce/checkout';
import type { AppBindings } from '../../../src/env';
import {
  createStripeCheckoutGateway,
  createStripeClientOptions,
  StripeCheckoutGateway,
} from '../../../src/infrastructure/stripe/stripe-checkout-gateway';
import { cartQuantity, storeItemSlug, stripePriceId, variantId } from '../../support/commerce-value-objects';

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
  it('creates hosted Checkout Sessions with fixed quantities', async () => {
    const create = vi.fn(async () => ({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session/cs_test_123',
    }));
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            create,
            retrieve: vi.fn(),
            listLineItems: vi.fn(),
          },
        },
      } as never,
      'pmc_test_blackbox_checkout',
    );

    await expect(
      gateway.createHostedCheckoutSession({
        lineItems: [
          {
            quantity: cartQuantity(2),
            storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
            stripePriceId: stripePriceId('price_test_barren_point'),
            variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
          },
        ],
        cancelUrl: 'https://blackbox.example/checkout',
        successUrl: 'https://blackbox.example/return',
      }),
    ).resolves.toEqual({
      checkoutSessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.test/session/cs_test_123',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          {
            price: 'price_test_barren_point',
            quantity: 2,
          },
        ],
        cancel_url: 'https://blackbox.example/checkout',
        locale: 'en',
        payment_method_configuration: 'pmc_test_blackbox_checkout',
        phone_number_collection: {
          enabled: true,
        },
        shipping_address_collection: {
          allowed_countries: ['GR'],
        },
        success_url: 'https://blackbox.example/return',
      }),
    );
    const createCalls = create.mock.calls as unknown as Array<[{ line_items: unknown[] }]>;
    const createPayload = createCalls[0]?.[0];

    expect(createPayload).not.toHaveProperty('ui_mode');
    expect(createPayload).not.toHaveProperty('payment_method_types');
    expect(createPayload?.line_items[0]).not.toHaveProperty('adjustable_quantity');
  });

  it('requires a configured Payment Method Configuration ID before Checkout Session creation', () => {
    const bindings: Pick<
      AppBindings,
      'STRIPE_API_BASE_URL' | 'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID' | 'STRIPE_SECRET_KEY'
    > = {
      STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: ' ',
      STRIPE_SECRET_KEY: 'sk_test_123',
    };

    expect(() => createStripeCheckoutGateway(bindings)).toThrow(CheckoutConfigurationError);
    expect(() => createStripeCheckoutGateway(bindings)).toThrow(
      'Stripe Payment Method Configuration ID is not configured.',
    );
  });
});
