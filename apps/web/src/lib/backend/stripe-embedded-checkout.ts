import { loadStripe, type Stripe } from '@stripe/stripe-js';

export type EmbeddedCheckoutMount = {
    destroy(): void;
};

export type EmbeddedCheckoutAdapter = {
    getConfigurationError(): string | null;
    mountEmbeddedCheckout(input: EmbeddedCheckoutMountInput): Promise<EmbeddedCheckoutMount>;
};

export type EmbeddedCheckoutMountInput = {
    clientSecret: string;
    mountTarget: HTMLElement;
};

type StripeLoader = (publishableKey: string) => Promise<Stripe | null>;

export type StripeEmbeddedCheckoutAdapterOptions = {
    loadStripeClient?: StripeLoader;
    publishableKey?: string;
};

export function createStripeEmbeddedCheckoutAdapter({
    loadStripeClient = loadStripe,
    publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
}: StripeEmbeddedCheckoutAdapterOptions = {}): EmbeddedCheckoutAdapter {
    const normalizedPublishableKey = publishableKey?.trim() ?? '';

    return {
        getConfigurationError() {
            return normalizedPublishableKey ? null : 'Stripe publishable key is not configured.';
        },
        async mountEmbeddedCheckout({ clientSecret, mountTarget }) {
            if (!normalizedPublishableKey) {
                throw new Error('Stripe publishable key is not configured.');
            }

            const stripe = await loadStripeClient(normalizedPublishableKey);

            if (!stripe) {
                throw new Error('Stripe.js did not initialize.');
            }

            const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret });
            checkout.mount(mountTarget);

            return {
                destroy() {
                    checkout.destroy();
                },
            };
        },
    };
}
