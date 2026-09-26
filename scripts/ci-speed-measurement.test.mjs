import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyRun, collectMeasurements, measureAttempt, summarizeMeasurements } from './ci-speed-measurement.mjs';

const job = (name, start, end, conclusion = 'success', steps = []) => ({ name, started_at: start, completed_at: end, conclusion, steps });

test('classifies UAT, PRD, catalog, and diagnostic runs without guessing from failures', () => {
  assert.equal(classifyRun({ path: '.github/workflows/pages.yml', event: 'push' }), 'uat-candidate');
  assert.equal(
    classifyRun({
      path: '.github/workflows/pages.yml',
      event: 'workflow_dispatch',
      inputs: { target: 'prd', confirm_code_promotion: 'true' },
    }),
    'prd-promotion',
  );
  assert.equal(
    classifyRun({ path: '.github/workflows/pages.yml', event: 'workflow_dispatch', inputs: { target: 'prd' } }),
    'prd-catalog',
  );
  assert.equal(classifyRun({ path: '.github/workflows/other.yml', event: 'workflow_dispatch' }), 'diagnostic');
});

test('measures attempt-specific execution and rejects incomplete or failed required jobs', () => {
  const run = {
    id: 123,
    run_attempt: 2,
    path: '.github/workflows/pages.yml',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    head_sha: 'a'.repeat(40),
    created_at: '2026-09-20T00:00:00.000Z',
    run_started_at: '2026-09-20T00:00:00.000Z',
  };
  const jobs = [
    job('check-candidate', '2026-09-20T00:00:02.000Z', '2026-09-20T00:00:12.000Z'),
    job('prepare-uat', '2026-09-20T00:00:13.000Z', '2026-09-20T00:00:15.000Z'),
    job('prepare-prd', '2026-09-20T00:00:13.000Z', '2026-09-20T00:00:15.000Z'),
    job('assemble-candidate', '2026-09-20T00:00:16.000Z', '2026-09-20T00:00:20.000Z', 'success', [
      { name: 'Download verified UAT target bundle', started_at: '2026-09-20T00:00:16.000Z', completed_at: '2026-09-20T00:00:17.000Z' },
      { name: 'Upload verified release bundle', started_at: '2026-09-20T00:00:19.000Z', completed_at: '2026-09-20T00:00:20.000Z' },
    ]),
    job('inspect-uat-pages', '2026-09-20T00:00:21.000Z', '2026-09-20T00:00:25.000Z'),
    job('deploy-uat', '2026-09-20T00:00:26.000Z', '2026-09-20T00:00:30.000Z'),
    job('deploy-uat-static', '2026-09-20T00:00:31.000Z', '2026-09-20T00:00:35.000Z', 'success', [
      { name: 'Run UAT quick checks', started_at: '2026-09-20T00:00:31.500Z', completed_at: '2026-09-20T00:00:33.500Z' },
    ]),
    job('smoke-uat', '2026-09-20T00:00:36.000Z', '2026-09-20T00:00:40.000Z'),
  ];
  const measured = measureAttempt(run, jobs);
  assert.equal(measured.attempt, 2);
  assert.equal(measured.executionMs, 38_000);
  assert.equal(measured.queuedMs, 2_000);
  assert.equal(measured.pushToPromotionReadyMs, 40_000);
  assert.equal(measured.uatQuickFeedbackMs, 33_500);
  assert.equal(measured.artifactTransferElapsedMs, 4_000);
  assert.equal(measured.artifactTransferRunnerSeconds, 2);
  assert.equal(measured.valid, true);
  assert.equal(measureAttempt(run, jobs.slice(0, -1)).valid, false);
  assert.equal(measureAttempt({ ...run, conclusion: 'failure' }, jobs).successful, false);
});

