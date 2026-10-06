import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const DEFAULT_WINDOW_DAYS = 30;
const SPLIT_UAT_JOBS = [
  'check-candidate',
  'prepare-uat',
  'prepare-prd',
  'assemble-candidate',
  'inspect-uat-pages',
  'deploy-uat',
  'deploy-uat-static',
];
/** Jobs a complete UAT candidate run needs, per workflow generation. Samples carry the generation so reports compare like with like. */
const UAT_JOBS_BY_JOB_SET = {
  'legacy-build': ['build-candidate', 'inspect-uat-pages', 'deploy-uat', 'deploy-uat-static', 'smoke-uat'],
  'push-acceptance': [...SPLIT_UAT_JOBS, 'smoke-uat'],
  'promotion-acceptance': SPLIT_UAT_JOBS,
};
const ACCEPTANCE_JOBS = [
  'accept-uat-identity',
  'accept-uat-static',
  'accept-uat-providers',
  'accept-staff-previews',
  'accept-e2e',
];

/** Reusable-workflow jobs are listed as `<caller> / <job>` and matrix legs as `<job> (<leg>)`. */
const isJob = (name, required) =>
  name === required || name.endsWith(` / ${required}`) || name.startsWith(`${required} (`);

/** The run lists every job, skipped ones included, so a push of the current workflow still names the acceptance jobs. */
export function jobSetOf(jobs) {
  const names = jobs.map(({ name }) => name);
  if (names.some((name) => isJob(name, 'build-candidate'))) return 'legacy-build';
  return names.some((name) => isJob(name, 'accept-uat-identity')) ? 'promotion-acceptance' : 'push-acceptance';
}

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
  const jobSet = jobSetOf(jobs);
  const requiredNames = classifyRun(run) === 'uat-candidate' ? UAT_JOBS_BY_JOB_SET[jobSet] : [];
  const missingJobs = requiredNames.filter((required) => !relevant.some(({ name }) => isJob(name, required)));
  const executionMs = firstStartedAt !== null && lastCompletedAt !== null ? lastCompletedAt - firstStartedAt : null;
  const queuedMs =
    firstStartedAt === null
      ? null
      : duration(
          Number(run.run_attempt ?? 1) > 1 ? run.run_started_at : run.created_at,
          new Date(firstStartedAt).toISOString(),
        );
  const steps = timed.flatMap(({ name: jobName, steps = [] }) =>
    steps.map((step) => ({ ...step, jobName, durationMs: duration(step.started_at, step.completed_at) })),
  );
  const stepMeasure = (names) => {
    const matching = steps.filter(({ name }) => !/^post /i.test(name) && names.test(name));
    if (!matching.length || matching.some(({ durationMs }) => durationMs === null))
      return { elapsedMs: null, runnerSeconds: null };
    const jobWindows = Map.groupBy(matching, ({ jobName }) => jobName);
    const elapsedByJob = [...jobWindows.values()].map((jobSteps) =>
      jobSteps.reduce((total, step) => total + step.durationMs, 0),
    );
    const elapsedMs = Math.max(...elapsedByJob);
    return {
      elapsedMs: elapsedMs >= 0 ? elapsedMs : null,
      runnerSeconds: matching.reduce((total, step) => total + step.durationMs, 0) / 1000,
    };
  };
  const setup = stepMeasure(/setup|install|dependency/i);
  const artifactTransfer = stepMeasure(
    /(?:artifact|bundle).*(?:upload|download)|(?:upload|download).*(?:artifact|bundle)/i,
  );
  // A matrix job spans its legs: it starts with the first, ends with the last and succeeds only if every leg did.
  const timedJob = (required) => {
    const legs = timed.filter(({ name }) => isJob(name, required));
    if (legs.length < 2) return legs[0];
    const edge = (key, pick) =>
      legs.map((leg) => leg[key]).reduce((a, b) => (pick(timestamp(a), timestamp(b)) ? a : b));
    return {
      ...legs[0],
      started_at: edge('started_at', (a, b) => a <= b),
      completed_at: edge('completed_at', (a, b) => a >= b),
      conclusion: legs.every((leg) => leg.conclusion === 'success') ? 'success' : 'failure',
    };
  };
  const sinceCreated = (required) => {
    const job = timedJob(required);
    return job?.conclusion === 'success' ? duration(run.created_at, job.completed_at) : null;
  };
  const span = (first, lasts) => {
    const start = timedJob(first);
    const ends = lasts.map(timedJob);
    return start && ends.every(Boolean)
      ? Math.max(...ends.map((job) => timestamp(job.completed_at))) - timestamp(start.started_at)
      : null;
  };
  return {
    runId: String(run.id ?? ''),
    attempt: Number(run.run_attempt ?? 1),
    classification: classifyRun(run),
    jobSet,
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
    manualRerunGapMs: Number(run.run_attempt ?? 1) > 1 ? duration(run.created_at, run.run_started_at) : null,
    jobSeconds:
      relevant.length > 0 && timed.length === relevant.length
        ? timed.reduce((total, job) => total + job.durationMs, 0) / 1000
        : null,
    setupElapsedMs: setup.elapsedMs,
    setupRunnerSeconds: setup.runnerSeconds,
    artifactTransferElapsedMs: artifactTransfer.elapsedMs,
    artifactTransferRunnerSeconds: artifactTransfer.runnerSeconds,
    // deploy-uat-static ends with `verify-hosted uat`; under push-acceptance it also ran the UAT quick checks.
    uatLiveMs: sinceCreated('deploy-uat-static'),
    candidateReadyMs: sinceCreated('assemble-candidate'),
    acceptanceMs: span('accept-uat-identity', ACCEPTANCE_JOBS),
    prdDeployMs: span('deploy-prd', ['deploy-prd-static']),
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

/** Groups by classification and job-set generation (`unlabelled` for samples recorded before generations existed). */
export function summarizeMeasurements(measurements) {
  const groups = {};
  for (const measurement of measurements) {
    const key = `${measurement.classification}/${measurement.jobSet ?? 'unlabelled'}`;
    (groups[key] ??= []).push(measurement);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([key, entries]) => {
      const successful = entries.filter((entry) => entry.successful && entry.valid);
      const execution = successful.map((entry) => entry.executionMs).filter(Number.isFinite);
      const sumAvailable = (values) => {
        const available = values.filter(Number.isFinite);
        return available.length ? available.reduce((total, value) => total + value, 0) : null;
      };
      const successfulMedian = (field) =>
        percentile(successful.map((entry) => entry[field]).filter(Number.isFinite), 0.5);
      return [
        key,
        {
          classification: entries[0].classification,
          jobSet: entries[0].jobSet ?? 'unlabelled',
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
          setupElapsedMs: successfulMedian('setupElapsedMs'),
          setupRunnerSeconds: sumAvailable(entries.map((entry) => entry.setupRunnerSeconds)),
          artifactTransferElapsedMs: successfulMedian('artifactTransferElapsedMs'),
          artifactTransferRunnerSeconds: sumAvailable(entries.map((entry) => entry.artifactTransferRunnerSeconds)),
          queuedMs: successfulMedian('queuedMs'),
          uatLiveMs: successfulMedian('uatLiveMs'),
          candidateReadyMs: successfulMedian('candidateReadyMs'),
          pushToPromotionReadyMs: successfulMedian('pushToPromotionReadyMs'),
          acceptanceMs: successfulMedian('acceptanceMs'),
          prdDeployMs: successfulMedian('prdDeployMs'),
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
    '| Classification | Job set | Samples | Successful | Failed | Cancelled | Median | p75 | p90 | Queue | UAT live | Candidate ready | Promotion ready | Acceptance | PRD deploy | Setup elapsed | Transfer elapsed | Runner seconds | Setup runner seconds | Transfer runner seconds | Confidence |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const group of Object.values(summary)) {
    const seconds = (value) => (Number.isFinite(value) ? `${(value / 1000).toFixed(1)}s` : 'unavailable');
    lines.push(
      `| ${group.classification} | ${group.jobSet} | ${group.sampleCount} | ${group.successfulCount} | ${group.conclusionCounts.failure ?? 0} | ${group.conclusionCounts.cancelled ?? 0} | ${seconds(group.executionMs.median)} | ${seconds(group.executionMs.p75)} | ${seconds(group.executionMs.p90)} | ${seconds(group.queuedMs)} | ${seconds(group.uatLiveMs)} | ${seconds(group.candidateReadyMs)} | ${seconds(group.pushToPromotionReadyMs)} | ${seconds(group.acceptanceMs)} | ${seconds(group.prdDeployMs)} | ${seconds(group.setupElapsedMs)} | ${seconds(group.artifactTransferElapsedMs)} | ${group.totalRunnerSeconds === null ? 'unavailable' : group.totalRunnerSeconds.toFixed(1)} | ${group.setupRunnerSeconds === null ? 'unavailable' : group.setupRunnerSeconds.toFixed(1)} | ${group.artifactTransferRunnerSeconds === null ? 'unavailable' : group.artifactTransferRunnerSeconds.toFixed(1)} | ${group.confidence} |`,
    );
  }
  lines.push(
    '',
    'Milestones are medians of successful attempts, measured from run creation: UAT live is `deploy-uat-static` completion (hosted identity verified; under `push-acceptance` it also includes the UAT quick checks), candidate ready is `assemble-candidate` completion and promotion ready is the last job. Acceptance runs from the start of `accept-uat-identity` to the last acceptance job; PRD deploy from the start of `deploy-prd` to the end of `deploy-prd-static`. Job sets: `legacy-build` (one build job), `push-acceptance` (split preparation, smoke on every push), `promotion-acceptance` (browser and provider suites at PRD promotion).',
    '',
    'Failures, cancellations, reruns, missing timing, and unavailable cache/content metadata remain in `raw.json` and `summary.json`.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

async function ghJson(endpoint) {
  const filter = endpoint.includes('/runs?')
    ? '{workflow_runs: [.workflow_runs[] | {id, run_attempt, path, workflow_path, event, status, conclusion, head_sha, workflow_sha, created_at, run_started_at, inputs}]}'
    : endpoint.includes('/jobs?')
      ? '{jobs: [.jobs[] | {name, started_at, completed_at, conclusion, steps: [.steps[] | {name, started_at, completed_at, conclusion}]}]}'
      : '.';
  const { stdout } = await execFileAsync('gh', ['api', endpoint, '--jq', filter], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

export async function collectMeasurements({ repository, workflow = 'pages.yml', from, to, read = ghJson }) {
  const runs = [];
  for (let page = 1; ; page += 1) {
    const response = await read(
      `repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/runs?per_page=100&page=${page}`,
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
      for (let page = 1; ; page += 1) {
        const response = await read(
          `repos/${repository}/actions/runs/${run.id}/attempts/${attempt}/jobs?per_page=100&page=${page}`,
        );
        jobs.push(...(response.jobs ?? []));
        if ((response.jobs ?? []).length < 100) break;
      }
      const attemptRun = {
        ...run,
        ...(attempt !== Number(run.run_attempt ?? 1)
          ? await read(`repos/${repository}/actions/runs/${run.id}/attempts/${attempt}`)
          : {}),
        run_attempt: attempt,
      };
      if (attemptRun.event === 'workflow_dispatch' && !attemptRun.inputs) {
        const activeJobs = jobs.filter(({ conclusion }) => conclusion !== 'skipped');
        attemptRun.inputs = activeJobs.some(({ name }) =>
          // A promotion that fails acceptance never reaches deploy-prd.
          ['accept-uat-identity', 'deploy-prd', 'deploy-prd-static', 'prd-release-sequence'].some((required) =>
            isJob(name, required),
          ),
        )
          ? { target: 'prd', confirm_code_promotion: true }
          : activeJobs.some(({ name }) => name === 'catalog-prd' || name === 'catalog-prd-plan')
            ? { target: 'prd' }
            : {};
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
