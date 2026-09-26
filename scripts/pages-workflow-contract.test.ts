import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const workflow = parse(readFileSync(fileURLToPath(new URL('../.github/workflows/pages.yml', import.meta.url)), 'utf8'));
const checks = workflow.jobs['check-candidate'];
const uatBuild = workflow.jobs['prepare-uat'];
const prdBuild = workflow.jobs['prepare-prd'];
const assembly = workflow.jobs['assemble-candidate'];
const uatSequence = parse(
  readFileSync(fileURLToPath(new URL('../.github/workflows/uat-release-sequence.yml', import.meta.url)), 'utf8'),
);
const prdSequence = parse(
  readFileSync(fileURLToPath(new URL('../.github/workflows/prd-promotion-sequence.yml', import.meta.url)), 'utf8'),
);
const promotion = prdSequence.jobs['deploy-prd'];
const staticPromotion = prdSequence.jobs['deploy-prd-static'];
const publication = parse(
  readFileSync(fileURLToPath(new URL('../.github/workflows/content-publication.yml', import.meta.url)), 'utf8'),
);

describe('Content publication workflow', () => {
  it('registers a run before installation and validation and reports failure without weakening acceptance', () => {
    const steps = publication.jobs.publish.steps;
    const attempt = steps.findIndex((step: { id?: string }) => step.id === 'attempt');
    expect(attempt).toBeGreaterThan(0);
    expect(attempt).toBeLessThan(
      steps.findIndex((step: { run?: string }) => step.run === 'pnpm install --frozen-lockfile'),
    );
    expect(attempt).toBeLessThan(steps.findIndex((step: { id?: string }) => step.id === 'code'));
    expect(steps.at(-1).if).toBe("${{ (failure() || cancelled()) && steps.attempt.outcome == 'success' }}");
    expect(steps.at(-1).run).toBe('node scripts/report-publication-run.mjs failed');
  });
  it('shares the release lock and builds selected deployed code without build credentials', () => {
    expect(publication.concurrency).toEqual({ group: 'blackbox-release', 'cancel-in-progress': false });
    const steps = publication.jobs.publish.steps;
    const checkout = steps.find((step: { name: string }) => step.name === 'Checkout deployed source');
    expect(checkout.with.ref).toBe('${{ steps.code.outputs.sha }}');
    const buildContent = steps.find(
      (step: { name: string }) => step.name === 'Build public content with deployed code',
    );
    expect(JSON.stringify(buildContent)).not.toContain('secrets.');
    expect(buildContent.run).toContain('check-frontend-route-isolation.ts web');
    expect(JSON.stringify(publication.jobs.publish.env)).not.toContain('secrets.');
    const deploy = steps.find(
      (step: { name: string }) => step.name === 'Recheck code and deploy only the public artifact',
    );
    expect(deploy.run).toContain('cmp .codex-artifacts/publication-code.json');
    expect(deploy.run).toContain('wrangler pages deploy ../../.codex-artifacts/publication-source/apps/web/dist');
    expect(JSON.stringify(publication)).not.toContain('wrangler deploy');
    expect(JSON.stringify(publication)).not.toContain('d1:migrations');
    const capture = steps.find((step: { name: string }) => step.name === 'Claim request and capture published content');
    expect(capture.env.CMS_EXPORT_TOKEN).toContain("secrets[format('{0}_CMS_EXPORT_TOKEN'");
    expect(capture.env.CMS_PUBLICATION_MAX_REQUESTS).toContain("vars[format('{0}_CMS_PUBLICATION_MAX_REQUESTS'");
  });
});

