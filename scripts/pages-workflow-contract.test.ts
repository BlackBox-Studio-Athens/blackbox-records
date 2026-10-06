import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

// Shape-free release invariants. Job names, step order and wiring belong to the workflows, not to this test.
type Concurrency = { group?: string; 'cancel-in-progress'?: boolean };
type Step = { name?: string; uses?: string; run?: string; with?: Record<string, unknown> };
type Job = { environment?: unknown; concurrency?: Concurrency; steps?: Step[] };
const directory = fileURLToPath(new URL('../.github/workflows/', import.meta.url));
const workflows = readdirSync(directory)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const text = readFileSync(directory + file, 'utf8');
    const definition = parse(text) as {
      on: Record<string, unknown> | string;
      concurrency?: Concurrency;
      jobs: Record<string, Job>;
    };
    return { file, text, definition, jobs: Object.entries(definition.jobs) };
  });
const jobs = workflows.flatMap(({ file, definition, jobs: entries }) =>
  entries.map(([name, job]) => ({ id: `${file}:${name}`, job, workflow: definition })),
);
const promotion = workflows.find(({ file }) => file === 'promote-prd.yml')!;
const releaseLocks = ['release-uat', 'release-prd', 'blackbox-release'];

describe('Release workflow invariants', () => {
  it('binds the PRD environment only in the manual promotion workflow', () => {
    for (const { id, job } of jobs)
      if (JSON.stringify(job.environment ?? '').includes('catalog-promotion-prd'))
        expect(id.startsWith('promote-prd.yml:'), id).toBe(true);
    expect(promotion.definition.on).toBe('workflow_dispatch');
  });

  it('keeps PRD secrets out of every workflow a push can start', () => {
    for (const { file, text, definition } of workflows)
      if (typeof definition.on === 'object' && 'push' in definition.on)
        expect(text, file).not.toMatch(/secrets\.PRD_\w+|catalog-promotion-prd/);
  });

  it('starts the release only from main pushes, decided by changed paths and with no manual or message-driven entry', () => {
    const { definition, text } = workflows.find(({ file }) => file === 'pages.yml')!;
    expect(definition.on).toEqual({
      push: { branches: ['main'], 'paths-ignore': ['docs/**', 'openspec/**', '*.md', 'LICENSE'] },
    });
    expect(text).not.toMatch(
      /head_commit|commit\.message|github\.event\.commits|workflow_dispatch|artifact_commit_sha|candidate_run_id|confirm_code_promotion/,
    );
  });

  it('proves the candidate from main before the promotion checks out its code', () => {
    const steps = promotion.jobs.flatMap(([, job]) => job.steps ?? []);
    const resolve = steps.findIndex((step) => step.run?.includes('release-candidate.mjs resolve'));
    const candidate = steps.findIndex((step) => step.uses?.startsWith('actions/checkout@') && step.with?.ref);
    expect(resolve).toBeGreaterThan(-1);
    expect(candidate).toBeGreaterThan(resolve);
    expect(steps.findIndex((step) => step.run?.includes('refs/heads/main'))).toBeLessThan(resolve);
  });

  it('never enables checkout, touches the live catalog or dispatches workflows', () => {
    for (const { file, text } of workflows)
      expect(text, file).not.toMatch(
        /PRD_LAUNCH_APPROVED=true|PRD_OPEN_GATE|native_checkout_enabled=true|stripe:catalog:reset|stripe:catalog:verify|d1:seed:.*catalog|confirm-live-catalog-changes|gh workflow run/,
      );
  });

  it('runs the provider smoke only from the manual smoke workflow', () => {
    for (const { file, text } of workflows)
      if (file !== 'uat-smoke.yml') expect(text, file).not.toMatch(/smoke:(stripe|resend)-uat/);
  });

  it('cancels only jobs that hold no environment or mutating credential, and never a release lock', () => {
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
        if (releaseLocks.includes(lock?.group ?? '')) expect(lock?.['cancel-in-progress'], id).toBe(false);
    // An environment-bound job always runs under a non-cancelling lock.
    for (const { id, job, workflow } of jobs)
      if (job.environment) expect((job.concurrency ?? workflow.concurrency)?.['cancel-in-progress'], id).toBe(false);
  });

  it('never persists the checkout token and reads toolchain versions from repository files', () => {
    const steps = jobs.flatMap(({ job }) => job.steps ?? []);
    const using = (action: string) => steps.filter((step) => step.uses?.startsWith(`${action}@`));
    for (const step of using('actions/checkout')) expect(step.with?.['persist-credentials']).toBe(false);
    for (const step of using('pnpm/action-setup')) expect(step.with?.version).toBeUndefined();
    for (const step of using('actions/setup-node')) expect(step.with?.['node-version-file']).toBe('.node-version');
  });
});
