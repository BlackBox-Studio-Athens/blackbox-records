import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  contentPublicationIdentity,
  configuration,
  refreshedReleaseIdentity,
  inventory,
  materializeBundle,
  observe,
  packBundle,
  recheckUat,
  validateArtifacts,
  validateIdentity,
  validateOrder,
  validatePublicationFreshness,
  validateRun,
  validateWorker,
  verifyFiles,
  verifyTargetFiles,
  assembleTargetBundles,
  waitForDeployment,
} from './release-candidate.mjs';

const sha = 'a'.repeat(40);
const repository = 'example/repository';

test('rejects promotion when combined CMS configuration differs from the candidate', () => {
  const config = configuration();
  const candidate = { schema: 2, sha, runId: '123', runNumber: 10, configuration: config };
  const current = { sha, runId: '123', runNumber: 10 };
  for (const field of ['cmsResources', 'cmsBuild']) {
    assert.match(config[field], /^[0-9a-f]{64}$/);
    assert.throws(() => validateIdentity(candidate, current, { ...config, [field]: 'changed' }));
  }
  assert.ok(Object.keys(config.cmsMigrations).includes('0001_publications.sql'));
  assert.throws(() => validateIdentity(candidate, current, { ...config, cmsMigrations: {} }));
});

test('refreshes an artifact at the same reviewed code SHA while retaining target publication identity', () => {
  const code = { sha, runId: '456', runNumber: 11 };
  const content = {
    publicationId: '12345678-1234-4234-8234-123456789012',
    ciRunId: '123',
    snapshotSha256: 'b'.repeat(64),
  };
  assert.deepEqual(refreshedReleaseIdentity(code, content), { ...code, content });
  assert.deepEqual(refreshedReleaseIdentity(code, null), code);
  assert.throws(() => refreshedReleaseIdentity(code, { ...content, snapshotSha256: '' }));
});

test('code promotion cannot replace newer target content with an old artifact', () => {
  const content = { publicationId: 'one', ciRunId: '123', snapshotSha256: 'a'.repeat(64) };
  validatePublicationFreshness({}, null);
  validatePublicationFreshness({ content }, { content });
  assert.throws(() => validatePublicationFreshness({}, { content }), /refresh the artifact/);
  assert.throws(
    () => validatePublicationFreshness({ content: { ...content, publicationId: 'old' } }, { content }),
    /refresh the artifact/,
  );
});

test('publication metadata preserves deployed code identity while replacing only content identity', () => {
  const code = { sha, runId: '123', runNumber: 10, content: { old: true }, private: 'omit' };
  const content = {
    publicationId: '12345678-1234-4234-8234-123456789012',
    ciRunId: '456',
    snapshotSha256: 'b'.repeat(64),
    token: 'omit',
  };
  assert.deepEqual(contentPublicationIdentity(code, content, sha), {
    sha,
    runId: '123',
    runNumber: 10,
    content: { publicationId: content.publicationId, ciRunId: '456', snapshotSha256: content.snapshotSha256 },
  });
  assert.throws(() => contentPublicationIdentity(code, content, 'c'.repeat(40)), /selected deployed code/);
  for (const invalid of [{ publicationId: '../private' }, { ciRunId: 'main' }, { snapshotSha256: 'bad' }])
    assert.throws(() => contentPublicationIdentity(code, { ...content, ...invalid }, sha));
});
const run = {
  head_sha: sha,
  status: 'completed',
  conclusion: 'success',
  path: '.github/workflows/pages.yml',
  head_branch: 'main',
  event: 'push',
  repository: { full_name: repository },
  head_repository: { full_name: repository },
};

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
  assert.equal(attempts, 12);
});

test('partial deployment evidence retains the Worker revision when Pages is unavailable', async () => {
  const candidate = {
    sha,
    runId: '123',
    runNumber: 10,
    configuration: { uatBackend: 'https://api.example.com', uatSite: 'https://uat.example.com' },
  };
  const result = await observe(candidate, 'uat', async (url) =>
    url.includes('/api/')
      ? new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' } })
      : new Response('', { status: 503 }),
  );
  assert.equal(result.worker.sha, sha);
  assert.deepEqual(result.frontend, { unavailable: 'HTTP 503' });
});

