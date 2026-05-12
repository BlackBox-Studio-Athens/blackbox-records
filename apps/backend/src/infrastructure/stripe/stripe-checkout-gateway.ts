import Stripe from 'stripe';

import type {
  CheckoutGateway,
  EmbeddedCheckoutSession,
  EmbeddedCheckoutSessionRequest,
  StripeCheckoutSessionState,
} from '../../application/commerce/checkout';
import { CheckoutConfigurationError } from '../../application/commerce/checkout';
import type { AppBindings } from '../../env';
import { toStripeCheckoutSessionState } from './stripe-checkout-session-state';

const STRIPE_API_VERSION = '2026-04-22.dahlia';
const DEFAULT_STRIPE_PROTOCOL = 'https';
type StripeClientOptions = NonNullable<ConstructorParameters<typeof Stripe>[1]>;
type StripeProtocol = NonNullable<StripeClientOptions['protocol']>;

export class StripeCheckoutGateway implements CheckoutGateway {
  public constructor(private readonly stripe: Stripe) {}

  public async createEmbeddedCheckoutSession(
    request: EmbeddedCheckoutSessionRequest,
  ): Promise<EmbeddedCheckoutSession> {
    const resolvedLineItems =
      request.lineItems ??
      (request.storeItemSlug && request.stripePriceId && request.variantId
        ? [
            {
              quantity: 1,
              storeItemSlug: request.storeItemSlug,
              stripePriceId: request.stripePriceId,
              variantId: request.variantId,
            },
          ]
        : []);
    const metadataLineItem = resolvedLineItems[0];
    const session = await this.stripe.checkout.sessions.create({
      line_items: resolvedLineItems.map((lineItem) => ({
        adjustable_quantity: {
          enabled: true,
          maximum: lineItem.adjustableQuantityMaximum ?? lineItem.quantity,
          minimum: 1,
        },
        price: lineItem.stripePriceId,
        quantity: lineItem.quantity,
      })),
      metadata: metadataLineItem
        ? {
            storeItemSlug: metadataLineItem.storeItemSlug,
            variantId: metadataLineItem.variantId,
          }
        : undefined,
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

    return toStripeCheckoutSessionState(session);
  }

  public async readCheckoutSessionLineItems(checkoutSessionId: string) {
    const stripeLineItemsResponse = await this.stripe.checkout.sessions.listLineItems(checkoutSessionId, {
      limit: 100,
    });

    return stripeLineItemsResponse.data
      .map((lineItem) => ({
        quantity: lineItem.quantity ?? 0,
        stripePriceId: lineItem.price?.id ?? '',
      }))
      .filter((lineItem) => lineItem.quantity > 0 && lineItem.stripePriceId);
  }
}

export function createStripeCheckoutGateway(
  bindings: Pick<AppBindings, 'STRIPE_API_BASE_URL' | 'STRIPE_SECRET_KEY'>,
): CheckoutGateway {
  if (!bindings.STRIPE_SECRET_KEY) {
    throw new CheckoutConfigurationError('Stripe secret key is not configured.');
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

  if (!stripeApiBaseUrl?.trim()) {
    return options;
  }

  const baseUrl = new URL(stripeApiBaseUrl);

  return {
    ...options,
    host: baseUrl.hostname,
    port: Number(baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80)),
    protocol: normalizeStripeProtocol(baseUrl.protocol),
  };
}

function normalizeStripeProtocol(protocol: string): StripeProtocol {
  return protocol === 'http:' ? 'http' : DEFAULT_STRIPE_PROTOCOL;
}
