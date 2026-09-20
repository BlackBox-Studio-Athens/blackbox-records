import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const DEFAULT_WINDOW_DAYS = 30;
const REQUIRED_UAT_JOBS = ['build-candidate', 'inspect-uat-pages', 'deploy-uat', 'deploy-uat-static', 'smoke-uat'];

export function classifyRun(run) {
  const workflow = String(run.workflow_path ?? run.path ?? run.workflow ?? '');
  const inputs = run.inputs ?? {};
  if (workflow.endsWith('/pages.yml') || workflow === '.github/workflows/pages.yml') {
    if (inputs.target === 'prd' && (inputs.confirm_code_promotion === true || inputs.confirm_code_promotion === 'true'))
      return 'prd-promotion';
    if (inputs.target === 'prd') return 'prd-catalog';
    return run.event === 'push' || run.event === 'workflow_dispatch' ? 'uat-candidate' : 'diagnostic';
  }
  return 'diagnostic';
}

function successfulRun(run) {
  return run.status === 'completed' && run.conclusion === 'success';
}

function timestamp(value) {
  const result = Date.parse(value ?? '');
  return Number.isFinite(result) ? result : null;
}

function duration(start, end) {
  const startedAt = timestamp(start);
  const endedAt = timestamp(end);
  return startedAt !== null && endedAt !== null && endedAt >= startedAt ? endedAt - startedAt : null;
}

export function measureAttempt(run, jobs) {
  const relevant = jobs.filter((job) => job.conclusion !== 'skipped');
  const timed = relevant
    .map((job) => ({ ...job, durationMs: duration(job.started_at, job.completed_at) }))
    .filter((job) => job.durationMs !== null);
  const firstStartedAt =
    timed
      .map((job) => timestamp(job.started_at))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)[0] ?? null;
  const lastCompletedAt =
    timed
      .map((job) => timestamp(job.completed_at))
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0] ?? null;
  const requiredNames = classifyRun(run) === 'uat-candidate' ? REQUIRED_UAT_JOBS : [];
  const presentNames = new Set(relevant.map((job) => job.name));
  const missingJobs = requiredNames.filter((name) => !presentNames.has(name));
  const executionMs = firstStartedAt !== null && lastCompletedAt !== null ? lastCompletedAt - firstStartedAt : null;
  const queuedMs =
    firstStartedAt === null ? null : Math.max(0, firstStartedAt - (timestamp(run.run_started_at) ?? firstStartedAt));
  return {
    runId: String(run.id ?? ''),
    attempt: Number(run.run_attempt ?? 1),
    classification: classifyRun(run),
    sourceSha: run.head_sha ?? null,
    workflowSha: run.workflow_sha ?? null,
    event: run.event ?? null,
    status: run.status ?? null,
    conclusion: run.conclusion ?? null,
    successful: successfulRun(run),
    executionMs,
    queuedMs,
    manualRerunGapMs: null,
    jobSeconds: timed.reduce((total, job) => total + job.durationMs, 0) / 1000,
    jobCount: relevant.length,
    missingJobs,
    jobs: timed.map((job) => ({ name: job.name, conclusion: job.conclusion, durationMs: job.durationMs })),
    metadata: {
      cache: run.cache ?? null,
      artifacts: run.artifacts ?? null,
      content: run.content ?? null,
    },
    valid: executionMs !== null && missingJobs.length === 0 && relevant.every((job) => job.conclusion !== 'failure'),
  };
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

