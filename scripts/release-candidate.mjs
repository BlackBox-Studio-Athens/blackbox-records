import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const sites = {
  uat: 'https://blackbox-records-web-uat.pages.dev',
  prd: 'https://blackbox-records-web.pages.dev',
};
const backends = {
  uat: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
  prd: 'https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev',
};
const gh = (endpoint) => JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8' }));

export async function waitForDeployment(verify, pause = () => setTimeout(5000)) {
  // ponytail: retry complete read-only checks; poll only identities if these reads become costly.
  // 24 x 5 s (about 2 minutes): deploys restart Durable Objects onto the new code at once (code_update_strategy
  // immediate), so the Worker entry and the store object both report a new release within seconds.
  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      return await verify();
    } catch (error) {
      if (attempt === 23) throw error;
      await pause();
    }
  }
}

// The release a job builds and deploys. A promotion deploys the candidate UAT serves, so CANDIDATE_* wins.
export function releaseIdentity(env = process.env) {
  const release = {
    sha: env.SOURCE_SHA,
    runId: String(env.CANDIDATE_RUN_ID ?? env.GITHUB_RUN_ID),
    runNumber: Number(env.CANDIDATE_RUN_NUMBER ?? env.GITHUB_RUN_NUMBER),
  };
  assert.match(release.sha ?? '', /^[0-9a-f]{40}$/, 'Select a full source SHA.');
  assert.match(release.runId, /^[1-9][0-9]*$/);
  assert.ok(Number.isSafeInteger(release.runNumber) && release.runNumber > 0, 'Invalid candidate run number.');
  return release;
}

export function validateRun(run, sha, repository) {
  assert.match(sha, /^[0-9a-f]{40}$/, 'Select a full source SHA.');
  assert.equal(run.head_sha, sha, 'Candidate SHA mismatch.');
  assert.equal(run.status, 'completed');
  assert.equal(run.conclusion, 'success', 'Candidate acceptance failed.');
  assert.equal(run.path, '.github/workflows/pages.yml');
  assert.equal(run.head_branch, 'main');
  assert.equal(run.event, 'push');
  assert.equal(run.repository.full_name, repository);
  assert.equal(run.head_repository.full_name, repository);
}

// A candidate run made before a suite joined the push pipeline cannot skip it.
export function validateSuites(jobs) {
  const required = [
    'e2e (1)',
    'e2e (2)',
    'e2e (3)',
    'e2e (4)',
    'staff-previews (chromium)',
    'staff-previews (firefox)',
    'deploy-uat',
  ];
  const passed = new Set(jobs.filter((job) => job.conclusion === 'success').map((job) => job.name));
  for (const name of required) assert.ok(passed.has(name), `Candidate run lacks a passed ${name} job.`);
}

export function validateOrder(candidate, current) {
  assert.ok(Number.isSafeInteger(candidate.runNumber) && candidate.runNumber > 0, 'Invalid candidate run number.');
  if (current) assert.ok(candidate.runNumber >= current.runNumber, 'A newer candidate already mutated this target.');
}

export function validateWorker(candidate, response, source = 'Worker') {
  assert.ok(response.ok, `${source} is unavailable.`);
  assert.equal(response.headers.get('X-Release-SHA'), candidate.sha, `${source} source differs from the candidate.`);
  assert.equal(
    Number(response.headers.get('X-Release-Run-Number')),
    candidate.runNumber,
    `${source} belongs to another candidate run.`,
  );
}

export function validateReviewMarker(target, html) {
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
  const marked = title.includes('[UAT] ') && html.includes('UAT · TESTING ONLY');
  assert.ok(
    target === 'uat' ? marked : !title.includes('[UAT] ') && !html.includes('UAT · TESTING ONLY'),
    'Review Site Marker mismatch.',
  );
}

