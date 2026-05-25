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
        "CHECKOUT_RETURN_ORIGINS": "https://blackbox-records-web.pages.dev"
      }
    }
  }
}
`;

describe('runtime config verification', () => {
  it('parses the target environment argument', () => {
    expect(parseRuntimeConfigVerifyArgs(['--env', 'production'])).toEqual({ environment: 'production' });
  });

  it('classifies required production config categories without printing values', () => {
    const result = verifyRuntimeConfig({
      env: {
        STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_live_secret_value',
      },
      environment: 'production',
      secretNames: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
      wranglerConfigText,
    });

    expect(result.issues).toEqual([]);
    expect(result.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID', status: 'present' }),
        expect.objectContaining({ name: 'STRIPE_SECRET_KEY', status: 'present' }),
        expect.objectContaining({ name: 'STRIPE_WEBHOOK_SECRET', status: 'present' }),
        expect.objectContaining({ name: 'CHECKOUT_RETURN_ORIGINS', status: 'present' }),
        expect.objectContaining({ name: 'COMMERCE_DB', status: 'present' }),
        expect.objectContaining({ name: 'FLAGS', status: 'not_applicable' }),
        expect.objectContaining({ name: 'PRODUCTION_CATALOG_CRON', status: 'not_applicable' }),
      ]),
    );
    expect(formatRuntimeConfigVerificationReport(result)).not.toContain('pmc_live_secret_value');
  });

  it('reports missing config categories with redacted output', () => {
    const result = verifyRuntimeConfig({
      env: {},
      environment: 'production',
      secretNames: ['STRIPE_SECRET_KEY'],
      wranglerConfigText: '{"env":{"production":{"vars":{"APP_ENV":"production"}}}}',
    });
    const report = formatRuntimeConfigVerificationReport(result);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID is missing.',
        'STRIPE_WEBHOOK_SECRET is missing.',
        'CHECKOUT_RETURN_ORIGINS is missing.',
        'COMMERCE_DB is missing.',
      ]),
    );
    expect(report).not.toContain('sk_live_');
    expect(report).not.toContain('whsec_');
  });
});
