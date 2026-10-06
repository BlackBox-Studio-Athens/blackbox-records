import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  main,
  releaseIdentity,
  resolveCandidate,
  validateOrder,
  validateReviewMarker,
  validateRun,
  validateSuites,
  validateWorker,
  waitForDeployment,
} from './release-candidate.mjs';

const sha = 'a'.repeat(40);
const repository = 'example/repository';
const run = {
  id: 123,
  run_number: 10,
  head_sha: sha,
  status: 'completed',
  conclusion: 'success',
  path: '.github/workflows/pages.yml',
  head_branch: 'main',
  event: 'push',
  repository: { full_name: repository },
  head_repository: { full_name: repository },
};
const jobs = ['e2e (1)', 'e2e (2)', 'staff-previews', 'deploy-uat'].map((name) => ({ name, conclusion: 'success' }));

test('post-deployment propagation checks retry within a fixed attempt budget', async () => {
  let attempts = 0;
  const pause = async () => {};
  await waitForDeployment(async () => {
    if (++attempts === 1) throw new Error('Previous edge revision');
  }, pause);
  assert.equal(attempts, 2);
  attempts = 0;
  await assert.rejects(
    waitForDeployment(async () => {
      attempts += 1;
      throw new Error('Still mismatched');
    }, pause),
    /Still mismatched/,
  );
  assert.equal(attempts, 36);
});

test('only a successful push run of this workflow on main with the selected SHA is accepted', () => {
  validateRun(run, sha, repository);
  for (const patch of [
    { head_sha: 'b'.repeat(40) },
    { conclusion: 'failure' },
    { status: 'in_progress' },
    { path: '.github/workflows/other.yml' },
    { head_branch: 'feature' },
    { event: 'pull_request' },
    { event: 'workflow_dispatch' },
    { repository: { full_name: 'foreign/repo' } },
    { head_repository: { full_name: 'fork/repo' } },
  ]) {
    assert.throws(() => validateRun({ ...run, ...patch }, sha, repository));
  }
  assert.throws(() => validateRun(run, 'main', repository));
});

test('a candidate run must have passed the browser suites and the UAT deploy', () => {
  validateSuites(jobs);
  for (const name of ['e2e (2)', 'staff-previews', 'deploy-uat']) {
    assert.throws(
      () => validateSuites(jobs.filter((job) => job.name !== name)),
      new RegExp(name.replace(/[()]/g, '\\$&')),
    );
    assert.throws(() =>
      validateSuites(jobs.map((job) => (job.name === name ? { ...job, conclusion: 'failure' } : job))),
    );
  }
});

test('release identity comes from the run, or from the resolved candidate during promotion', () => {
  const env = { SOURCE_SHA: sha, GITHUB_RUN_ID: '123', GITHUB_RUN_NUMBER: '10' };
  assert.deepEqual(releaseIdentity(env), { sha, runId: '123', runNumber: 10 });
  assert.deepEqual(releaseIdentity({ ...env, CANDIDATE_RUN_ID: '99', CANDIDATE_RUN_NUMBER: '7' }), {
    sha,
    runId: '99',
    runNumber: 7,
  });
  for (const patch of [{ SOURCE_SHA: 'main' }, { GITHUB_RUN_ID: 'x' }, { GITHUB_RUN_NUMBER: '0' }])
    assert.throws(() => releaseIdentity({ ...env, ...patch }));
});

test('promotion resolves only what UAT serves and proves it before any candidate code runs', async () => {
  const served = { sha, runId: '123', runNumber: 10 };
  const calls = [];
  const io = (patch = {}) => ({
    env: { GITHUB_REPOSITORY: repository },
    json: async () => served,
    api: (endpoint) => {
      calls.push(endpoint);
      if (endpoint.includes('/compare/')) return { status: 'ahead', ...patch.compare };
      if (endpoint.includes('/jobs')) return { jobs: patch.jobs ?? jobs };
      return { ...run, ...patch.run };
    },
  });
  assert.deepEqual(await resolveCandidate(io()), served);
  assert.ok(calls.some((endpoint) => endpoint.endsWith(`/compare/${sha}...main`)));
  await assert.rejects(resolveCandidate(io({ compare: { status: 'diverged' } })), /trusted main history/);
  await assert.rejects(resolveCandidate(io({ run: { run_number: 11 } })), /differs from its run/);
  await assert.rejects(resolveCandidate(io({ run: { conclusion: 'failure' } })), /acceptance failed/);
  await assert.rejects(resolveCandidate(io({ jobs: jobs.slice(1) })), /e2e \(1\)/);
});

