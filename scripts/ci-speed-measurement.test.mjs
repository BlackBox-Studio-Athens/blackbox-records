import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyRun, measureAttempt, summarizeMeasurements } from './ci-speed-measurement.mjs';

const job = (name, start, end, conclusion = 'success') => ({ name, started_at: start, completed_at: end, conclusion });

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
    run_started_at: '2026-09-20T00:00:00.000Z',
  };
  const jobs = [
    job('build-candidate', '2026-09-20T00:00:02.000Z', '2026-09-20T00:00:12.000Z'),
    job('inspect-uat-pages', '2026-09-20T00:00:13.000Z', '2026-09-20T00:00:15.000Z'),
    job('deploy-uat', '2026-09-20T00:00:16.000Z', '2026-09-20T00:00:20.000Z'),
    job('deploy-uat-static', '2026-09-20T00:00:21.000Z', '2026-09-20T00:00:25.000Z'),
    job('smoke-uat', '2026-09-20T00:00:26.000Z', '2026-09-20T00:00:30.000Z'),
  ];
  const measured = measureAttempt(run, jobs);
  assert.equal(measured.attempt, 2);
  assert.equal(measured.executionMs, 28_000);
  assert.equal(measured.queuedMs, 2_000);
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
      successful: true,
      valid: true,
      conclusion: 'success',
      runId: '1',
    },
    {
      classification: 'uat-candidate',
      executionMs: null,
      jobSeconds: 0,
      successful: false,
      valid: false,
      conclusion: 'cancelled',
      runId: '2',
    },
  ];
  const summary = summarizeMeasurements(measurements)['uat-candidate'];
  assert.equal(summary.successfulCount, 1);
  assert.equal(summary.confidence, 'low');
  assert.deepEqual(summary.failures, [{ runId: '2', conclusion: 'cancelled' }]);
});
