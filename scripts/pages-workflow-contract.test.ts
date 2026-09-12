import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const workflow = parse(readFileSync(fileURLToPath(new URL('../.github/workflows/pages.yml', import.meta.url)), 'utf8'));
const build = workflow.jobs['build-candidate'];
const promotion = workflow.jobs['deploy-prd'];
const staticPromotion = workflow.jobs['deploy-prd-static'];

describe('Pages artifact promotion contract', () => {
  it('builds paired targets after the repository gates without provider credentials', () => {
    expect(build.env).toBeUndefined();
    const tooling = build.steps.find((step: { name: string }) => step.name === 'Checkout trusted release tooling');
    expect(tooling.with.ref).toBe('${{ github.sha }}');
    expect(tooling.with.path).toBe('.codex-artifacts/release-tools');
    expect(JSON.stringify(build)).toContain('node .codex-artifacts/release-tools/scripts/release-candidate.mjs pack');
    const steps = build.steps.map((step: { name: string }) => step.name);
    expect(steps.indexOf('Run unit tests')).toBeLessThan(steps.indexOf('Build hosted UAT static frontend'));
    expect(steps.indexOf('Run workspace checks')).toBeLessThan(steps.indexOf('Build hosted UAT static frontend'));
    expect(steps.indexOf('Run unused code audit')).toBeLessThan(steps.indexOf('Build hosted UAT static frontend'));
    const uat = build.steps.find((step: { name: string }) => step.name === 'Build hosted UAT static frontend');
    const prd = build.steps.find((step: { name: string }) => step.name === 'Build hosted PRD static frontend');
    expect(uat.env.ASTRO_BASE_PATH).toBe('/');
    expect(prd.env.ASTRO_BASE_PATH).toBe('/');
    expect(uat.env.PUBLIC_BACKEND_BASE_URL).not.toBe(prd.env.PUBLIC_BACKEND_BASE_URL);
    expect(uat.env.SHOW_REVIEW_SITE_MARKER).toBe('true');
    expect(prd.env.SHOW_REVIEW_SITE_MARKER).toBeUndefined();
    const staff = build.steps.find((step: { name: string }) => step.name === 'Build hosted staff frontend');
    expect(staff.env.PUBLIC_BACKEND_BASE_URL).toBe('');
  });

  it('promotes only the selected retained artifact without rebuilding it', () => {
    for (const job of [promotion, staticPromotion]) {
      const download = job.steps.find(
        (step: { name: string }) => step.name === 'Download selected candidate artifacts',
      );
      expect(download.with['run-id']).toBe('${{ inputs.candidate_run_id }}');
      expect(download.with.name).toBe('release-${{ inputs.artifact_commit_sha }}');
      expect(JSON.stringify(job)).not.toContain('pnpm build');
      expect(job.env.SOURCE_SHA).toBe('${{ inputs.artifact_commit_sha }}');
      expect(job.steps[0].with.ref).toBe('${{ github.sha }}');
    }
    expect(JSON.stringify(promotion)).toContain('--no-bundle');
    expect(JSON.stringify(staticPromotion)).toContain('/prd/public --project-name=blackbox-records-web --branch=main');
    expect(JSON.stringify(staticPromotion)).toContain('/prd/staff --project-name=blackbox-records-staff --branch=main');
  });
});
