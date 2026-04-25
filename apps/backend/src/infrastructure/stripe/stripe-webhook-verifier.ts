import Stripe from 'stripe';

export const STRIPE_CHECKOUT_WEBHOOK_EVENT_TYPES = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
] as const;

export type StripeCheckoutWebhookEventType = (typeof STRIPE_CHECKOUT_WEBHOOK_EVENT_TYPES)[number];

export type VerifiedStripeWebhookEvent =
  | {
      checkoutSession: Stripe.Checkout.Session;
      created: number;
      id: string;
      isAllowed: true;
      type: StripeCheckoutWebhookEventType;
    }
  | {
      created: number;
      id: string;
      isAllowed: false;
      type: string;
    };

const allowedCheckoutWebhookEventTypes = new Set<string>(STRIPE_CHECKOUT_WEBHOOK_EVENT_TYPES);

const stripe = new Stripe('sk_test_webhook_verifier', {
  httpClient: Stripe.createFetchHttpClient(),
});

export class StripeWebhookConfigurationError extends Error {
  public constructor() {
    super('Stripe webhook is not configured.');
    this.name = 'StripeWebhookConfigurationError';
  }
}

export class StripeWebhookMissingSignatureError extends Error {
  public constructor() {
    super('Stripe webhook signature is required.');
    this.name = 'StripeWebhookMissingSignatureError';
  }
}

export class StripeWebhookSignatureVerificationError extends Error {
  public constructor() {
    super('Stripe webhook signature verification failed.');
    this.name = 'StripeWebhookSignatureVerificationError';
  }
}

export async function verifyStripeWebhookEvent(input: {
  rawBody: string;
  signature: string | null;
  webhookSecret?: string;
}): Promise<VerifiedStripeWebhookEvent> {
  const webhookSecret = input.webhookSecret?.trim();

  if (!webhookSecret) {
    throw new StripeWebhookConfigurationError();
  }

  if (!input.signature) {
    throw new StripeWebhookMissingSignatureError();
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      input.rawBody,
      input.signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    throw new StripeWebhookSignatureVerificationError();
  }

  if (!allowedCheckoutWebhookEventTypes.has(event.type)) {
    return {
      created: event.created,
      id: event.id,
      isAllowed: false,
      type: event.type,
    };
  }

  return {
    checkoutSession: event.data.object as Stripe.Checkout.Session,
    created: event.created,
    id: event.id,
    isAllowed: true,
    type: event.type as StripeCheckoutWebhookEventType,
  };
}
