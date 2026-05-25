import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { STRIPE_CATALOG_WEBHOOK_EVENT_TYPES } from '../../src/infrastructure/stripe';
import {
  analyzeStripeWebhookEndpoints,
  classifyWorkerSecretPresence,
  findMissingCatalogEvents,
  formatStripeWebhookEndpointVerificationReport,
  parseStripeWebhookVerifyArgs,
  parseWranglerSecretNames,
  PRODUCTION_WEBHOOK_URL,
  redactSensitiveValues,
  SANDBOX_WEBHOOK_URL,
  verifyStripeWebhookEndpointConfiguration,
  type StripeWebhookEndpoint,
  type StripeWebhookEndpointListClient,
} from '../../../../scripts/verify-stripe-webhook-endpoints';

const requiredCatalogEvents = [...STRIPE_CATALOG_WEBHOOK_EVENT_TYPES];

function endpoint(overrides: Partial<StripeWebhookEndpoint> = {}): StripeWebhookEndpoint {
  return {
    application: null,
    enabled_events: requiredCatalogEvents,
    id: 'we_1234567890abcdef',
    livemode: false,
    status: 'enabled',
    url: SANDBOX_WEBHOOK_URL,
    ...overrides,
  };
}

function fakeClient(pages: StripeWebhookEndpoint[][]): StripeWebhookEndpointListClient {
  const calls: Array<{ limit: number; startingAfter?: string }> = [];

  return {
    async list(params) {
      calls.push(params);
      const page = pages[calls.length - 1] ?? [];

      return {
        data: page,
        has_more: calls.length < pages.length,
      };
    },
  };
}

