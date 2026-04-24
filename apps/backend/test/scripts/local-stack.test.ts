import { describe, expect, it } from 'vitest';

import { buildStackPlan, readRequiredEnvironmentIssues } from '../../../../scripts/start-local-stack';

describe('local stack launcher plan', () => {
    it('builds the real Stripe test stack with D1 prep and split-port frontend env', () => {
        const plan = buildStackPlan('stripe-test');

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

        expect(plan.ports).toEqual([8787, 4321]);
        expect(plan.prepare.map((command) => command.args.join(' '))).toEqual([
            '--filter @blackbox/backend d1:prepare:local',
            '--filter @blackbox/backend d1:seed:stripe-mock:local',
        ]);
        expect(plan.longRunning).toEqual([
            expect.objectContaining({
                args: ['dev:backend:mock'],
                name: 'Worker',
            }),
            expect.objectContaining({
                args: ['site:dev'],
                env: expect.objectContaining({
                    PUBLIC_BACKEND_BASE_URL: 'http://127.0.0.1:8787',
                    PUBLIC_CHECKOUT_CLIENT_MODE: 'mock',
                }),
                name: 'Static site',
            }),
        ]);
    });

    it('requires a publishable key only for the real Stripe test stack', () => {
        expect(
            readRequiredEnvironmentIssues(
                'stripe-test',
                {
                    PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
                },
                new Set(['STRIPE_SECRET_KEY']),
            ),
        ).toContain('PUBLIC_STRIPE_PUBLISHABLE_KEY is required for dev:stack:stripe-test.');

        expect(readRequiredEnvironmentIssues('stripe-mock', {}, new Set(['STRIPE_SECRET_KEY']))).not.toContain(
            'PUBLIC_STRIPE_PUBLISHABLE_KEY is required for dev:stack:stripe-test.',
        );
    });

    it('requires a backend Stripe secret only for the real Stripe test stack', () => {
        expect(readRequiredEnvironmentIssues('stripe-test', { PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_key' }, new Set())).toContain(
            'apps/backend/.dev.vars must define STRIPE_SECRET_KEY for dev:stack:stripe-test.',
        );

        expect(readRequiredEnvironmentIssues('stripe-mock', {}, new Set())).toEqual([]);
    });
});
