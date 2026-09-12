import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { inventory, observe, validateIdentity, validateOrder, validateRun, verifyFiles } from './release-candidate.mjs';

const sha = 'a'.repeat(40);
const repository = 'example/repository';
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

test('superseded UAT, mixed revisions and changed config cannot authorize promotion', () => {
  const configuration = { site: 'https://uat.example.com' };
  const candidate = { schema: 1, sha, runId: '123', runNumber: 10, configuration };
  const current = { sha, runId: '123', runNumber: 10 };
  validateIdentity(candidate, current, configuration);
  for (const patch of [{ sha: 'b'.repeat(40) }, { runId: '124' }, { runNumber: 11 }]) {
    assert.throws(() => validateIdentity(candidate, { ...current, ...patch }, configuration));
  }
  assert.throws(() => validateIdentity(candidate, current, { site: 'https://changed.example.com' }));
  validateOrder(candidate, null);
  validateOrder(candidate, current);
  assert.throws(() => validateOrder(candidate, { ...current, runNumber: 11 }));
});

test('retained artifact verification rejects missing and modified files', (context) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-release-'));
  context.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    rmSync(directory, { recursive: true });
  });
  const files = {};
  for (const target of ['uat/public', 'prd/public', 'prd/staff', 'uat/worker', 'prd/worker', 'migrations']) {
    mkdirSync(`${directory}/${target}`, { recursive: true });
    writeFileSync(`${directory}/${target}/artifact`, sha);
    files[target] = inventory(`${directory}/${target}`);
  }
  verifyFiles({ files }, directory);
  writeFileSync(`${directory}/prd/public/artifact`, 'tampered');
  assert.throws(() => verifyFiles({ files }, directory), /digest mismatch/);
  writeFileSync(`${directory}/prd/public/artifact`, sha);
  rmSync(`${directory}/prd/worker`, { recursive: true });
  assert.throws(() => verifyFiles({ files }, directory), /Missing artifact/);
});
