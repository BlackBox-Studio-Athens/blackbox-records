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
    expect(release.jobs['deploy-uat'].needs).toBe('build-candidate');
    const steps = release.jobs['deploy-uat'].steps.map((step: { name: string }) => step.name);
    expect(steps.indexOf('Deploy UAT Worker')).toBeLessThan(steps.indexOf('Deploy UAT to Cloudflare Pages'));
    expect(steps.indexOf('Deploy UAT to Cloudflare Pages')).toBeLessThan(steps.indexOf('Run UAT provider smoke'));
    expect(source.match(/--scenario happy_path_paid,pay_what_you_want_paid/g)).toHaveLength(1);
    expect(source).not.toMatch(/gh workflow run|git commit|DELETE FROM|stripe:catalog:reset/);
    expect(release.on.push['paths-ignore']).toEqual(['docs/**', 'openspec/**', '*.md', 'LICENSE']);
  });

  it('rechecks identity before mutations and records mixed revision outcomes', () => {
    const steps = release.jobs['deploy-prd'].steps;
    for (const step of steps.filter((step: { run?: string }) => /wrangler|d1:migrations/.test(step.run ?? ''))) {
      expect(step.run.trim().startsWith('node scripts/release-candidate.mjs verify prd')).toBe(true);
    }
    const report = steps.find((step: { name: string }) => step.name === 'Record actual deployed revisions');
    expect(report.if).toBe('${{ always() }}');
    expect(report.run).toContain('observe prd');
  });
});