test('only a successful trusted main candidate with the selected SHA is accepted', () => {
  validateRun(run, sha, repository);
  for (const patch of [
    { head_sha: 'b'.repeat(40) },
    { conclusion: 'failure' },
    { status: 'in_progress' },
    { path: '.github/workflows/other.yml' },
    { head_branch: 'feature' },
    { event: 'pull_request' },
    { repository: { full_name: 'foreign/repo' } },
    { head_repository: { full_name: 'fork/repo' } },
  ]) {
    assert.throws(() => validateRun({ ...run, ...patch }, sha, repository));
  }
  assert.throws(() => validateRun(run, 'main', repository));
});

test('only the promotion verify command re-reads UAT; later PRD checks ignore a UAT that moved on', async () => {
  const candidate = {
    schema: 2,
    sha,
    workflowSha: sha,
    runId: '123',
    runNumber: 10,
    configuration: { uatSite: 'https://uat.example.com', uatBackend: 'https://api.example.com' },
  };
  const calls = [];
  const io = {
    env: { GITHUB_REPOSITORY: repository },
    api: (endpoint) => {
      calls.push(endpoint);
      if (endpoint.includes('/artifacts')) return { artifacts: [{ name: `release-${sha}`, expired: false }] };
      return endpoint.includes('/compare/') ? { status: 'identical' } : { ...run, id: 123 };
    },
    json: async () => ({ sha, runId: '123', runNumber: 10, ...io.uat }),
    request: async () =>
      new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': String(io.uat.runNumber) } }),
    uat: { runNumber: 10 },
  };
  await recheckUat('verify', candidate, io);
  assert.equal(calls.length, 3);
  io.uat = { runId: '124', runNumber: 11 };
  await assert.rejects(recheckUat('verify', candidate, io), /superseded/);
  calls.length = 0;
  for (const command of ['verify-worker', 'verify-hosted']) await recheckUat(command, candidate, io);
  assert.deepEqual(calls, []);
});

test('superseded UAT, mixed revisions and changed config cannot authorize promotion', () => {
  const configuration = { site: 'https://uat.example.com' };
  const candidate = { schema: 2, sha, runId: '123', runNumber: 10, configuration };
  const current = { sha, runId: '123', runNumber: 10 };
  validateIdentity(candidate, current, configuration);
  for (const patch of [{ sha: 'b'.repeat(40) }, { runId: '124' }, { runNumber: 11 }]) {
    assert.throws(() => validateIdentity(candidate, { ...current, ...patch }, configuration));
  }
  assert.throws(() => validateIdentity(candidate, current, { site: 'https://changed.example.com' }));
  validateOrder(candidate, null);
  validateOrder(candidate, current);
  assert.throws(() => validateOrder(candidate, { ...current, runNumber: 11 }));
  validateWorker(candidate, new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' } }));
  assert.throws(() =>
    validateWorker(candidate, new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': '11' } })),
  );
  assert.throws(() =>
    validateWorker(
      candidate,
      new Response('{}', { headers: { 'X-Release-SHA': 'b'.repeat(40), 'X-Release-Run-Number': '10' } }),
    ),
  );
});

test('retained artifact verification rejects missing and modified files', (context) => {
  validateArtifacts([{ name: `release-${sha}`, expired: false }], sha);
  assert.throws(() => validateArtifacts([{ name: `release-${sha}`, expired: true }], sha));
  assert.throws(() => validateArtifacts([{ name: `release-${'b'.repeat(40)}`, expired: false }], sha));
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-release-'));
  context.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    rmSync(directory, { recursive: true });
  });
  const files = {};
  for (const target of ['uat/public', 'prd/public', 'uat/worker', 'prd/cms', 'migrations']) {
    mkdirSync(`${directory}/${target}`, { recursive: true });
    writeFileSync(`${directory}/${target}/artifact`, sha);
    if (target === 'uat/worker' || target === 'prd/cms') {
      for (const file of [
        'server/wrangler.json',
        'server/entry.mjs',
        'client/content/index.html',
        'client/items/index.html',
        'client/stock/index.html',
      ]) {
        mkdirSync(path.dirname(`${directory}/${target}/${file}`), { recursive: true });
        writeFileSync(`${directory}/${target}/${file}`, sha);
      }
    }
    files[target] = inventory(`${directory}/${target}`);
  }
  assert.throws(() => verifyFiles({ schema: 1, files }, directory), /fresh candidate/);
  verifyFiles({ schema: 2, files }, directory);
  writeFileSync(`${directory}/prd/public/artifact`, 'tampered');
  assert.throws(() => verifyFiles({ schema: 2, files }, directory), /digest mismatch/);
  writeFileSync(`${directory}/prd/public/artifact`, sha);
  rmSync(`${directory}/prd/cms`, { recursive: true });
  assert.throws(() => verifyFiles({ schema: 2, files }, directory), /Missing combined CMS artifact/);
});

