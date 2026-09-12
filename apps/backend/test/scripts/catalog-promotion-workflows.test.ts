import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../../..');
const source = readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const release = parse(source);

describe('one gated release', () => {
  it('limits main pushes to UAT and keeps code/catalog/launch authorization independent', () => {
    expect(release.on.workflow_dispatch.inputs.target.default).toBe('uat');
    expect(release.on.workflow_dispatch.inputs.confirm_code_promotion.default).toBe(false);
    expect(release.on.workflow_dispatch.inputs.confirm_live_catalog_changes.default).toBe(false);
    expect(release.jobs['deploy-prd'].if).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.target == 'prd' && inputs.confirm_code_promotion }}",
    );
    expect(release.jobs['catalog-prd'].if).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.target == 'prd' && inputs.confirm_live_catalog_changes && !inputs.confirm_code_promotion }}",
    );
    expect(JSON.stringify(release.jobs['deploy-prd'])).not.toContain('--apply');
    expect(source).not.toMatch(/PRD_LAUNCH_APPROVED=true|native_checkout_enabled=true|NATIVE_CHECKOUT_ENABLED: true/);
  });

  it('serializes bounded mutations and keeps provider smoke behind deployment', () => {
    expect(release.concurrency).toEqual({ group: 'blackbox-release', 'cancel-in-progress': false });
    for (const job of Object.values(release.jobs) as Array<{ 'timeout-minutes': number }>) {
      expect(job['timeout-minutes']).toBeGreaterThan(0);
      expect(job['timeout-minutes']).toBeLessThanOrEqual(40);
    }
    expect(release.jobs['inspect-uat-pages'].needs).toBe('build-candidate');
    expect(release.jobs['inspect-uat-pages'].environment).toBeUndefined();
    expect(release.jobs['deploy-uat'].needs).toEqual(['build-candidate', 'inspect-uat-pages']);
    expect(release.jobs['deploy-uat'].environment).toBe('catalog-promotion-uat');
    expect(release.jobs['deploy-uat-static'].needs).toBe('deploy-uat');
    expect(release.jobs['deploy-uat-static'].environment).toBeUndefined();
    expect(release.jobs['smoke-uat'].needs).toBe('deploy-uat-static');
    expect(release.jobs['deploy-prd'].environment).toBe('catalog-promotion-prd');
    expect(release.jobs['deploy-prd-static'].environment).toBeUndefined();
    expect(release.jobs['deploy-prd-static'].needs).toBe('deploy-prd');
    expect(release.jobs['deploy-prd-static'].if).toBe(release.jobs['deploy-prd'].if);
    const steps = release.jobs['deploy-uat'].steps.map((step: { name: string }) => step.name);
    expect(steps.indexOf('Prepare UAT catalog schema')).toBeLessThan(steps.indexOf('Deploy UAT Worker'));
    expect(source.match(/--scenario happy_path_paid,pay_what_you_want_paid/g)).toHaveLength(1);
    expect(source).not.toMatch(/gh workflow run|git commit|DELETE FROM|stripe:catalog:reset/);
    expect(release.on.push['paths-ignore']).toEqual(['docs/**', 'openspec/**', '*.md', 'LICENSE']);
    expect(source).not.toMatch(
      /legacy_uat|legacy-uat|configure-pages|upload-pages-artifact|deploy-pages|pages: write|id-token: write/,
    );
  });

  it('rechecks identity before mutations and records mixed revision outcomes', () => {
    const steps = [...release.jobs['deploy-prd'].steps, ...release.jobs['deploy-prd-static'].steps];
    for (const step of steps.filter((step: { run?: string }) => /wrangler|d1:migrations/.test(step.run ?? ''))) {
      expect(
        step.run.trim().startsWith('node .codex-artifacts/release-tools/scripts/release-candidate.mjs verify prd'),
      ).toBe(true);
    }
    const report = steps.find((step: { name: string }) => step.name === 'Record actual deployed revisions');
    expect(report.if).toBe('${{ always() }}');
    expect(report.run).toContain('observe prd');
  });

  it('promotes the uploaded PRD version without changing existing routes', () => {
    const worker = release.jobs['deploy-prd'].steps.find(
      (step: { name: string }) => step.name === 'Deploy candidate PRD Worker',
    ).run;
    expect(worker).toContain('wrangler versions upload');
    expect(worker).toContain('--no-bundle --keep-vars --tag "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"');
    expect(worker).toContain('--version-tag "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT@100%" --yes');
    expect(worker).not.toMatch(/wrangler deploy|triggers deploy|--routes/);
    expect(worker.match(/release-candidate\.mjs verify prd/g)).toHaveLength(2);
  });
});