test('a target never moves to an older candidate, and the Worker must serve the selected release', () => {
  const candidate = { sha, runNumber: 10 };
  validateOrder(candidate, null);
  validateOrder(candidate, { runNumber: 10 });
  assert.throws(() => validateOrder(candidate, { runNumber: 11 }));
  assert.throws(() => validateOrder({ sha, runNumber: 0 }, null));
  const worker = (headers) => new Response('{}', { headers });
  validateWorker(candidate, worker({ 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' }));
  assert.throws(() => validateWorker(candidate, worker({ 'X-Release-SHA': sha, 'X-Release-Run-Number': '11' })));
  assert.throws(() =>
    validateWorker(candidate, worker({ 'X-Release-SHA': 'b'.repeat(40), 'X-Release-Run-Number': '10' })),
  );
});

test('only UAT carries the Review Site Marker', () => {
  const marked = '<title>[UAT] Home</title><p>UAT · TESTING ONLY</p>';
  const plain = '<title>Home</title>';
  validateReviewMarker('uat', marked);
  validateReviewMarker('prd', plain);
  assert.throws(() => validateReviewMarker('uat', plain));
  assert.throws(() => validateReviewMarker('prd', marked));
  assert.throws(() => validateReviewMarker('prd', '<title>Home</title><p>UAT · TESTING ONLY</p>'));
});

// main() with canned HTTP: each entry is a fresh Response, so a route can be fetched more than once.
// A route key is the URL for a GET, or `<METHOD> <url>` for any other method.
const backend = 'https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev';
const site = 'https://blackbox-records-web.pages.dev';
const capabilitiesUrl = `${backend}/api/store/capabilities`;
const preflightUrl = `OPTIONS ${capabilitiesUrl}`;
const prdEnv = {
  PRD_PUBLIC_BACKEND_BASE_URL: backend,
  SOURCE_SHA: sha,
  GITHUB_RUN_ID: '123',
  GITHUB_RUN_NUMBER: '10',
};
const reply =
  (body, { status = 200, ...headers } = {}) =>
  () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
const canned =
  (routes) =>
  async (url, init = {}) => {
    const key = init.method ? `${init.method} ${url}` : url;
    assert.ok(routes[key], `Unexpected request: ${key}`);
    return routes[key](init);
  };
const capabilities = (enabled, headers) => reply({ nativeCheckout: { enabled } }, headers);
// The Worker entry's own answer to a CORS preflight: no body, release identity in the headers.
const preflight = (headers) => (init) => {
  assert.equal(init.headers.Origin, site);
  assert.equal(init.headers['Access-Control-Request-Method'], 'GET');
  return new Response(null, { status: 204, headers });
};
const released = reply({
  sha,
  runId: '123',
  runNumber: 10,
  publicationMode: 'runtime',
  content: { snapshotSha256: 'f'.repeat(64) },
});
const home = (title) => reply(`<title>${title}</title>`, { 'X-Release-SHA': sha });

test('PRD verify refuses a Worker with native checkout enabled, and a wrong backend URL', async (t) => {
  t.mock.method(console, 'log', () => {});
  const routes = (enabled) => ({
    [preflightUrl]: preflight({ 'X-Release-Run-Number': '9' }),
    [capabilitiesUrl]: capabilities(enabled),
    [`${site}/release.json`]: reply('', { status: 404 }),
  });
  await main('verify', 'prd', { env: prdEnv, fetch: canned(routes(false)) });
  await assert.rejects(
    main('verify', 'prd', { env: prdEnv, fetch: canned(routes(true)) }),
    /disabled PRD readiness only/,
  );
  await assert.rejects(
    main('verify', 'prd', {
      env: { ...prdEnv, PRD_PUBLIC_BACKEND_BASE_URL: 'https://example.com' },
      fetch: canned(routes(false)),
    }),
    /Wrong backend URL/,
  );
});

test('verify refuses a target whose Worker already serves a newer run', async () => {
  const fetch = canned({
    [preflightUrl]: preflight({ 'X-Release-Run-Number': '11' }),
    [capabilitiesUrl]: capabilities(false),
    [`${site}/release.json`]: reply('', { status: 404 }),
  });
  await assert.rejects(main('verify', 'prd', { env: prdEnv, fetch }), /newer candidate already mutated/);
});

test('verify-hosted prd refuses the UAT review marker', async (t) => {
  t.mock.method(console, 'log', () => {});
  const routes = (title) => ({
    [preflightUrl]: preflight({ 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' }),
    [`${site}/release.json`]: released,
    [`${site}/`]: home(title),
  });
  await main('verify-hosted', 'prd', { env: prdEnv, fetch: canned(routes('Home')) });
  await assert.rejects(
    main('verify-hosted', 'prd', { env: prdEnv, fetch: canned(routes('[UAT] Home')) }),
    /Review Site Marker mismatch/,
  );
});

test('verify-worker refuses a Worker from an older run', async () => {
  const fetch = canned({
    [preflightUrl]: preflight({ 'X-Release-SHA': sha, 'X-Release-Run-Number': '9' }),
  });
  await assert.rejects(main('verify-worker', 'prd', { env: prdEnv, fetch }), /another candidate run/);
});

test('verify-worker trusts the Worker entry preflight over a Durable Object still on the old code', async (t) => {
  t.mock.method(console, 'log', () => {});
  const fetch = canned({
    [preflightUrl]: preflight({ 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' }),
    [capabilitiesUrl]: capabilities(false, { 'X-Release-SHA': 'b'.repeat(40), 'X-Release-Run-Number': '9' }),
  });
  await main('verify-worker', 'prd', { env: prdEnv, fetch });
});
