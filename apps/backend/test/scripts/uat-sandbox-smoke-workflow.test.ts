import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(__dirname, '..', '..', '..', '..');

function readWorkflow(name: string): string {
  return readFileSync(path.join(rootDir, '.github', 'workflows', name), 'utf8');
}

describe('UAT provider smoke workflow', () => {
  it('runs after the UAT Pages deploy without mutating UAT', () => {
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
    expect(workflow).not.toContain('pnpm deploy:backend:uat');
    expect(workflow).not.toContain('d1:migrations:apply:uat');
    expect(workflow).toContain('pnpm smoke:stripe-uat -- \\');
    expect(workflow).toContain('--site-url "${UAT_SITE_URL}"');
    expect(workflow).toContain('--scenario happy_path_paid,pay_what_you_want_paid');
    expect(workflow).toContain('--screenshots on-failure');
    expect(workflow).not.toContain('--verify-email-receipts');
    expect(workflow).not.toContain('RESEND_API_KEY');
    expect(workflow).not.toContain('inbox receipt');
    expect(workflow).toContain('.codex-artifacts/smoke/uat/stripe-sandbox/**');
    expect(workflow).toContain('uat-smoke-${{ github.run_id }}-${{ github.run_attempt }}');
    expect(workflow).toContain('actions/upload-artifact@v7.0.1');
    expect(workflow.indexOf('pnpm stripe:webhooks:verify --env uat')).toBeLessThan(
      workflow.indexOf('pnpm smoke:stripe-uat -- \\'),
    );
  });

  it('removes the standalone UAT Worker deployment workflow', () => {
    expect(existsSync(path.join(rootDir, '.github', 'workflows', 'cloudflare-uat.yml'))).toBe(false);
  });
});