describe('Pages artifact promotion contract', () => {
  it('runs the normal provider and active public-surface smoke without retired-route exceptions', () => {
    expect(workflow.on.workflow_dispatch.inputs.confirm_retired_admin_cache_exception).toBeUndefined();
    const steps = uatSequence.jobs['smoke-uat'].steps;
    const normal = steps.find((step: { name: string }) => step.name === 'Run UAT provider smoke');
    expect(normal.if).toBeUndefined();
    expect(JSON.stringify(steps)).not.toMatch(/admin|retired|legacy|cache exception/i);
  });
  it('reports static UAT feedback directly after Pages deployment before provider acceptance', () => {
    const pages = uatSequence.jobs['deploy-uat-static'].steps;
    const deploy = pages.findIndex((step: { name: string }) => step.name === 'Deploy UAT to Cloudflare Pages');
    const quick = pages.findIndex((step: { name: string }) => step.name === 'Run UAT quick checks');
    expect(quick).toBeGreaterThan(deploy);
    expect(pages[quick].run).toContain('smoke:uat-static -- --site-url');
    expect(pages[quick].run).toContain('UAT quick checks passed');
    const evidence = pages.find((step: { name: string }) => step.name === 'Upload UAT quick-check evidence');
    expect(evidence.if).toBe('${{ always() }}');
    expect(evidence.with.path).toBe('.codex-artifacts/smoke/uat/uat-static');
    const providers = uatSequence.jobs['smoke-uat'].steps;
    expect(providers.some((step: { name: string }) => step.name === 'Run UAT quick checks')).toBe(false);
    expect(providers.findIndex((step: { name: string }) => step.name === 'Run UAT provider smoke')).toBeLessThan(
      providers.findIndex((step: { name: string }) => step.name === 'Verify current UAT release identity'),
    );
  });
  it('reuses matching trusted tooling and downloads only the required target artifacts', () => {
    for (const sequence of [uatSequence, prdSequence]) {
      expect(sequence.env.UAT_PUBLIC_BACKEND_BASE_URL).toBe('${{ vars.UAT_PUBLIC_BACKEND_BASE_URL }}');
      expect(sequence.env.PRD_PUBLIC_BACKEND_BASE_URL).toBe('${{ vars.PRD_PUBLIC_BACKEND_BASE_URL }}');
    }
    expect(uatSequence.env.RELEASE_TOOLS_DIR).toBe(
      "${{ inputs.source_sha == github.sha && '.' || '.codex-artifacts/release-tools' }}",
    );
    for (const jobName of ['deploy-uat', 'deploy-uat-static', 'smoke-uat']) {
      const steps = uatSequence.jobs[jobName].steps;
      const checkouts = steps.filter((step: { uses?: string }) => step.uses === 'actions/checkout@v7.0.1');
      expect(checkouts[0].with.ref).toBe('${{ inputs.source_sha }}');
      expect(checkouts[1].if).toBe('${{ inputs.source_sha != github.sha }}');
      expect(steps.find((step: { name?: string }) => step.name?.startsWith('Download verified')).with.name).toBe(
        '${{ inputs.artifact_name }}',
      );
    }
    for (const job of [promotion, staticPromotion]) {
      expect(job.steps[0].with.ref).toBe('${{ github.sha }}');
      expect(job.steps.some((step: { name?: string }) => step.name === 'Checkout trusted release tooling')).toBe(false);
      expect(
        job.steps.find((step: { name?: string }) => step.name === 'Download selected candidate artifacts').with.name,
      ).toBe('${{ inputs.candidate_artifact }}');
    }
  });
  it('keeps advisory unused-code analysis out of candidate preparation', () => {
    const names = checks.steps.map((step: { name?: string; run?: string }) => `${step.name ?? ''} ${step.run ?? ''}`);
    expect(names.join('\n')).not.toContain('audit:unused');
    const audit = parse(
      readFileSync(fileURLToPath(new URL('../.github/workflows/unused-code-audit.yml', import.meta.url)), 'utf8'),
    );
    expect(audit.on.schedule).toHaveLength(1);
    expect(audit.on.workflow_dispatch).toBeNull();
    expect(JSON.stringify(audit)).toContain('upload-artifact');
  });
  it('keeps unconfirmed PRD dispatches on the read-only catalog plan', () => {
    const plan = workflow.jobs['catalog-prd-plan'];
    expect(plan.if).toContain("inputs.target == 'prd'");
    for (const input of ['confirm_live_catalog_changes', 'confirm_code_promotion', 'confirm_cms_cutover']) {
      expect(plan.if).toContain(`!inputs.${input}`);
    }
    expect(plan.environment).toBe('catalog-promotion-prd');
    const commands = plan.steps.map((step: { run?: string }) => step.run ?? '').join('\n');
    expect(commands).toContain('prepare-prd-initial-price.ts');
    expect(commands).not.toMatch(/--apply\b|d1:migrations|d1:seed|wrangler deploy|pages deploy/);
    const apply = workflow.jobs['catalog-prd'].steps.find(
      (step: { name: string }) => step.name === 'Prepare reviewed CMS cutover initial Price',
    );
    expect(workflow.jobs['catalog-prd'].if).toContain('inputs.confirm_live_catalog_changes');
    expect(apply.if).toBe('${{ inputs.confirm_cms_cutover && !inputs.cms_import_report }}');
    expect(apply.run).toContain('--apply --confirm-live-catalog-changes --plan-sha256 "$REVIEWED_CATALOG_PLAN_SHA256"');
  });

  it('keeps CMS linkage separate from initial Price creation and requires a reviewed apply hash', () => {
    for (const jobName of ['catalog-prd-plan', 'catalog-prd']) {
      const job = workflow.jobs[jobName];
      const linkage = job.steps.find((step: { run?: string }) => step.run?.includes('backfill-runtime-catalog.ts'));
      expect(linkage.if).toBe("${{ inputs.cms_import_report != '' }}");
      expect(linkage.run).toContain('--env prd --cms-plan');
      expect(linkage.run).toContain('--cms-report');
      const initial = job.steps.find((step: { run?: string }) => step.run?.includes('prepare-prd-initial-price.ts'));
      expect(initial.if).toContain('!inputs.cms_import_report');
      if (jobName === 'catalog-prd') {
        expect(job.if).toContain('inputs.confirm_live_catalog_changes');
        expect(linkage.run).toContain(
          '--apply --confirm-live-catalog-changes --plan-sha256 "$REVIEWED_CATALOG_PLAN_SHA256"',
        );
      } else expect(linkage.run).not.toContain('--apply');
    }
    const runtimeKey = workflow.jobs['catalog-prd'].steps.find(
      (step: { name: string }) => step.name === 'Configure approved PRD member price commands',
    );
    expect(runtimeKey.if).toBe("${{ inputs.cms_import_report != '' && inputs.confirm_cms_cutover }}");
    expect(runtimeKey.run).toContain('secret put STRIPE_SECRET_KEY --env prd');
    expect(JSON.stringify(workflow.jobs['catalog-prd-plan'])).not.toContain('secret put');
  });

  it('requires cutover approval or accepted CMS state before switching the PRD runtime', () => {
    expect(workflow.on.workflow_dispatch.inputs.confirm_cms_cutover.default).toBe(false);
    const combined = promotion.steps.find(
      (step: { name: string }) => step.name === 'Deploy candidate combined PRD CMS Worker',
    );
    const legacy = promotion.steps.find((step: { name: string }) => step.name === 'Deploy candidate PRD Worker');
    const staff = staticPromotion.steps.find(
      (step: { name: string }) => step.name === 'Deploy staff frontend to Cloudflare Pages',
    );
    expect(combined.if).toBeUndefined();
    expect(legacy).toBeUndefined();
    expect(staff).toBeUndefined();
    expect(combined.run).toContain('release-candidate.mjs verify prd');
    expect(combined.run).toContain('/prd/cms/server/wrangler.json --keep-vars');
    expect(combined.run).toContain('release-candidate.mjs verify-worker prd');
    expect(workflow.jobs['prd-release-sequence'].if).toContain('inputs.confirm_code_promotion');
  });

  it('prepares independent target bundles and assembles the retained final candidate', () => {
    expect(checks.env).toBeUndefined();
    expect(checks.steps.find((step: { name: string }) => step.name === 'Run validation checks').run).toBe(
      'pnpm validate:checks',
    );
    expect(uatBuild.needs).toBe('check-candidate');
    expect(prdBuild.needs).toBe('check-candidate');
    const uatSteps = uatBuild.steps.map(
      (step: { name?: string; run?: string }) => `${step.name ?? ''} ${step.run ?? ''}`,
    );
    const prdSteps = prdBuild.steps.map(
      (step: { name?: string; run?: string }) => `${step.name ?? ''} ${step.run ?? ''}`,
    );
    expect(uatSteps.join('\n')).toContain('pack-target uat');
    expect(prdSteps.join('\n')).toContain('pack-target prd');
    expect(uatSteps.join('\n')).not.toContain('PRD_CMS_');
    expect(prdSteps.join('\n')).not.toContain('UAT_CMS_');
    expect(uatSteps.join('\n')).not.toContain('build:cms --env prd');
    expect(prdSteps.join('\n')).not.toContain('build:cms --env uat');
    for (const [target, job] of [
      ['uat', uatBuild],
      ['prd', prdBuild],
    ] as const) {
      const frontend = job.steps.find(
        (step: { name: string }) => step.name === `Build hosted ${target.toUpperCase()} static frontend`,
      );
      expect(frontend.env.ASTRO_BASE_PATH).toBe('/');
      expect(frontend.env.CMS_CONTENT_ENVIRONMENT).toBe(target);
      expect(frontend.env.CMS_CONTENT_SOURCE).toBe(`\${{ steps.${target}-content.outputs.source }}`);
      expect(frontend.env.CMS_CONTENT_SNAPSHOT).toContain(`/release-content/${target}/snapshot.json`);
      expect(frontend.env.PUBLIC_BACKEND_BASE_URL).toBe(`\${{ vars.${target.toUpperCase()}_PUBLIC_BACKEND_BASE_URL }}`);
      expect(JSON.stringify(frontend.env)).not.toContain('secrets.');
      const restore = job.steps.find(
        (step: { name: string }) => step.name === `Restore current ${target.toUpperCase()} publication`,
      );
      expect(restore.env.CMS_PUBLICATION_EXPORT_TOKEN).toBe(
        `\${{ secrets.${target.toUpperCase()}_CMS_PUBLICATION_EXPORT_TOKEN }}`,
      );
      expect(restore.run).toContain('restore-published-content.mjs');
      expect(restore.run).toContain(`"$tool" ${target}`);
    }
    expect(prdSteps.join('\n')).toContain('run-release-preparation.mjs browsers');
    expect(JSON.stringify(prdBuild)).toContain('chromium firefox');
    expect(assembly.needs).toEqual(['prepare-uat', 'prepare-prd']);
    expect(
      assembly.steps.find((step: { name: string }) => step.name === 'Setup Node.js for bundle assembly').with.cache,
    ).toBeUndefined();
    const downloads = assembly.steps.filter((step: { name?: string }) => step.name?.startsWith('Download verified'));
    expect(downloads.map((step: { with: { name: string } }) => step.with.name)).toEqual([
      'release-uat-${{ inputs.artifact_commit_sha || github.sha }}',
      'release-prd-${{ inputs.artifact_commit_sha || github.sha }}',
    ]);
    const assemble = assembly.steps.find(
      (step: { name: string }) => step.name === 'Verify and assemble immutable release bundle',
    );
    expect(assemble.run).toContain('release-candidate.mjs');
    expect(assemble.run).toContain('assemble');
    const finalUpload = assembly.steps.find((step: { name: string }) => step.name === 'Upload verified release bundle');
    expect(finalUpload.with.name).toBe('release-${{ inputs.artifact_commit_sha || github.sha }}');
    expect(finalUpload.with['compression-level']).toBe(1);
  });

  it('keeps UAT inspection built-in-only after downloading the candidate', () => {
    const steps = workflow.jobs['inspect-uat-pages'].steps;
    expect(steps.some((step: { name?: string }) => step.name === 'Setup pnpm')).toBe(false);
    expect(steps.some((step: { name?: string }) => step.name === 'Install dependencies')).toBe(false);
    expect(steps.some((step: { uses?: string }) => step.uses?.startsWith('actions/cache/'))).toBe(false);
    expect(steps.find((step: { name?: string }) => step.name === 'Setup Node.js').with['node-version']).toBe('24.21.0');
    expect(steps.at(-1).run).toContain('node "$tool" verify uat');
    expect(steps.at(-1).run).toContain('tool=scripts/release-candidate.mjs');
    expect(steps.find((step: { name: string }) => step.name === 'Checkout trusted release tooling').if).toContain(
      'inputs.artifact_commit_sha != github.sha',
    );
  });

  it('promotes only the selected retained artifact without rebuilding it', () => {
    for (const job of [promotion, staticPromotion]) {
      const download = job.steps.find(
        (step: { name: string }) => step.name === 'Download selected candidate artifacts',
      );
      expect(download.with['run-id']).toBe('${{ inputs.candidate_run_id }}');
      expect(download.with.name).toBe('${{ inputs.candidate_artifact }}');
      expect(JSON.stringify(job)).not.toContain('pnpm build');
      expect(prdSequence.env.SOURCE_SHA).toBe('${{ inputs.source_sha }}');
      expect(job.steps[0].with.ref).toBe('${{ github.sha }}');
    }
    expect(JSON.stringify(promotion)).toContain('/prd/cms/server/wrangler.json');
    expect(JSON.stringify(staticPromotion)).toContain('/prd/public --project-name=blackbox-records-web --branch=main');
    expect(JSON.stringify(staticPromotion)).not.toContain('blackbox-records-staff');
    expect(JSON.stringify(uatSequence.jobs['deploy-uat'])).not.toMatch(/d1:seed:.*catalog|stripe:catalog:verify/);
    expect(workflow.jobs['uat-release-sequence'].needs).toEqual(['prepare-uat', 'inspect-uat-pages']);
    expect(JSON.stringify(workflow.jobs['uat-release-sequence'].needs)).not.toContain('prepare-prd');
  });

  it('cancels only preparation and holds one shared non-cancelling lock through mutations and acceptance', () => {
    expect(workflow.concurrency).toBeUndefined();
    for (const role of ['check-candidate', 'prepare-uat', 'prepare-prd', 'assemble-candidate']) {
      const concurrency = workflow.jobs[role].concurrency;
      expect(concurrency['cancel-in-progress']).toBe(true);
      expect(concurrency.group).toContain('github.ref');
      expect(concurrency.group).toContain('github.run_id');
    }
    const lock = { group: 'blackbox-release', 'cancel-in-progress': false };
    expect(workflow.jobs['uat-release-sequence'].concurrency).toEqual(lock);
    expect(workflow.jobs['prd-release-sequence'].concurrency).toEqual(lock);
    expect(workflow.jobs['catalog-prd'].concurrency).toEqual(lock);
    expect(uatSequence.concurrency).toBeUndefined();
    expect(prdSequence.concurrency).toBeUndefined();
    expect(uatSequence.jobs['deploy-uat-static'].needs).toBe('deploy-uat');
    expect(uatSequence.jobs['smoke-uat'].needs).toBe('deploy-uat-static');
    expect(prdSequence.jobs['deploy-prd-static'].needs).toBe('deploy-prd');
    expect(publication.concurrency).toEqual(lock);
    const holding = parse(
      readFileSync(fileURLToPath(new URL('../.github/workflows/prd-holding-page.yml', import.meta.url)), 'utf8'),
    );
    expect(holding.concurrency).toEqual(lock);
    const workerDeploy = uatSequence.jobs['deploy-uat'].steps.find(
      (step: { name: string }) => step.name === 'Deploy UAT Worker',
    ).run;
    expect(workerDeploy.indexOf('verify-backend')).toBeLessThan(workerDeploy.indexOf('wrangler deploy'));
    const prdDeploy = promotion.steps.find(
      (step: { name: string }) => step.name === 'Deploy candidate combined PRD CMS Worker',
    ).run;
    expect(prdDeploy.indexOf('release-candidate.mjs verify prd')).toBeLessThan(
      prdDeploy.indexOf('wrangler versions deploy'),
    );
  });
});
