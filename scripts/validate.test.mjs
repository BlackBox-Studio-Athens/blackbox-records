import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { execa } from 'execa';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validationPlan, main, runValidation, sourceIdentity } from './validate.mjs';
import { main as testWatchMain, nxWatchArguments } from './test-watch.mjs';

const identity = async () => ({ sha: 'fixture', fingerprint: 'same' });

async function fixture(t) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-validation-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

async function gitFixture(t) {
  const cwd = await fixture(t);
  await import('execa').then(({ execa }) => execa('git', ['init'], { cwd }));
  await writeFile(path.join(cwd, '.gitignore'), '.codex-artifacts/\n');
  await writeFile(path.join(cwd, 'source.ts'), 'before');
  const { execa } = await import('execa');
  await execa('git', ['add', '.'], { cwd });
  await execa(
    'git',
    ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'],
    { cwd },
  );
  return cwd;
}

test('Nx plans use affected targets by default and run-many for full validation', async () => {
  assert.deepEqual(validationPlan()[0].args, ['exec', 'nx', 'affected', '-t', 'test', 'lint', 'typecheck', '--nxBail']);
  assert.deepEqual(validationPlan({ full: true })[0].args, [
    'exec',
    'nx',
    'run-many',
    '-t',
    'test',
    'lint',
    'typecheck',
    'build',
    '--all',
    '--nxBail',
  ]);
  assert.deepEqual(validationPlan({ checks: true })[0].args, [
    'exec',
    'nx',
    'run-many',
    '-t',
    'test',
    'lint',
    'typecheck',
    '--all',
    '--nxBail',
  ]);
  assert.deepEqual(validationPlan({ scope: 'web' })[0].args, [
    'exec',
    'nx',
    'affected',
    '-t',
    'test',
    'lint',
    'typecheck',
    '--nxBail',
    '--exclude=*,!tag:scope:web',
  ]);
  assert.deepEqual(validationPlan({ lintOnly: true })[0].args, [
    'exec',
    'nx',
    'run-many',
    '-t',
    'lint',
    '--all',
    '--nxBail',
  ]);
  assert.deepEqual(validationPlan({ plan: true })[0].args.slice(-2), ['--nxBail', '--graph=stdout']);
  assert.deepEqual(validationPlan({ since: 'HEAD' })[0].args.slice(-1), ['--base=HEAD']);
  assert.throws(() => validationPlan({ full: true, since: 'HEAD' }), /only valid for affected/);
  assert.throws(() => validationPlan({ full: true, fast: true }), /one validation mode/);
  assert.throws(() => validationPlan({ full: true, scope: 'web' }), /cannot be scoped/);
  assert.throws(() => validationPlan({ scope: 'unknown' }), /Unknown scope/);
  assert.throws(() => validationPlan({ editor: true, since: 'HEAD' }), /--since/);
  assert.throws(() => validationPlan({ editor: true, plan: true }), /--plan/);
  assert.deepEqual(nxWatchArguments('stock'), ['exec', 'nx', 'run', 'stock:test-watch']);
  assert.deepEqual(nxWatchArguments('backend', { changed: true, since: 'origin/main' }), [
    'exec',
    'nx',
    'affected',
    '-t',
    'test',
    '--exclude=*,!tag:scope:backend',
    '--base=origin/main',
  ]);
  assert.deepEqual(nxWatchArguments(undefined, { changed: true }), ['exec', 'nx', 'affected', '-t', 'test']);
  assert.deepEqual(nxWatchArguments(undefined, { changed: true, since: 'origin/main' }), [
    'exec',
    'nx',
    'affected',
    '-t',
    'test',
    '--base=origin/main',
  ]);
  assert.throws(() => nxWatchArguments(), /Specify a module/);
  assert.throws(() => nxWatchArguments('typo', { changed: true }), /Unknown changed-test scope/);
  let output = '';
  const originalLog = console.log;
  console.log = (message) => {
    output = message;
  };
  try {
    await testWatchMain(['--changed'], { runCommand: async () => ({ exitCode: 0 }) });
  } finally {
    console.log = originalLog;
  }
  assert.equal(output, 'PARTIAL affected tests: this does not establish implementation completion.');
  await assert.rejects(testWatchMain(['--changed', 'web', 'backend'], { runCommand: async () => {} }), /module once/);
  await assert.rejects(
    testWatchMain(['--changed', '--scope=web', 'backend'], { runCommand: async () => {} }),
    /module once/,
  );
});

