import { describe, expect, it } from 'vitest';

import { createStripeCheckoutGateway, createStripeClientOptions } from '../../../src/infrastructure/stripe/stripe-checkout-gateway';

describe('createStripeClientOptions', () => {
    it('uses real Stripe API defaults when no API base URL is configured', () => {
        const options = createStripeClientOptions();

        expect(options.host).toBeUndefined();
        expect(options.port).toBeUndefined();
        expect(options.protocol).toBeUndefined();
    });

    it('points the Stripe SDK to stripe-mock when a local API base URL is configured', () => {
        const options = createStripeClientOptions('http://127.0.0.1:12111');

        expect(options.host).toBe('127.0.0.1');
        expect(options.port).toBe(12111);
        expect(options.protocol).toBe('http');
    });

    it('uses an in-process mock gateway for the default local stack', async () => {
        const gateway = createStripeCheckoutGateway({
            STRIPE_API_BASE_URL: 'mock',
            STRIPE_SECRET_KEY: 'sk_test_mock',
        });

        const session = await gateway.createEmbeddedCheckoutSession({
            returnUrl: 'http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/',
            storeItemSlug: 'disintegration-black-vinyl-lp',
            stripePriceId: 'price_mock_barren_point',
            variantId: 'variant_barren-point_standard',
        });

        expect(session).toEqual({
            checkoutSessionId: 'cs_mock_variant_barren-point_standard',
            clientSecret: 'cs_mock_secret_variant_barren-point_standard',
        });
        await expect(gateway.readCheckoutSession(session.checkoutSessionId)).resolves.toEqual({
            checkoutSessionId: 'cs_mock_variant_barren-point_standard',
            paymentStatus: 'unpaid',
            status: 'open',
        });
    });
});
