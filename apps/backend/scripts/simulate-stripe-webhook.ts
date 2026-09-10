import process from 'node:process';
import { pathToFileURL } from 'node:url';

import Stripe from 'stripe';

import type { StripeCheckoutWebhookEventType } from '../src/infrastructure/stripe';

export type StripeWebhookFixtureOptions = {
  monetarySource?: Record<string, unknown>;
  checkoutSessionId?: string;
  created?: number;
  eventId?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'no_payment_required';
  status?: 'complete' | 'expired' | 'open';
  type: StripeCheckoutWebhookEventType;
};

export type SimulateStripeWebhookOptions = StripeWebhookFixtureOptions & {
  endpointUrl: string;
  fetcher?: typeof fetch;
  webhookSecret: string;
};

const defaultWebhookSecret = 'whsec_local_mock';
const defaultEndpointUrl = 'http://127.0.0.1:8787/api/stripe/webhooks';
const defaultCheckoutSessionId = 'cs_mock_variant_disintegration-black-vinyl-lp_standard';
const defaultEventType: StripeCheckoutWebhookEventType = 'checkout.session.completed';

export function createStripeWebhookFixturePayload({
  checkoutSessionId = defaultCheckoutSessionId,
  created = 1_777_132_800,
  eventId,
  paymentStatus = 'paid',
  status = 'complete',
  type,
  monetarySource,
}: StripeWebhookFixtureOptions): string {
  return JSON.stringify({
    api_version: '2026-08-26.dahlia',
    created,
    data: {
      object: {
        amount_total: monetarySource?.amount_total ?? 2800,
        automatic_tax: monetarySource?.automatic_tax,
        shipping_cost: monetarySource?.shipping_cost,
        total_details: monetarySource?.total_details,
        currency: 'eur',
        collected_information: {
          shipping_details: {
            name: 'Local Mock Recipient',
            address: {
              city: 'Athens',
              country: 'GR',
              line1: '1 Local Mock Street',
              line2: null,
              postal_code: '10558',
              state: 'Attica',
            },
          },
        },
        customer_details: {
          address: {
            city: 'Athens',
            country: 'GR',
            line1: '1 Local Mock Street',
            line2: null,
            postal_code: '10558',
            state: 'Attica',
          },
          email: 'shopper@example.com',
          name: 'Local Mock Shopper',
          phone: '+306900000000',
        },
        id: checkoutSessionId,
        metadata: monetarySource?.metadata ?? {},
        object: 'checkout.session',
        payment_status: paymentStatus,
        payment_intent: paymentStatus === 'paid' ? 'pi_local_mock' : null,
        status,
      },
    },
    id: eventId ?? `evt_local_${type.replaceAll('.', '_')}`,
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: null,
    type,
  });
}

export function createStripeWebhookSignatureHeader(input: { payload: string; webhookSecret: string }): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload: input.payload,
    secret: input.webhookSecret,
  });
}

export async function simulateStripeWebhook({
  endpointUrl,
  fetcher = fetch,
  webhookSecret,
  ...fixtureOptions
}: SimulateStripeWebhookOptions): Promise<{ body: string; status: number }> {
  const payload = createStripeWebhookFixturePayload(fixtureOptions);
  const response = await fetcher(endpointUrl, {
    body: payload,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': createStripeWebhookSignatureHeader({
        payload,
        webhookSecret,
      }),
    },
    method: 'POST',
  });

  return {
    body: await response.text(),
    status: response.status,
  };
}

async function main() {
  const type = readWebhookEventType(process.argv[2]);
  const checkoutSessionId = readWebhookCheckoutSessionId();
  const endpointUrl = process.env.STRIPE_WEBHOOK_ENDPOINT_URL?.trim() || defaultEndpointUrl;
  const monetarySource = (await fetch(
    `http://127.0.0.1:12110/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}`,
    {
      headers: { Authorization: 'Bearer sk_test_mock' },
    },
  ).then((response) => {
    if (!response.ok) throw new Error('Could not read the local mock Checkout Session.');
    return response.json();
  })) as Record<string, unknown>;
  const result = await simulateStripeWebhook({
    checkoutSessionId,
    monetarySource,
    endpointUrl,
    type,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || defaultWebhookSecret,
  });

  console.log(`Stripe webhook fixture ${type}`);
  console.log(`Checkout session: ${checkoutSessionId}`);
  console.log(`Endpoint: ${endpointUrl}`);
  console.log(`HTTP ${result.status}`);
  console.log(result.body);

  if (result.status < 200 || result.status >= 300) {
    process.exit(1);
  }
}

function readWebhookEventType(value: string | undefined): StripeCheckoutWebhookEventType {
  if (
    value === 'checkout.session.completed' ||
    value === 'checkout.session.async_payment_succeeded' ||
    value === 'checkout.session.async_payment_failed' ||
    value === 'checkout.session.expired'
  ) {
    return value;
  }

  return defaultEventType;
}

export function readWebhookCheckoutSessionId(env: Record<string, string | undefined> = process.env): string {
  return (
    env.STRIPE_WEBHOOK_CHECKOUT_SESSION_ID?.trim() || env.LOCAL_CHECKOUT_SESSION_ID?.trim() || defaultCheckoutSessionId
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
