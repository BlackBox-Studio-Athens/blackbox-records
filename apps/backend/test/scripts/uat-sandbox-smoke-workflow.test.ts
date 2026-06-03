import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(__dirname, '..', '..', '..', '..');

function readWorkflow(name: string): string {
  return readFileSync(path.join(rootDir, '.github', 'workflows', name), 'utf8');
}

describe('UAT sandbox smoke workflow', () => {
  it('runs after the UAT Pages deploy with sandbox-only smoke settings', () => {
    const workflow = readWorkflow('uat-sandbox-smoke.yml');

    expect(workflow).toContain('name: UAT sandbox smoke');
    expect(workflow).toContain('workflow_run');
    expect(workflow).toContain('Deploy UAT static site to GitHub Pages');
    expect(workflow).toContain("branches: ['main']");
    expect(workflow).toContain('types: [completed]');
    expect(workflow).toContain('permissions:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('concurrency:');
    expect(workflow).toContain("group: 'uat-sandbox-smoke-${{ github.event.workflow_run.head_branch }}'");
    expect(workflow).toContain('cancel-in-progress: true');
    expect(workflow).toContain('environment: catalog-promotion-uat');
    expect(workflow).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(workflow).toContain('github.event.workflow_run.head_sha');
    expect(workflow).toContain('pnpm smoke:stripe-sandbox -- \\');
    expect(workflow).toContain('--site-url "${UAT_SITE_URL}"');
    expect(workflow).toContain('--scenario all');
    expect(workflow).toContain('--screenshots on-failure');
    expect(workflow).toContain('.codex-artifacts/smoke/uat/stripe-sandbox/**');
    expect(workflow).toContain('actions/upload-artifact@v5.0.0');
  });
});
