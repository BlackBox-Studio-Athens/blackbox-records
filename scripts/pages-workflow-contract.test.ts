import { readdirSync, readFileSync } from 'node:fs';
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
const prdSequence = workflow;
const promotion = workflow.jobs['deploy-prd'];
const staticPromotion = workflow.jobs['deploy-prd-static'];
const publication = parse(
  readFileSync(fileURLToPath(new URL('../.github/workflows/content-publication.yml', import.meta.url)), 'utf8'),
);
const workflowsDir = fileURLToPath(new URL('../.github/workflows/', import.meta.url));
const allWorkflows = readdirSync(workflowsDir)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => ({ file, workflow: parse(readFileSync(workflowsDir + file, 'utf8')) }));
type Step = { name?: string; id?: string; uses?: string; run?: string; if?: string; env?: Record<string, string> };
type Job = {
  if?: string;
  needs?: string | string[];
  environment?: string;
  env?: Record<string, string>;
  concurrency?: unknown;
  steps: Step[];
};
const acceptanceJobs = [
  'accept-uat-identity',
  'accept-uat-static',
  'accept-uat-providers',
  'accept-staff-previews',
  'accept-e2e',
];
// Jobs a push to main runs: candidate checks, both target builds, assembly, inspection and the UAT deployment sequence.
const pushJobs: [string, Job][] = [
  ...['check-candidate', 'prepare-uat', 'prepare-prd', 'assemble-candidate', 'inspect-uat-pages'].map(
    (name): [string, Job] => [name, workflow.jobs[name]],
  ),
  ...Object.entries(uatSequence.jobs as Record<string, Job>),
];
// Reusable-workflow callers have no steps of their own.
const runs = (job: Job) => (job.steps ?? []).map((step) => step.run ?? '').join('\n');
const stepNamed = (job: Job, name: string) => job.steps.find((step) => step.name === name)!;

