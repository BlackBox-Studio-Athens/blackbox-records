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

export type CheckoutClientMode = 'mock' | 'stripe';

type StripeLoader = (publishableKey: string) => Promise<Stripe | null>;

export type StripeEmbeddedCheckoutAdapterOptions = {
  loadStripeClient?: StripeLoader;
  mode?: string | undefined;
  publishableKey?: string | undefined;
};

export function createConfiguredEmbeddedCheckoutAdapter({
  loadStripeClient = loadStripe,
  mode = import.meta.env.PUBLIC_CHECKOUT_CLIENT_MODE,
  publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
}: StripeEmbeddedCheckoutAdapterOptions = {}): EmbeddedCheckoutAdapter {
  return readCheckoutClientMode(mode) === 'mock'
    ? createMockEmbeddedCheckoutAdapter()
    : createStripeEmbeddedCheckoutAdapter({
        loadStripeClient,
        publishableKey,
      });
}

export function createStripeEmbeddedCheckoutAdapter({
  loadStripeClient = loadStripe,
  publishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
}: Omit<StripeEmbeddedCheckoutAdapterOptions, 'mode'> = {}): EmbeddedCheckoutAdapter {
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

export function createMockEmbeddedCheckoutAdapter(): EmbeddedCheckoutAdapter {
  return {
    getConfigurationError() {
      return null;
    },
    async mountEmbeddedCheckout({ mountTarget }) {
      mountTarget.setAttribute('data-mock-checkout-panel', '');
      mountTarget.className = 'grid gap-3 p-5 text-sm text-muted-foreground';
      mountTarget.textContent = [
        'Mock Checkout Started',
        'This local mode confirms the Worker can create a checkout session shape without mounting real Stripe Checkout.',
      ].join(' ');

      return {
        destroy() {
          mountTarget.removeAttribute('data-mock-checkout-panel');
          mountTarget.textContent = '';
        },
      };
    },
  };
}

export function readCheckoutClientMode(mode?: string): CheckoutClientMode {
  return mode === 'mock' ? 'mock' : 'stripe';
}
