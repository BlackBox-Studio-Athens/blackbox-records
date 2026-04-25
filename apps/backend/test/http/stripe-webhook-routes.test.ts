import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';
import * as stripeWebhookAcknowledgement from '../../src/interfaces/http/routes/stripe-webhook-acknowledgement';

const webhookSecret = 'whsec_fixture_secret';

const testBindings = {
  APP_ENV: 'local' as const,
  COMMERCE_DB: {} as D1Database,
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: webhookSecret,
};

function createStripeEventPayload(type: string): string {
  return JSON.stringify({
    api_version: '2026-04-25.basil',
    created: 1777132800,
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
      },
    },
    id: `evt_${type.replaceAll('.', '_')}`,
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: null,
    type,
  });
}

function createSignatureHeader(payload: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
}

describe('Stripe webhook routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('acknowledges valid allowed checkout-session events after signature verification', async () => {
    const payload = createStripeEventPayload('checkout.session.completed');
    const acknowledgeSpy = vi.spyOn(stripeWebhookAcknowledgement, 'acknowledgeVerifiedStripeWebhookEvent');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(acknowledgeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutSession: expect.objectContaining({
          id: 'cs_test_123',
          object: 'checkout.session',
        }),
        id: 'evt_checkout_session_completed',
        isAllowed: true,
        type: 'checkout.session.completed',
      }),
    );
  });

  it('acknowledges but ignores valid unsupported events', async () => {
    const payload = createStripeEventPayload('payment_intent.succeeded');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ignored: true,
      received: true,
    });
  });

  it('rejects missing Stripe signatures before acknowledging an event', async () => {
    const acknowledgeSpy = vi.spyOn(stripeWebhookAcknowledgement, 'acknowledgeVerifiedStripeWebhookEvent');
    const payload = createStripeEventPayload('checkout.session.completed');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Stripe webhook signature is required.',
    });
    expect(acknowledgeSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid signatures before acknowledging an event', async () => {
    const acknowledgeSpy = vi.spyOn(stripeWebhookAcknowledgement, 'acknowledgeVerifiedStripeWebhookEvent');
    const payload = createStripeEventPayload('checkout.session.completed');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: `${payload}\n`,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      testBindings,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Stripe webhook signature verification failed.',
    });
    expect(acknowledgeSpy).not.toHaveBeenCalled();
  });

  it('returns a configuration error when the webhook secret is missing', async () => {
    const payload = createStripeEventPayload('checkout.session.completed');

    const app = createHttpApp();
    const response = await app.request(
      'http://backend.test/api/stripe/webhooks',
      {
        body: payload,
        headers: {
          'content-type': 'application/json',
          'stripe-signature': createSignatureHeader(payload),
        },
        method: 'POST',
      },
      {
        ...testBindings,
        STRIPE_WEBHOOK_SECRET: undefined,
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Stripe webhook is not configured.',
    });
  });
});
