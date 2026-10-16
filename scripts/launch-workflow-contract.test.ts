import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { parse } from 'yaml';
import { describe, expect, it, vi } from 'vitest';

const workflow = parse(readFileSync(new URL('../.github/workflows/launch-switch.yml', import.meta.url), 'utf8'));
const require = createRequire(import.meta.url);
const steps = [...workflow.jobs.request.steps, ...workflow.jobs.launch.steps];

// Execute the workflow's actual Node blocks with isolated files and GitHub replies.
function execute(
  name: string,
  options: { env?: Record<string, string>; date?: string; runs?: unknown[]; files?: Record<string, string> } = {},
) {
  const files = { ...options.files };
  const env = {
    GITHUB_REF: 'refs/heads/main',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    INPUT_STAGE: 'cutover',
    INPUT_DRY_RUN: 'true',
    GITHUB_OUTPUT: 'outputs',
    GITHUB_STEP_SUMMARY: 'summary',
    RUNNER_TEMP: 'temporary',
    GITHUB_REPOSITORY: 'owner/repo',
    ...options.env,
  };
  const gh = vi.fn((_command: string, _args: string[], _options: object) => JSON.stringify(options.runs ?? []));
  const fs = {
    appendFileSync: (file: string, text: string) => {
      files[file] = (files[file] ?? '') + text;
    },
    writeFileSync: (file: string, text: string) => {
      files[file] = text;
    },
    mkdirSync: () => {},
    existsSync: (file: string) => file in files,
    readFileSync: (file: string) => {
      assert.ok(file in files, `Missing ${file}`);
      return files[file];
    },
    readdirSync: (directory: string) =>
      Object.keys(files)
        .filter((file) => file.startsWith(path.normalize(directory) + path.sep))
        .map((file) => path.relative(directory, file)),
    copyFileSync: (source: string, target: string) => {
      assert.ok(source in files, 'Missing snapshot');
      files[target] = files[source];
    },
  };
  const script = steps.find((step: { name: string }) => step.name === name).run.match(/<<'NODE'\n([\s\S]+)\nNODE/)[1];
  runInNewContext(script, {
    require: (module: string) =>
      module === 'node:fs' ? fs : module === 'node:child_process' ? { execFileSync: gh } : require(module),
    process: { env },
    Date: class extends Date {
      constructor() {
        super(options.date ?? '2026-10-15T20:00:00Z');
      }
    },
  });
  return { files, gh };
}

describe('Launch workflow recovery and authorization', () => {
  it('limits the schedule to its authorized UTC date and keeps manual dry-runs available', () => {
    for (const date of ['2026-10-15T23:59:59Z', '2026-10-17T00:00:00Z', '2027-10-16T07:00:00Z']) {
      const result = execute('Resolve launch request', { date, env: { GITHUB_EVENT_NAME: 'schedule' } });
      expect(result.files.outputs).toBeUndefined();
      expect(result.files.summary).toContain('skipped');
    }
    expect(
      execute('Resolve launch request', { date: '2026-10-16T07:00:00Z', env: { GITHUB_EVENT_NAME: 'schedule' } }).files
        .outputs,
    ).toBe('execute=true\nstage=cutover\ndry_run=false\n');
    expect(execute('Resolve launch request').files.outputs).toBe('execute=true\nstage=cutover\ndry_run=true\n');
    expect(() => execute('Resolve launch request', { env: { GITHUB_REF: 'refs/heads/other' } })).toThrow(
      'Launch requires main',
    );
  });

  it('restores the latest real cutover even when it failed, ignoring newer dry-runs', () => {
    const snapshot = path.join('temporary', 'launch-cutover-state', 'snapshot.json');
    const { files, gh } = execute('Restore cutover snapshot', {
      runs: [
        { databaseId: 30, displayTitle: 'Launch cutover (dry-run)', conclusion: 'success' },
        { databaseId: 29, displayTitle: 'Launch cutover (live)', conclusion: 'failure' },
        { databaseId: 28, displayTitle: 'Launch cutover (live)', conclusion: 'success' },
      ],
      files: { [snapshot]: '{"cutoverAt":"2026-10-16T07:00:00Z"}' },
    });
    expect(gh.mock.calls[1]?.[1]).toContain('29');
    expect(files['.codex-artifacts/launch/snapshot.json']).toBe(files[snapshot]);
    expect(() =>
      execute('Restore cutover snapshot', { runs: [{ databaseId: 29, displayTitle: 'Launch cutover (live)' }] }),
    ).toThrow('Missing snapshot');
    expect(() => execute('Restore cutover snapshot')).toThrow('No real cutover run found');
  });

  it('shows failures and the printed manual links in the phone summary', () => {
    const directory = '.codex-artifacts/launch';
    const result = execute('Write launch summary', {
      files: {
        [path.join(directory, 'cutover', 'run', 'summary.json')]: JSON.stringify({
          stage: 'cutover',
          status: 'failed',
          error: 'Launch checks failed',
          steps: [
            { name: 'DNS', status: 'passed' },
            { name: 'Home', status: 'failed', error: 'Unexpected | release' },
          ],
        }),
        [path.join(directory, 'command.log')]: 'DNS: passed\nhttps://search.google.com/search-console/sitemaps\n',
      },
    });
    expect(result.files.summary).toContain('Status: **failed**');
    expect(result.files.summary).toContain('| DNS | passed |');
    expect(result.files.summary).toContain('| Home | failed | Unexpected \\| release |');
    expect(result.files.summary).toContain('Error: Launch checks failed');
    expect(result.files.summary).toContain('<https://search.google.com/search-console/sitemaps>');
    expect(execute('Write launch summary', { env: { LAUNCH_JOB_STATUS: 'failure' } }).files.summary).toContain(
      'No launch summary was produced',
    );
  });

  it('keeps safe defaults, serial execution, failure propagation and recovery artifacts', () => {
    expect(workflow.on.schedule).toEqual([{ cron: '30 10 16 10 *' }]);
    expect(workflow.on.workflow_dispatch.inputs.dry_run.default).toBe(true);
    expect(workflow.permissions).toEqual({ contents: 'read', actions: 'read' });
    expect(workflow.concurrency).toEqual({ group: 'launch-switch', 'cancel-in-progress': false });
    expect(workflow.jobs.launch.environment).toBe('prd-launch');
    expect(workflow.jobs.launch.if).toBe("needs.request.outputs.execute == 'true'");
    const run = steps.find((step: { name: string }) => step.name === 'Run launch stage');
    expect(run.shell).toBe('bash'); // Actions' explicit bash uses pipefail, including the tee pipeline.
    expect(run['continue-on-error']).toBeUndefined();
    expect(workflow.jobs.launch['continue-on-error']).toBeUndefined();
    const upload = steps.find((step: { name: string }) => step.name === 'Preserve launch state');
    expect(upload.if).toBe('always()');
    expect(upload.with).toMatchObject({
      name: 'launch-state',
      path: '.codex-artifacts/launch/**',
      'include-hidden-files': true,
      'retention-days': 90,
    });
  });
});
