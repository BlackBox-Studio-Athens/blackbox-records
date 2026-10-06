import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyRun,
  collectMeasurements,
  jobSetOf,
  measureAttempt,
  renderMeasurementReport,
  summarizeMeasurements,
} from './ci-speed-measurement.mjs';

const job = (name, start, end, conclusion = 'success', steps = []) => ({
  name,
  started_at: start,
  completed_at: end,
  conclusion,
  steps,
});
const at = (seconds) => new Date(Date.parse('2026-10-01T12:00:00.000Z') + seconds * 1000).toISOString();
const timedJob = (name, start, end, conclusion) => job(name, at(start), at(end), conclusion);
const skipped = (name) => job(name, at(0), at(0), 'skipped');
const pagesRun = (event, extra = {}) => ({
  path: '.github/workflows/pages.yml',
  event,
  status: 'completed',
  conclusion: 'success',
  created_at: at(0),
  ...extra,
});
const ACCEPTANCE = [
  'accept-uat-identity',
  'accept-uat-static',
  'accept-uat-providers',
  'accept-staff-previews',
  'accept-e2e',
];
// Shapes follow runs 36859506583 (push with smoke-uat) and 36894123055 (promotion before acceptance moved).
const pushAcceptancePush = () => [
  timedJob('check-candidate', 38, 330),
  timedJob('prepare-uat', 2, 314),
  timedJob('prepare-prd', 2, 461),
  skipped('deploy-prd'),
  skipped('deploy-prd-static'),
  timedJob('inspect-uat-pages', 333, 352),
  timedJob('uat-release / deploy-uat', 355, 475),
  timedJob('assemble-candidate', 463, 503),
  timedJob('uat-release / deploy-uat-static', 477, 610),
  timedJob('uat-release / smoke-uat', 612, 718),
];
const promotionAcceptancePush = () => [...pushAcceptancePush().slice(0, -1), ...ACCEPTANCE.map(skipped)];
const promotionAcceptancePromotion = () => [
  skipped('check-candidate'),
  skipped('uat-release'),
  timedJob('accept-uat-identity', 4, 40),
  timedJob('accept-uat-static', 42, 160),
  timedJob('accept-uat-providers', 42, 200),
  timedJob('accept-staff-previews', 42, 260),
  timedJob('accept-e2e', 42, 300),
  timedJob('deploy-prd', 304, 460),
  timedJob('deploy-prd-static', 464, 556),
];
const prdDispatch = { inputs: { target: 'prd', confirm_code_promotion: true } };

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
      {
        name: 'Download verified UAT target bundle',
        started_at: '2026-09-20T00:00:16.000Z',
        completed_at: '2026-09-20T00:00:17.000Z',
      },
      {
        name: 'Upload verified release bundle',
        started_at: '2026-09-20T00:00:19.000Z',
        completed_at: '2026-09-20T00:00:20.000Z',
      },
    ]),
    job('inspect-uat-pages', '2026-09-20T00:00:21.000Z', '2026-09-20T00:00:25.000Z'),
    job('uat-release-sequence / deploy-uat', '2026-09-20T00:00:26.000Z', '2026-09-20T00:00:30.000Z'),
    job('uat-release-sequence / deploy-uat-static', '2026-09-20T00:00:31.000Z', '2026-09-20T00:00:35.000Z', 'success', [
      {
        name: 'Install Chromium for UAT quick checks',
        conclusion: 'success',
        started_at: '2026-09-20T00:00:31.000Z',
        completed_at: '2026-09-20T00:00:31.500Z',
      },
      {
        name: 'Run UAT quick checks',
        conclusion: 'success',
        started_at: '2026-09-20T00:00:31.500Z',
        completed_at: '2026-09-20T00:00:33.500Z',
      },
      {
        name: 'Post Setup Node.js',
        started_at: '2026-09-20T00:00:34.000Z',
        completed_at: '2026-09-20T00:00:35.000Z',
      },
    ]),
    job('uat-release-sequence / smoke-uat', '2026-09-20T00:00:36.000Z', '2026-09-20T00:00:40.000Z'),
  ];
  const measured = measureAttempt(run, jobs);
  assert.equal(measured.attempt, 2);
  assert.equal(measured.executionMs, 38_000);
  assert.equal(measured.queuedMs, 2_000);
  assert.equal(measured.pushToPromotionReadyMs, 40_000);
  assert.equal(measured.jobSet, 'push-acceptance');
  assert.equal(measured.uatLiveMs, 35_000);
  assert.equal(measured.candidateReadyMs, 20_000);
  assert.equal(measured.artifactTransferElapsedMs, 2_000);
  assert.equal(measured.setupElapsedMs, 500);
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
  const summary = summarizeMeasurements(measurements)['uat-candidate/unlabelled'];
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
  const unavailable = measureAttempt(run, [
    job('check-candidate', null, null, 'success', [{ name: 'Setup Node.js', started_at: null, completed_at: null }]),
  ]);
  assert.equal(unavailable.executionMs, null);
  assert.equal(unavailable.queuedMs, null);
  assert.equal(unavailable.setupElapsedMs, null);
  const summary = summarizeMeasurements([
    { ...unavailable, successful: true, valid: true, executionMs: 1000, runId: 'ok' },
    { ...unavailable, successful: false, valid: false, executionMs: 9000, conclusion: 'failure', runId: 'bad' },
  ])['uat-candidate/push-acceptance'];
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
  assert.equal(measureAttempt(run, jobs).jobSet, 'legacy-build');
});

