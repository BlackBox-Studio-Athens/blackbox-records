import Stripe from 'stripe';

import type {
  CheckoutGateway,
  EmbeddedCheckoutSession,
  EmbeddedCheckoutSessionRequest,
  StripeCheckoutSessionState,
} from '../../application/commerce/checkout';
import { CheckoutConfigurationError } from '../../application/commerce/checkout';
import type { AppBindings } from '../../env';

const STRIPE_API_VERSION = '2026-04-22.dahlia';
const DEFAULT_STRIPE_PROTOCOL = 'https';
const MOCK_STRIPE_API_BASE_URL = 'mock';
type StripeClientOptions = NonNullable<ConstructorParameters<typeof Stripe>[1]>;
type StripeProtocol = NonNullable<StripeClientOptions['protocol']>;

export class StripeCheckoutGateway implements CheckoutGateway {
  public constructor(private readonly stripe: Stripe) {}

  public async createEmbeddedCheckoutSession(
    request: EmbeddedCheckoutSessionRequest,
  ): Promise<EmbeddedCheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price: request.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        storeItemSlug: request.storeItemSlug,
        variantId: request.variantId,
      },
      mode: 'payment',
      return_url: request.returnUrl,
      ui_mode: 'embedded_page',
    });

    if (!session.client_secret) {
      throw new CheckoutConfigurationError('Stripe did not return a Checkout client secret.');
    }

    return {
      checkoutSessionId: session.id,
      clientSecret: session.client_secret,
    };
  }

  public async readCheckoutSession(checkoutSessionId: string): Promise<StripeCheckoutSessionState> {
    const session = await this.stripe.checkout.sessions.retrieve(checkoutSessionId);

    return {
      checkoutSessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
    };
  }
}

export class MockStripeCheckoutGateway implements CheckoutGateway {
  public async createEmbeddedCheckoutSession(
    request: EmbeddedCheckoutSessionRequest,
  ): Promise<EmbeddedCheckoutSession> {
    return {
      checkoutSessionId: `cs_mock_${request.variantId}`,
      clientSecret: `cs_mock_secret_${request.variantId}`,
    };
  }

  public async readCheckoutSession(checkoutSessionId: string): Promise<StripeCheckoutSessionState> {
    return {
      checkoutSessionId,
      paymentStatus: 'unpaid',
      status: 'open',
    };
  }
}

export function createStripeCheckoutGateway(
  bindings: Pick<AppBindings, 'STRIPE_API_BASE_URL' | 'STRIPE_SECRET_KEY'>,
): CheckoutGateway {
  if (!bindings.STRIPE_SECRET_KEY) {
    throw new CheckoutConfigurationError('Stripe secret key is not configured.');
  }

  if (readStripeApiBaseMode(bindings.STRIPE_API_BASE_URL) === 'mock') {
    return new MockStripeCheckoutGateway();
  }

  return new StripeCheckoutGateway(
    new Stripe(bindings.STRIPE_SECRET_KEY, createStripeClientOptions(bindings.STRIPE_API_BASE_URL)),
  );
}

export function createStripeClientOptions(stripeApiBaseUrl?: string): StripeClientOptions {
  const options: StripeClientOptions = {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  };

  if (!stripeApiBaseUrl?.trim() || readStripeApiBaseMode(stripeApiBaseUrl) === 'mock') {
    return options;
  }

  const baseUrl = new URL(stripeApiBaseUrl);

  return {
    ...options,
    host: baseUrl.hostname,
    port: Number(baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80)),
    protocol: parseStripeProtocol(baseUrl.protocol),
  };
}

function parseStripeProtocol(protocol: string): StripeProtocol {
  return protocol === 'http:' ? 'http' : DEFAULT_STRIPE_PROTOCOL;
}

function readStripeApiBaseMode(stripeApiBaseUrl?: string): 'mock' | 'stripe' {
  return stripeApiBaseUrl?.trim().toLowerCase() === MOCK_STRIPE_API_BASE_URL ? 'mock' : 'stripe';
}
