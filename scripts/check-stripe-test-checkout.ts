import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export type StripeTestCheckoutPreflightInput = {
  devVarsText: string | null;
  env: NodeJS.ProcessEnv;
  gitignoreText: string | null;
  seedSqlText: string | null;
};

export type StripeTestCheckoutPreflightResult = {
  issues: string[];
};

const rootDir = process.cwd();
const devVarsRelativePath = 'apps/backend/.dev.vars';
const seedRelativePath = 'apps/backend/prisma/seeds/local-stripe-test-state.sql';
const seedExampleRelativePath = `${seedRelativePath}.example`;
const placeholderPriceId = 'price_replace_with_real_stripe_test_price';

export function checkStripeTestCheckoutPreflight(
  input: StripeTestCheckoutPreflightInput,
): StripeTestCheckoutPreflightResult {
  const issues: string[] = [];
  const publishableKey = input.env.PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';
  const stripeSecretKey = input.devVarsText ? readDotEnvValue(input.devVarsText, 'STRIPE_SECRET_KEY') : null;
  const seedSqlText = input.seedSqlText?.trim() ?? '';

  if (!isRealStripeTestPublishableKey(publishableKey)) {
    issues.push('PUBLIC_STRIPE_PUBLISHABLE_KEY must be set to a real Stripe test publishable key (pk_test_...).');
  }

  if (!input.devVarsText) {
    issues.push(`${devVarsRelativePath} must exist for dev:stack:stripe-test.`);
  } else if (!isRealStripeTestSecretKey(stripeSecretKey ?? '')) {
    issues.push(
      `${devVarsRelativePath} must define STRIPE_SECRET_KEY with a real Stripe test secret key (sk_test_...).`,
    );
  }

  if (!input.seedSqlText) {
    issues.push(`Missing ${seedRelativePath}. Copy ${seedExampleRelativePath} and replace the placeholder Price ID.`);
  } else {
    if (seedSqlText.includes(placeholderPriceId)) {
      issues.push(
        `${seedRelativePath} still contains ${placeholderPriceId}. Replace it with a real Stripe test Price ID.`,
      );
    }

    if (!containsRealStripeTestPriceId(seedSqlText)) {
      issues.push(
        `${seedRelativePath} must contain at least one real Stripe test Price ID (price_...), not price_mock_*.`,
      );
    }
  }

  if (!input.gitignoreText?.includes(seedRelativePath)) {
    issues.push(`${seedRelativePath} must remain gitignored before real Stripe test Price IDs are added locally.`);
  }

  return { issues };
}

export function formatStripeTestCheckoutPreflightReport(result: StripeTestCheckoutPreflightResult): string {
  if (!result.issues.length) {
    return 'Stripe test checkout preflight OK.';
  }

  return [
    `Stripe test checkout preflight failed: ${result.issues.length} issue(s).`,
    ...result.issues.map((issue) => `- ${issue}`),
    '',
    'Required setup:',
    '1. Copy apps/backend/.dev.vars.example to apps/backend/.dev.vars.',
    '2. Set STRIPE_SECRET_KEY in apps/backend/.dev.vars to a real sk_test_ value.',
    '3. Set PUBLIC_STRIPE_PUBLISHABLE_KEY in this shell to the matching pk_test_ value.',
    `4. Copy ${seedExampleRelativePath} to ${seedRelativePath} and add a real Stripe test Price ID.`,
  ].join('\n');
}

function readDotEnvValue(text: string, key: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const parsedKey = trimmed.slice(0, separatorIndex).trim();

    if (parsedKey !== key) {
      continue;
    }

    return trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }

  return null;
}

function isRealStripeTestPublishableKey(value: string): boolean {
  return value.startsWith('pk_test_') && value !== 'pk_test_mock';
}

function isRealStripeTestSecretKey(value: string): boolean {
  return value.startsWith('sk_test_') && value !== 'sk_test_mock';
}

function containsRealStripeTestPriceId(value: string): boolean {
  const priceIds = value.match(/(^|[^A-Za-z0-9_])(price_[A-Za-z0-9_]+)/g) ?? [];

  return priceIds.some((match) => {
    const priceId = match.trim().replace(/^[^A-Za-z0-9_]/, '');

    return priceId !== placeholderPriceId && !priceId.startsWith('price_mock_');
  });
}

function readOptionalFile(relativePath: string): string | null {
  const absolutePath = path.join(rootDir, ...relativePath.split('/'));

  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath, 'utf8');
}

function main() {
  const result = checkStripeTestCheckoutPreflight({
    devVarsText: readOptionalFile(devVarsRelativePath),
    env: process.env,
    gitignoreText: readOptionalFile('.gitignore'),
    seedSqlText: readOptionalFile(seedRelativePath),
  });

  const report = formatStripeTestCheckoutPreflightReport(result);

  if (result.issues.length) {
    console.error(report);
    process.exit(1);
  }

  console.log(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
