import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bundle = '.codex-artifacts/release';
const manifestPath = `${bundle}/manifest.json`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const gh = (endpoint) => JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8' }));

export function configuration(env = process.env) {
  return {
    uatSite: 'https://blackbox-records-web-uat.pages.dev',
    prdSite: 'https://blackbox-records-web.pages.dev',
    uatBackend: env.UAT_PUBLIC_BACKEND_BASE_URL,
    prdBackend: env.PRD_PUBLIC_BACKEND_BASE_URL,
    cmsAuth: env.SVELTIA_AUTH_BASE_URL,
    worker: sha256(readFileSync('apps/backend/wrangler.jsonc')),
    lockfile: sha256(readFileSync('pnpm-lock.yaml')),
    migrations: inventory('apps/backend/prisma/migrations'),
  };
}

export function validateRun(run, sha, repository) {
  assert.match(sha, /^[0-9a-f]{40}$/, 'Select a full source SHA.');
  assert.equal(run.head_sha, sha, 'Candidate SHA mismatch.');
  assert.equal(run.status, 'completed');
  assert.equal(run.conclusion, 'success', 'Candidate acceptance failed.');
  assert.equal(run.path, '.github/workflows/pages.yml');
  assert.equal(run.head_branch, 'main');
  assert.ok(['push', 'workflow_dispatch'].includes(run.event));
  assert.equal(run.repository.full_name, repository);
  assert.equal(run.head_repository.full_name, repository);
}

export function validateArtifacts(artifacts, sha) {
  assert.ok(
    artifacts.some((artifact) => artifact.name === `release-${sha}` && !artifact.expired),
    'Candidate artifact missing or expired.',
  );
}

export function validateIdentity(candidate, current, config) {
  assert.equal(candidate.schema, 1);
  assert.deepEqual(candidate.configuration, config, 'Target configuration changed; revalidate the candidate.');
  assert.equal(current.sha, candidate.sha, 'UAT no longer serves the selected source.');
  assert.equal(String(current.runId), String(candidate.runId), 'UAT candidate was superseded.');
  assert.equal(current.runNumber, candidate.runNumber);
}

export function validateOrder(candidate, current) {
  assert.ok(Number.isSafeInteger(candidate.runNumber) && candidate.runNumber > 0, 'Invalid candidate run number.');
  if (current) assert.ok(candidate.runNumber >= current.runNumber, 'A newer candidate already mutated this target.');
}

export function validateWorker(candidate, response) {
  assert.ok(response.ok, 'Worker is unavailable.');
  assert.equal(response.headers.get('X-Release-SHA'), candidate.sha, 'Worker source differs from selected artifact.');
  assert.equal(
    Number(response.headers.get('X-Release-Run-Number')),
    candidate.runNumber,
    'Worker belongs to another candidate run.',
  );
}

export async function observe(candidate, target, request = fetch) {
  const config = candidate.configuration;
  const backend = target === 'uat' ? config.uatBackend : config.prdBackend;
  const site = target === 'uat' ? config.uatSite : config.prdSite;
  const read = async (url, worker) => {
    try {
      const response = await request(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
      assert.ok(response.ok, `HTTP ${response.status}`);
      return worker
        ? { sha: response.headers.get('X-Release-SHA'), runNumber: response.headers.get('X-Release-Run-Number') }
        : await response.json();
    } catch (error) {
      return { unavailable: error.message };
    }
  };
  const [worker, frontend] = await Promise.all([
    read(`${backend}/api/store/capabilities`, true),
    read(`${site}/release.json`, false),
  ]);
  return { target, selected: identity(candidate), worker, frontend };
}

export function inventory(directory, prefix = '') {
  return Object.fromEntries(
    readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((entry) => {
        assert.ok(!entry.isSymbolicLink(), 'Release artifacts cannot contain symlinks.');
        const relative = `${prefix}${entry.name}`;
        const file = path.join(directory, entry.name);
        return entry.isDirectory()
          ? Object.entries(inventory(file, `${relative}/`))
          : [[relative, sha256(readFileSync(file))]];
      }),
  );
}

async function publicJson(url, optional = false) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  if (optional && response.status === 404) return null;
  if (
    optional &&
    [522, 523].includes(response.status) &&
    new URL(url).hostname === 'blackbox-records-web-uat.pages.dev'
  ) {
    const deployments = JSON.parse(
      execFileSync(
        process.execPath,
        [
          'apps/backend/node_modules/wrangler/bin/wrangler.js',
          'pages',
          'deployment',
          'list',
          '--project-name',
          'blackbox-records-web-uat',
          '--json',
        ],
        { encoding: 'utf8' },
      ),
    );
    assert.equal(deployments.length, 0, 'An existing UAT deployment is unreachable.');
    return null;
  }
  assert.ok(response.ok, `Cannot verify ${url}: HTTP ${response.status}`);
  return response.json();
}

function identity(candidate) {
  return { sha: candidate.sha, runId: candidate.runId, runNumber: candidate.runNumber };
}

export function verifyFiles(candidate, directory = bundle) {
  for (const target of ['uat/public', 'prd/public', 'prd/staff', 'uat/worker', 'prd/worker', 'migrations']) {
    assert.ok(existsSync(`${directory}/${target}`), `Missing artifact: ${target}`);
    assert.deepEqual(
      inventory(`${directory}/${target}`),
      candidate.files[target],
      `Artifact digest mismatch: ${target}`,
    );
  }
}