test('compact transport round-trips complete logical files and rejects unexpected objects', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-release-transport-'));
  try {
    const repeated = 'same payload\n'.repeat(100);
    const files = {};
    for (const target of ['uat/public', 'prd/public']) {
      mkdirSync(`${directory}/${target}`, { recursive: true });
      for (let index = 0; index < 6; index += 1) {
        writeFileSync(`${directory}/${target}/asset-${index}.txt`, repeated);
      }
      files[target] = inventory(`${directory}/${target}`);
    }
    const candidate = { schema: 2, files };
    writeFileSync(`${directory}/manifest.json`, JSON.stringify(candidate));
    const packed = packBundle(directory);
    assert.equal(packed.logicalBytes, repeated.length * 12);
    assert.equal(packed.storedBytes, repeated.length);
    assert.ok(packed.storedBytes < packed.logicalBytes / 2);
    assert.ok(existsSync(`${directory}/transport.json`));
    assert.deepEqual(Object.keys(materializeBundle(directory)), ['materialized', 'objectCount']);
    for (const target of Object.keys(files)) assert.deepEqual(inventory(`${directory}/${target}`), files[target]);
    assert.equal(materializeBundle(directory).materialized, false);

    packBundle(directory);
    const object = readdirSync(`${directory}/objects`)[0];
    const originalObject = readFileSync(`${directory}/objects/${object}`);
    writeFileSync(`${directory}/objects/${object}`, 'tampered');
    assert.throws(() => materializeBundle(directory), /size mismatch|digest mismatch/);
    assert.ok(existsSync(`${directory}/transport.json`), 'failed materialization leaves the compact input intact');

    writeFileSync(`${directory}/objects/${object}`, originalObject);
    materializeBundle(directory);
    packBundle(directory);
    const missingObject = readdirSync(`${directory}/objects`)[0];
    const missingBytes = readFileSync(`${directory}/objects/${missingObject}`);
    rmSync(`${directory}/objects/${missingObject}`);
    assert.throws(() => materializeBundle(directory), /objects differ from the manifest|unexpected objects/);
    writeFileSync(`${directory}/objects/${missingObject}`, missingBytes);
    materializeBundle(directory);
    packBundle(directory);
    writeFileSync(`${directory}/objects/${'f'.repeat(64)}`, 'extra');
    assert.throws(() => materializeBundle(directory), /unexpected objects/);
    assert.equal(readFileSync(`${directory}/manifest.json`, 'utf8'), JSON.stringify(candidate));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('compact transport rejects path escapes and duplicate logical destinations before packing', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-release-transport-paths-'));
  try {
    mkdirSync(`${directory}/uat/public`, { recursive: true });
    writeFileSync(`${directory}/uat/public/asset`, 'asset');
    const digest = 'a'.repeat(64);
    for (const files of [
      { uat: { '../escape': digest } },
      { uat: { 'public/asset': digest }, 'uat/public': { asset: digest } },
    ]) {
      writeFileSync(`${directory}/manifest.json`, JSON.stringify({ schema: 2, files }));
      assert.throws(() => packBundle(directory), /Invalid release path|Duplicate release destination/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('pack-target CLI produces independently verifiable UAT and PRD bundles', (context) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-pack-target-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const target of ['uat', 'prd']) {
    const cwd = path.join(directory, target);
    const write = (name, content) => {
      const filename = path.join(cwd, name);
      mkdirSync(path.dirname(filename), { recursive: true });
      writeFileSync(filename, content);
    };
    for (const name of ['wrangler.jsonc', 'cms-resources.json', 'astro.config.mjs', 'astro.public.config.mjs'])
      write(`apps/backend/${name}`, '{}');
    write('pnpm-lock.yaml', 'fixture lock');
    write('apps/backend/prisma/migrations/fixture.sql', 'SELECT 1;');
    write('apps/backend/cms-migrations/fixture.sql', 'SELECT 1;');
    write(`.codex-artifacts/release-content/${target}/identity.json`, 'null');
    const bundle = '.codex-artifacts/release';
    write(`${bundle}/${target}/public/index.html`, target === 'uat' ? '[UAT] UAT · TESTING ONLY' : 'PRD SITE');
    write(`${bundle}/${target}/public/_headers`, 'fixture headers');
    write(`${bundle}/${target}/renderer/server/entry.mjs`, sha);
    const worker = target === 'uat' ? 'worker' : 'cms';
    for (const file of [
      'server/wrangler.json',
      'server/entry.mjs',
      'client/content/index.html',
      'client/items/index.html',
      'client/stock/index.html',
    ])
      write(`${bundle}/${target}/${worker}/${file}`, file.endsWith('.mjs') ? `${sha} X-Release-SHA` : '{}');
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./release-candidate.mjs', import.meta.url)), 'pack-target', target],
      {
        cwd,
        env: {
          ...process.env,
          SOURCE_SHA: sha,
          GITHUB_SHA: sha,
          GITHUB_RUN_ID: '123',
          GITHUB_RUN_NUMBER: '10',
          CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
          UAT_PUBLIC_BACKEND_BASE_URL: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
          PRD_PUBLIC_BACKEND_BASE_URL: 'https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev',
        },
        stdio: 'pipe',
      },
    );
    const root = path.join(cwd, bundle);
    const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    assert.equal(manifest.target, target);
    verifyTargetFiles(manifest, target, root);
  }
  const result = assembleTargetBundles(
    `${directory}/uat/.codex-artifacts/release`,
    `${directory}/prd/.codex-artifacts/release`,
    `${directory}/final`,
  );
  assert.equal(result.candidate.schema, 2);
  // Promotion acceptance materializes the downloaded transport offline, bound to the selected source and run.
  const materialize = (runId) => {
    const cwd = path.join(directory, `promotion-${runId}`);
    cpSync(`${directory}/final`, path.join(cwd, '.codex-artifacts/release'), { recursive: true });
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./release-candidate.mjs', import.meta.url)), 'materialize'],
      {
        cwd,
        env: { ...process.env, SOURCE_SHA: sha, CANDIDATE_RUN_ID: runId },
        stdio: 'pipe',
        windowsHide: true,
      },
    );
    return path.join(cwd, '.codex-artifacts/release');
  };
  assert.ok(existsSync(path.join(materialize('123'), 'prd/cms/client/content/index.html')));
  assert.throws(() => materialize('999'), /Downloaded candidate differs from the run/);
  verifyFiles(result.candidate, `${directory}/final`);
});

test('target bundles assemble only when identities, digests, and migration inventories agree', (context) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-release-targets-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const common = {
    schema: 2,
    publicationMode: 'runtime',
    sha,
    workflowSha: 'b'.repeat(40),
    runId: '123',
    runNumber: 10,
    configuration: {
      uatBackend: 'https://uat.example.com',
      prdBackend: 'https://prd.example.com',
    },
  };
  const makeTarget = (target, root) => {
    const paths =
      target === 'uat'
        ? ['uat/public', 'uat/worker', 'uat/renderer', 'migrations']
        : ['prd/public', 'prd/cms', 'prd/renderer', 'migrations'];
    const files = {};
    for (const targetPath of paths) {
      mkdirSync(`${root}/${targetPath}`, { recursive: true });
      writeFileSync(`${root}/${targetPath}/artifact`, targetPath === 'migrations' ? 'same migration' : targetPath);
      if (targetPath === `${target}/public`) {
        writeFileSync(`${root}/${targetPath}/index.html`, target === 'uat' ? '[UAT] UAT · TESTING ONLY' : 'PRD SITE');
        writeFileSync(`${root}/${targetPath}/_headers`, 'headers');
        writeFileSync(
          `${root}/${targetPath}/release.json`,
          JSON.stringify({ sha, runId: '123', runNumber: 10, publicationMode: 'runtime' }),
        );
      }
      if (targetPath === 'uat/worker' || targetPath === 'prd/cms') {
        for (const file of [
          'server/wrangler.json',
          'server/entry.mjs',
          'client/content/index.html',
          'client/items/index.html',
          'client/stock/index.html',
        ]) {
          mkdirSync(path.dirname(`${root}/${targetPath}/${file}`), { recursive: true });
          writeFileSync(`${root}/${targetPath}/${file}`, file.endsWith('.mjs') ? `${sha} X-Release-SHA` : file);
        }
      }
      files[targetPath] = inventory(`${root}/${targetPath}`);
    }
    const candidate = {
      ...common,
      target,
      configuration: { ...common.configuration, migrations: files.migrations },
      files,
    };
    writeFileSync(`${root}/manifest.json`, JSON.stringify(candidate));
    packBundle(root);
    return candidate;
  };
  const uatDir = `${directory}/uat`;
  const prdDir = `${directory}/prd`;
  mkdirSync(uatDir);
  mkdirSync(prdDir);
  const uat = makeTarget('uat', uatDir);
  const prd = makeTarget('prd', prdDir);
  verifyTargetFiles(uat, 'uat', uatDir);
  verifyTargetFiles(prd, 'prd', prdDir);
  const missingDir = `${directory}/missing-file`;
  cpSync(uatDir, missingDir, { recursive: true });
  materializeBundle(missingDir);
  rmSync(`${missingDir}/uat/public/index.html`);
  assert.throws(() => verifyTargetFiles(uat, 'uat', missingDir), /Artifact digest mismatch/);
  assert.throws(() => assembleTargetBundles(uatDir, `${directory}/missing-prd`, `${directory}/missing-target`));

  const output = `${directory}/assembled`;
  const result = assembleTargetBundles(uatDir, prdDir, output);
  assert.equal(result.candidate.schema, 2);
  assert.equal('target' in result.candidate, false);
  verifyFiles(result.candidate, output);
  assert.throws(() => assembleTargetBundles(uatDir, prdDir, output), /already exists/);

  const mismatchDir = `${directory}/mismatch`;
  cpSync(prdDir, mismatchDir, { recursive: true });
  materializeBundle(mismatchDir);
  const mismatch = JSON.parse(readFileSync(`${mismatchDir}/manifest.json`, 'utf8'));
  mismatch.runNumber += 1;
  writeFileSync(
    `${mismatchDir}/prd/public/release.json`,
    JSON.stringify({ sha, runId: mismatch.runId, runNumber: mismatch.runNumber, publicationMode: 'runtime' }),
  );
  mismatch.files['prd/public'] = inventory(`${mismatchDir}/prd/public`);
  writeFileSync(`${mismatchDir}/manifest.json`, JSON.stringify(mismatch));
  packBundle(mismatchDir);
  assert.throws(() => assembleTargetBundles(uatDir, mismatchDir, `${directory}/wrong-run`), /different candidate/);

  const foreignDir = `${directory}/foreign`;
  cpSync(prdDir, foreignDir, { recursive: true });
  materializeBundle(foreignDir);
  const foreign = JSON.parse(readFileSync(`${foreignDir}/manifest.json`, 'utf8'));
  foreign.target = 'uat';
  writeFileSync(`${foreignDir}/manifest.json`, JSON.stringify(foreign));
  packBundle(foreignDir);
  assert.throws(() => assembleTargetBundles(uatDir, foreignDir, `${directory}/wrong-target`), /Expected PRD/);

  const conflictDir = `${directory}/migration-conflict`;
  cpSync(prdDir, conflictDir, { recursive: true });
  materializeBundle(conflictDir);
  writeFileSync(`${conflictDir}/migrations/artifact`, 'conflicting migration');
  const conflict = JSON.parse(readFileSync(`${conflictDir}/manifest.json`, 'utf8'));
  conflict.files.migrations = inventory(`${conflictDir}/migrations`);
  writeFileSync(`${conflictDir}/manifest.json`, JSON.stringify(conflict));
  packBundle(conflictDir);
  assert.throws(
    () => assembleTargetBundles(uatDir, conflictDir, `${directory}/wrong-migrations`),
    /conflicting migration inventories/,
  );

  const tamperedDir = `${directory}/tampered`;
  cpSync(prdDir, tamperedDir, { recursive: true });
  packBundle(tamperedDir);
  const object = readdirSync(`${tamperedDir}/objects`)[0];
  writeFileSync(`${tamperedDir}/objects/${object}`, 'tampered');
  assert.throws(() => verifyTargetFiles(prd, 'prd', tamperedDir), /size mismatch|digest mismatch/);
});
