import process from 'node:process';
import { pathToFileURL } from 'node:url';

import Stripe from 'stripe';

import type { StripeCheckoutWebhookEventType } from '../src/infrastructure/stripe';

export type StripeWebhookFixtureOptions = {
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
const defaultCheckoutSessionId = 'cs_mock_variant_barren-point_standard';
const defaultEventType: StripeCheckoutWebhookEventType = 'checkout.session.completed';

export function createStripeWebhookFixturePayload({
  checkoutSessionId = defaultCheckoutSessionId,
  created = 1_777_132_800,
  eventId,
  paymentStatus = 'paid',
  status = 'complete',
  type,
}: StripeWebhookFixtureOptions): string {
  return JSON.stringify({
    api_version: '2026-04-22.dahlia',
    created,
    data: {
      object: {
        id: checkoutSessionId,
        object: 'checkout.session',
        payment_status: paymentStatus,
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
  const result = await simulateStripeWebhook({
    endpointUrl: process.env.STRIPE_WEBHOOK_ENDPOINT_URL?.trim() || defaultEndpointUrl,
    type,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || defaultWebhookSecret,
  });

  console.log(`Stripe webhook fixture ${type} -> HTTP ${result.status}`);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