async function main(command, target) {
  if (command === 'pack') {
    const sha = process.env.SOURCE_SHA;
    assert.match(sha ?? '', /^[0-9a-f]{40}$/);
    assert.match(process.env.GITHUB_RUN_ID ?? '', /^[1-9][0-9]*$/);
    assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/);
    const config = configuration();
    assert.equal(config.uatBackend, 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev');
    assert.equal(config.prdBackend, 'https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev');
    cpSync('apps/backend/prisma/migrations', `${bundle}/migrations`, { recursive: true });
    const candidate = {
      schema: 1,
      sha,
      workflowSha: process.env.GITHUB_SHA,
      runId: process.env.GITHUB_RUN_ID,
      runNumber: Number(process.env.GITHUB_RUN_NUMBER),
      configuration: config,
      files: {},
    };
    validateOrder(candidate, null);
    for (const surface of ['uat/public', 'prd/public', 'prd/staff']) {
      const html = readFileSync(`${bundle}/${surface}/index.html`, 'utf8');
      if (surface === 'uat/public') assert.ok(html.includes('[TEST] ') && html.includes('TEST SITE'));
      else assert.ok(!html.includes('[TEST] ') && !html.includes('TEST SITE'));
      if (surface.endsWith('public')) {
        assert.ok(existsSync(`${bundle}/${surface}/_headers`));
        const wrongBackend = surface.startsWith('uat') ? config.prdBackend : config.uatBackend;
        for (const file of Object.keys(inventory(`${bundle}/${surface}`)).filter((name) => /\.(html|js)$/.test(name))) {
          assert.ok(
            !readFileSync(`${bundle}/${surface}/${file}`, 'utf8').includes(wrongBackend),
            `Wrong target backend in ${surface}/${file}`,
          );
        }
      }
      writeFileSync(`${bundle}/${surface}/release.json`, JSON.stringify(identity(candidate)));
    }
    for (const directory of ['uat/public', 'prd/public', 'prd/staff', 'uat/worker', 'prd/worker', 'migrations']) {
      assert.ok(statSync(`${bundle}/${directory}`).isDirectory());
      candidate.files[directory] = inventory(`${bundle}/${directory}`);
    }
    writeFileSync(manifestPath, JSON.stringify(candidate, null, 2));
    return;
  }

  assert.ok(['uat', 'prd'].includes(target));
  const candidate = readJson(manifestPath);
  const backend = target === 'uat' ? candidate.configuration.uatBackend : candidate.configuration.prdBackend;
  if (command === 'observe') {
    console.log(JSON.stringify(await observe(candidate, target)));
    return;
  }
  verifyFiles(candidate);
  assert.deepEqual(candidate.configuration, configuration(), 'Build/deploy configuration differs.');
  const config = candidate.configuration;
  if (target === 'prd') {
    assert.equal(process.env.CONFIRM_CODE_PROMOTION, 'true', 'Code promotion requires confirmation.');
    assert.equal(candidate.sha, process.env.SOURCE_SHA);
    assert.equal(String(candidate.runId), process.env.CANDIDATE_RUN_ID);
    validateRun(
      gh(`repos/${process.env.GITHUB_REPOSITORY}/actions/runs/${candidate.runId}`),
      candidate.workflowSha,
      process.env.GITHUB_REPOSITORY,
    );
    const sourceComparison = gh(
      `repos/${process.env.GITHUB_REPOSITORY}/compare/${candidate.sha}...${candidate.workflowSha}`,
    );
    assert.ok(['ahead', 'identical'].includes(sourceComparison.status), 'Source is outside trusted main history.');
    const artifacts = gh(
      `repos/${process.env.GITHUB_REPOSITORY}/actions/runs/${candidate.runId}/artifacts?per_page=100`,
    ).artifacts;
    validateArtifacts(artifacts, candidate.sha);
    validateIdentity(candidate, await publicJson(`${config.uatSite}/release.json`), config);
    validateWorker(
      candidate,
      await fetch(`${config.uatBackend}/api/store/capabilities`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      }),
    );
    const capabilities = await publicJson(`${config.prdBackend}/api/store/capabilities`);
    assert.equal(capabilities.nativeCheckout.enabled, false, 'This promotion path is for disabled PRD readiness only.');
  } else {
    assert.equal(candidate.sha, process.env.SOURCE_SHA);
    assert.equal(String(candidate.runId), process.env.GITHUB_RUN_ID);
  }
  const site = target === 'uat' ? config.uatSite : config.prdSite;
  const current = await publicJson(`${site}/release.json`, true);
  validateOrder(candidate, current);
  const workerResponse = await fetch(`${backend}/api/store/capabilities`, { signal: AbortSignal.timeout(30_000) });
  assert.ok(workerResponse.ok);
  const workerRunNumber = workerResponse.headers.get('X-Release-Run-Number');
  if (workerRunNumber !== null) validateOrder(candidate, { runNumber: Number(workerRunNumber) });
  if (command === 'verify-hosted') {
    assert.deepEqual(current, identity(candidate), 'Deployed artifact identity mismatch.');
  }
  if (command === 'verify-hosted' || command === 'verify-worker') {
    validateWorker(candidate, workerResponse);
  } else assert.equal(command, 'verify');
  console.log(`${target.toUpperCase()} ${command}: ${candidate.sha} / run ${candidate.runId}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2], process.argv[3]).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
