import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildStackPlan, readRequiredEnvironmentIssues } from '../../../../scripts/start-local-stack';

describe('local stack launcher plan', () => {
  it('pins local Worker ports and keeps mock scripts isolated from real local Stripe secrets', () => {
    const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      scripts: Record<string, string>;
    };

    for (const scriptName of ['dev', 'dev:mock', 'dev:mock-api', 'dev:uat']) {
      expect(packageJson.scripts[scriptName]).toContain('--port 8787');
    }

    for (const scriptName of ['dev:mock', 'dev:mock-api']) {
      expect(packageJson.scripts[scriptName]).toContain('--var STRIPE_SECRET_KEY:sk_test_mock');
      expect(packageJson.scripts[scriptName]).toContain(
        '--var STRIPE_PAYMENT_METHOD_CONFIGURATION_ID:pmc_mock_blackbox_checkout',
      );
      expect(packageJson.scripts[scriptName]).toContain('--var STRIPE_WEBHOOK_SECRET:whsec_local_mock');
    }
  });

  it('builds the real Stripe test stack with D1 prep and split-port frontend env', () => {
    const plan = buildStackPlan('stripe-test');

    expect(plan.ports).toEqual([8787, 4321]);
    expect(plan.prepare.map((command) => command.args.join(' '))).toEqual([
      '--filter @blackbox/backend d1:prepare:local',
      '--filter @blackbox/backend d1:seed:stripe-test:local',
    ]);
    expect(plan.longRunning).toEqual([
      expect.objectContaining({
        args: ['dev:backend'],
        command: 'pnpm',
        name: 'Worker',
        waitForPort: 8787,
      }),
      expect.objectContaining({
        args: ['site:dev'],
        command: 'pnpm',
        env: expect.objectContaining({
          SVELTIA_BACKEND_MODE: 'local',
          PUBLIC_BACKEND_BASE_URL: 'http://127.0.0.1:8787',
          PUBLIC_CHECKOUT_CLIENT_MODE: 'stripe',
        }),
        name: 'Static site',
        waitForPort: 4321,
      }),
    ]);
  });

  it('builds the stripe-mock stack with D1 mock seed, backend mock env, and frontend mock mode', () => {
    const plan = buildStackPlan('stripe-mock');

    expect(plan.ports).toEqual([12110, 12111, 12112, 8787, 4321]);
    expect(plan.prepare.map((command) => command.args.join(' '))).toEqual([
      '--filter @blackbox/backend d1:prepare:local',
      '--filter @blackbox/backend d1:seed:stripe-mock:local',
    ]);
    expect(plan.longRunning).toEqual([
      expect.objectContaining({
        args: ['stripe-mock:local'],
        name: 'Stripe mock API',
        waitForPort: 12110,
      }),
      expect.objectContaining({
        args: ['dev:backend:mock'],
        name: 'Worker',
      }),
      expect.objectContaining({
        args: ['site:dev'],
        env: expect.objectContaining({
          SVELTIA_BACKEND_MODE: 'local',
          PUBLIC_BACKEND_BASE_URL: 'http://127.0.0.1:8787',
          PUBLIC_CHECKOUT_CLIENT_MODE: 'mock',
        }),
        name: 'Static site',
      }),
    ]);
  });

  it('builds the stripe-mock API stack with official stripe-mock as the Stripe API target', () => {
    const plan = buildStackPlan('stripe-mock-api');

    expect(plan.ports).toEqual([12110, 12111, 12112, 8787, 4321]);
    expect(plan.prepare.map((command) => command.args.join(' '))).toEqual([
      '--filter @blackbox/backend d1:prepare:local',
      '--filter @blackbox/backend d1:seed:stripe-mock:local',
    ]);
    expect(plan.longRunning).toEqual([
      expect.objectContaining({
        args: ['stripe-mock:local'],
        name: 'Stripe mock API',
        waitForPort: 12110,
      }),
      expect.objectContaining({
        args: ['dev:backend:mock-api'],
        name: 'Worker',
      }),
      expect.objectContaining({
        args: ['site:dev'],
        env: expect.objectContaining({
          SVELTIA_BACKEND_MODE: 'local',
          PUBLIC_BACKEND_BASE_URL: 'http://127.0.0.1:8787',
          PUBLIC_CHECKOUT_CLIENT_MODE: 'mock',
        }),
        name: 'Static site',
      }),
    ]);
  });

  it('builds the uat-connected stack without local Worker, D1, or UAT secrets', () => {
    const plan = buildStackPlan('uat-connected');

    expect(plan.ports).toEqual([4321]);
    expect(plan.prepare).toEqual([]);
    expect(plan.longRunning).toEqual([
      expect.objectContaining({
        args: ['site:dev'],
        command: 'pnpm',
        env: expect.objectContaining({
          PUBLIC_BACKEND_BASE_URL: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
          PUBLIC_CHECKOUT_CLIENT_MODE: 'stripe',
        }),
        name: 'Static site',
        waitForPort: 4321,
      }),
    ]);
  });

  it('does not require a publishable key for hosted Checkout redirect stacks', () => {
    expect(
      readRequiredEnvironmentIssues(
        'stripe-test',
        {},
        new Set(['STRIPE_SECRET_KEY', 'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID']),
      ),
    ).toEqual([]);
    expect(readRequiredEnvironmentIssues('stripe-mock', {}, new Set(['STRIPE_SECRET_KEY']))).toEqual([]);
    expect(readRequiredEnvironmentIssues('stripe-mock-api', {}, new Set(['STRIPE_SECRET_KEY']))).toEqual([]);
    expect(readRequiredEnvironmentIssues('uat-connected', {}, new Set())).toEqual([]);
  });

  it('requires a backend Stripe secret only for the real Stripe test stack', () => {
    expect(readRequiredEnvironmentIssues('stripe-test', {}, new Set())).toContain(
      'apps/backend/.dev.vars must define STRIPE_SECRET_KEY for dev:stack:stripe-test.',
    );
    expect(readRequiredEnvironmentIssues('stripe-test', {}, new Set())).toContain(
      'apps/backend/.dev.vars must define STRIPE_PAYMENT_METHOD_CONFIGURATION_ID for dev:stack:stripe-test.',
    );

    expect(readRequiredEnvironmentIssues('stripe-mock', {}, new Set())).toEqual([]);
    expect(readRequiredEnvironmentIssues('stripe-mock-api', {}, new Set())).toEqual([]);
    expect(readRequiredEnvironmentIssues('uat-connected', {}, new Set())).toEqual([]);
  });
});
