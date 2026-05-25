import { describe, expect, it } from 'vitest';

import {
  checkStripeTestCheckoutPreflight,
  formatStripeTestCheckoutPreflightReport,
} from '../../../../scripts/check-stripe-test-checkout';

const validInput = {
  devVarsText: 'STRIPE_SECRET_KEY=sk_test_real_secret\nSTRIPE_PAYMENT_METHOD_CONFIGURATION_ID=pmc_test_123\n',
  env: {},
  gitignoreText: 'apps/backend/prisma/seeds/local-stripe-test-state.sql\n',
  seedSqlText:
    "INSERT INTO VariantStripeMapping VALUES ('variant', 'variant_disintegration-black-vinyl-lp_standard', 'price_real');",
};

describe('Stripe test checkout preflight', () => {
  it('passes when local-only real Stripe test setup is present', () => {
    const result = checkStripeTestCheckoutPreflight(validInput);

    expect(result.issues).toEqual([]);
    expect(formatStripeTestCheckoutPreflightReport(result)).toBe('Stripe test checkout preflight OK.');
  });

  it('requires a real Stripe test secret key in backend dev vars', () => {
    expect(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        devVarsText: null,
      }).issues,
    ).toContain('apps/backend/.dev.vars must exist for dev:stack:stripe-test.');

    expect(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        devVarsText: 'STRIPE_SECRET_KEY=sk_test_mock\n',
      }).issues,
    ).toContain(
      'apps/backend/.dev.vars must define STRIPE_SECRET_KEY with a real Stripe test secret key (sk_test_...).',
    );
  });

  it('requires a Stripe Payment Method Configuration ID in backend dev vars', () => {
    expect(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        devVarsText: 'STRIPE_SECRET_KEY=sk_test_real_secret\n',
      }).issues,
    ).toContain('apps/backend/.dev.vars must define STRIPE_PAYMENT_METHOD_CONFIGURATION_ID with a pmc_... value.');
  });

  it('requires an ignored local Stripe test seed with a non-placeholder real price id', () => {
    expect(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        seedSqlText: null,
      }).issues,
    ).toContain(
      'Missing apps/backend/prisma/seeds/local-stripe-test-state.sql. Copy apps/backend/prisma/seeds/local-stripe-test-state.sql.example and replace the placeholder Price ID.',
    );

    const placeholderResult = checkStripeTestCheckoutPreflight({
      ...validInput,
      seedSqlText: 'price_replace_with_real_stripe_test_price',
    });

    expect(placeholderResult.issues).toContain(
      'apps/backend/prisma/seeds/local-stripe-test-state.sql still contains price_replace_with_real_stripe_test_price. Replace it with a real Stripe test Price ID.',
    );
    expect(placeholderResult.issues).toContain(
      'apps/backend/prisma/seeds/local-stripe-test-state.sql must contain at least one real Stripe test Price ID (price_...), not price_mock_*.',
    );

    expect(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        seedSqlText: 'price_mock_disintegration_black_vinyl_lp',
      }).issues,
    ).toContain(
      'apps/backend/prisma/seeds/local-stripe-test-state.sql must contain at least one real Stripe test Price ID (price_...), not price_mock_*.',
    );
  });

  it('requires the local Stripe test seed file to remain ignored', () => {
    expect(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        gitignoreText: '',
      }).issues,
    ).toContain(
      'apps/backend/prisma/seeds/local-stripe-test-state.sql must remain gitignored before real Stripe test Price IDs are added locally.',
    );
  });

  it('formats setup instructions without printing secret values', () => {
    const report = formatStripeTestCheckoutPreflightReport(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        devVarsText: 'STRIPE_SECRET_KEY=\n',
        env: {},
        seedSqlText: null,
      }),
    );

    expect(report).toContain('Advanced Stripe test checkout diagnostic preflight failed:');
    expect(report).toContain('Normal Local modes are exactly:');
    expect(report).toContain('- mock: pnpm dev:stack:stripe-mock');
    expect(report).toContain('- uat-connected: pnpm dev:stack:uat-connected');
    expect(report).toContain('Set STRIPE_SECRET_KEY in apps/backend/.dev.vars to a real sk_test_ value.');
    expect(report).toContain(
      'Set STRIPE_PAYMENT_METHOD_CONFIGURATION_ID in apps/backend/.dev.vars to the test-mode Payment Method Configuration ID.',
    );
    expect(report).not.toContain('sk_test_real_secret');
  });

  it('reports malformed env values without printing submitted secrets', () => {
    const report = formatStripeTestCheckoutPreflightReport(
      checkStripeTestCheckoutPreflight({
        ...validInput,
        devVarsText:
          'STRIPE_SECRET_KEY=sk_live_real_secret\nSTRIPE_PAYMENT_METHOD_CONFIGURATION_ID=payment_method_config_secret\n',
      }),
    );

    expect(report).toContain(
      'apps/backend/.dev.vars must define STRIPE_SECRET_KEY with a real Stripe test secret key (sk_test_...).',
    );
    expect(report).toContain(
      'apps/backend/.dev.vars must define STRIPE_PAYMENT_METHOD_CONFIGURATION_ID with a pmc_... value.',
    );
    expect(report).not.toContain('sk_live_real_secret');
    expect(report).not.toContain('payment_method_config_secret');
  });
});