test('CLI rejects ignored jobs and unsupported editor combinations', async (t) => {
  const cwd = await fixture(t);
  const dependencies = { cwd, identify: identity, log: () => {}, runCommand: async () => {} };
  await assert.rejects(main(['--jobs', '2'], dependencies), /Unknown option '--jobs'/);
  await assert.rejects(main(['--editor', '--since=HEAD'], dependencies), /--since/);
  await assert.rejects(main(['--editor', '--plan'], dependencies), /--plan/);
});

test('invalidated or cancelled plans cannot succeed', async (t) => {
  const cwd = await fixture(t);
  const invalidated = await runValidation({
    cwd,
    options: { plan: true },
    identify: (() => {
      let call = 0;
      return async () => ({ fingerprint: String(call++) });
    })(),
    log: () => {},
    runCommand: async () => {},
  });
  assert.equal(invalidated.status, 'invalidated');
  assert.notEqual(invalidated.exitCode, 0);

  const controller = new AbortController();
  let spawnedEnv;
  const cancelled = await runValidation({
    cwd,
    options: { plan: true },
    signal: controller.signal,
    identify: identity,
    log: () => {},
    runCommand: async (command) => {
      spawnedEnv = command.env;
      controller.abort();
    },
  });
  assert.equal(spawnedEnv.NX_DAEMON, 'false');
  assert.equal(cancelled.status, 'cancelled');
  assert.notEqual(cancelled.exitCode, 0);
});

test('real failing subprocess output streams before exit and stays in the phase log', async (t) => {
  const cwd = await fixture(t);
  const root = path.dirname(fileURLToPath(import.meta.url));
  const summaryPath = path.join(cwd, 'summary.json');
  const harness = `
    import { writeFile } from 'node:fs/promises';
    import { runValidation } from ${JSON.stringify(pathToFileURL(path.join(root, 'validate.mjs')).href)};
    import { runFiniteCommand } from ${JSON.stringify(pathToFileURL(path.join(root, 'local-process.ts')).href)};
    const summary = await runValidation({
      cwd: ${JSON.stringify(cwd)},
      options: { fast: true },
      identify: async () => ({ fingerprint: 'fixed' }),
      log: () => {},
      runCommand: (_command, options) => runFiniteCommand({
        name: 'subprocess', command: process.execPath,
        args: ['-e', "process.stdout.write('LIVE_STDOUT_SENTINEL\\\\n'); process.stderr.write('LIVE_STDERR_SENTINEL\\\\n'); setTimeout(() => process.exit(9), 500)"],
      }, options),
    });
    await writeFile(${JSON.stringify(summaryPath)}, JSON.stringify(summary));
  `;
  let resolveFirstOutput;
  const firstOutput = new Promise((resolve) => {
    resolveFirstOutput = resolve;
  });
  const child = execa(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', harness], {
    cwd: root,
    reject: false,
  });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
    if (output.includes('LIVE_STDOUT_SENTINEL')) resolveFirstOutput();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  const first = await Promise.race([firstOutput.then(() => 'output'), child.then(() => 'exit')]);
  const result = await child;
  if (first !== 'output') {
    const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
    assert.fail(
      `subprocess exited before live output: ${JSON.stringify({ result: result.stderr, summary: summary.error })}`,
    );
  }
  assert.equal(result.exitCode, 0, output);
  assert.match(output, /LIVE_STDOUT_SENTINEL/);
  assert.match(output, /LIVE_STDERR_SENTINEL/);
  const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
  assert.equal(summary.status, 'failed');
  assert.equal(summary.phases[0].exitCode, 9);
  const log = await readFile(summary.phases[0].logPath, 'utf8');
  assert.match(log, /LIVE_STDOUT_SENTINEL/);
  assert.match(log, /LIVE_STDERR_SENTINEL/);
  assert.equal(summary.firstFailureDurationMs, null);
});