describe('Stripe webhook endpoint verifier', () => {
  it('requires explicit target environment argument parsing', () => {
    expect(parseStripeWebhookVerifyArgs(['--env', 'sandbox'])).toEqual({ environment: 'sandbox' });
    expect(parseStripeWebhookVerifyArgs(['--env', 'production'])).toEqual({ environment: 'production' });
    expect(parseStripeWebhookVerifyArgs(['--', '--env=sandbox'])).toEqual({ environment: 'sandbox' });
    expect(() => parseStripeWebhookVerifyArgs([])).toThrow(
      'Usage: pnpm stripe:webhooks:verify --env sandbox|production',
    );
    expect(() => parseStripeWebhookVerifyArgs(['--env', 'local'])).toThrow(
      'Stripe webhook endpoint verification requires --env sandbox or --env production.',
    );
  });

  it('passes one enabled test-mode account endpoint and reports checkout extras as diagnostics', async () => {
    const result = await verifyStripeWebhookEndpointConfiguration({
      client: fakeClient([
        [
          endpoint({
            enabled_events: [...requiredCatalogEvents, 'checkout.session.completed'],
          }),
        ],
      ]),
      committedCron: { status: 'present' },
      deployedCron: { status: 'present' },
      workerSecret: { status: 'present' },
    });
    const report = formatStripeWebhookEndpointVerificationReport(result);

    expect(result.issues).toEqual([]);
    expect(result.endpointAnalysis.extraEvents).toEqual(['checkout.session.completed']);
    expect(result.signingSecretMatchProof).toBe('not_proven_by_api');
    expect(report).toContain('Stripe sandbox webhook endpoint verification OK.');
    expect(report).toContain('we_...cdef');
    expect(report).toContain('Signing-secret match proof: not_proven_by_api');
    expect(report).not.toContain('we_1234567890abcdef');
  });

  it('passes one enabled live-mode production account endpoint without requiring sandbox cron proof', async () => {
    const result = await verifyStripeWebhookEndpointConfiguration({
      client: fakeClient([
        [
          endpoint({
            livemode: true,
            url: PRODUCTION_WEBHOOK_URL,
          }),
        ],
      ]),
      committedCron: { status: 'unverified', detail: 'not configured' },
      deployedCron: { status: 'unverified', detail: 'not configured' },
      environment: 'production',
      workerSecret: { status: 'present' },
    });
    const report = formatStripeWebhookEndpointVerificationReport(result);

    expect(result.issues).toEqual([]);
    expect(report).toContain('Stripe production webhook endpoint verification OK.');
    expect(report).toContain(`Endpoint URL: ${PRODUCTION_WEBHOOK_URL}`);
  });

  it('follows Stripe pagination while listing endpoints', async () => {
    const result = await verifyStripeWebhookEndpointConfiguration({
      client: fakeClient([[endpoint({ id: 'we_page_one' })], [endpoint({ id: 'we_page_two' })]]),
      committedCron: { status: 'present' },
      deployedCron: { status: 'present' },
      workerSecret: { status: 'present' },
    });

    expect(result.endpointAnalysis.matchingEndpointCount).toBe(2);
    expect(result.issues).toContain(
      `Multiple enabled account webhook endpoints target ${SANDBOX_WEBHOOK_URL}: we_..._one, we_..._two.`,
    );
  });

  it('fails missing, disabled, duplicate, live-mode, and Connect-only endpoint states', () => {
    expect(analyzeStripeWebhookEndpoints([]).issues).toContain(
      `No Stripe account webhook endpoint targets ${SANDBOX_WEBHOOK_URL}.`,
    );
    expect(analyzeStripeWebhookEndpoints([endpoint({ status: 'disabled' })]).issues).toContain(
      'Matching webhook endpoint is disabled: we_...cdef.',
    );
    expect(analyzeStripeWebhookEndpoints([endpoint(), endpoint({ id: 'we_abcdef1234567890' })]).issues).toContain(
      `Multiple enabled account webhook endpoints target ${SANDBOX_WEBHOOK_URL}: we_...cdef, we_...7890.`,
    );
    expect(analyzeStripeWebhookEndpoints([endpoint({ livemode: true })]).issues).toContain(
      'Webhook endpoint we_...cdef is not in Stripe test mode.',
    );
    expect(
      analyzeStripeWebhookEndpoints(
        [
          endpoint({
            livemode: false,
            url: PRODUCTION_WEBHOOK_URL,
          }),
        ],
        'production',
      ).issues,
    ).toContain('Webhook endpoint we_...cdef is not in Stripe live mode.');
    expect(analyzeStripeWebhookEndpoints([endpoint({ application: 'ca_1234567890abcdef' })]).issues).toContain(
      `Matching webhook endpoint(s) for ${SANDBOX_WEBHOOK_URL} are Connect-only or application-owned; create an account endpoint.`,
    );
  });

  it('validates required catalog event coverage including wildcard coverage', () => {
    expect(findMissingCatalogEvents(['*'])).toEqual([]);

    const missingEventAnalysis = analyzeStripeWebhookEndpoints([
      endpoint({
        enabled_events: requiredCatalogEvents.filter((eventType) => eventType !== 'price.deleted'),
      }),
    ]);

    expect(missingEventAnalysis.missingEvents).toEqual(['price.deleted']);
    expect(missingEventAnalysis.issues).toContain(
      'Webhook endpoint we_...cdef is missing required catalog event(s): price.deleted.',
    );

    const wildcardAnalysis = analyzeStripeWebhookEndpoints([endpoint({ enabled_events: ['*'] })]);

    expect(wildcardAnalysis.missingEvents).toEqual([]);
    expect(wildcardAnalysis.warnings).toContain(
      "Webhook endpoint subscribes to '*'. Required catalog events are covered, but event volume should be reviewed.",
    );
  });

  it('classifies Worker secret presence without exposing values', () => {
    expect(classifyWorkerSecretPresence(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'])).toEqual({ status: 'present' });
    expect(classifyWorkerSecretPresence(['STRIPE_SECRET_KEY'])).toEqual({ status: 'missing' });
    expect(classifyWorkerSecretPresence(null, 'wrangler failed')).toEqual({
      detail: 'wrangler failed',
      status: 'unverified',
    });
    expect(
      parseWranglerSecretNames(
        'Wrangler output\n[{"name":"STRIPE_SECRET_KEY","type":"secret_text"},{"name":"STRIPE_WEBHOOK_SECRET","type":"secret_text"}]',
      ),
    ).toEqual(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);
  });

  it('keeps missing or unverified Worker secret presence out of accepted readiness', async () => {
    const missingResult = await verifyStripeWebhookEndpointConfiguration({
      client: fakeClient([[endpoint()]]),
      committedCron: { status: 'present' },
      deployedCron: { status: 'present' },
      workerSecret: { status: 'missing' },
    });
    const unverifiedResult = await verifyStripeWebhookEndpointConfiguration({
      client: fakeClient([[endpoint()]]),
      committedCron: { status: 'present' },
      deployedCron: { status: 'unverified', detail: 'no token' },
      workerSecret: { status: 'unverified', detail: 'wrangler failed with whsec_should_not_print' },
    });

    expect(missingResult.issues).toContain(
      'Sandbox Worker secret STRIPE_WEBHOOK_SECRET is missing. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox',
    );
    expect(unverifiedResult.issues).toContain(
      'Sandbox Worker secret STRIPE_WEBHOOK_SECRET presence is unverified. (wrangler failed with [redacted_stripe_webhook_secret])',
    );
    expect(formatStripeWebhookEndpointVerificationReport(unverifiedResult)).toContain(
      'Deployed cron presence is unverified. (no token)',
    );
  });

  it('redacts Stripe secrets and private object identifiers in diagnostics', () => {
    const redacted = redactSensitiveValues(
      [
        'sk_test_should_not_print',
        'whsec_should_not_print',
        'we_1234567890abcdef',
        'price_1234567890abcdef',
        'prod_1234567890abcdef',
      ].join('\n'),
    );

    expect(redacted).toContain('sk_test_[redacted]');
    expect(redacted).toContain('[redacted_stripe_webhook_secret]');
    expect(redacted).toContain('we_...cdef');
    expect(redacted).toContain('price_...cdef');
    expect(redacted).toContain('prod_...cdef');
    expect(redacted).not.toContain('should_not_print');
    expect(redacted).not.toContain('1234567890abcdef');
  });

  it('prevents the sandbox listener from syncing transient listener secrets into the Worker', () => {
    const scriptPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../scripts/start-stripe-sandbox-listener.ts',
    );
    const scriptText = readFileSync(scriptPath, 'utf8');

    expect(scriptText).not.toContain('secret put');
    expect(scriptText).not.toContain('syncSandboxWebhookSecret');
    expect(scriptText).toContain('It was not synced to the sandbox Worker');
  });
});
