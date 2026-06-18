import { describe, expect, it } from 'vitest';

import {
  formatRuntimeConfigVerificationReport,
  parseRuntimeConfigVerifyArgs,
  verifyRuntimeConfig,
} from '../../../../scripts/verify-runtime-config';

const wranglerConfigText = `
{
  "env": {
    "production": {
      "name": "blackbox-records-backend",
      "d1_databases": [{ "binding": "COMMERCE_DB" }],
      "vars": {
        "APP_ENV": "production",
        "CHECKOUT_RETURN_ORIGINS": "https://blackbox-records-web.pages.dev",
        "RESEND_FROM_EMAIL": "orders@blackboxrecordsathens.com",
        "RESEND_OPS_TO_EMAIL": "blackboxrecordsathens@gmail.com",
        "RESEND_REPLY_TO_EMAIL": "support@blackboxrecordsathens.com"
      }
    }
  }
}
`;

const requiredResendSecrets = ['RESEND_API_KEY', 'RESEND_NEWSLETTER_TOPIC_ID'];

describe('runtime config verification', () => {
  it('parses the target environment argument', () => {
    expect(parseRuntimeConfigVerifyArgs(['--env', 'production'])).toEqual({
      environment: 'production',
      productEnvironment: 'PRD',
      requireLiveSecrets: false,
    });
    expect(parseRuntimeConfigVerifyArgs(['--env', 'prd'])).toEqual({
      environment: 'production',
      productEnvironment: 'PRD',
      requireLiveSecrets: false,
    });
    expect(parseRuntimeConfigVerifyArgs(['--env', 'uat'])).toEqual({
      environment: 'sandbox',
      productEnvironment: 'UAT',
      requireLiveSecrets: false,
    });
    expect(parseRuntimeConfigVerifyArgs(['--env', 'prd', '--require-live-secrets'])).toEqual({
      environment: 'production',
      productEnvironment: 'PRD',
      requireLiveSecrets: true,
    });
  });

  it('classifies required production config categories without printing values', () => {
    const result = verifyRuntimeConfig({
      environment: 'production',
      requireLiveSecrets: true,
      secretNames: [
        'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        ...requiredResendSecrets,
      ],
      wranglerConfigText,
    });

    expect(result.issues).toEqual([]);
    expect(result.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID', status: 'present' }),
        expect.objectContaining({ name: 'STRIPE_SECRET_KEY', status: 'present' }),
        expect.objectContaining({ name: 'STRIPE_WEBHOOK_SECRET', status: 'present' }),
        expect.objectContaining({ name: 'CHECKOUT_RETURN_ORIGINS', status: 'present' }),
        expect.objectContaining({ name: 'WORKER_ORIGIN_SCOPE', status: 'present' }),
        expect.objectContaining({ name: 'COMMERCE_DB', status: 'present' }),
        expect.objectContaining({ name: 'RESEND_API_KEY', status: 'present' }),
        expect.objectContaining({ name: 'RESEND_FROM_EMAIL', status: 'present' }),
        expect.objectContaining({ name: 'RESEND_REPLY_TO_EMAIL', status: 'present' }),
        expect.objectContaining({ name: 'RESEND_OPS_TO_EMAIL', status: 'present' }),
        expect.objectContaining({ name: 'RESEND_NEWSLETTER_TOPIC_ID', status: 'present' }),
        expect.objectContaining({ name: 'RESEND_NEWSLETTER_SEGMENT_ID', status: 'not_applicable' }),
        expect.objectContaining({ name: 'RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL', status: 'not_applicable' }),
        expect.objectContaining({ name: 'FLAGS', status: 'not_applicable' }),
        expect.objectContaining({ name: 'PRD_OPEN_GATE', status: 'not_applicable' }),
        expect.objectContaining({ name: 'PRODUCTION_CATALOG_CRON', status: 'not_applicable' }),
      ]),
    );
  });

  it('reports missing config categories with redacted output', () => {
    const result = verifyRuntimeConfig({
      environment: 'production',
      requireLiveSecrets: true,
      secretNames: ['STRIPE_SECRET_KEY'],
      wranglerConfigText: '{"env":{"production":{"vars":{"APP_ENV":"production"}}}}',
    });
    const report = formatRuntimeConfigVerificationReport(result);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID is missing.',
        'STRIPE_WEBHOOK_SECRET is missing.',
        'CHECKOUT_RETURN_ORIGINS is missing.',
        'WORKER_ORIGIN_SCOPE is missing (PRD Worker must not allow Local, UAT, or preview origins.).',
        'COMMERCE_DB is missing.',
        'RESEND_API_KEY is missing.',
        'RESEND_FROM_EMAIL is missing (Resend sender must stay on the verified orders@blackboxrecordsathens.com address.).',
        'RESEND_REPLY_TO_EMAIL is missing (Resend reply-to must route through support@blackboxrecordsathens.com.).',
        'RESEND_OPS_TO_EMAIL is missing (Ops notifications must route to the Gmail operations inbox.).',
        'RESEND_NEWSLETTER_TOPIC_ID is missing.',
      ]),
    );
    expect(report).not.toContain('sk_live_');
    expect(report).not.toContain('whsec_');
    expect(report).not.toContain('re_live_');
  });

  it('accepts payment method configuration from Worker vars without printing values', () => {
    const result = verifyRuntimeConfig({
      environment: 'production',
      requireLiveSecrets: true,
      secretNames: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', ...requiredResendSecrets],
      wranglerConfigText: wranglerConfigText.replace(
        '"CHECKOUT_RETURN_ORIGINS": "https://blackbox-records-web.pages.dev"',
        '"CHECKOUT_RETURN_ORIGINS": "https://blackbox-records-web.pages.dev", "STRIPE_PAYMENT_METHOD_CONFIGURATION_ID": "pmc_live_secret_value"',
      ),
    });

    expect(result.issues).toEqual([]);
    expect(formatRuntimeConfigVerificationReport(result)).not.toContain('pmc_live_secret_value');
  });

  it('allows disabled PRD readiness checks without live Stripe secrets', () => {
    const result = verifyRuntimeConfig({
      environment: 'production',
      secretNames: requiredResendSecrets,
      wranglerConfigText,
    });

    expect(result.issues).toEqual([]);
    expect(result.requireLiveSecrets).toBe(false);
    expect(result.categories).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'STRIPE_SECRET_KEY' })]),
    );
    expect(result.categories).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'RESEND_API_KEY', status: 'present' })]),
    );
  });

  it('requires UAT Resend sink routing and rejects the same override in PRD', () => {
    const sandboxConfig = `{
      "env": {
        "sandbox": {
          "d1_databases": [{ "binding": "COMMERCE_DB" }],
          "vars": {
            "APP_ENV": "sandbox",
            "CHECKOUT_RETURN_ORIGINS": "http://127.0.0.1:4321,https://blackbox-studio-athens.github.io/blackbox-records",
            "RESEND_FROM_EMAIL": "orders@blackboxrecordsathens.com",
            "RESEND_OPS_TO_EMAIL": "blackboxrecordsathens@gmail.com",
            "RESEND_REPLY_TO_EMAIL": "support@blackboxrecordsathens.com",
            "RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL": "blackboxrecordsathens+TESTING@gmail.com"
          }
        }
      }
    }`;
    const sandboxResult = verifyRuntimeConfig({
      environment: 'sandbox',
      secretNames: [
        'RESEND_API_KEY',
        'RESEND_NEWSLETTER_TOPIC_ID',
        'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
      ],
      wranglerConfigText: sandboxConfig,
    });
    const productionResult = verifyRuntimeConfig({
      environment: 'production',
      secretNames: requiredResendSecrets,
      wranglerConfigText: wranglerConfigText.replace(
        '"RESEND_REPLY_TO_EMAIL": "support@blackboxrecordsathens.com"',
        '"RESEND_REPLY_TO_EMAIL": "support@blackboxrecordsathens.com", "RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL": "blackboxrecordsathens+TESTING@gmail.com"',
      ),
    });

    expect(sandboxResult.issues).toEqual([]);
    expect(productionResult.issues).toContain(
      'RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL is missing (PRD must not honor the UAT sink recipient override.).',
    );
  });
});
