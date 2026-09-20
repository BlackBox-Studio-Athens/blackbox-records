import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const bundle = '.codex-artifacts/release';
const manifestPath = `${bundle}/manifest.json`;
const transportPath = `${bundle}/transport.json`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const gh = (endpoint) => JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8' }));

export function configuration(env = process.env) {
  return {
    cloudflareAccount: env.CLOUDFLARE_ACCOUNT_ID,
    uatSite: 'https://blackbox-records-web-uat.pages.dev',
    prdSite: 'https://blackbox-records-web.pages.dev',
    uatBackend: env.UAT_PUBLIC_BACKEND_BASE_URL,
    prdBackend: env.PRD_PUBLIC_BACKEND_BASE_URL,
    worker: sha256(readFileSync('apps/backend/wrangler.jsonc')),
    cmsResources: sha256(readFileSync('apps/backend/cms-resources.json')),
    cmsBuild: sha256(readFileSync('apps/backend/astro.config.mjs')),
    publicBuild: sha256(readFileSync('apps/backend/astro.public.config.mjs')),
    lockfile: sha256(readFileSync('pnpm-lock.yaml')),
    migrations: inventory('apps/backend/prisma/migrations'),
    cmsMigrations: inventory('apps/backend/cms-migrations'),
  };
}

export async function waitForDeployment(verify, pause = () => setTimeout(5000)) {
  // ponytail: retry complete read-only checks; poll only identities if artifact reads become costly.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await verify();
    } catch (error) {
      if (attempt === 11) throw error;
      await pause();
    }
  }
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
  assert.equal(candidate.schema, 2, 'Legacy candidate contract; build and accept a fresh candidate.');
  assert.deepEqual(candidate.configuration, config, 'Target configuration changed; revalidate the candidate.');
  assert.equal(current.sha, candidate.sha, 'UAT no longer serves the selected source.');
  assert.equal(String(current.runId), String(candidate.runId), 'UAT candidate was superseded.');
  assert.equal(current.runNumber, candidate.runNumber);
}

export function validateOrder(candidate, current) {
  assert.ok(Number.isSafeInteger(candidate.runNumber) && candidate.runNumber > 0, 'Invalid candidate run number.');
  if (current) assert.ok(candidate.runNumber >= current.runNumber, 'A newer candidate already mutated this target.');
}

