import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { execa } from 'execa';
import { validationPlan, runValidation, sourceIdentity, diagnosticExcerpt, monitorSourceChanges } from './validate.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const identity = async () => ({ sha: 'fixture', fingerprint: 'same' });
const testOptions = { identify: identity, readPnpmVersion: async () => '12.0.0', log: () => {} };
const command = (name, source) => ({ name, command: process.execPath, args: ['-e', source] });
async function fixture(t) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-validation-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

test('full plan preserves every baseline leaf command and standalone preparation', async () => {
  const { scripts } = JSON.parse(await readFile(path.join(root, 'package.json')));
  const plan = validationPlan();
  assert.deepEqual(
    plan.map((phase) => phase.args[0]),
    ['stripe:catalog:artifacts:generate', 'test:unit:core', 'check:core', 'build:core'],
  );
  assert.equal(scripts['build:core'], 'pnpm build:web && pnpm build:staff');
  assert.equal(
    scripts['check:core'],
    'pnpm environment:model:verify && pnpm format:check && pnpm lint && pnpm check:types && pnpm check:boundaries',
  );
  for (const name of ['build', 'check', 'test:unit'])
    assert.equal(scripts[name], `pnpm stripe:catalog:artifacts:generate && pnpm ${name}:core`);
  assert.match(
    scripts['test:unit:core'],
    /--filter @blackbox\/web --filter @blackbox\/staff --filter @blackbox\/backend --filter @blackbox\/api-client test && pnpm test:contracts/,
  );
  assert.throws(() => validationPlan({ scope: 'web' }));
  assert.throws(() => validationPlan({ fast: true, scope: 'unknown' }));
  assert.deepEqual(validationPlan({ fast: true, scope: 'backend' })[1].args, [
    '--parallel',
    '--filter',
    '@blackbox/backend',
    'test',
  ]);
  assert.equal(validationPlan({ fast: true }).at(-1).name, 'contracts');
});

for (const phase of ['test', 'format', 'type', 'boundary', 'build', 'missing-artifact']) {
  test(`${phase} failure preserves exit status and prevents later phases`, async (t) => {
    const cwd = await fixture(t);
    const summary = await runValidation({
      cwd,
      ...testOptions,
      phases: [
        command(phase, 'console.error("FAIL sentinel"); process.exit(7)'),
        command('should-not-run', 'process.exit(0)'),
      ],
    });
    assert.equal(summary.status, 'failed');
    assert.equal(summary.exitCode, 7);
    assert.equal(summary.phases.length, 1);
    assert.match(await readFile(summary.phases[0].logPath, 'utf8'), /FAIL sentinel/);
  });
}

test('partial pass, changed source and cancellation never report full completion', async (t) => {
  const cwd = await fixture(t);
  const phases = [command('ok', 'console.log("ok")')];
  assert.equal((await runValidation({ cwd, phases, fast: true, ...testOptions })).status, 'partial');
  let reads = 0;
  assert.equal(
    (await runValidation({ cwd, phases, ...testOptions, identify: async () => ({ fingerprint: String(reads++) }) }))
      .status,
    'invalidated',
  );
  const controller = new AbortController();
  controller.abort();
  assert.equal((await runValidation({ cwd, phases, ...testOptions, signal: controller.signal })).status, 'cancelled');
});

test('cancellation terminates a running child and records a nonzero result', async (t) => {
  const cwd = await fixture(t);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 500);
  try {
    const summary = await runValidation({
      cwd,
      ...testOptions,
      signal: controller.signal,
      phases: [command('waiting', 'setInterval(() => {}, 1000)')],
    });
    assert.equal(summary.status, 'cancelled');
    assert.notEqual(summary.exitCode, 0);
  } finally {
    clearTimeout(timer);
  }
});

test('missing generated input surfaces its filesystem diagnostic', async (t) => {
  const cwd = await fixture(t);
  const summary = await runValidation({
    cwd,
    ...testOptions,
    phases: [command('build', "require('node:fs').readFileSync('missing-generated-input')")],
  });
  assert.equal(summary.status, 'failed');
  assert.match(await readFile(summary.phases[0].logPath, 'utf8'), /ENOENT/);
});

test('source fingerprint detects tracked, untracked and deleted source but ignores logs', async (t) => {
  const cwd = await fixture(t);
  await execa('git', ['init'], { cwd });
  await writeFile(path.join(cwd, '.gitignore'), '.codex-artifacts/\n');
  await writeFile(path.join(cwd, 'source.txt'), 'before');
  await execa('git', ['add', '.'], { cwd });
  await execa(
    'git',
    ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'],
    { cwd },
  );
  const original = await sourceIdentity(cwd);
  const stopReadMonitoring = await monitorSourceChanges(cwd);
  await readFile(path.join(cwd, 'source.txt'));
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.deepEqual(await stopReadMonitoring(), []);
  const stopMonitoring = await monitorSourceChanges(cwd);
  await writeFile(path.join(cwd, 'source.txt'), 'transient');
  await new Promise((resolve) => setTimeout(resolve, 30));
  await writeFile(path.join(cwd, 'source.txt'), 'before');
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.ok((await stopMonitoring()).includes('source.txt'));
  assert.deepEqual(await sourceIdentity(cwd), original);
  await mkdir(path.join(cwd, 'existing'));
  const stopGeneratedMonitoring = await monitorSourceChanges(cwd);
  await writeFile(path.join(cwd, 'existing', '_tmp_123_abcdef12'), 'pnpm probe');
  await new Promise((resolve) => setTimeout(resolve, 30));
  await rm(path.join(cwd, 'existing', '_tmp_123_abcdef12'));
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.deepEqual(await stopGeneratedMonitoring(), []);
  await mkdir(path.join(cwd, '.codex-artifacts'));
  await writeFile(path.join(cwd, '.codex-artifacts', 'log'), 'ignored');
  assert.deepEqual(await sourceIdentity(cwd), original);
  await writeFile(path.join(cwd, 'source.txt'), 'after');
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, original.fingerprint);
  await writeFile(path.join(cwd, 'source.txt'), 'before');
  await writeFile(path.join(cwd, 'new.txt'), 'untracked');
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, original.fingerprint);
  await rm(path.join(cwd, 'new.txt'));
  await rm(path.join(cwd, 'source.txt'));
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, original.fingerprint);
});

test('worktree guard rejects by default and accepts explicit authorization', async () => {
  const run = (args) =>
    execa(process.execPath, ['--import', 'tsx', 'scripts/assert-openspec-worktree.ts', ...args], {
      cwd: root,
      reject: false,
    });
  const worktrees = (await execa('git', ['worktree', 'list', '--porcelain'], { cwd: root })).stdout;
  const primary = worktrees.split('\n')[0].slice('worktree '.length).replaceAll('\\', '/').toLowerCase();
  const branch = (await execa('git', ['branch', '--show-current'], { cwd: root })).stdout;
  assert.equal(
    (await run([])).exitCode,
    root.replaceAll('\\', '/').replace(/\/$/, '').toLowerCase() === primary && branch === 'main' ? 0 : 1,
  );
  assert.equal((await run(['--allow-worktree'])).exitCode, 0);
});

test('diagnostics retain failure context within a fixed output bound', () => {
  const output = `PASS handles failures\n${'noise\n'.repeat(200)}FAIL test assertion\n${'details\n'.repeat(200)}`;
  assert.match(diagnosticExcerpt(output), /FAIL test assertion/);
  assert.ok(diagnosticExcerpt(output).length <= 6000);
});