test('CLI no-cache skips Nx cache without changing affected mode', async (t) => {
  const cwd = await fixture(t);
  let invocation;
  const summary = await main(['--no-cache'], {
    cwd,
    identify: identity,
    log: () => {},
    runCommand: async (command) => {
      invocation = command;
    },
  });
  assert.equal(summary.mode, 'local');
  assert.equal(summary.status, 'passed');
  assert.deepEqual(invocation.args, [
    'exec',
    'nx',
    'affected',
    '-t',
    'test',
    'lint',
    'typecheck',
    '--nxBail',
    '--skip-nx-cache',
  ]);
  await main(['--resume'], {
    cwd,
    identify: identity,
    log: () => {},
    runCommand: async (command) => {
      invocation = command;
    },
  });
  assert.equal(invocation.args.includes('--skip-nx-cache'), false);
  const planned = await main(['--plan'], {
    cwd,
    identify: identity,
    log: () => {},
    runCommand: async (command) => {
      invocation = command;
    },
  });
  assert.equal(planned.status, 'planned');
  assert.ok(invocation.args.includes('--graph=stdout'));
});

test('failed Nx invocation preserves its exit code and stops the run', async (t) => {
  const cwd = await fixture(t);
  let calls = 0;
  const summary = await runValidation({
    cwd,
    options: { full: true },
    identify: identity,
    log: () => {},
    runCommand: async () => {
      calls += 1;
      throw Object.assign(new Error('Nx failed'), { exitCode: 9 });
    },
  });
  assert.equal(calls, 1);
  assert.equal(summary.status, 'failed');
  assert.equal(summary.exitCode, 9);
  assert.equal(summary.phases[0].status, 'failed');
  assert.ok(summary.skippedPhases.length === 0);
});

test('a source edit restored before exit still invalidates evidence', async (t) => {
  const cwd = await gitFixture(t);
  const summary = await runValidation({
    cwd,
    options: { fast: true },
    identify: sourceIdentity,
    log: () => {},
    runCommand: async () => {
      await writeFile(path.join(cwd, 'source.ts'), 'transient');
      await new Promise((resolve) => setTimeout(resolve, 40));
      await writeFile(path.join(cwd, 'source.ts'), 'before');
      await new Promise((resolve) => setTimeout(resolve, 40));
    },
  });
  assert.equal(summary.sourceBefore.fingerprint, summary.sourceAfter.fingerprint);
  assert.equal(summary.status, 'invalidated');
  assert.ok(summary.sourceChanges.includes('source.ts'));
});

test('source fingerprint hashes tracked and untracked files and ignores validation evidence', async (t) => {
  const cwd = await gitFixture(t);
  const original = await sourceIdentity(cwd);
  await writeFile(path.join(cwd, 'new.ts'), 'new');
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, original.fingerprint);
  await rm(path.join(cwd, 'new.ts'));
  await writeFile(path.join(cwd, 'source.ts'), 'after');
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, original.fingerprint);
});

async function lockFixture(t, content) {
  const cwd = await fixture(t);
  const lockPath = path.join(cwd, '.codex-artifacts', 'validation', 'active.lock');
  await mkdir(path.dirname(lockPath), { recursive: true });
  await writeFile(lockPath, content);
  const run = () =>
    runValidation({ cwd, options: { plan: true }, identify: identity, log: () => {}, runCommand: async () => {} });
  return { lockPath, run };
}

test('a lock left by a dead process is replaced', async (t) => {
  const child = execa(process.execPath, ['-e', '']);
  await child;
  const { lockPath, run } = await lockFixture(t, String(child.pid));
  assert.notEqual((await run()).status, 'incomplete');
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});

test('a lock held by a live or unknown owner still fails and stays intact', async (t) => {
  for (const [content, message] of [
    [String(process.pid), new RegExp(`active[.]lock.*PID ${process.pid}`)],
    ['', /active\.lock.*unknown owner/],
  ]) {
    const { lockPath, run } = await lockFixture(t, content);
    await assert.rejects(run(), message);
    assert.equal(await readFile(lockPath, 'utf8'), content);
  }
});
