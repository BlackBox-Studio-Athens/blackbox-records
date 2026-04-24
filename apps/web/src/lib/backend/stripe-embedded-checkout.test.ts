import { describe, expect, it, vi } from 'vitest';

import { createStripeEmbeddedCheckoutAdapter } from './stripe-embedded-checkout';

describe('createStripeEmbeddedCheckoutAdapter', () => {
    it('reports a configuration error when the publishable key is missing', () => {
        const adapter = createStripeEmbeddedCheckoutAdapter({
            loadStripeClient: vi.fn(),
            publishableKey: '',
        });

        expect(adapter.getConfigurationError()).toBe('Stripe publishable key is not configured.');
    });

    it('loads Stripe and mounts embedded Checkout with the Worker client secret', async () => {
        const mountTarget = {} as HTMLElement;
        const checkout = {
            destroy: vi.fn(),
            mount: vi.fn(),
            unmount: vi.fn(),
        };
        const stripe = {
            createEmbeddedCheckoutPage: vi.fn(async () => checkout),
        };
        const adapter = createStripeEmbeddedCheckoutAdapter({
            loadStripeClient: vi.fn(async () => stripe as never),
            publishableKey: 'pk_test_blackbox',
        });

        const mount = await adapter.mountEmbeddedCheckout({
            clientSecret: 'cs_test_client_secret',
            mountTarget,
        });

        expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledExactlyOnceWith({
            clientSecret: 'cs_test_client_secret',
        });
        expect(checkout.mount).toHaveBeenCalledExactlyOnceWith(mountTarget);

        mount.destroy();

        expect(checkout.destroy).toHaveBeenCalledOnce();
    });
});