export function validatePublicationFreshness(candidate, current) {
  if (candidate.publicationMode === 'runtime' && current?.publicationMode === 'runtime') return;
  assert.deepEqual(
    candidate.content ?? null,
    current?.content ?? null,
    'Target content changed; refresh the artifact at the reviewed code SHA before explicit promotion.',
  );
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

function safePath(root, target, relative = '') {
  const targetPart = String(target).replaceAll('\\', '/');
  const relativePart = String(relative).replaceAll('\\', '/');
  assert(
    targetPart &&
      !path.posix.isAbsolute(targetPart) &&
      !path.win32.isAbsolute(targetPart) &&
      !targetPart.split('/').includes('..'),
    'Invalid release path.',
  );
  assert(
    relativePart &&
      !path.posix.isAbsolute(relativePart) &&
      !path.win32.isAbsolute(relativePart) &&
      !relativePart.split('/').includes('..'),
    'Invalid release path.',
  );
  const resolved = path.resolve(root, targetPart, relativePart);
  assert(resolved.startsWith(path.resolve(root) + path.sep), 'Release path escapes its output root.');
  return resolved;
}

function regularFile(filename) {
  const stat = lstatSync(filename);
  assert(stat.isFile() && !stat.isSymbolicLink(), `Release artifact is not a regular file: ${filename}`);
  return stat;
}

function manifestEntries(candidate) {
  assert.equal(candidate.schema, 2, 'Compact transport requires schema 2.');
  assert(
    candidate.files && typeof candidate.files === 'object' && !Array.isArray(candidate.files),
    'Invalid manifest files.',
  );
  const destinations = new Set();
  const entries = [];
  for (const [target, files] of Object.entries(candidate.files)) {
    assert(files && typeof files === 'object' && !Array.isArray(files), `Invalid manifest target: ${target}`);
    for (const [relative, digest] of Object.entries(files)) {
      const destination = safePath('.', target, relative);
      const key = process.platform === 'win32' ? destination.toLowerCase() : destination;
      assert(!destinations.has(key), `Duplicate release destination: ${target}/${relative}`);
      destinations.add(key);
      assert.match(digest, /^[a-f0-9]{64}$/, `Invalid manifest digest: ${target}/${relative}`);
      entries.push({ target, relative, digest });
    }
  }
  return entries;
}

function manifestObjects(candidate, directory) {
  const objects = new Map();
  for (const { target, relative, digest } of manifestEntries(candidate)) {
    const source = safePath(directory, target, relative);
    assertNoSymlinkParents(directory, source);
    const stat = regularFile(source);
    const bytes = readFileSync(source);
    assert.equal(sha256(bytes), digest, `Manifest digest mismatch: ${target}/${relative}`);
    objects.set(digest, { size: stat.size, source });
  }
  return objects;
}

function manifestDigests(candidate) {
  return new Set(manifestEntries(candidate).map(({ digest }) => digest));
}

export function packBundle(directory = bundle) {
  const manifest = readFileSync(path.join(directory, 'manifest.json'));
  const candidate = JSON.parse(manifest.toString('utf8'));
  const objects = manifestObjects(candidate, directory);
  const logicalBytes = Object.values(candidate.files ?? {})
    .flatMap((files) => Object.keys(files).map((relative) => files[relative]))
    .reduce((total, digest) => total + objects.get(digest).size, 0);
  const temporary = `${directory}.pack-${process.pid}`;
  const previous = `${directory}.unpacked-${process.pid}`;
  rmSync(temporary, { recursive: true, force: true });
  mkdirSync(path.join(temporary, 'objects'), { recursive: true });
  try {
    writeFileSync(path.join(temporary, 'manifest.json'), manifest, { flag: 'wx' });
    for (const [digest, object] of objects)
      writeFileSync(path.join(temporary, 'objects', digest), readFileSync(object.source), { flag: 'wx' });
    const marker = {
      transportVersion: 1,
      manifestSha256: sha256(manifest),
      objects: Object.fromEntries([...objects].map(([digest, object]) => [digest, { size: object.size }])),
    };
    writeFileSync(path.join(temporary, path.basename(transportPath)), `${JSON.stringify(marker, null, 2)}\n`, {
      flag: 'wx',
    });
    renameSync(directory, previous);
    renameSync(temporary, directory);
    rmSync(previous, { recursive: true, force: true });
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
  return {
    objectCount: objects.size,
    logicalBytes,
    storedBytes: [...objects.values()].reduce((total, object) => total + object.size, 0),
  };
}

function assertNoSymlinkParents(root, filename) {
  let current = path.dirname(filename);
  const rootPath = path.resolve(root);
  while (current.startsWith(rootPath + path.sep)) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat) assert(!stat.isSymbolicLink(), `Release materialization encountered a symlink: ${current}`);
    current = path.dirname(current);
  }
}