test('labels each job-set generation from the listed jobs, skipped ones included', () => {
  assert.equal(jobSetOf(pushAcceptancePush()), 'push-acceptance');
  assert.equal(jobSetOf(promotionAcceptancePush()), 'promotion-acceptance');
  assert.equal(jobSetOf(promotionAcceptancePromotion()), 'promotion-acceptance');
  assert.equal(jobSetOf([skipped('build-candidate'), timedJob('deploy-prd', 1, 2)]), 'legacy-build');
});

test('a push without smoke-uat is a complete candidate once acceptance moved to promotion', () => {
  const current = measureAttempt(pagesRun('push'), promotionAcceptancePush());
  assert.equal(current.jobSet, 'promotion-acceptance');
  assert.deepEqual(current.missingJobs, []);
  assert.equal(current.valid, true);
  assert.equal(current.uatLiveMs, 610_000);
  assert.equal(current.candidateReadyMs, 503_000);
  assert.equal(current.pushToPromotionReadyMs, 610_000);
  assert.equal(current.acceptanceMs, null);
  const withoutStatic = promotionAcceptancePush().filter(({ name }) => !name.endsWith('deploy-uat-static'));
  assert.deepEqual(measureAttempt(pagesRun('push'), withoutStatic).missingJobs, ['deploy-uat-static']);
  // The earlier shape still needs its push smoke.
  const historical = measureAttempt(pagesRun('push'), pushAcceptancePush().slice(0, -1));
  assert.equal(historical.jobSet, 'push-acceptance');
  assert.deepEqual(historical.missingJobs, ['smoke-uat']);
});

test('matrix legs count as one job that ends with its last leg', () => {
  const legs = (jobs, name, ...parts) =>
    jobs.flatMap((job) => (job.name === name ? parts.map((part) => ({ ...job, ...part })) : [job]));
  const push = legs(
    promotionAcceptancePush(),
    'check-candidate',
    { name: 'check-candidate (lint)', completed_at: at(200) },
    { name: 'check-candidate (tests)' },
  );
  assert.deepEqual(measureAttempt(pagesRun('push'), push).missingJobs, []);
  const shards = legs(
    promotionAcceptancePromotion(),
    'accept-e2e',
    { name: 'accept-e2e (1)', completed_at: at(250) },
    { name: 'accept-e2e (2)' },
  );
  const promotion = measureAttempt(pagesRun('workflow_dispatch', prdDispatch), shards);
  assert.equal(promotion.acceptanceMs, 296_000);
});

test('promotion reports acceptance separately from PRD deployment', () => {
  const current = measureAttempt(pagesRun('workflow_dispatch', prdDispatch), promotionAcceptancePromotion());
  assert.equal(current.classification, 'prd-promotion');
  assert.equal(current.jobSet, 'promotion-acceptance');
  assert.equal(current.acceptanceMs, 296_000);
  assert.equal(current.prdDeployMs, 252_000);
  assert.equal(current.uatLiveMs, null);
  const earlier = measureAttempt(pagesRun('workflow_dispatch', prdDispatch), [
    skipped('check-candidate'),
    skipped('uat-release'),
    timedJob('deploy-prd', 4, 156),
    timedJob('deploy-prd-static', 160, 248),
  ]);
  assert.equal(earlier.jobSet, 'push-acceptance');
  assert.equal(earlier.acceptanceMs, null);
  assert.equal(earlier.prdDeployMs, 244_000);
  const failedAcceptance = promotionAcceptancePromotion().map((entry) =>
    entry.name === 'accept-e2e' ? { ...entry, conclusion: 'failure' } : entry,
  );
  assert.equal(
    measureAttempt(pagesRun('workflow_dispatch', { ...prdDispatch, conclusion: 'failure' }), failedAcceptance).valid,
    false,
  );
});

