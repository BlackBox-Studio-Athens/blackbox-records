import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../../..');
const release = parse(readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8'));
const uatSequence = parse(readFileSync(path.join(root, '.github/workflows/uat-release-sequence.yml'), 'utf8'));
const prdSequence = release;

describe('one gated release', () => {
  it('builds and retains independent UAT and PRD bundles with migration manifests', () => {
    const uatBuild = release.jobs['prepare-uat'].steps.find(
      (step: { name: string }) => step.name === 'Build UAT Worker and renderer',
    ).run;
    const prdBuild = release.jobs['prepare-prd'].steps.find(
      (step: { name: string }) => step.name === 'Build PRD Worker and renderer',
    ).run;
    expect(uatBuild).toContain('build:cms --env uat');
    expect(uatBuild).toContain('cp -R apps/backend/dist .codex-artifacts/release/uat/worker');
    expect(uatBuild).toContain('pack-target uat');
    expect(prdBuild).toContain('build:cms --env prd --out-dir ../../.codex-artifacts/release/prd/cms');
    expect(prdBuild).toContain('pack-target prd');
    for (const [job, target] of [
      [release.jobs['prepare-uat'], 'uat'],
      [release.jobs['prepare-prd'], 'prd'],
    ]) {
      const build = job.steps.find(
        (step: { name: string }) => step.name === `Build ${target.toUpperCase()} Worker and renderer`,
      ).run;
      const worker = target === 'uat' ? 'worker' : 'cms';
      expect(build).toContain(
        `cp apps/backend/.emdash/migrations.json .codex-artifacts/release/${target}/${worker}/migrations.json`,
      );
      const upload = job.steps.find(
        (step: { name: string }) => step.name === `Upload verified ${target.toUpperCase()} target bundle`,
      ).with;
      expect(upload.name).toBe(`release-${target}-\${{ inputs.artifact_commit_sha || github.sha }}`);
      expect(upload.path).toBe('.codex-artifacts/release');
      expect(upload['include-hidden-files']).toBe(true);
    }
    const uatSteps = uatSequence.jobs['deploy-uat'].steps;
    const uatCoreMigrations = uatSteps.find(
      (step: { name: string }) => step.name === 'Apply UAT EmDash core migrations',
    ).run;
    expect(uatCoreMigrations).toContain('node apps/backend/scripts/migrate-cms.mjs --env uat');
    expect(uatCoreMigrations).toContain('--apply --fingerprint "$fingerprint"');
    const prdSteps = prdSequence.jobs['deploy-prd'].steps;
    const prdMigration = prdSteps.find(
      (step: { name: string }) => step.name === 'Apply reviewed PRD EmDash core migrations',
    ).run;
    expect(prdMigration).toContain('--confirm-live-cms-changes');
    for (const migration of [uatCoreMigrations, prdMigration]) {
      expect(migration.match(/--manifest "\$\{config%\/server\/wrangler.json\}\/migrations.json"/g)).toHaveLength(2);
      expect(migration).toContain('exit "$status"');
    }
  });

  it('limits main pushes to UAT and keeps code, catalog, and launch authorization independent', () => {
    expect(release.on.workflow_dispatch.inputs.target.default).toBe('uat');
    expect(release.on.workflow_dispatch.inputs.confirm_code_promotion.default).toBe(false);
    expect(release.on.workflow_dispatch.inputs.confirm_live_catalog_changes.default).toBe(false);
    expect(release.jobs['deploy-prd'].if).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.target == 'prd' && inputs.confirm_code_promotion }}",
    );
    expect(release.jobs['catalog-prd'].if).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.target == 'prd' && inputs.confirm_live_catalog_changes && !inputs.confirm_code_promotion }}",
    );
    const promotion = [prdSequence.jobs['deploy-prd'], prdSequence.jobs['deploy-prd-static']];
    expect(JSON.stringify(promotion)).not.toMatch(/stripe:catalog:verify|d1:seed:prd|confirm-live-catalog-changes/);
    expect(JSON.stringify(prdSequence.jobs['deploy-prd'])).toContain(
      'cms:application-migrations --env prd --apply --confirm-live-cms-changes',
    );
    expect(JSON.stringify(release.jobs['deploy-prd'])).toContain('release-${{ inputs.artifact_commit_sha }}');
    expect(JSON.stringify(release)).not.toMatch(
      /PRD_LAUNCH_APPROVED=true|native_checkout_enabled=true|NATIVE_CHECKOUT_ENABLED: true/,
    );
  });

  it('serializes hosted mutations while preparation stays independent and cancellable', () => {
    const lock = { group: 'blackbox-release', 'cancel-in-progress': false };
    expect(release.concurrency.group).toContain("inputs.target == 'prd' && 'blackbox-release'");
    expect(release.concurrency.group).toContain("format('blackbox-preparation-{0}', github.run_id)");
    expect(release.concurrency['cancel-in-progress']).toBe(false);
    expect(release.jobs['uat-release'].concurrency).toEqual(lock);
    expect(release.jobs['uat-release'].secrets).toBe('inherit');
    for (const role of ['deploy-prd', 'deploy-prd-static', 'catalog-prd'])
      expect(release.jobs[role].concurrency).toBeUndefined();
    for (const role of ['check-candidate', 'prepare-uat', 'prepare-prd', 'assemble-candidate']) {
      expect(release.jobs[role].concurrency['cancel-in-progress']).toBe(true);
      expect(release.jobs[role].concurrency.group).toContain('github.ref');
      expect(release.jobs[role].concurrency.group).toContain('github.run_id');
    }
    expect(release.jobs['inspect-uat-pages'].needs).toEqual(['check-candidate', 'prepare-uat']);
    expect(release.jobs['uat-release'].needs).toEqual(['check-candidate', 'prepare-uat', 'inspect-uat-pages']);
    expect(uatSequence.jobs['deploy-uat-static'].environment).toBeUndefined();
    for (const role of ['deploy-uat', 'smoke-uat']) {
      const job = uatSequence.jobs[role];
      expect(job.environment).toBe('catalog-promotion-uat');
      expect(job.concurrency).toBeUndefined();
      expect(job.env.CLOUDFLARE_API_TOKEN).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}');
      expect(job.env.STRIPE_SECRET_KEY).toBe('${{ secrets.STRIPE_SECRET_KEY }}');
    }
    expect(release.jobs['deploy-prd'].env.CLOUDFLARE_API_TOKEN).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}');
    expect(uatSequence.jobs['deploy-uat-static'].env.CLOUDFLARE_API_TOKEN).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}');
    expect(release.jobs['deploy-prd-static'].env.CLOUDFLARE_API_TOKEN).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}');
    expect(uatSequence.jobs['deploy-uat'].environment).toBe('catalog-promotion-uat');
    expect(uatSequence.jobs['deploy-uat-static'].needs).toBe('deploy-uat');
    expect(uatSequence.jobs['smoke-uat'].needs).toBe('deploy-uat-static');
    expect(prdSequence.jobs['deploy-prd'].environment).toBe('catalog-promotion-prd');
    expect(prdSequence.jobs['deploy-prd-static'].needs).toBe('deploy-prd');
    expect(release.on.push['paths-ignore']).toEqual(['docs/**', 'openspec/**', '*.md', 'LICENSE']);
    expect(JSON.stringify(release)).not.toMatch(/gh workflow run|git commit|DELETE FROM|stripe:catalog:reset/);
  });

  it('rechecks candidate identity before every PRD mutation and records deployed revisions', () => {
    const steps = [...prdSequence.jobs['deploy-prd'].steps, ...prdSequence.jobs['deploy-prd-static'].steps];
    for (const step of steps.filter((candidate: { run?: string }) =>
      /wrangler|d1:migrations/.test(candidate.run ?? ''),
    )) {
      expect(step.run.trim().startsWith('node scripts/release-candidate.mjs verify prd')).toBe(true);
    }
    const report = steps.find((step: { name: string }) => step.name === 'Record actual deployed revisions');
    expect(report.if).toBe('${{ always() }}');
    expect(report.run).toContain('observe prd');
  });

  it('promotes the uploaded PRD Worker version and selected retained bundle without rebuilding', () => {
    const steps = prdSequence.jobs['deploy-prd'].steps;
    const worker = steps.find((step: { name: string }) => step.name === 'Deploy candidate combined PRD CMS Worker').run;
    expect(worker).toContain('wrangler versions upload');
    expect(worker).toContain('prd/cms/server/wrangler.json --keep-vars --tag "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"');
    expect(worker).toContain('--version-tag "$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT@100%" --yes');
    expect(worker).not.toMatch(/wrangler deploy|triggers deploy|--routes/);
    expect(worker.match(/release-candidate\.mjs verify prd/g)).toHaveLength(1);
    expect(worker).toContain('release-candidate.mjs verify-worker prd');
    const download = steps.find((step: { name: string }) => step.name === 'Download selected candidate artifacts');
    expect(download.with.name).toBe('release-${{ inputs.artifact_commit_sha }}');
    expect(download.with['run-id']).toBe('${{ inputs.candidate_run_id }}');
    expect(JSON.stringify([prdSequence.jobs['deploy-prd'], prdSequence.jobs['deploy-prd-static']])).not.toContain(
      'pnpm build',
    );
  });
});
