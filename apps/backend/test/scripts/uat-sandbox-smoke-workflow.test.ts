import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(__dirname, '..', '..', '..', '..');

function readWorkflow(name: string): string {
  return readFileSync(path.join(rootDir, '.github', 'workflows', name), 'utf8');
}

describe('UAT provider smoke workflow', () => {
  it('runs after the UAT Pages deploy with sandbox-only smoke settings', () => {
    const workflow = readWorkflow('uat-smoke.yml');

    expect(workflow).toContain('name: UAT provider smoke');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('workflow_run');
    expect(workflow).toContain('Deploy UAT and PRD static sites');
    expect(workflow).toContain("branches: ['main']");
    expect(workflow).toContain('types: [completed]');
    expect(workflow).toContain('permissions:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('concurrency:');
    expect(workflow).toContain("group: 'uat-smoke-${{ github.event.workflow_run.head_branch }}'");
    expect(workflow).toContain('cancel-in-progress: true');
    expect(workflow).toContain('environment: catalog-promotion-uat');
    expect(workflow).toContain(
      "github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'",
    );
    expect(workflow).toContain('github.event.workflow_run.head_sha || github.sha');
    expect(workflow).toContain('pnpm stripe:webhooks:verify --env uat');
    expect(workflow).toContain('pnpm stripe:payment-methods:verify');
    expect(workflow).toContain('pnpm deploy:backend:uat');
    expect(workflow).toContain('pnpm smoke:stripe-uat -- \\');
    expect(workflow).toContain('--site-url "${UAT_SITE_URL}"');
    expect(workflow).toContain('--scenario happy_path_paid');
    expect(workflow).toContain('--scenario pay_what_you_want_paid');
    expect(workflow).toContain('--screenshots on-failure');
    expect(workflow).toContain('.codex-artifacts/smoke/uat/stripe-sandbox/**');
    expect(workflow).toContain('uat-smoke-${{ github.run_id }}-${{ github.run_attempt }}');
    expect(workflow).toContain('actions/upload-artifact@v5.0.0');
    expect(workflow.indexOf('pnpm stripe:webhooks:verify --env uat')).toBeLessThan(
      workflow.indexOf('pnpm deploy:backend:uat'),
    );
    expect(workflow.indexOf('pnpm deploy:backend:uat')).toBeLessThan(workflow.indexOf('pnpm smoke:stripe-uat -- \\'));
  });

  it('keeps manual UAT Worker deploys inside the UAT credential environment', () => {
    const workflow = readWorkflow('cloudflare-uat.yml');

    expect(workflow).toContain('name: Deploy Worker UAT');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('environment: catalog-promotion-uat');
    expect(workflow).toContain(
      'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: ${{ vars.STRIPE_PAYMENT_METHOD_CONFIGURATION_ID }}',
    );
    expect(workflow).toContain('STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}');
    expect(workflow).toContain('pnpm deploy:backend:uat');
  });
});