test('mixed samples summarize per generation so reports stay comparable across the change', () => {
  const rows = [
    measureAttempt(pagesRun('push'), pushAcceptancePush()),
    measureAttempt(pagesRun('push'), promotionAcceptancePush()),
    measureAttempt(pagesRun('workflow_dispatch', prdDispatch), promotionAcceptancePromotion()),
    { classification: 'uat-candidate', successful: true, valid: true, executionMs: 900_000, conclusion: 'success' },
  ];
  const summary = summarizeMeasurements(rows);
  assert.deepEqual(Object.keys(summary).sort(), [
    'prd-promotion/promotion-acceptance',
    'uat-candidate/promotion-acceptance',
    'uat-candidate/push-acceptance',
    'uat-candidate/unlabelled',
  ]);
  assert.equal(summary['uat-candidate/push-acceptance'].uatLiveMs, 610_000);
  assert.equal(summary['uat-candidate/push-acceptance'].pushToPromotionReadyMs, 718_000);
  assert.equal(summary['uat-candidate/promotion-acceptance'].pushToPromotionReadyMs, 610_000);
  assert.equal(summary['prd-promotion/promotion-acceptance'].acceptanceMs, 296_000);
  assert.equal(summary['uat-candidate/unlabelled'].uatLiveMs, null);
  const report = renderMeasurementReport({ window: { from: 0, to: 1 }, summary });
  assert.match(report, /\| Job set \|/);
  assert.match(report, /\| uat-candidate \| promotion-acceptance \| 1 \| 1 \|/);
  assert.match(report, /\| uat-candidate \| unlabelled \|/);
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
      if (endpoint.includes('/actions/workflows/pages.yml/runs?')) return { workflow_runs: [run] };
      if (endpoint.endsWith('/attempts/1')) return { ...run, run_attempt: 1, conclusion: 'failure' };
      if (endpoint.endsWith('/attempts/1/jobs?per_page=100&page=1'))
        return {
          jobs: Array.from({ length: 100 }, (_, i) =>
            job(`job-${i}`, '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:01.000Z'),
          ),
        };
      if (endpoint.endsWith('/attempts/1/jobs?per_page=100&page=2'))
        return { jobs: [job('job-last', '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:01.000Z')] };
      return { jobs: [job('job', '2026-09-20T00:00:00.000Z', '2026-09-20T00:00:02.000Z')] };
    },
  });
  assert.deepEqual(
    measurements.map(({ attempt }) => attempt),
    [1, 2],
  );
  assert.ok(calls.some((endpoint) => endpoint.endsWith('/attempts/1/jobs?per_page=100&page=2')));
  assert.ok(calls.some((endpoint) => endpoint.endsWith('/attempts/2/jobs?per_page=100&page=1')));
  assert.equal(measurements[0].successful, false);
  assert.equal(measurements[1].successful, true);
});

test('manual UAT classification ignores skipped PRD jobs and empty timing stays unavailable', async () => {
  const run = {
    id: 9,
    run_attempt: 1,
    event: 'workflow_dispatch',
    path: '.github/workflows/pages.yml',
    created_at: '2026-09-20T00:00:00.000Z',
    status: 'completed',
    conclusion: 'success',
  };
  const rows = await collectMeasurements({
    repository: 'owner/repo',
    workflow: 'pages.yml',
    from: Date.parse('2026-09-19'),
    to: Date.parse('2026-09-21'),
    read: async (endpoint) =>
      endpoint.includes('/workflows/pages.yml/runs?')
        ? { workflow_runs: [run] }
        : {
            jobs: [job('deploy-prd', null, null, 'skipped'), job('catalog-prd', null, null, 'skipped')],
          },
  });
  assert.equal(rows[0].classification, 'uat-candidate');
  assert.equal(rows[0].jobSeconds, null);
  assert.equal(rows[0].valid, false);
});

test('a promotion that fails acceptance is still classified as a promotion', async () => {
  const run = { id: 10, run_attempt: 1, ...pagesRun('workflow_dispatch', { conclusion: 'failure' }) };
  const [row] = await collectMeasurements({
    repository: 'owner/repo',
    from: Date.parse('2026-09-30'),
    to: Date.parse('2026-10-02'),
    read: async (endpoint) =>
      endpoint.includes('/workflows/pages.yml/runs?')
        ? { workflow_runs: [run] }
        : {
            jobs: [
              timedJob('accept-uat-identity', 1, 20, 'failure'),
              skipped('deploy-prd'),
              skipped('check-candidate'),
            ],
          },
  });
  assert.equal(row.classification, 'prd-promotion');
  assert.equal(row.successful, false);
});