export function summarizeMeasurements(measurements) {
  const groups = {};
  for (const measurement of measurements) {
    const key = measurement.classification;
    (groups[key] ??= []).push(measurement);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([classification, entries]) => {
      const execution = entries.map((entry) => entry.executionMs).filter(Number.isFinite);
      const successful = entries.filter((entry) => entry.successful && entry.valid);
      return [
        classification,
        {
          sampleCount: entries.length,
          successfulCount: successful.length,
          conclusionCounts: Object.fromEntries(
            entries.reduce(
              (counts, entry) =>
                counts.set(entry.conclusion ?? 'unknown', (counts.get(entry.conclusion ?? 'unknown') ?? 0) + 1),
              new Map(),
            ),
          ),
          executionMs: {
            median: percentile(execution, 0.5),
            p75: percentile(execution, 0.75),
            p90: percentile(execution, 0.9),
          },
          totalJobSeconds: entries.reduce((total, entry) => total + (entry.jobSeconds ?? 0), 0),
          confidence: successful.length >= 5 ? 'high' : successful.length ? 'low' : 'unavailable',
          failures: entries
            .filter((entry) => !entry.successful || !entry.valid)
            .map((entry) => ({ runId: entry.runId, conclusion: entry.conclusion })),
        },
      ];
    }),
  );
}

export function renderMeasurementReport({ window, summary }) {
  const lines = [
    '# CI speed measurement',
    '',
    `Window: ${window.from} → ${window.to}`,
    '',
    '| Classification | Samples | Successful | Median | p75 | p90 | Job seconds | Confidence |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const [classification, group] of Object.entries(summary)) {
    const seconds = (value) => (value === null ? 'unavailable' : `${(value / 1000).toFixed(1)}s`);
    lines.push(
      `| ${classification} | ${group.sampleCount} | ${group.successfulCount} | ${seconds(group.executionMs.median)} | ${seconds(group.executionMs.p75)} | ${seconds(group.executionMs.p90)} | ${group.totalJobSeconds.toFixed(1)} | ${group.confidence} |`,
    );
  }
  lines.push(
    '',
    'Failures, cancellations, reruns, missing timing, and unavailable cache/content metadata remain in `raw.json` and `summary.json`.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

async function ghJson(endpoint) {
  const { stdout } = await execFileAsync('gh', ['api', endpoint], { encoding: 'utf8' });
  return JSON.parse(stdout);
}

export async function collectMeasurements({ repository, workflow = 'pages.yml', from, to, read = ghJson }) {
  const runs = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await read(
      `repos/${repository}/actions/runs?workflow=${encodeURIComponent(workflow)}&per_page=100&page=${page}`,
    );
    const pageRuns = response.workflow_runs ?? [];
    runs.push(
      ...pageRuns.filter((run) => {
        const created = timestamp(run.created_at);
        return created !== null && created >= from && created <= to;
      }),
    );
    if (pageRuns.length < 100) break;
  }
  const measurements = [];
  for (const run of runs) {
    const attempt = Number(run.run_attempt ?? 1);
    const jobs = await read(`repos/${repository}/actions/runs/${run.id}/attempts/${attempt}/jobs?per_page=100`);
    measurements.push(measureAttempt(run, jobs.jobs ?? []));
  }
  return measurements;
}

async function main() {
  const { values } = parseArgs({
    options: {
      repository: { type: 'string', default: process.env.GITHUB_REPOSITORY },
      workflow: { type: 'string', default: 'pages.yml' },
      from: { type: 'string' },
      to: { type: 'string' },
      raw: { type: 'string' },
      output: { type: 'string', default: '.codex-artifacts/ci-speed-analysis' },
    },
  });
  assert(values.repository, 'Specify --repository or GITHUB_REPOSITORY.');
  const to = timestamp(values.to) ?? Date.now();
  const from = timestamp(values.from) ?? to - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  assert(from <= to, 'The measurement window is invalid.');
  const output = path.resolve(values.output);
  await mkdir(output, { recursive: true });
  const measurements = values.raw
    ? JSON.parse(await readFile(values.raw, 'utf8'))
    : await collectMeasurements({ repository: values.repository, workflow: values.workflow, from, to });
  await writeFile(path.join(output, 'raw.json'), `${JSON.stringify(measurements, null, 2)}\n`);
  const summary = summarizeMeasurements(measurements);
  await writeFile(path.join(output, 'summary.json'), `${JSON.stringify({ window: { from, to }, summary }, null, 2)}\n`);
  await writeFile(path.join(output, 'report.md'), renderMeasurementReport({ window: { from, to }, summary }));
  console.log(`CI speed evidence: ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