export function materializeBundle(directory = bundle) {
  if (!existsSync(path.join(directory, 'transport.json'))) return { materialized: false };
  const manifestBytes = readFileSync(path.join(directory, 'manifest.json'));
  const marker = JSON.parse(readFileSync(path.join(directory, 'transport.json'), 'utf8'));
  const candidate = JSON.parse(manifestBytes.toString('utf8'));
  assert.equal(marker.transportVersion, 1, 'Unsupported release transport version.');
  assert.equal(marker.manifestSha256, sha256(manifestBytes), 'Release transport manifest mismatch.');
  const expectedNames = [...manifestDigests(candidate)].sort();
  const declared = marker.objects;
  assert(declared && typeof declared === 'object' && !Array.isArray(declared), 'Invalid release transport objects.');
  assert.deepEqual(Object.keys(declared).sort(), expectedNames, 'Release transport objects differ from the manifest.');
  const objectDirectory = path.join(directory, 'objects');
  const objectDirectoryStat = lstatSync(objectDirectory);
  assert(
    objectDirectoryStat.isDirectory() && !objectDirectoryStat.isSymbolicLink(),
    'Invalid release object directory.',
  );
  const actualNames = readdirSync(objectDirectory, { withFileTypes: true })
    .map((entry) => {
      assert(entry.isFile() && !entry.isSymbolicLink(), 'Release transport objects must be regular files.');
      return entry.name;
    })
    .sort();
  assert.deepEqual(actualNames, expectedNames, 'Release transport contains unexpected objects.');
  for (const digest of expectedNames) {
    assert.match(digest, /^[a-f0-9]{64}$/);
    const filename = path.join(objectDirectory, digest);
    const bytes = readFileSync(filename);
    assert(
      Number.isSafeInteger(declared[digest]?.size) && declared[digest].size >= 0,
      `Invalid object size: ${digest}`,
    );
    assert.equal(bytes.byteLength, declared[digest]?.size, `Release transport object size mismatch: ${digest}`);
    assert.equal(sha256(bytes), digest, `Release transport object digest mismatch: ${digest}`);
  }

  const temporary = `${directory}.materialized-${process.pid}`;
  const previous = `${directory}.compact-${process.pid}`;
  rmSync(temporary, { recursive: true, force: true });
  mkdirSync(temporary, { recursive: true });
  try {
    writeFileSync(path.join(temporary, 'manifest.json'), manifestBytes, { flag: 'wx' });
    for (const { target, relative, digest } of manifestEntries(candidate)) {
      const destination = safePath(temporary, target, relative);
      assertNoSymlinkParents(temporary, destination);
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, readFileSync(path.join(objectDirectory, digest)), { flag: 'wx' });
    }
    renameSync(directory, previous);
    renameSync(temporary, directory);
    rmSync(previous, { recursive: true, force: true });
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
  return { materialized: true, objectCount: expectedNames.length };
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

export function refreshedReleaseIdentity(candidate, content) {
  if (content === null) return identity(candidate);
  return contentPublicationIdentity(candidate, content, candidate.sha);
}

export function contentPublicationIdentity(code, content, checkedOutSha) {
  assert.match(code.sha ?? '', /^[a-f0-9]{40}$/);
  assert.equal(code.sha, checkedOutSha, 'Publication must build the selected deployed code.');
  assert.match(code.runId ?? '', /^[1-9][0-9]{0,19}$/);
  validateOrder(code, null);
  assert.match(
    content.publicationId ?? '',
    /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
  );
  assert.match(content.ciRunId ?? '', /^(?:[1-9][0-9]{0,19}|runtime)$/);
  assert.match(content.snapshotSha256 ?? '', /^[a-f0-9]{64}$/);
  return {
    ...identity(code),
    content: {
      publicationId: content.publicationId,
      ciRunId: content.ciRunId,
      snapshotSha256: content.snapshotSha256,
    },
  };
}

export function publicationCodeIdentity(project, current, run, target, repository) {
  assert.ok(['uat', 'prd'].includes(target));
  const name = target === 'uat' ? 'blackbox-records-web-uat' : 'blackbox-records-web';
  assert.equal(project.name, name, 'Wrong publication project.');
  const deployment = project.canonical_deployment;
  assert.equal(deployment?.environment, 'production', 'Publication requires the canonical production deployment.');
  assert.equal(deployment.latest_stage?.name, 'deploy');
  assert.equal(deployment.latest_stage?.status, 'success', 'Canonical deployment did not succeed.');
  assert.match(current.sha ?? '', /^[a-f0-9]{40}$/);
  assert.match(String(current.runId ?? ''), /^[1-9][0-9]{0,19}$/);
  assert.equal(deployment.deployment_trigger?.metadata?.commit_hash, current.sha, 'Public code differs from Pages.');
  assert.equal(deployment.deployment_trigger.metadata.branch, 'main');
  validateRun(run, run.head_sha, repository);
  assert.equal(String(run.id), String(current.runId), 'Public release run mismatch.');
  assert.equal(run.run_number, current.runNumber, 'Public release sequence mismatch.');
  validateOrder(current, null);
  return identity({ ...current, runId: String(current.runId) });
}

export function verifyFiles(candidate, directory = bundle) {
  materializeBundle(directory);
  assert.equal(candidate.schema, 2, 'Legacy candidate contract; build and accept a fresh candidate.');
  for (const target of ['uat/worker', 'prd/cms']) {
    for (const file of [
      'server/wrangler.json',
      'server/entry.mjs',
      'client/content/index.html',
      'client/items/index.html',
      'client/stock/index.html',
    ])
      assert.ok(existsSync(`${directory}/${target}/${file}`), `Missing combined CMS artifact: ${target}/${file}`);
  }
  for (const target of [
    'uat/public',
    'prd/public',
    'uat/worker',
    'prd/cms',
    'migrations',
    ...(candidate.publicationMode === 'runtime' ? ['uat/renderer', 'prd/renderer'] : []),
  ]) {
    assert.ok(existsSync(`${directory}/${target}`), `Missing artifact: ${target}`);
    assert.deepEqual(
      inventory(`${directory}/${target}`),
      candidate.files[target],
      `Artifact digest mismatch: ${target}`,
    );
  }
}

async function main(command, target) {
  if (command === 'resolve-publication-code') {
    assert.ok(['uat', 'prd'].includes(target));
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    assert.match(account ?? '', /^[a-f0-9]{32}$/);
    assert.ok(process.env.CLOUDFLARE_API_TOKEN, 'Pages read credential required.');
    const name = target === 'uat' ? 'blackbox-records-web-uat' : 'blackbox-records-web';
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${name}`, {
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    assert.ok(response.ok, `Pages deployment lookup failed (${response.status}).`);
    const project = await response.json();
    assert.equal(project.success, true, 'Pages deployment lookup failed.');
    const current = await publicJson(`https://${name}.pages.dev/release.json`);
    assert.match(String(current.runId ?? ''), /^[1-9][0-9]{0,19}$/);
    const repository = process.env.GITHUB_REPOSITORY;
    assert.equal(repository, 'BlackBox-Studio-Athens/blackbox-records');
    const run = gh(`repos/${repository}/actions/runs/${current.runId}`);
    const selected = publicationCodeIdentity(project.result, current, run, target, repository);
    const comparison = gh(`repos/${repository}/compare/${selected.sha}...${run.head_sha}`);
    assert.ok(['ahead', 'identical'].includes(comparison.status), 'Published source is outside release main history.');
    console.log(JSON.stringify(selected));
    return;
  }
  if (command === 'pack') {
    const startedAt = performance.now();
    const sha = process.env.SOURCE_SHA;
    assert.match(sha ?? '', /^[0-9a-f]{40}$/);
    assert.match(process.env.GITHUB_RUN_ID ?? '', /^[1-9][0-9]*$/);
    assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/);
    const config = configuration();
    assert.match(config.cloudflareAccount ?? '', /^[0-9a-f]{32}$/, 'Select an explicit Cloudflare account.');
    assert.equal(config.uatBackend, 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev');
    assert.equal(config.prdBackend, 'https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev');
    cpSync('apps/backend/prisma/migrations', `${bundle}/migrations`, { recursive: true });
    const candidate = {
      schema: 2,
      publicationMode: 'runtime',
      sha,
      workflowSha: process.env.GITHUB_SHA,
      runId: process.env.GITHUB_RUN_ID,
      runNumber: Number(process.env.GITHUB_RUN_NUMBER),
      configuration: config,
      files: {},
    };
    validateOrder(candidate, null);
    for (const target of ['uat', 'prd']) {
      const directory = `${bundle}/${target === 'uat' ? 'uat/worker' : 'prd/cms'}`;
      const worker = Object.keys(inventory(directory))
        .filter((name) => /\.(?:js|mjs)$/.test(name))
        .map((name) => readFileSync(`${directory}/${name}`, 'utf8'))
        .join('\n');
      assert.ok(worker.includes(sha) && worker.includes('X-Release-SHA'), 'Worker has no compiled release identity.');
    }
    for (const surface of ['uat/public', 'prd/public']) {
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
      const content = surface.endsWith('public')
        ? readJson(`.codex-artifacts/release-content/${surface.split('/')[0]}/identity.json`)
        : null;
      writeFileSync(
        `${bundle}/${surface}/release.json`,
        JSON.stringify({ ...refreshedReleaseIdentity(candidate, content), publicationMode: 'runtime' }),
      );
    }
    for (const directory of [
      'uat/public',
      'prd/public',
      'uat/worker',
      'prd/cms',
      'uat/renderer',
      'prd/renderer',
      'migrations',
    ]) {
      assert.ok(statSync(`${bundle}/${directory}`).isDirectory());
      candidate.files[directory] = inventory(`${bundle}/${directory}`);
    }
    writeFileSync(manifestPath, JSON.stringify(candidate, null, 2));
    const transport = packBundle(bundle);
    console.log(
      `Packed ${transport.objectCount} unique release objects: logical=${transport.logicalBytes} bytes, stored=${transport.storedBytes} bytes, elapsed=${Math.round(performance.now() - startedAt)}ms.`,
    );
    return;
  }

  assert.ok(['uat', 'prd'].includes(target));
  const candidate = readJson(manifestPath);
  const backend = target === 'uat' ? candidate.configuration.uatBackend : candidate.configuration.prdBackend;
  if (command === 'observe') {
    console.log(JSON.stringify(await observe(candidate, target)));
    return;
  }
  const verificationStartedAt = performance.now();
  verifyFiles(candidate);
  console.log(`Verified release bundle in ${Math.round(performance.now() - verificationStartedAt)}ms.`);
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
  // Pages access is verified by the preceding job using the separate Pages credential.
  const current = await publicJson(`${site}/release.json`, true);
  if (command === 'verify' || command === 'verify-backend')
    validatePublicationFreshness(readJson(`${bundle}/${target}/public/release.json`), current);
  validateOrder(candidate, current);
  const workerResponse = await fetch(`${backend}/api/store/capabilities`, { signal: AbortSignal.timeout(30_000) });
  assert.ok(workerResponse.ok);
  const workerRunNumber = workerResponse.headers.get('X-Release-Run-Number');
  if (workerRunNumber !== null) validateOrder(candidate, { runNumber: Number(workerRunNumber) });
  if (command === 'verify-hosted') {
    assert.deepEqual(identity(current), identity(candidate), 'Deployed artifact identity mismatch.');
    assert.equal(current.publicationMode, candidate.publicationMode);
    assert.match(current.content?.snapshotSha256 ?? '', /^[a-f0-9]{64}$/);
    const page = await fetch(`${site}/`, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
    assert.ok(page.ok, 'Public renderer unavailable.');
    assert.equal(page.headers.get('X-Release-SHA'), candidate.sha);
    await page.body?.cancel();
  }
  if (command === 'verify-hosted' || command === 'verify-worker') {
    validateWorker(candidate, workerResponse);
  } else assert.ok(['verify', 'verify-backend'].includes(command));
  console.log(`${target.toUpperCase()} ${command}: ${candidate.sha} / run ${candidate.runId}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const verify = () => main(process.argv[2], process.argv[3]);
  const result = ['verify-worker', 'verify-hosted'].includes(process.argv[2]) ? waitForDeployment(verify) : verify();
  result.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
