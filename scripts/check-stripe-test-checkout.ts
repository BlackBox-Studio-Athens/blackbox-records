import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { createEnv, type StandardSchemaV1 } from '@t3-oss/env-core';
import { z } from 'zod';

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
  const seedSqlText = input.seedSqlText?.trim() ?? '';

  issues.push(...readStripeTestCheckoutEnvIssues(input.devVarsText));

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
    '3. Set STRIPE_PAYMENT_METHOD_CONFIGURATION_ID in apps/backend/.dev.vars to the test-mode Payment Method Configuration ID.',
    `4. Copy ${seedExampleRelativePath} to ${seedRelativePath} and add a real Stripe test Price ID.`,
  ].join('\n');
}

class StripeTestCheckoutEnvValidationError extends Error {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    super('Stripe test checkout env validation failed.');
    this.name = 'StripeTestCheckoutEnvValidationError';
    this.issues = issues;
  }
}

function readStripeTestCheckoutEnvIssues(devVarsText: string | null): string[] {
  if (!devVarsText) {
    return [`${devVarsRelativePath} must exist for dev:stack:stripe-test.`];
  }

  try {
    createEnv({
      emptyStringAsUndefined: true,
      onValidationError: (issues) => {
        throw new StripeTestCheckoutEnvValidationError(issues);
      },
      runtimeEnv: readDotEnvRuntimeEnv(devVarsText),
      server: {
        STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: z.string().trim().startsWith('pmc_'),
        STRIPE_SECRET_KEY: z
          .string()
          .trim()
          .startsWith('sk_test_')
          .refine((value) => value !== 'sk_test_mock'),
      },
    });

    return [];
  } catch (error) {
    if (error instanceof StripeTestCheckoutEnvValidationError) {
      return formatStripeTestCheckoutEnvIssues(error.issues);
    }

    throw error;
  }
}

function formatStripeTestCheckoutEnvIssues(issues: readonly StandardSchemaV1.Issue[]): string[] {
  const invalidVariables = new Set(issues.flatMap((issue) => issue.path?.map((pathItem) => String(pathItem)) ?? []));
  const formattedIssues: string[] = [];

  if (invalidVariables.has('STRIPE_SECRET_KEY')) {
    formattedIssues.push(
      `${devVarsRelativePath} must define STRIPE_SECRET_KEY with a real Stripe test secret key (sk_test_...).`,
    );
  }

  if (invalidVariables.has('STRIPE_PAYMENT_METHOD_CONFIGURATION_ID')) {
    formattedIssues.push(
      `${devVarsRelativePath} must define STRIPE_PAYMENT_METHOD_CONFIGURATION_ID with a pmc_... value.`,
    );
  }

  return formattedIssues;
}

function readDotEnvRuntimeEnv(text: string | null): Record<string, string | undefined> {
  const runtimeEnv: Record<string, string | undefined> = {};

  if (!text) {
    return runtimeEnv;
  }

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
    runtimeEnv[parsedKey] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }

  return runtimeEnv;
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
