import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../../..');
const source = readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const release = parse(source);

describe('one gated release', () => {
  it('gates every deployment on both catalog preparations and repository checks', () => {
    function dependencies(id: string): string[] {
      return (release.jobs[id].needs ?? []).flatMap((name: string) => [name, ...dependencies(name)]);
    }
    for (const [id, job] of Object.entries(release.jobs)) {
      if (!id.startsWith('deploy-')) continue;
      expect(dependencies(id)).toEqual(
        expect.arrayContaining([
          'catalog-uat',
          'catalog-prd',
          'unit-tests',
          'workspace-checks',
          'build-uat-static',
          'build-prd-static',
        ]),
      );
      expect((job as { if?: string }).if ?? '').not.toContain('always()');
    }
  });

  it('uses one immutable source revision and one non-cancelling lock', () => {
    expect(release.concurrency).toEqual({ group: 'blackbox-release', 'cancel-in-progress': false });
    for (const job of Object.values(release.jobs) as Array<{
      steps: Array<{ uses?: string; with?: { ref?: string } }>;
    }>) {
      for (const step of job.steps) {
        if (step.uses?.startsWith('actions/checkout@'))
          expect(step.with?.ref).toBe('${{ inputs.artifact_commit_sha || github.sha }}');
      }
    }
    expect(release.jobs['smoke-uat'].needs).toEqual(['deploy-uat']);
    expect(source).not.toMatch(/gh workflow run|git commit|DELETE FROM|stripe:catalog:reset/);
  });

  it('gates content-only and mixed commits identically without bot workflows', () => {
    expect(release.on.push['paths-ignore']).toEqual(['docs/**', 'openspec/**', '*.md', 'LICENSE']);
    expect(existsSync(path.join(root, '.github/workflows/catalog-promotion.yml'))).toBe(false);
    expect(existsSync(path.join(root, '.github/workflows/catalog-artifacts.yml'))).toBe(false);
  });

  it('requires one-run authorization for every PRD catalog mutation', () => {
    expect(release.on.workflow_dispatch.inputs.confirm_live_catalog_changes.default).toBe(false);
    const mutation = release.jobs['catalog-prd'].steps.find((step: { run?: string }) => step.run?.includes('--apply'));
    expect(mutation.if).toBe('${{ inputs.confirm_live_catalog_changes }}');
    expect(mutation.run).toContain('--confirm-live-catalog-changes');
    expect(source).not.toContain('PRD_LAUNCH_APPROVED=true');
  });
});
