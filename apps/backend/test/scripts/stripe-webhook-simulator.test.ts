import { describe, expect, it, vi } from 'vitest';

import {
  createStripeWebhookFixturePayload,
  createStripeWebhookSignatureHeader,
  readWebhookCheckoutSessionId,
  simulateStripeWebhook,
} from '../../scripts/simulate-stripe-webhook';
import { verifyStripeWebhookEvent } from '../../src/infrastructure/stripe';

describe('Stripe webhook simulator', () => {
  const webhookSecret = 'whsec_local_mock';

  it('creates signed checkout-session fixture payloads accepted by the verifier', async () => {
    const payload = createStripeWebhookFixturePayload({
      checkoutSessionId: 'cs_mock_variant_barren-point_standard',
      type: 'checkout.session.completed',
    });
    const signature = createStripeWebhookSignatureHeader({
      payload,
      webhookSecret,
    });

    await expect(
      verifyStripeWebhookEvent({
        rawBody: payload,
        signature,
        webhookSecret,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        checkoutSession: expect.objectContaining({
          id: 'cs_mock_variant_barren-point_standard',
          payment_status: 'paid',
          status: 'complete',
        }),
        isAllowed: true,
        type: 'checkout.session.completed',
      }),
    );
  });

  it('posts signed fixture events to the local webhook endpoint', async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual(
        expect.objectContaining({
          'content-type': 'application/json',
          'stripe-signature': expect.any(String) as string,
        }),
      );
      expect(init?.body).toEqual(expect.stringContaining('"type":"checkout.session.expired"'));
      expect(init?.body).toEqual(expect.stringContaining('"id":"cs_test_browser_created"'));

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
      });
    });

    await expect(
      simulateStripeWebhook({
        checkoutSessionId: 'cs_test_browser_created',
        endpointUrl: 'http://127.0.0.1:8787/api/stripe/webhooks',
        fetcher,
        paymentStatus: 'unpaid',
        status: 'expired',
        type: 'checkout.session.expired',
        webhookSecret,
      }),
    ).resolves.toEqual({
      body: '{"received":true}',
      status: 200,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/api/stripe/webhooks',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('reads the checkout session id from the webhook-specific env before the legacy local env', () => {
    expect(
      readWebhookCheckoutSessionId({
        LOCAL_CHECKOUT_SESSION_ID: 'cs_local_legacy',
        STRIPE_WEBHOOK_CHECKOUT_SESSION_ID: ' cs_test_browser_created ',
      }),
    ).toBe('cs_test_browser_created');
  });

  it('falls back to the legacy local checkout session env for older handoff docs', () => {
    expect(
      readWebhookCheckoutSessionId({
        LOCAL_CHECKOUT_SESSION_ID: ' cs_local_legacy ',
      }),
    ).toBe('cs_local_legacy');
  });
});