test('summaries retain failures and use low confidence below five successes', () => {
  const measurements = [
    {
      classification: 'uat-candidate',
      executionMs: 1000,
      jobSeconds: 1,
      jobSeconds: 2,
      setupElapsedMs: 400,
      setupRunnerSeconds: 0.5,
      artifactTransferElapsedMs: 250,
      artifactTransferRunnerSeconds: 0.25,
      successful: true,
      valid: true,
      conclusion: 'success',
      runId: '1',
    },
    {
      classification: 'uat-candidate',
      executionMs: null,
      jobSeconds: 0,
      jobSeconds: null,
      setupElapsedMs: null,
      setupRunnerSeconds: null,
      artifactTransferElapsedMs: null,
      artifactTransferRunnerSeconds: null,
      successful: false,
      valid: false,
      conclusion: 'cancelled',
      runId: '2',
    },
  ];
  const summary = summarizeMeasurements(measurements)['uat-candidate'];
  assert.equal(summary.successfulCount, 1);
  assert.equal(summary.confidence, 'low');
  assert.deepEqual(summary.failures, [{ runId: '2', attempt: undefined, conclusion: 'cancelled' }]);
  assert.equal(summary.executionMs.median, 1000);
  assert.equal(summary.totalRunnerSeconds, 2);
  assert.equal(summary.setupElapsedMs, 400);
  assert.equal(summary.artifactTransferElapsedMs, 250);
});

test('missing timestamps stay unavailable and failed runs do not skew successful timing', () => {
  const run = {
    path: '.github/workflows/pages.yml',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    created_at: '2026-09-20T00:00:00.000Z',
  };
  const unavailable = measureAttempt(
    run,
    [job('check-candidate', null, null, 'success', [{ name: 'Setup Node.js', started_at: null, completed_at: null }])],
  );
  assert.equal(unavailable.executionMs, null);
  assert.equal(unavailable.queuedMs, null);
  assert.equal(unavailable.setupElapsedMs, null);
  const summary = summarizeMeasurements([
    { ...unavailable, successful: true, valid: true, executionMs: 1000, runId: 'ok' },
    { ...unavailable, successful: false, valid: false, executionMs: 9000, conclusion: 'failure', runId: 'bad' },
  ])['uat-candidate'];
  assert.equal(summary.executionMs.median, 1000);
  assert.equal(summary.conclusionCounts.failure, 1);
});

test('recognizes complete historical candidate job sets without treating them as partial', () => {
  const run = {
    path: '.github/workflows/pages.yml',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    created_at: '2026-09-20T00:00:00.000Z',
  };
  const jobs = ['build-candidate', 'inspect-uat-pages', 'deploy-uat', 'deploy-uat-static', 'smoke-uat'].map((name) =>
    job(name, '2026-09-20T00:00:01.000Z', '2026-09-20T00:00:02.000Z'),
  );
  assert.equal(measureAttempt(run, jobs).valid, true);
});

test('measurement collection reads every attempt and paginates attempt jobs', async () => {
  const calls = [];
  const run = {
    id: 17,
    run_attempt: 2,
    status: 'completed',
    conclusion: 'success',
    path: '.github/workflows/other.yml',
    event: 'push',
    created_at: '2026-09-20T00:00:00.000Z',
  };
  const measurements = await collectMeasurements({
    repository: 'owner/repo',
    from: Date.parse('2026-09-19T00:00:00.000Z'),
    to: Date.parse('2026-09-21T00:00:00.000Z'),
    read: async (endpoint) => {
      calls.push(endpoint);
      if (endpoint.includes('/actions/runs?')) return { workflow_runs: [run] };
      if (endpoint.endsWith('/attempts/1/jobs?per_page=100&page=1'))
        return { jobs: Array.from({ length: 100 }, (_, i) => job(`job-${i}`, '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:01.000Z')) };
      if (endpoint.endsWith('/attempts/1/jobs?per_page=100&page=2'))
        return { jobs: [job('job-last', '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:01.000Z')] };
      return { jobs: [job('job', '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:02.000Z')] };
    },
  });
  assert.deepEqual(measurements.map(({ attempt }) => attempt), [1, 2]);
  assert.ok(calls.some((endpoint) => endpoint.endsWith('/attempts/1/jobs?per_page=100&page=2')));
  assert.ok(calls.some((endpoint) => endpoint.endsWith('/attempts/2/jobs?per_page=100&page=1')));
});
