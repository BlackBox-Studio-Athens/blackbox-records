import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const workflow = parse(readFileSync(fileURLToPath(new URL('../.github/workflows/pages.yml', import.meta.url)), 'utf8'));
const build = workflow.jobs['build-candidate'];
const promotion = workflow.jobs['deploy-prd'];
const staticPromotion = workflow.jobs['deploy-prd-static'];
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
    expect(publication.concurrency).toEqual(workflow.concurrency);
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
    const steps = workflow.jobs['smoke-uat'].steps;
    const normal = steps.find((step: { name: string }) => step.name === 'Run UAT provider smoke');
    expect(normal.if).toBeUndefined();
    expect(JSON.stringify(steps)).not.toMatch(/admin|retired|legacy|cache exception/i);
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
    expect(promotion.if).toContain('inputs.confirm_code_promotion');
  });

  it('builds paired targets after the repository gates without provider credentials', () => {
    expect(build.env).toBeUndefined();
    const tooling = build.steps.find((step: { name: string }) => step.name === 'Checkout trusted release tooling');
    expect(tooling.with.ref).toBe('${{ github.sha }}');
    expect(tooling.with.path).toBe('.codex-artifacts/release-tools');
    expect(JSON.stringify(build)).toContain('node .codex-artifacts/release-tools/scripts/release-candidate.mjs pack');
    const steps = build.steps.map((step: { name: string }) => step.name);
    expect(steps.indexOf('Run validation checks')).toBeLessThan(steps.indexOf('Build hosted UAT static frontend'));
    expect(steps.indexOf('Run unused code audit')).toBeLessThan(steps.indexOf('Build hosted UAT static frontend'));
    expect(build.steps.find((step: { name: string }) => step.name === 'Run validation checks').run).toBe(
      'pnpm validate:checks',
    );
    const uat = build.steps.find((step: { name: string }) => step.name === 'Build hosted UAT static frontend');
    const prd = build.steps.find((step: { name: string }) => step.name === 'Build hosted PRD static frontend');
    expect(uat.env.ASTRO_BASE_PATH).toBe('/');
    expect(prd.env.ASTRO_BASE_PATH).toBe('/');
    expect(uat.env.PUBLIC_BACKEND_BASE_URL).not.toBe(prd.env.PUBLIC_BACKEND_BASE_URL);
    expect(uat.env.SHOW_REVIEW_SITE_MARKER).toBe('true');
    expect(prd.env.SHOW_REVIEW_SITE_MARKER).toBeUndefined();
    for (const [target, step] of [
      ['uat', uat],
      ['prd', prd],
    ] as const) {
      expect(step.env.CMS_CONTENT_ENVIRONMENT).toBe(target);
      expect(step.env.CMS_CONTENT_SOURCE).toBe(`\${{ steps.${target}-content.outputs.source }}`);
      expect(step.env.CMS_CONTENT_SNAPSHOT).toContain(`/release-content/${target}/snapshot.json`);
      expect(JSON.stringify(step.env)).not.toContain('secrets.');
      const restore = build.steps.find(
        (entry: { name: string }) => entry.name === `Restore current ${target.toUpperCase()} publication`,
      );
      expect(restore.env.CMS_PUBLICATION_EXPORT_TOKEN).toBe(
        `\${{ secrets.${target.toUpperCase()}_CMS_PUBLICATION_EXPORT_TOKEN }}`,
      );
      expect(restore.run).toContain(`restore-published-content.mjs ${target}`);
    }
    const staff = build.steps.find((step: { name: string }) => step.name === 'Build hosted staff frontend');
    expect(staff).toBeUndefined();
    const imageCache = build.steps.find((step: { name: string }) => step.name === 'Restore Astro image cache');
    expect(imageCache.uses).toBe('actions/cache/restore@v6.1.0');
    expect(imageCache.with.path).toBe('apps/web/node_modules/.astro/assets');
    expect(imageCache.with.key).toContain('${{ github.run_id }}');
    const upload = build.steps.find((step: { name: string }) => step.name === 'Upload verified release bundle');
    expect(upload.with['compression-level']).toBe(1);
    const diagnostics = build.steps.find((step: { name: string }) => step.name === 'Upload validation diagnostics');
    expect(diagnostics.if).toBe('${{ failure() }}');
    expect(diagnostics.with.path).toBe('.codex-artifacts/validation');
  });

  it('keeps UAT inspection built-in-only after downloading the candidate', () => {
    const steps = workflow.jobs['inspect-uat-pages'].steps;
    expect(steps.some((step: { name?: string }) => step.name === 'Setup pnpm')).toBe(false);
    expect(steps.some((step: { name?: string }) => step.name === 'Install dependencies')).toBe(false);
    expect(steps.some((step: { uses?: string }) => step.uses?.startsWith('actions/cache/'))).toBe(false);
    expect(steps.find((step: { name?: string }) => step.name === 'Setup Node.js').with['node-version']).toBe('24.21.0');
    expect(steps.at(-1).run).toBe('node .codex-artifacts/release-tools/scripts/release-candidate.mjs verify uat');
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
    expect(JSON.stringify(promotion)).toContain('/prd/cms/server/wrangler.json');
    expect(JSON.stringify(staticPromotion)).toContain('/prd/public --project-name=blackbox-records-web --branch=main');
    expect(JSON.stringify(staticPromotion)).not.toContain('blackbox-records-staff');
    expect(JSON.stringify(workflow.jobs['deploy-uat'])).not.toMatch(/d1:seed:.*catalog|stripe:catalog:verify/);
  });
});