async function publicJson(url, optional = false, request = fetch) {
  const response = await request(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  if (optional && response.status === 404) return null;
  assert.ok(response.ok, `Cannot verify ${url}: HTTP ${response.status}`);
  return response.json();
}

// Resolves what UAT serves and proves it from main-side tooling, before any candidate code is checked out.
export async function resolveCandidate({ env = process.env, api = gh, json = publicJson } = {}) {
  const repository = env.GITHUB_REPOSITORY;
  const served = await json(`${sites.uat}/release.json`);
  const candidate = releaseIdentity({
    SOURCE_SHA: served.sha,
    CANDIDATE_RUN_ID: served.runId,
    CANDIDATE_RUN_NUMBER: served.runNumber,
  });
  const run = api(`repos/${repository}/actions/runs/${candidate.runId}`);
  validateRun(run, candidate.sha, repository);
  assert.equal(run.run_number, candidate.runNumber, 'UAT release identity differs from its run.');
  const comparison = api(`repos/${repository}/compare/${candidate.sha}...main`);
  assert.ok(['ahead', 'identical'].includes(comparison.status), 'Source is outside trusted main history.');
  validateSuites(api(`repos/${repository}/actions/runs/${candidate.runId}/jobs?per_page=100`).jobs);
  return candidate;
}

export async function main(command, target, { fetch = globalThis.fetch, env = process.env } = {}) {
  const json = (url, optional) => publicJson(url, optional, fetch);
  if (command === 'resolve') {
    const { sha, runId, runNumber } = await resolveCandidate({ env, json });
    console.log(`SOURCE_SHA=${sha}\nCANDIDATE_RUN_ID=${runId}\nCANDIDATE_RUN_NUMBER=${runNumber}`);
    return;
  }
  assert.ok(['uat', 'prd'].includes(target), 'Select target uat or prd.');
  assert.ok(['verify', 'verify-worker', 'verify-hosted'].includes(command), 'Unknown command.');
  assert.equal(env[`${target.toUpperCase()}_PUBLIC_BACKEND_BASE_URL`], backends[target], 'Wrong backend URL.');
  const release = releaseIdentity(env);
  const site = sites[target];
  const capabilitiesUrl = `${backends[target]}/api/store/capabilities`;
  // The Worker entry answers the OPTIONS preflight itself; GETs run in the store Durable Object.
  const worker = await fetch(capabilitiesUrl, {
    method: 'OPTIONS',
    headers: { Origin: site, 'Access-Control-Request-Method': 'GET' },
    signal: AbortSignal.timeout(30_000),
  });
  assert.ok(worker.ok, 'Worker is unavailable.');
  if (command === 'verify') {
    if (target === 'prd') {
      const capabilities = await fetch(capabilitiesUrl, { signal: AbortSignal.timeout(30_000) });
      assert.ok(capabilities.ok, 'Worker is unavailable.');
      assert.equal(
        (await capabilities.json()).nativeCheckout.enabled,
        false,
        'This promotion path is for disabled PRD readiness only.',
      );
    }
    // A target never moves to an older candidate; an unreachable or empty target has nothing to order against.
    validateOrder(release, await json(`${site}/release.json`, true));
    const runNumber = worker.headers.get('X-Release-Run-Number');
    if (runNumber !== null) validateOrder(release, { runNumber: Number(runNumber) });
  } else {
    validateWorker(release, worker);
    const store = await fetch(capabilitiesUrl, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
    validateWorker(release, store, 'Store Durable Object');
  }
  if (command === 'verify-hosted') {
    const current = await json(`${site}/release.json`);
    const { sha, runId, runNumber } = current;
    assert.deepEqual(
      { sha, runId: String(runId), runNumber: Number(runNumber) },
      release,
      'Deployed identity mismatch.',
    );
    assert.equal(current.publicationMode, 'runtime');
    assert.match(current.content?.snapshotSha256 ?? '', /^[a-f0-9]{64}$/);
    // A unique query bypasses the renderer's s-maxage edge copy, which can still name the previous SHA.
    const page = await fetch(`${site}/?release=${release.sha}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    assert.ok(page.ok, 'Public renderer unavailable.');
    assert.equal(page.headers.get('X-Release-SHA'), release.sha);
    validateReviewMarker(target, await page.text());
  }
  console.log(`${target.toUpperCase()} ${command}: ${release.sha} / run ${release.runId}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const verify = () => main(process.argv[2], process.argv[3]);
  const result = ['verify-worker', 'verify-hosted'].includes(process.argv[2]) ? waitForDeployment(verify) : verify();
  result.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
