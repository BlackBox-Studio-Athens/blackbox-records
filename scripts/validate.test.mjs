import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { execa } from 'execa';
import { validationPlan, runValidation, sourceIdentity, diagnosticExcerpt, monitorSourceChanges } from './validate.mjs';
import { validationReporters } from './validation-reporters.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const identity = async () => ({ sha: 'fixture', fingerprint: 'same' });
const testOptions = { identify: identity, readPnpmVersion: async () => '12.0.0', log: () => {} };
const command = (name, source) => ({ name, command: process.execPath, args: ['-e', source] });
async function fixture(t) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-validation-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

test('full plan preserves current gates without retired catalog preparation', async () => {
  const { scripts } = JSON.parse(await readFile(path.join(root, 'package.json')));
  const plan = validationPlan();
  assert.deepEqual(
    plan.map((phase) => phase.args[0]),
    ['test:unit', 'environment:model:verify', 'format:check', 'lint', 'check:types', 'check:boundaries', 'build'],
  );
  assert.equal(scripts.build, 'node --import tsx scripts/run-release-preparation.mjs builds');
  assert.equal(
    scripts.check,
    'pnpm environment:model:verify && pnpm format:check && pnpm lint && pnpm check:types && pnpm check:boundaries',
  );
  for (const name of ['build', 'check', 'test:unit']) assert.doesNotMatch(scripts[name], /catalog/);
  assert.match(
    scripts['test:unit'],
    /--filter @blackbox\/web --filter @blackbox\/staff --filter @blackbox\/backend --filter @blackbox\/api-client test && pnpm test:contracts/,
  );
  assert.throws(() => validationPlan({ scope: 'web' }));
  assert.throws(() => validationPlan({ fast: true, scope: 'unknown' }));
  assert.deepEqual(validationPlan({ fast: true, scope: 'backend' })[0].args, [
    '--parallel',
    '--filter',
    '@blackbox/backend',
    'test',
  ]);
  assert.equal(validationPlan({ fast: true }).at(-1).name, 'contracts');
  assert.equal(validationPlan({ editor: true }).length, 4);
  assert.throws(() => validationPlan({ editor: true, fast: true }));
  assert.deepEqual(
    validationPlan({ checks: true }).map((phase) => phase.name),
    ['test:unit', 'environment:model:verify', 'format:check', 'lint', 'check:types', 'check:boundaries'],
  );
  assert.throws(() => validationPlan({ checks: true, fast: true }));
  assert.throws(() => validationPlan({ checks: true, scope: 'web' }));
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
  assert.equal((await runValidation({ cwd, phases, editor: true, ...testOptions })).status, 'partial');
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
  if ((await run([])).exitCode === 1) {
    const wrapper = await execa(process.execPath, ['--import', 'tsx', 'scripts/run-openspec.ts', '--', '--version'], {
      cwd: root,
      reject: false,
    });
    assert.equal(wrapper.exitCode, 1);
    assert.match(wrapper.stderr, /main worktree/);
  }
});

test('diagnostics retain failure context within a fixed output bound', () => {
  const output = `PASS handles failures\n${'noise\n'.repeat(200)}FAIL test assertion\n${'details\n'.repeat(200)}`;
  assert.match(diagnosticExcerpt(output), /FAIL test assertion/);
  assert.ok(diagnosticExcerpt(output).length <= 6000);
  const negativePathLog = `Error: expected injected D1 failure\n${'passing test\n'.repeat(50)}Failed Tests 1\nFAIL fixture.test.ts\nAssertionError: expected /api/wrong\n`;
  assert.match(diagnosticExcerpt(negativePathLog), /AssertionError: expected \/api\/wrong/);
  assert.doesNotMatch(diagnosticExcerpt(negativePathLog), /injected D1 failure/);
});

test('parallel groups finish before build and failures cannot reach build', async (t) => {
  const cwd = await fixture(t);
  const phases = [command('tests', 'setTimeout(() => {}, 200)')];
  for (let i = 0; i < 5; i++) phases.push(command(`check-${i}`, 'process.exit(0)'));
  phases.push(command('build', 'process.exit(0)'));
  const summary = await runValidation({ cwd, phases, jobs: 2, ...testOptions });
  assert.equal(summary.status, 'passed');
  assert.equal(summary.phases.at(-1).name, 'build');
  assert.match(summary.taskAcceptance, /not established/);
  phases[2] = command('bad-check', 'process.exit(9)');
  const failed = await runValidation({ cwd, phases, jobs: 2, ...testOptions });
  assert.equal(failed.exitCode, 9);
  assert.ok(!failed.phases.some(({ name }) => name === 'build'));
  assert.deepEqual(failed.skippedPhases, ['check-2', 'check-3', 'check-4', 'build']);
});

test('checks mode is partial and never schedules a build', async (t) => {
  const cwd = await fixture(t);
  const phases = [command('test:unit', 'setTimeout(() => {}, 20)'), command('check', 'process.exit(0)')];
  const summary = await runValidation({ cwd, phases, checks: true, jobs: 2, ...testOptions });
  assert.equal(summary.status, 'partial');
  assert.equal(summary.scope, 'checks');
  assert.equal(summary.mode, 'partial');
  assert.deepEqual(summary.skippedPhases, []);
  assert.ok(!summary.phases.some(({ name }) => name === 'build'));
});

test('native reports are opt-in and root contract ownership stays explicit', async () => {
  const original = process.env.BLACKBOX_VALIDATION_REPORT_DIR;
  try {
    delete process.env.BLACKBOX_VALIDATION_REPORT_DIR;
    assert.deepEqual(validationReporters('web'), {});
    process.env.BLACKBOX_VALIDATION_REPORT_DIR = '/evidence';
    assert.deepEqual(validationReporters('web').reporters, ['default', 'json']);
    assert.notEqual(validationReporters('web').outputFile, validationReporters('backend-node').outputFile);
  } finally {
    if (original === undefined) delete process.env.BLACKBOX_VALIDATION_REPORT_DIR;
    else process.env.BLACKBOX_VALIDATION_REPORT_DIR = original;
  }
  const web = await readFile(path.join(root, 'apps/web/vitest.config.ts'), 'utf8');
  const contracts = await readFile(path.join(root, 'scripts/vitest.contracts.config.ts'), 'utf8');
  for (const file of ['check-frontend-route-isolation.test.ts', 'pages-workflow-contract.test.ts']) {
    assert.ok(web.includes(`../../scripts/${file}`));
    assert.ok(contracts.includes(`scripts/${file}`));
  }
});
