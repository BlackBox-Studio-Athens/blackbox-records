import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const DEFAULT_WINDOW_DAYS = 30;
const CURRENT_UAT_JOBS = [
  'check-candidate',
  'prepare-uat',
  'prepare-prd',
  'assemble-candidate',
  'inspect-uat-pages',
  'deploy-uat',
  'deploy-uat-static',
  'smoke-uat',
];
const LEGACY_UAT_JOBS = ['build-candidate', 'inspect-uat-pages', 'deploy-uat', 'deploy-uat-static', 'smoke-uat'];

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
  const presentNames = new Set(relevant.map((job) => job.name));
  const requiredNames =
    classifyRun(run) !== 'uat-candidate'
      ? []
      : presentNames.has('check-candidate')
        ? CURRENT_UAT_JOBS
        : LEGACY_UAT_JOBS;
  const hasJob = (required) => [...presentNames].some((name) => name === required || name.endsWith(` / ${required}`));
  const missingJobs = requiredNames.filter((name) => !hasJob(name));
  const executionMs = firstStartedAt !== null && lastCompletedAt !== null ? lastCompletedAt - firstStartedAt : null;
  const queuedMs = firstStartedAt === null ? null : duration(run.created_at, new Date(firstStartedAt).toISOString());
  const steps = timed.flatMap(({ name: jobName, steps = [] }) =>
    steps.map((step) => ({ ...step, jobName, durationMs: duration(step.started_at, step.completed_at) })),
  );
  const stepMeasure = (names) => {
    const matching = steps.filter(({ name }) => names.test(name));
    if (!matching.length || matching.some(({ durationMs }) => durationMs === null))
      return { elapsedMs: null, runnerSeconds: null };
    const jobWindows = Map.groupBy(matching, ({ jobName }) => jobName);
    const elapsedByJob = [...jobWindows.values()].map((jobSteps) => {
      const starts = jobSteps.map(({ started_at }) => timestamp(started_at));
      const ends = jobSteps.map(({ completed_at }) => timestamp(completed_at));
      return starts.some((value) => value === null) || ends.some((value) => value === null)
        ? null
        : Math.max(...ends) - Math.min(...starts);
    });
    if (elapsedByJob.some((value) => value === null)) return { elapsedMs: null, runnerSeconds: null };
    const elapsedMs = Math.max(...elapsedByJob);
    return {
      elapsedMs: elapsedMs >= 0 ? elapsedMs : null,
      runnerSeconds: matching.reduce((total, step) => total + step.durationMs, 0) / 1000,
    };
  };
  const setup = stepMeasure(/setup|install|dependency/i);
  const artifactTransfer = stepMeasure(/(?:artifact|bundle).*(?:upload|download)|(?:upload|download).*(?:artifact|bundle)/i);
  const quickStep = steps.find(({ name }) => /quick.*uat|uat.*quick/i.test(name));
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
    pushToPromotionReadyMs:
      classifyRun(run) === 'uat-candidate' && successfulRun(run) && lastCompletedAt !== null
        ? duration(run.created_at, new Date(lastCompletedAt).toISOString())
        : null,
    queuedMs,
    manualRerunGapMs: null,
    jobSeconds: timed.length === relevant.length ? timed.reduce((total, job) => total + job.durationMs, 0) / 1000 : null,
    setupElapsedMs: setup.elapsedMs,
    setupRunnerSeconds: setup.runnerSeconds,
    artifactTransferElapsedMs: artifactTransfer.elapsedMs,
    artifactTransferRunnerSeconds: artifactTransfer.runnerSeconds,
    uatQuickFeedbackMs: quickStep ? duration(run.created_at, quickStep.completed_at) : null,
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
      const successful = entries.filter((entry) => entry.successful && entry.valid);
      const execution = successful.map((entry) => entry.executionMs).filter(Number.isFinite);
      const sumAvailable = (values) => {
        const available = values.filter(Number.isFinite);
        return available.length ? available.reduce((total, value) => total + value, 0) : null;
      };
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
          totalRunnerSeconds: sumAvailable(entries.map((entry) => entry.jobSeconds)),
          setupElapsedMs: percentile(successful.map((entry) => entry.setupElapsedMs).filter(Number.isFinite), 0.5),
          setupRunnerSeconds: sumAvailable(entries.map((entry) => entry.setupRunnerSeconds)),
          artifactTransferElapsedMs: percentile(
            successful.map((entry) => entry.artifactTransferElapsedMs).filter(Number.isFinite),
            0.5,
          ),
          artifactTransferRunnerSeconds: sumAvailable(entries.map((entry) => entry.artifactTransferRunnerSeconds)),
          queuedMs: percentile(successful.map((entry) => entry.queuedMs).filter(Number.isFinite), 0.5),
          uatQuickFeedbackMs: percentile(successful.map((entry) => entry.uatQuickFeedbackMs).filter(Number.isFinite), 0.5),
          pushToPromotionReadyMs: percentile(successful.map((entry) => entry.pushToPromotionReadyMs).filter(Number.isFinite), 0.5),
          confidence: successful.length >= 5 ? 'high' : successful.length ? 'low' : 'unavailable',
          failures: entries
            .filter((entry) => !entry.successful || !entry.valid)
            .map((entry) => ({ runId: entry.runId, attempt: entry.attempt, conclusion: entry.conclusion })),
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
    '| Classification | Samples | Successful | Failed | Cancelled | Median | p75 | p90 | Queue | UAT quick | Ready | Setup elapsed | Transfer elapsed | Runner seconds | Setup runner seconds | Transfer runner seconds | Confidence |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const [classification, group] of Object.entries(summary)) {
    const seconds = (value) => (value === null ? 'unavailable' : `${(value / 1000).toFixed(1)}s`);
    lines.push(
      `| ${classification} | ${group.sampleCount} | ${group.successfulCount} | ${group.conclusionCounts.failure ?? 0} | ${group.conclusionCounts.cancelled ?? 0} | ${seconds(group.executionMs.median)} | ${seconds(group.executionMs.p75)} | ${seconds(group.executionMs.p90)} | ${seconds(group.queuedMs)} | ${seconds(group.uatQuickFeedbackMs)} | ${seconds(group.pushToPromotionReadyMs)} | ${seconds(group.setupElapsedMs)} | ${seconds(group.artifactTransferElapsedMs)} | ${group.totalRunnerSeconds === null ? 'unavailable' : group.totalRunnerSeconds.toFixed(1)} | ${group.setupRunnerSeconds === null ? 'unavailable' : group.setupRunnerSeconds.toFixed(1)} | ${group.artifactTransferRunnerSeconds === null ? 'unavailable' : group.artifactTransferRunnerSeconds.toFixed(1)} | ${group.confidence} |`,
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
  const filter = endpoint.includes('/actions/runs?')
    ? '{workflow_runs: [.workflow_runs[] | {id, run_attempt, path, workflow_path, event, status, conclusion, head_sha, workflow_sha, created_at, run_started_at, inputs}]}'
    : endpoint.includes('/jobs?')
      ? '{jobs: [.jobs[] | {name, started_at, completed_at, conclusion, steps: [.steps[] | {name, started_at, completed_at, conclusion}]}]}'
      : '.';
  const { stdout } = await execFileAsync('gh', ['api', endpoint, '--jq', filter], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
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
    if (pageRuns.length < 100 || (timestamp(pageRuns.at(-1)?.created_at) ?? Infinity) < from) break;
  }
  const measurements = [];
  for (const run of runs) {
    for (let attempt = 1; attempt <= Number(run.run_attempt ?? 1); attempt += 1) {
      const jobs = [];
      for (let page = 1; page <= 10; page += 1) {
        const response = await read(
          `repos/${repository}/actions/runs/${run.id}/attempts/${attempt}/jobs?per_page=100&page=${page}`,
        );
        jobs.push(...(response.jobs ?? []));
        if ((response.jobs ?? []).length < 100) break;
      }
      const attemptRun = { ...run, run_attempt: attempt };
      if (attemptRun.event === 'workflow_dispatch' && !attemptRun.inputs) {
        attemptRun.inputs = jobs.some(({ name }) =>
          ['deploy-prd', 'deploy-prd-static', 'prd-release-sequence'].some((required) =>
            name === required || name.endsWith(` / ${required}`),
          ),
        )
          ? { target: 'prd', confirm_code_promotion: true }
          : jobs.some(({ name }) => name === 'catalog-prd' || name === 'catalog-prd-plan')
            ? { target: 'prd' }
            : {};
      }
      if (attempt !== Number(run.run_attempt ?? 1)) {
        attemptRun.status = 'completed';
        attemptRun.conclusion = jobs.length > 0 && jobs.every((job) => ['success', 'skipped'].includes(job.conclusion)) ? 'success' :
          jobs.some((job) => job.conclusion === 'cancelled') ? 'cancelled' : 'failure';
      }
      measurements.push(measureAttempt(attemptRun, jobs));
    }
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
