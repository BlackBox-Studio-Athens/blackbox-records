import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

// Shape-free release invariants. Job names, step order and wiring belong to the workflows, not to this test.
type Concurrency = { group?: string; 'cancel-in-progress'?: boolean };
type Step = { name?: string; uses?: string; with?: Record<string, unknown> };
type Job = { if?: string; environment?: unknown; concurrency?: Concurrency; steps?: Step[] };
const directory = fileURLToPath(new URL('../.github/workflows/', import.meta.url));
const workflows = readdirSync(directory)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const text = readFileSync(directory + file, 'utf8');
    const definition = parse(text) as { concurrency?: Concurrency; jobs: Record<string, Job> };
    return { file, text, definition, jobs: Object.entries(definition.jobs) };
  });
const jobs = workflows.flatMap(({ file, definition, jobs: entries }) =>
  entries.map(([name, job]) => ({ id: `${file}:${name}`, job, workflow: definition })),
);
// A job whose condition starts with the PRD dispatch and has no `||` cannot run on a push.
const promotionOnly = (job: Job) => {
  const condition = (job.if ?? '').replace(/^\$\{\{\s*/, '');
  return (
    condition.startsWith("github.event_name == 'workflow_dispatch' && inputs.target == 'prd'") &&
    !condition.includes('||')
  );
};

describe('Release workflow invariants', () => {
  it('binds the PRD environment only in jobs gated on the PRD dispatch', () => {
    for (const { id, job } of jobs)
      if (JSON.stringify(job.environment ?? '').includes('catalog-promotion-prd'))
        expect(promotionOnly(job), id).toBe(true);
  });

  it('keeps PRD secrets out of push-reachable jobs except the PRD_CMS_* restore secrets', () => {
    for (const { id, job } of jobs)
      if (!promotionOnly(job)) expect(JSON.stringify(job).match(/secrets\.PRD_(?!CMS_)\w+/g) ?? [], id).toEqual([]);
  });

  it('verifies main ancestry before a code-promotion job checks out the candidate', () => {
    for (const { id, job } of jobs) {
      const checksOutCandidate = (job.steps ?? []).some(
        (step) =>
          step.uses?.startsWith('actions/checkout@') && String(step.with?.ref).includes('inputs.artifact_commit_sha'),
      );
      // Catalog jobs (`!inputs.confirm_code_promotion`) predate this rule and are removed with the catalog workflow.
      if (promotionOnly(job) && /(?<!!)inputs\.confirm_code_promotion/.test(job.if ?? '') && checksOutCandidate)
        expect(job.steps?.[0]?.name, id).toBe('Require immutable main source');
    }
  });

  it('never enables checkout, resets the catalog or dispatches workflows', () => {
    for (const { file, text } of workflows)
      expect(text, file).not.toMatch(
        /PRD_LAUNCH_APPROVED=true|native_checkout_enabled=true|stripe:catalog:reset|gh workflow run/,
      );
  });

  it('runs the provider smoke only from the manual smoke workflow', () => {
    for (const { file, text } of workflows)
      if (file !== 'uat-smoke.yml') expect(text, file).not.toMatch(/smoke:(stripe|resend)-uat/);
  });

  it('cancels only jobs that hold no environment or mutating credential, and never the release lock', () => {
    for (const { id, job, workflow } of jobs) {
      const cancellable =
        job.concurrency?.['cancel-in-progress'] === true || workflow.concurrency?.['cancel-in-progress'] === true;
      if (cancellable) {
        expect(job.environment, id).toBeUndefined();
        expect(JSON.stringify(job), id).not.toMatch(/secrets\.(CLOUDFLARE_API_TOKEN|STRIPE_SECRET_KEY)/);
      }
    }
    for (const { id, job, workflow } of jobs)
      for (const lock of [job.concurrency, workflow.concurrency])
        if (lock?.group === 'blackbox-release') expect(lock['cancel-in-progress'], id).toBe(false);
  });

  it('never persists the checkout token and reads toolchain versions from repository files', () => {
    const steps = jobs.flatMap(
      ({ job }) => (job as { steps?: { uses?: string; with?: Record<string, unknown> }[] }).steps ?? [],
    );
    const using = (action: string) => steps.filter((step) => step.uses?.startsWith(`${action}@`));
    for (const step of using('actions/checkout')) expect(step.with?.['persist-credentials']).toBe(false);
    for (const step of using('pnpm/action-setup')) expect(step.with?.version).toBeUndefined();
    for (const step of using('actions/setup-node')) expect(step.with?.['node-version-file']).toBe('.node-version');
  });
});