describe('Workflow toolchain and checkout policy', () => {
  it('reads toolchain versions from repository files and never persists the checkout token', () => {
    const steps = allWorkflows.flatMap(({ workflow: definition }) =>
      Object.values(definition.jobs).flatMap(
        (job) => (job as { steps?: { uses?: string; with?: Record<string, unknown> }[] }).steps ?? [],
      ),
    );
    const using = (action: string) => steps.filter((step) => step.uses?.startsWith(`${action}@`));
    expect(using('actions/checkout').length).toBeGreaterThan(0);
    for (const step of using('actions/checkout')) expect(step.with?.['persist-credentials']).toBe(false);
    for (const step of using('pnpm/action-setup')) expect(step.with?.version).toBeUndefined();
    for (const step of using('actions/setup-node')) {
      expect(step.with?.['node-version']).toBeUndefined();
      expect(step.with?.['node-version-file']).toBe('.node-version');
    }
  });
});

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
  it('passes the selected candidate and explicit approval to both PRD verification jobs', () => {
    expect(workflow.on.workflow_dispatch.inputs.confirm_code_promotion.default).toBe(false);
    for (const job of [promotion, staticPromotion]) {
      const environment = { ...workflow.env, ...job.env };
      expect(environment.CANDIDATE_RUN_ID).toBe("${{ inputs.target == 'prd' && inputs.candidate_run_id || '' }}");
      expect(environment.CONFIRM_CODE_PROMOTION).toBe('${{ inputs.confirm_code_promotion }}');
      expect(job.if).toContain('inputs.confirm_code_promotion');
      expect(job.if).toContain("inputs.target == 'prd'");
    }
  });
  it('verifies push and manual UAT candidates against their own run', () => {
    // An empty CANDIDATE_RUN_ID makes release-candidate.mjs fall back to GITHUB_RUN_ID.
    expect(workflow.env.CANDIDATE_RUN_ID).toMatch(/^\$\{\{ inputs\.target == 'prd' && /);
    for (const [name, job] of Object.entries(workflow.jobs) as [string, { env?: Record<string, string> }][])
      expect(job.env?.CANDIDATE_RUN_ID, name).toBeUndefined();
  });
  it('runs the normal provider and active public-surface smoke without retired-route exceptions', () => {
    expect(workflow.on.workflow_dispatch.inputs.confirm_retired_admin_cache_exception).toBeUndefined();
    const steps = workflow.jobs['accept-uat-providers'].steps;
    const normal = steps.find((step: { name: string }) => step.name === 'Run UAT provider smoke');
    expect(normal.if).toBeUndefined();
    expect(JSON.stringify(steps)).not.toMatch(/admin|retired|legacy|cache exception/i);
  });
  it('ends a push with UAT serving the verified candidate and runs no browser or smoke on the way', () => {
    for (const [name, job] of pushJobs) {
      const commands = runs(job);
      expect(commands, name).not.toMatch(/playwright|smoke:|test:e2e|run-release-preparation\.mjs browsers/);
      expect(JSON.stringify(job.steps), name).not.toMatch(/codex-artifacts\/(smoke|e2e)/);
    }
    expect(Object.keys(uatSequence.jobs)).toEqual(['deploy-uat', 'deploy-uat-static']);
    const pages = uatSequence.jobs['deploy-uat-static'];
    const deploy = stepNamed(pages, 'Deploy UAT to Cloudflare Pages').run!;
    expect(deploy.indexOf('wrangler pages deploy')).toBeLessThan(deploy.indexOf('verify-hosted uat'));
    expect(deploy.trim().endsWith('release-candidate.mjs" verify-hosted uat')).toBe(true);
    expect(pages.steps.at(-1)).toMatchObject({ name: 'Record actual deployed revisions', if: '${{ always() }}' });
  });
  it('gates every PRD mutation on promotion acceptance of the UAT-served candidate', () => {
    expect(promotion.needs).toEqual(acceptanceJobs);
    expect(staticPromotion.needs).toBe('deploy-prd');
    const identity = workflow.jobs['accept-uat-identity'];
    for (const name of acceptanceJobs) {
      const job = workflow.jobs[name];
      expect(job.if, name).toBe(promotion.if);
      expect(job.concurrency, name).toBeUndefined();
      if (name !== 'accept-uat-identity') expect(job.needs, name).toBe('accept-uat-identity');
    }
    // UAT must still serve the selected candidate run before any smoke starts.
    expect(identity.steps[0]).toEqual(checks.steps[0]);
    expect(identity.steps[1].with.ref).toBe('${{ github.sha }}');
    const download = stepNamed(identity, 'Download selected candidate artifacts') as Step & {
      with: Record<string, string>;
    };
    expect(download.with).toMatchObject({
      name: 'release-${{ inputs.artifact_commit_sha }}',
      'run-id': '${{ inputs.candidate_run_id }}',
    });
    expect(identity.steps.at(-1)?.run).toBe('node scripts/release-candidate.mjs verify-hosted uat');
    expect(runs(workflow.jobs['accept-uat-static'])).toContain(
      'pnpm smoke:uat-static -- --site-url https://blackbox-records-web-uat.pages.dev --scenario all --screenshots on-failure',
    );
    const providers = workflow.jobs['accept-uat-providers'];
    expect(runs(providers)).toContain(
      'pnpm smoke:stripe-uat -- --site-url https://blackbox-records-web-uat.pages.dev --worker-url "$UAT_PUBLIC_BACKEND_BASE_URL" --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure',
    );
    expect(runs(providers)).toContain('pnpm smoke:resend-uat -- --worker-url "$UAT_PUBLIC_BACKEND_BASE_URL"');
    const names = providers.steps.map((step: Step) => step.name);
    expect(names.indexOf('Run UAT provider smoke')).toBeLessThan(names.indexOf('Verify current UAT release identity'));
    const staff = workflow.jobs['accept-staff-previews'];
    const retained = stepNamed(staff, "Use the candidate's retained PRD staff build").run!;
    expect(retained).toContain('release-candidate.mjs" materialize');
    expect(retained).toContain('cp -R .codex-artifacts/release/prd/cms/client apps/staff/dist');
    expect(runs(staff)).not.toMatch(/pnpm build|build:staff|build:cms/);
    expect(stepNamed(staff, 'Verify staff previews in Chromium and Firefox')).toMatchObject({
      env: { STAFF_PREVIEW_ENVIRONMENT: 'prd' },
      run: 'node --import tsx scripts/run-release-preparation.mjs browsers',
    });
    expect(runs(staff)).toContain('playwright install --with-deps chromium firefox');
    const e2e = workflow.jobs['accept-e2e'];
    expect(stepNamed(e2e, 'Run the whole end-to-end suite').run).toBe('pnpm test:e2e');
    expect(stepNamed(e2e, 'Upload end-to-end evidence')).toMatchObject({
      if: '${{ failure() }}',
      with: { path: '.codex-artifacts/e2e' },
    });
    // Suites test the candidate's own source; release tooling still comes from the trusted workflow revision.
    for (const name of ['accept-uat-static', 'accept-uat-providers', 'accept-staff-previews', 'accept-e2e']) {
      const checkouts = workflow.jobs[name].steps.filter((step: Step) => step.uses?.startsWith('actions/checkout@'));
      expect(checkouts[0].with.ref, name).toBe('${{ inputs.artifact_commit_sha || github.sha }}');
    }
    // Acceptance never builds or uploads a release artifact, so deploy-prd still downloads the candidate run's bytes.
    for (const name of acceptanceJobs) {
      expect(runs(workflow.jobs[name]), name).not.toMatch(/pnpm build|build:(web|staff|cms)|pack-target|assemble/);
      for (const step of workflow.jobs[name].steps)
        if (step.uses?.startsWith('actions/upload-artifact@')) expect(step.with.name, name).not.toMatch(/^release-/);
    }
  });
  it('keeps PRD credentials out of acceptance and UAT credentials in the provider job only', () => {
    for (const name of acceptanceJobs) {
      const job = workflow.jobs[name];
      const text = JSON.stringify(job);
      const secrets = [...new Set(text.match(/secrets\.\w+/g) ?? [])].sort();
      expect(text, name).not.toMatch(/PRD_|catalog-promotion-prd/);
      if (name === 'accept-uat-providers') {
        expect(job.environment).toBe('catalog-promotion-uat');
        expect(secrets).toEqual(['secrets.CLOUDFLARE_API_TOKEN', 'secrets.STRIPE_SECRET_KEY']);
        expect(job.steps[0].run).toContain(
          'CLOUDFLARE_API_TOKEN STRIPE_SECRET_KEY STRIPE_PAYMENT_METHOD_CONFIGURATION_ID',
        );
        expect(job.steps[0].run).toContain('exit 1');
        expect(text).not.toMatch(/wrangler (deploy|versions|pages deploy)|d1:migrations|deploy:backend/);
      } else {
        expect(job.environment, name).toBeUndefined();
        expect(secrets, name).toEqual([]);
      }
    }
  });
  it('runs provider smoke only in promotion acceptance and the manual smoke workflow', () => {
    const owners = allWorkflows.flatMap(({ file, workflow: definition }) =>
      Object.entries(definition.jobs as Record<string, Job>)
        .filter(([, job]) => /smoke:(stripe|resend)-uat/.test(runs(job)))
        .map(([name]) => `${file}:${name}`),
    );
    expect(owners.sort()).toEqual(['pages.yml:accept-uat-providers', 'uat-smoke.yml:smoke']);
  });
  it('reuses matching trusted tooling and downloads only the required target artifacts', () => {
    for (const sequence of [uatSequence, prdSequence]) {
      expect(sequence.env.UAT_PUBLIC_BACKEND_BASE_URL).toBe('${{ vars.UAT_PUBLIC_BACKEND_BASE_URL }}');
      expect(sequence.env.PRD_PUBLIC_BACKEND_BASE_URL).toBe('${{ vars.PRD_PUBLIC_BACKEND_BASE_URL }}');
    }
    expect(uatSequence.env.RELEASE_TOOLS_DIR).toBe(
      "${{ (inputs.artifact_commit_sha || github.sha) == github.sha && '.' || '.codex-artifacts/release-tools' }}",
    );
    for (const jobName of ['deploy-uat', 'deploy-uat-static']) {
      const steps = uatSequence.jobs[jobName].steps;
      const checkouts = steps.filter((step: { uses?: string }) => step.uses?.startsWith('actions/checkout@'));
      expect(checkouts[0].with.ref).toBe('${{ inputs.artifact_commit_sha || github.sha }}');
      expect(checkouts[1].if).toBe('${{ inputs.artifact_commit_sha && inputs.artifact_commit_sha != github.sha }}');
      expect(
        steps.find((step: { name?: string }) => step.name === 'Download verified UAT target bundle').with.name,
      ).toBe('release-uat-${{ inputs.artifact_commit_sha || github.sha }}');
      expect(uatSequence.jobs[jobName].environment === 'catalog-promotion-uat').toBe(jobName === 'deploy-uat');
    }
    for (const jobName of ['accept-uat-providers', 'accept-staff-previews']) {
      const checkouts = workflow.jobs[jobName].steps.filter((step: Step) => step.uses?.startsWith('actions/checkout@'));
      expect(checkouts[1].if).toBe('${{ inputs.artifact_commit_sha && inputs.artifact_commit_sha != github.sha }}');
      expect(runs(workflow.jobs[jobName])).toContain('"$RELEASE_TOOLS_DIR/scripts/release-candidate.mjs"');
    }
    for (const job of [promotion, staticPromotion]) {
      expect(job.steps[0].with.ref).toBe('${{ github.sha }}');
      expect(job.steps.some((step: { name?: string }) => step.name === 'Checkout trusted release tooling')).toBe(false);
      expect(
        job.steps.find((step: { name?: string }) => step.name === 'Download selected candidate artifacts').with.name,
      ).toBe('release-${{ inputs.artifact_commit_sha }}');
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
    expect(workflow.jobs['deploy-prd'].if).toContain('inputs.confirm_code_promotion');
  });

  it('prepares independent target bundles and assembles the retained final candidate', () => {
    expect(checks.env).toBeUndefined();
    expect(checks.steps.find((step: { name: string }) => step.name === 'Run validation checks').run).toBe(
      'pnpm validate:checks',
    );
    // Build while validation runs, but do not assemble or deploy a failed candidate.
    expect(uatBuild.needs).toBeUndefined();
    expect(prdBuild.needs).toBeUndefined();
    expect(workflow.jobs['inspect-uat-pages'].needs).toEqual(['check-candidate', 'prepare-uat']);
    for (const job of [checks, uatBuild]) {
      const diagnostics = job.steps.find((step: { name?: string }) => step.name === 'Upload validation diagnostics');
      expect(diagnostics.with.name).toContain('${{ github.job }}');
    }
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
      expect(job.steps[0]).toEqual(checks.steps[0]);
      const frontend = job.steps.find(
        (step: { name: string }) => step.name === `Build hosted ${target.toUpperCase()} static frontend`,
      );
      expect(frontend.env.ASTRO_BASE_PATH).toBe('/');
      expect(frontend.env.CMS_CONTENT_ENVIRONMENT).toBe(target);
      expect(frontend.env.CMS_CONTENT_SOURCE).toBe(`\${{ steps.${target}-content.outputs.source }}`);
      expect(frontend.env.CMS_CONTENT_SNAPSHOT).toContain(`/release-content/${target}/snapshot.json`);
      expect(frontend.env.PUBLIC_BACKEND_BASE_URL).toBe(`\${{ vars.${target.toUpperCase()}_PUBLIC_BACKEND_BASE_URL }}`);
      expect(JSON.stringify(frontend.env)).not.toContain('secrets.');
      expect(frontend.run).toBe('pnpm build:web');
      const restore = job.steps.find(
        (step: { name: string }) => step.name === `Restore current ${target.toUpperCase()} publication`,
      );
      expect(restore.env.CMS_PUBLICATION_EXPORT_TOKEN).toBe(
        `\${{ secrets.${target.toUpperCase()}_CMS_PUBLICATION_EXPORT_TOKEN }}`,
      );
      expect(restore.run).toContain('restore-published-content.mjs');
      expect(restore.run).toContain(`"$tool" ${target}`);
    }
    // Staff previews moved to promotion acceptance; candidate preparation installs no browser.
    expect(prdSteps.join('\n')).not.toContain('run-release-preparation.mjs browsers');
    expect(JSON.stringify(prdBuild)).not.toContain('playwright');
    expect(assembly.needs).toEqual(['check-candidate', 'prepare-uat', 'prepare-prd']);
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

  it('reuses the Astro image cache and validates the single target staff build', () => {
    const cache = (job: typeof uatBuild) =>
      job.steps.find((step: { name?: string }) => step.name === 'Restore Astro image cache');
    expect(cache(prdBuild)).toEqual(cache(uatBuild));
    expect(cache(prdBuild).with.path).toBe('apps/web/node_modules/.astro/assets');
    const restoreReport = uatBuild.steps.find(
      (step: { name?: string }) => step.name === 'Record Astro image cache restore',
    );
    const candidate = uatBuild.steps.find(
      (step: { name?: string }) => step.name === 'Measure Astro image cache candidate',
    );
    const frontendBuildIndex = uatBuild.steps.findIndex(
      (step: { name?: string }) => step.name === 'Build hosted UAT static frontend',
    );
    expect(restoreReport.id).toBe('astro-cache-restore-report');
    expect(restoreReport.env.ASTRO_CACHE_FINGERPRINT).toBe(
      "${{ hashFiles('apps/web/node_modules/.astro/assets/**') }}",
    );
    expect(restoreReport.run).toContain('fingerprint=${ASTRO_CACHE_FINGERPRINT}');
    expect(uatBuild.steps.indexOf(restoreReport)).toBeLessThan(frontendBuildIndex);
    expect(uatBuild.steps.indexOf(candidate)).toBeGreaterThan(frontendBuildIndex);
    expect(candidate.env.ASTRO_CACHE_FINGERPRINT_BEFORE).toBe(
      '${{ steps.astro-cache-restore-report.outputs.fingerprint }}',
    );
    expect(candidate.env.ASTRO_CACHE_FINGERPRINT_AFTER).toBe(
      "${{ hashFiles('apps/web/node_modules/.astro/assets/**') }}",
    );
    expect(candidate.run.indexOf('if [[ -z "$ASTRO_CACHE_FINGERPRINT_AFTER" ]]')).toBeLessThan(
      candidate.run.indexOf('elif [[ "$ASTRO_CACHE_FINGERPRINT_AFTER" == "$ASTRO_CACHE_FINGERPRINT_BEFORE" ]]'),
    );
    expect(candidate.run).toContain('bytes <= 629145600');
    for (const stepName of ['Start Astro image cache save timer', 'Save Astro image cache']) {
      expect(uatBuild.steps.find((step: { name?: string }) => step.name === stepName).if).toBe(
        "${{ steps.astro-cache-candidate.outputs.save == 'true' }}",
      );
    }
    expect(prdBuild.steps.some((step: { name?: string }) => step.name === 'Measure Astro image cache candidate')).toBe(
      false,
    );
    const cmsBuild = readFileSync(
      fileURLToPath(new URL('../apps/backend/scripts/build-cms.mjs', import.meta.url)),
      'utf8',
    );
    expect(cmsBuild).toContain("['--dir', '../..', 'build:staff']");
    expect(cmsBuild).toContain('validateCmsFreeTier');
  });

  it('keeps UAT inspection built-in-only after downloading the candidate', () => {
    const steps = workflow.jobs['inspect-uat-pages'].steps;
    expect(steps.some((step: { name?: string }) => step.name === 'Setup pnpm')).toBe(false);
    expect(steps.some((step: { name?: string }) => step.name === 'Install dependencies')).toBe(false);
    expect(steps.some((step: { uses?: string }) => step.uses?.startsWith('actions/cache/'))).toBe(false);
    expect(steps.find((step: { name?: string }) => step.name === 'Setup Node.js').with['node-version-file']).toBe(
      '.node-version',
    );
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
      expect(download.with.name).toBe('release-${{ inputs.artifact_commit_sha }}');
      expect(JSON.stringify(job)).not.toContain('pnpm build');
      expect(prdSequence.env.SOURCE_SHA).toBe('${{ inputs.artifact_commit_sha || github.sha }}');
      expect(job.steps[0].with.ref).toBe('${{ github.sha }}');
    }
    expect(JSON.stringify(promotion)).toContain('/prd/cms/server/wrangler.json');
    expect(JSON.stringify(staticPromotion)).toContain('/prd/public --project-name=blackbox-records-web --branch=main');
    expect(JSON.stringify(staticPromotion)).not.toContain('blackbox-records-staff');
    expect(JSON.stringify(uatSequence.jobs['deploy-uat'])).not.toMatch(/d1:seed:.*catalog|stripe:catalog:verify/);
    expect(workflow.jobs['uat-release'].needs).toEqual(['check-candidate', 'prepare-uat', 'inspect-uat-pages']);
    expect(JSON.stringify(workflow.jobs['uat-release'].needs)).not.toContain('prepare-prd');
  });

  it('cancels only preparation and holds one shared non-cancelling lock through mutations and acceptance', () => {
    const lock = { group: 'blackbox-release', 'cancel-in-progress': false };
    expect(workflow.concurrency).toEqual({
      group: "${{ inputs.target == 'prd' && 'blackbox-release' || format('blackbox-preparation-{0}', github.run_id) }}",
      'cancel-in-progress': false,
    });
    const caller = workflow.jobs['uat-release'];
    expect(caller.concurrency).toEqual(lock);
    expect(caller.uses).toBe('./.github/workflows/uat-release-sequence.yml');
    expect(caller.secrets).toBe('inherit');
    expect(caller.with.artifact_commit_sha).toBe('${{ inputs.artifact_commit_sha || github.sha }}');
    expect(uatSequence.concurrency).toBeUndefined();
    expect(JSON.stringify(uatSequence.env)).not.toContain('secrets.');
    for (const role of ['deploy-uat', 'deploy-uat-static']) {
      expect(uatSequence.jobs[role].concurrency).toBeUndefined();
    }
    for (const job of [uatSequence.jobs['deploy-uat'], workflow.jobs['accept-uat-providers']]) {
      expect(job.environment).toBe('catalog-promotion-uat');
      expect(job.steps[0].run).toContain(
        'CLOUDFLARE_API_TOKEN STRIPE_SECRET_KEY STRIPE_PAYMENT_METHOD_CONFIGURATION_ID',
      );
      expect(job.steps[0].run).toContain('exit 1');
    }
    for (const role of ['check-candidate', 'prepare-uat', 'prepare-prd', 'assemble-candidate']) {
      const concurrency = workflow.jobs[role].concurrency;
      expect(concurrency['cancel-in-progress']).toBe(true);
      expect(concurrency.group).toContain('github.ref');
      expect(concurrency.group).toContain('github.run_id');
    }
    // Acceptance and PRD mutation share the workflow-level release lock; a job-level group would split it.
    for (const role of ['deploy-prd', 'deploy-prd-static', 'catalog-prd', ...acceptanceJobs]) {
      expect(workflow.jobs[role].concurrency).toBeUndefined();
    }
    expect(uatSequence.jobs['deploy-uat-static'].needs).toBe('deploy-uat');
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

describe('CI cache reuse and the scheduled backstop', () => {
  it('carries no Nx cache between candidate check runs', () => {
    // Nx 23 names its task database after the machine id and does not support a local cache from another
    // machine, so a restored ~/.nx is never used and only consumes the repository cache quota.
    expect(JSON.stringify(checks.steps)).not.toContain('.nx');
    expect(runs(checks)).not.toContain('--skip-nx-cache');
  });

  it('restores publication media from a digest-checked cache and saves it only when changed and bounded', () => {
    for (const [target, job] of [
      ['uat', uatBuild],
      ['prd', prdBuild],
    ] as const) {
      const names = job.steps.map((step: Step) => step.name);
      const publicationRestore = `Restore current ${target.toUpperCase()} publication`;
      expect(stepNamed(job, publicationRestore).env?.CMS_PUBLICATION_MEDIA_CACHE).toBe(
        '.codex-artifacts/publication-media',
      );
      expect(names.indexOf('Record publication media cache restore')).toBeLessThan(names.indexOf(publicationRestore));
      expect(names.indexOf('Measure publication media cache candidate')).toBeGreaterThan(
        names.indexOf(publicationRestore),
      );
      const restore = stepNamed(job, 'Restore publication media cache') as Step & { with: Record<string, string> };
      expect(restore.with.key).toBe('publication-media-v1-${{ github.job }}-${{ github.run_id }}');
      // Outside the uploaded release bundle and the must-be-new restore destination.
      expect(restore.with.path).toBe('.codex-artifacts/publication-media');
      const save = stepNamed(job, 'Save publication media cache') as Step & { with: Record<string, string> };
      expect(save.if).toBe("${{ steps.media-cache-candidate.outputs.save == 'true' }}");
      expect(save.with.key).toBe('${{ steps.media-cache.outputs.cache-primary-key }}');
      const measure = stepNamed(job, 'Measure publication media cache candidate').run!;
      expect(measure).toContain('bytes <= 536870912');
      expect(measure.indexOf('(unchanged)')).toBeLessThan(measure.indexOf('save=true'));
    }
  });

  it('runs the complete uncached validation weekly and on demand without credentials', () => {
    const full = allWorkflows.find(({ file }) => file === 'full-validation.yml')?.workflow;
    expect(full).toBeDefined();
    expect(full.on.schedule).toHaveLength(1);
    expect(full.on.workflow_dispatch).toBeNull();
    expect(full.permissions).toEqual({ contents: 'read' });
    const job = full.jobs.validate;
    expect(job['timeout-minutes']).toBeLessThanOrEqual(60);
    expect(runs(job)).toContain('pnpm validate:full --no-cache');
    const upload = job.steps.find((step: Step) => step.uses?.startsWith('actions/upload-artifact@'));
    expect(upload).toMatchObject({ if: '${{ failure() }}', with: { path: '.codex-artifacts/validation' } });
    expect(JSON.stringify(full)).not.toMatch(/secrets\.|environment/);
  });
});
