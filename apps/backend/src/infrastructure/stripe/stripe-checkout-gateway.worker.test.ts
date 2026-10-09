import Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';

import {
  CheckoutConfigurationError,
  CheckoutCreationError,
  createPackingPolicy,
  quoteDelivery,
} from '../../application/commerce/checkout';
import { quantityBandPolicyReferences } from '../../domain/commerce';
import type { AppBindings } from '../../platform/env';
import {
  createStripeCheckoutGateway,
  createStripeClientOptions,
  StripeCheckoutGateway,
} from './stripe-checkout-gateway';
import {
  cartQuantity,
  checkoutSessionId,
  storeItemSlug,
  stripePriceId,
  variantId,
} from '../../../test/support/commerce-value-objects';

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
  it.each([
    [4, 300],
    [5, 600],
    [8, 600],
    [9, 1000],
    [20, 1000],
  ])('sends the exact quantity quote for %i units as one generic Stripe shipping option', async (units, amount) => {
    const create = vi
      .fn()
      .mockResolvedValue({ id: 'cs_test_manual', url: 'https://checkout.stripe.test/manual', expires_at: 1800000000 });
    const gateway = new StripeCheckoutGateway({ checkout: { sessions: { create } } } as never, 'pmc_test');
    const quantities = units === 20 ? [9, 8, 3] : [units!];
    const lineItems = quantities.map((quantity, index) => ({
      displayName: `Item ${index}`,
      optionLabel: null,
      unitAmountMinor: 2500,
      lineAmountMinor: 2500 * quantity,
      quantity: cartQuantity(quantity),
      storeItemSlug: storeItemSlug(`item-${index}`),
      stripePriceId: stripePriceId(`price_${index}`),
      variantId: variantId(`variant_${index}`),
    }));
    for (const target of ['local', 'uat', 'prd'] as const) {
      const quote = quoteDelivery(lineItems, createPackingPolicy(target, true))!;
      await gateway.createHostedCheckoutSession({
        cancelUrl: 'https://example.com/cancel',
        successUrl: 'https://example.com/return',
        checkoutExpiresAt: new Date('2026-10-09T12:00:00Z'),
        orderId: `order_manual_${target}`,
        lineItems,
        monetaryPolicy: {
          acceptedDeliveryAmountMinor: quote.amountMinor,
          acceptedParcelTier: quote.tier,
          monetaryPolicyReference: quantityBandPolicyReferences[target],
        },
      });
      const params = create.mock.lastCall![0];
      expect(params.shipping_options).toEqual([
        {
          shipping_rate_data: {
            display_name: 'BOX NOW locker delivery',
            type: 'fixed_amount',
            fixed_amount: { amount, currency: 'eur' },
            tax_behavior: 'inclusive',
            tax_code: 'txcd_92010001',
          },
        },
      ]);
      expect(params).toMatchObject({
        automatic_tax: { enabled: false },
        payment_method_configuration: 'pmc_test',
        shipping_address_collection: { allowed_countries: ['GR'] },
        metadata: { parcelTier: 'manual', monetaryPolicyReference: quantityBandPolicyReferences[target] },
      });
    }
  });
  it('explicitly expands shipping tax entries on Session reads', async () => {
    const retrieve = vi.fn().mockResolvedValue({ id: 'cs_test_expanded' });
    const gateway = new StripeCheckoutGateway({ checkout: { sessions: { retrieve } } } as never, 'pmc_test');
    await gateway.readCheckoutSession(checkoutSessionId('cs_test_expanded'));
    expect(retrieve).toHaveBeenCalledWith('cs_test_expanded', { expand: ['shipping_cost.taxes'] });
  });
  it.each([false, true, undefined])('distinguishes automatic tax enabled=%s from absent evidence', async (enabled) => {
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            retrieve: async () => ({
              id: 'cs_test_flag',
              ...(enabled === undefined ? {} : { automatic_tax: { enabled, status: enabled ? 'complete' : null } }),
            }),
          },
        },
      } as never,
      'pmc_test',
    );
    expect((await gateway.readCheckoutSession(checkoutSessionId('cs_test_flag'))).monetary).toMatchObject({
      automaticTaxEnabled: enabled ?? null,
      automaticTaxStatus: enabled ? 'complete' : null,
      deliveryVatMinor: null,
      totalVatMinor: null,
      deliveryAppliedTaxCount: null,
    });
  });
  it.each([
    'synthetic-uat-no-tax-collected-2026-10-09-v1',
    'owner-assumed-vinyl-packing-no-tax-collected-prd-2026-10-09-v1',
    'unknown-no-tax-collected',
  ])('uses only an explicit accepted policy for %s', async (reference) => {
    const create = vi
      .fn()
      .mockResolvedValue({ id: 'cs_test_mode', url: 'https://checkout.stripe.test/mode', expires_at: 1800000000 });
    const gateway = new StripeCheckoutGateway({ checkout: { sessions: { create } } } as never, 'pmc_test');
    const request = {
      monetaryPolicy: {
        acceptedDeliveryAmountMinor: 250,
        acceptedParcelTier: 'small' as const,
        monetaryPolicyReference: reference,
      },
      cancelUrl: 'https://example.com/cancel',
      successUrl: 'https://example.com/return',
      checkoutExpiresAt: new Date('2026-10-09T12:00:00Z'),
      orderId: 'order_mode',
      storeItemSlug: storeItemSlug('test'),
      stripePriceId: stripePriceId('price_mode'),
      variantId: variantId('variant_mode'),
    };
    if (reference === 'unknown-no-tax-collected') {
      await expect(gateway.createHostedCheckoutSession(request)).rejects.toThrow(CheckoutConfigurationError);
      expect(create).not.toHaveBeenCalled();
    } else {
      await gateway.createHostedCheckoutSession(request);
      const params = create.mock.calls[0]![0];
      expect(params).toMatchObject({
        automatic_tax: { enabled: false },
        tax_id_collection: { enabled: false },
        line_items: [{ price: 'price_mode', quantity: 1 }],
        shipping_options: [{ shipping_rate_data: { fixed_amount: { amount: 250, currency: 'eur' } } }],
      });
      expect(params.line_items[0]).not.toHaveProperty('tax_rates');
      expect(params).not.toHaveProperty('customer_update');
    }
  });
  it('retains no-tax evidence rather than replacing missing amounts or rates with zero', async () => {
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            retrieve: async () => ({
              id: 'cs_test_zero',
              automatic_tax: { enabled: false, status: null },
              shipping_cost: { amount_tax: 0, taxes: [] },
              total_details: { amount_tax: 0 },
            }),
            listLineItems: async () => ({
              data: [
                {
                  quantity: 1,
                  amount_total: 2480,
                  amount_tax: 0,
                  taxes: [],
                  price: { id: 'price_zero', tax_behavior: 'inclusive' },
                },
              ],
              has_more: false,
            }),
          },
        },
      } as never,
      'pmc_test',
    );
    expect((await gateway.readCheckoutSession(checkoutSessionId('cs_test_zero'))).monetary).toMatchObject({
      automaticTaxEnabled: false,
      automaticTaxStatus: null,
      deliveryVatMinor: 0,
      deliveryAppliedTaxCount: 0,
      totalVatMinor: 0,
    });
    expect(await gateway.readCheckoutSessionLineItems(checkoutSessionId('cs_test_zero'))).toMatchObject([
      { lineVatMinor: 0, taxRatePercent: null, appliedTaxCount: 0 },
    ]);
  });
  it('reads every finalized tax line and enforces immutable custom Price bounds', async () => {
    const line = {
      id: 'li_first',
      amount_total: 2480,
      amount_tax: 480,
      amount_discount: 0,
      currency: 'eur',
      quantity: 1,
      taxes: [{ rate: { percentage: 24, inclusive: true, country: 'GR' } }],
      price: {
        id: 'price_custom_tax',
        tax_behavior: 'inclusive',
        custom_unit_amount: { minimum: 1000, maximum: 3000 },
      },
    };
    const listLineItems = vi
      .fn()
      .mockResolvedValueOnce({ data: [line], has_more: true })
      .mockResolvedValueOnce({ data: [{ ...line, id: 'li_second', amount_total: 3001 }], has_more: false });
    const gateway = new StripeCheckoutGateway({ checkout: { sessions: { listLineItems } } } as never, 'pmc_test');
    const lines = await gateway.readCheckoutSessionLineItems(checkoutSessionId('cs_test_tax'));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      lineAmountMinor: 2480,
      lineVatMinor: 480,
      taxRatePercent: 24,
      taxInclusive: true,
      customAmountValid: true,
    });
    expect(lines[1]?.customAmountValid).toBe(false);
    expect(listLineItems).toHaveBeenLastCalledWith('cs_test_tax', {
      limit: 100,
      expand: ['data.taxes'],
      starting_after: 'li_first',
    });
  });

  it('does not silently omit a malformed provider line', async () => {
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            listLineItems: async () => ({ data: [{ quantity: 0 }], has_more: false }),
          },
        },
      } as never,
      'pmc_test',
    );
    await expect(gateway.readCheckoutSessionLineItems(checkoutSessionId('cs_test_tax'))).rejects.toThrow(
      'Incomplete Checkout line item',
    );
  });
  it('freezes expiry and idempotency parameters across real SDK retries', async () => {
    let now = Date.parse('2026-09-09T10:00:02.900Z');
    const checkoutExpiresAt = new Date('2026-09-09T10:35:02.000Z');
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
    const requests: { body: string; key: string | null }[] = [];
    const stripe = new Stripe('sk_test_mock', {
      maxNetworkRetries: 1,
      httpClient: Stripe.createFetchHttpClient(async (_url, init) => {
        requests.push({ body: String(init?.body), key: new Headers(init?.headers).get('Idempotency-Key') });
        now += 2_000;
        if (requests.length === 1) {
          return new Response(JSON.stringify({ error: { type: 'api_error', message: 'retry' } }), { status: 500 });
        }
        const expiry = Number(new URLSearchParams(String(init?.body)).get('expires_at'));
        return new Response(
          JSON.stringify({
            id: 'cs_test_retry',
            url: 'https://checkout.stripe.test/session/retry',
            expires_at: expiry,
          }),
        );
      }),
    });
    try {
      const result = await new StripeCheckoutGateway(stripe, 'pmc_test').createHostedCheckoutSession({
        monetaryPolicy: {
          acceptedDeliveryAmountMinor: 250,
          acceptedParcelTier: 'small',
          monetaryPolicyReference: 'synthetic-local-inclusive-v1',
        },
        cancelUrl: 'https://example.com/cancel',
        checkoutExpiresAt,
        orderId: 'order_retry',
        successUrl: 'https://example.com/return',
        storeItemSlug: storeItemSlug('test-item'),
        stripePriceId: stripePriceId('price_test_retry'),
        variantId: variantId('variant_test_retry'),
      });
      expect(requests).toHaveLength(2);
      expect(requests[0]).toEqual(requests[1]);
      expect(requests[0]?.key).toBe('checkout-order:order_retry');
      expect(result.checkoutExpiresAt).toEqual(checkoutExpiresAt);
    } finally {
      clock.mockRestore();
    }
  });

  it.each([
    [
      new Stripe.errors.StripeInvalidRequestError({ statusCode: 400, param: 'expires_at', message: 'invalid expiry' }),
      true,
    ],
    [new Stripe.errors.StripeAPIError({ statusCode: 500, message: 'server failure' }), false],
    [new Stripe.errors.StripeConnectionError({ message: 'timeout' }), false],
  ] as const)('classifies provider creation failure %# conservatively', async (error, definitiveNonCreation) => {
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            create: async () => {
              throw error;
            },
          },
        },
      } as never,
      'pmc_test',
    );
    await expect(
      gateway.createHostedCheckoutSession({
        monetaryPolicy: {
          acceptedDeliveryAmountMinor: 250,
          acceptedParcelTier: 'small',
          monetaryPolicyReference: 'synthetic-local-inclusive-v1',
        },
        cancelUrl: 'https://example.com/cancel',
        checkoutExpiresAt: new Date(),
        orderId: 'order_failure',
        successUrl: 'https://example.com/return',
      }),
    ).rejects.toMatchObject({ definitiveNonCreation, session: null });
  });

  it('retains accepted Session identity when a usable URL is missing', async () => {
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            create: async () => ({ id: 'cs_test_no_url', expires_at: 1777026600, url: null }),
          },
        },
      } as never,
      'pmc_test',
    );
    const result = gateway.createHostedCheckoutSession({
      monetaryPolicy: {
        acceptedDeliveryAmountMinor: 250,
        acceptedParcelTier: 'small',
        monetaryPolicyReference: 'synthetic-local-inclusive-v1',
      },
      cancelUrl: 'https://example.com/cancel',
      checkoutExpiresAt: new Date(),
      orderId: 'order_no_url',
      successUrl: 'https://example.com/return',
    });
    await expect(result).rejects.toBeInstanceOf(CheckoutCreationError);
    await expect(result).rejects.toMatchObject({
      definitiveNonCreation: false,
      session: { checkoutSessionId: 'cs_test_no_url', checkoutExpiresAt: new Date('2026-04-24T10:30:00.000Z') },
    });
  });

  it('keeps the native minimum after hold work without extending the saved deadline', async () => {
    const createdAt = new Date('2026-09-09T10:00:00.900Z');
    const providerNow = new Date(createdAt.getTime() + 59_000);
    const checkoutExpiresAt = new Date(createdAt.getTime() + 31 * 60 * 1000);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(providerNow.getTime());
    const create = vi.fn(async (params: { expires_at?: number }) => {
      expect(params.expires_at).toBe(Math.floor(checkoutExpiresAt.getTime() / 1000));
      expect(params.expires_at! - Math.floor(Date.now() / 1000)).toBeGreaterThanOrEqual(30 * 60);
      return {
        expires_at: params.expires_at,
        id: 'cs_test_delayed',
        url: 'https://checkout.stripe.test/session/cs_test_delayed',
      };
    });
    const gateway = new StripeCheckoutGateway(
      { checkout: { sessions: { create } } } as never,
      'pmc_test_blackbox_checkout',
    );

    try {
      await gateway.createHostedCheckoutSession({
        monetaryPolicy: {
          acceptedDeliveryAmountMinor: 250,
          acceptedParcelTier: 'small',
          monetaryPolicyReference: 'synthetic-local-inclusive-v1',
        },
        cancelUrl: 'https://blackbox.example/checkout',
        checkoutExpiresAt,
        orderId: 'order_delayed',
        storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
        stripePriceId: stripePriceId('price_test_barren_point'),
        successUrl: 'https://blackbox.example/return',
        variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
      });
    } finally {
      clock.mockRestore();
    }
  });

  it('creates hosted Checkout Sessions with fixed quantities and required shipping/contact collection', async () => {
    const create = vi.fn(async () => ({
      expires_at: 1777026600,
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session/cs_test_123',
    }));
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            create,
            expire: vi.fn(),
            retrieve: vi.fn(),
            listLineItems: vi.fn(),
          },
        },
      } as never,
      'pmc_test_blackbox_checkout',
    );

    await expect(
      gateway.createHostedCheckoutSession({
        checkoutExpiresAt: new Date('2026-04-24T10:30:00.000Z'),
        lineItems: [
          {
            displayName: 'Disintegration Black Vinyl LP',
            lineAmountMinor: 5000,
            optionLabel: null,
            quantity: cartQuantity(2),
            storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
            stripePriceId: stripePriceId('price_test_barren_point'),
            unitAmountMinor: 2500,
            variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
          },
        ],
        monetaryPolicy: {
          acceptedDeliveryAmountMinor: 250,
          acceptedParcelTier: 'small',
          monetaryPolicyReference: 'synthetic-local-inclusive-v1',
        },
        cancelUrl: 'https://blackbox.example/checkout',
        newsletterOptIn: true,
        orderId: 'order_test_123',
        successUrl: 'https://blackbox.example/return',
      }),
    ).resolves.toEqual({
      checkoutExpiresAt: new Date('2026-04-24T10:30:00.000Z'),
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
        expires_at: expect.any(Number),
        locale: 'en',
        metadata: {
          parcelTier: 'small',
          monetaryPolicyReference: 'synthetic-local-inclusive-v1',
          newsletterConsentCopyVersion: 'blackbox-newsletter-v1',
          newsletterOptIn: 'true',
          orderId: 'order_test_123',
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
        payment_method_configuration: 'pmc_test_blackbox_checkout',
        phone_number_collection: {
          enabled: true,
        },
        shipping_address_collection: {
          allowed_countries: ['GR'],
        },
        success_url: 'https://blackbox.example/return',
        automatic_tax: { enabled: true },
        adaptive_pricing: { enabled: false },
        shipping_options: [
          {
            shipping_rate_data: {
              display_name: 'BOX NOW Small locker delivery',
              type: 'fixed_amount',
              fixed_amount: { amount: 250, currency: 'eur' },
              tax_behavior: 'inclusive',
              tax_code: 'txcd_92010001',
            },
          },
        ],
      }),
      { idempotencyKey: 'checkout-order:order_test_123' },
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

  it('reads provider-finalized line amounts for fixed and pay-what-you-want snapshots', async () => {
    const listLineItems = vi.fn(async () => ({
      data: [
        {
          amount_total: 3700,
          price: { id: 'price_test_pay_what_you_want' },
          quantity: 1,
        },
      ],
    }));
    const gateway = new StripeCheckoutGateway(
      {
        checkout: {
          sessions: {
            create: vi.fn(),
            expire: vi.fn(),
            listLineItems,
            retrieve: vi.fn(),
          },
        },
      } as never,
      'pmc_test_blackbox_checkout',
    );

    await expect(gateway.readCheckoutSessionLineItems(checkoutSessionId('cs_test_123'))).resolves.toEqual([
      {
        lineAmountMinor: 3700,
        appliedTaxCount: null,
        customAmountValid: false,
        lineVatMinor: null,
        taxRatePercent: null,
        currencyCode: null,
        taxInclusive: false,
        discountMinor: null,
        quantity: 1,
        stripePriceId: 'price_test_pay_what_you_want',
      },
    ]);
  });
});
