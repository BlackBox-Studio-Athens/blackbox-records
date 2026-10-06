import assert from 'node:assert/strict';
import { copyFile, mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { execa } from 'execa';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPolicy } from './feedback-policy.mjs';
import { changedFiles, formatChangedFiles, validationPlan, main, runValidation, sourceIdentity } from './validate.mjs';
import {
  existingPath,
  main as testWatchMain,
  nxTestArguments,
  nxWatchArguments,
  owningProject,
} from './test-watch.mjs';

const identity = async () => ({ sha: 'fixture', fingerprint: 'same' });
const slotRequests = [];
const acquire = async (request) => {
  slotRequests.push(request);
  return { count: request.wait === false ? 1 : 2, release: async () => {} };
};
// Runner unit tests never touch the machine-wide slots or history, or format the checkout.
const offline = { acquire, format: async () => [], history: () => {}, env: {} };
// The maintainer's override, as the committed IDE run configuration carries it, for release-tier CLI modes.
const releaseTierEnv = { [loadPolicy().releaseTier.overrideEnv]: '1' };

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
  assert.deepEqual(validationPlan({ checks: true, part: 'lint' })[0].args.slice(3, 6), ['-t', 'lint', '--all']);
  assert.deepEqual(validationPlan({ checks: true, part: 'tests' })[0].args.slice(3, 7), [
    '-t',
    'test',
    'typecheck',
    '--all',
  ]);
  assert.throws(() => validationPlan({ part: 'lint' }), /needs --checks/);
  assert.throws(() => validationPlan({ checks: true, part: 'build' }), /lint or tests/);
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
  // Bail kills running sibling tasks, which then report as failures; CI lets every task report its own result.
  assert.deepEqual(validationPlan({ bail: false })[0].args, [
    'exec',
    'nx',
    'affected',
    '-t',
    'test',
    'lint',
    'typecheck',
  ]);
  assert.deepEqual(validationPlan({ full: true, plan: true, bail: false })[0].args.slice(-2), [
    '--all',
    '--graph=stdout',
  ]);
  assert.deepEqual(validationPlan({ since: 'HEAD' })[0].args.slice(-1), ['--base=HEAD']);
  assert.throws(() => validationPlan({ full: true, since: 'HEAD' }), /only valid for affected/);
  assert.throws(() => validationPlan({ full: true, fast: true }), /one validation mode/);
  assert.throws(() => validationPlan({ full: true, scope: 'web' }), /cannot be scoped/);
  assert.throws(() => validationPlan({ scope: 'unknown' }), /Unknown scope/);
  assert.throws(() => validationPlan({ editor: true, since: 'HEAD' }), /--since/);
  assert.throws(() => validationPlan({ editor: true, plan: true }), /--plan/);
  // An admitted editor run must not be judged again when its grant expires before the browser steps start.
  assert.deepEqual(
    validationPlan({ editor: true }).map(({ name, env }) => [name, env]),
    [
      ['build:staff', undefined],
      ['preview-policy', undefined],
      ['editor-chromium', releaseTierEnv],
      ['editor-firefox', releaseTierEnv],
    ],
  );
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
  let changedCommand;
  try {
    await testWatchMain(['--changed'], {
      acquire,
      runCommand: async (command) => {
        changedCommand = command;
        return { exitCode: 0 };
      },
    });
  } finally {
    console.log = originalLog;
  }
  assert.equal(output, 'PARTIAL affected tests: this does not establish implementation completion.');
  assert.deepEqual(changedCommand.args.slice(-1), ['--parallel=2']);
  assert.equal(changedCommand.env.NX_PLUGIN_NO_TIMEOUTS, 'true');
  assert.deepEqual(slotRequests.at(-1), { cwd: process.cwd(), signal: undefined, label: 'test:changed' });
  const affected = ['exec', 'nx', 'affected', '-t', 'test', '--exclude=workspace,*-tooling'];
  assert.deepEqual(nxTestArguments(), [...affected, '--base=HEAD']);
  assert.deepEqual(nxTestArguments('a/b.ts', 'a/b.ts'), [...affected, '--files=a/b.ts']);
  assert.deepEqual(nxTestArguments('scripts/a.mjs', 'scripts/a.mjs', [], false).slice(5), ['--files=scripts/a.mjs']);
  assert.deepEqual(nxTestArguments('staff-orders', undefined, ['--watch']).slice(-2), ['staff-orders:test', '--watch']);
  assert.deepEqual(nxTestArguments('staff-orders'), ['exec', 'nx', 'run', 'staff-orders:test']);
  assert.equal(existingPath('scripts\\test-watch.mjs'), 'scripts/test-watch.mjs');
  assert.equal(existingPath('nope.ts'), undefined);
  const node = (name, root, targets = {}) => ({ name, data: { root, targets } });
  const nodes = [node('workspace', '.'), node('app', 'apps/x'), node('mod', 'apps/x/src/mod', { 'test-watch': {} })];
  assert.equal(owningProject(nodes, 'apps/x/src/mod/a.ts').name, 'mod');
  assert.equal(owningProject(nodes, 'apps/x/src/modern/a.ts').name, 'app');
  assert.equal(owningProject(nodes, 'docs/a.md').name, 'workspace');
  const seen = [];
  const record = async (command) => seen.push(command.args.at(-1));
  console.log = () => {};
  try {
    await testWatchMain(['--run', 'scripts/test-watch.mjs'], { acquire, runCommand: record, nodes: async () => nodes });
    await testWatchMain(['--run', 'stock'], { acquire, runCommand: record });
    await testWatchMain(['--', 'scripts/test-watch.mjs'], {
      acquire,
      runCommand: record,
      nodes: async () => nodes,
    }).catch((e) => seen.push(e.message));
  } finally {
    console.log = originalLog;
  }
  assert.deepEqual(
    slotRequests.slice(-2).map(({ want, wait, label }) => ({ want, wait, label })),
    [
      { want: 1, wait: false, label: 'test scripts/test-watch.mjs' },
      { want: 1, wait: false, label: 'test stock' },
    ],
  );
  const full = [];
  console.log = () => {};
  try {
    const run = async (command) => full.push(command.args.join(' '));
    await testWatchMain(['--run', 'stock', '--watch', '-u'], { acquire, runCommand: run });
    await testWatchMain(['--run', 'scripts/test-watch.mjs'], { acquire, runCommand: run, nodes: async () => nodes });
    await testWatchMain(['--run'], { acquire, runCommand: run });
    const watched = slotRequests.length;
    await testWatchMain(['stock'], { acquire, runCommand: run });
    assert.equal(slotRequests.length, watched, 'watch targets take no slot');
  } finally {
    console.log = originalLog;
  }
  assert.equal(full[0], 'exec nx run stock:test --watch -u');
  assert.ok(!full[1].includes('--exclude=workspace,*-tooling'), 'root-owned path keeps workspace');
  assert.match(full[2], /--base=HEAD --parallel=2$/);
  assert.equal(full[3], 'exec nx run stock:test-watch');
  full.splice(2);
  await testWatchMain(['--run', 'scripts/test-watch.mjs'], {
    acquire,
    runCommand: async (command) => full.push(command.args.join(' ')),
    nodes: async () => [...nodes, node('x-tooling', 'scripts')],
  });
  assert.ok(!full[2].includes('--exclude'), 'tooling-owned path keeps its owner');
  assert.deepEqual(seen.slice(0, 2), ['--files=scripts/test-watch.mjs', 'stock:test']);
  assert.match(seen[2], /owned by workspace, which has no test-watch target/);
  await assert.rejects(testWatchMain(['--changed', 'web', 'backend'], { runCommand: async () => {} }), /module once/);
  await assert.rejects(
    testWatchMain(['--changed', '--scope=web', 'backend'], { runCommand: async () => {} }),
    /module once/,
  );
});

test('cancelling a test run that waits for machine slots ends the wait without running', async () => {
  const controller = new AbortController();
  let ran = false;
  const originalLog = console.log;
  console.log = () => {};
  try {
    const waiting = testWatchMain(['--changed'], {
      signal: controller.signal,
      // Waits like acquireSlots behind a held slot until the signal aborts.
      acquire: ({ signal }) =>
        new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
      runCommand: async () => {
        ran = true;
      },
    });
    controller.abort();
    await assert.rejects(waiting, { name: 'AbortError' });
  } finally {
    console.log = originalLog;
  }
  assert.equal(ran, false);
});

test('CLI rejects ignored jobs and unsupported editor combinations', async (t) => {
  const cwd = await fixture(t);
  const dependencies = { cwd, env: releaseTierEnv, identify: identity, log: () => {}, runCommand: async () => {} };
  await assert.rejects(main(['--jobs', '2'], dependencies), /Unknown option '--jobs'/);
  await assert.rejects(main(['--editor', '--since=HEAD'], dependencies), /--since/);
  await assert.rejects(main(['--editor', '--plan'], dependencies), /--plan/);
});

test('CLI refuses release-tier modes locally without an allowance before any work', async (t) => {
  const cwd = await fixture(t);
  const dependencies = {
    ...offline,
    cwd,
    identify: identity,
    log: () => {},
    runCommand: async () => assert.fail('a refused mode started a command'),
  };
  for (const mode of ['--full', '--checks', '--editor', '--lint-only', '--no-cache'])
    await assert.rejects(main([mode], dependencies), /release-tier work and needs a maintainer grant/, mode);
  await assert.rejects(access(path.join(cwd, '.codex-artifacts')), { code: 'ENOENT' });
  const ci = await main(['--checks'], { ...dependencies, env: { GITHUB_ACTIONS: 'true' }, runCommand: async () => {} });
  assert.equal(ci.status, 'partial');
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
  assert.equal(spawnedEnv.NX_PLUGIN_NO_TIMEOUTS, 'true');
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
      acquire: async () => ({ count: 1, release: async () => {} }),
      format: async () => [],
      history: () => {},
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
    ...offline,
    env: releaseTierEnv,
    cwd,
    identify: identity,
    log: () => {},
    runCommand: async (command) => {
      invocation = command;
    },
  });
  assert.equal(summary.mode, 'local');
  assert.equal(summary.status, 'passed');
  assert.equal(summary.slots.count, 2);
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
    '--parallel=2',
  ]);
  await main(['--resume'], {
    ...offline,
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
  // CI runs without --nxBail must still fail with the failing task's exit code.
  for (const env of [{}, { GITHUB_ACTIONS: 'true' }]) {
    let calls = 0;
    const summary = await runValidation({
      ...offline,
      env,
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
  }
});

const pause = () => new Promise((resolve) => setTimeout(resolve, 40));

test('a source edit restored before exit in both passes still invalidates evidence', async (t) => {
  const cwd = await gitFixture(t);
  const summary = await runValidation({
    ...offline,
    cwd,
    options: { fast: true },
    identify: sourceIdentity,
    log: () => {},
    runCommand: async () => {
      await writeFile(path.join(cwd, 'source.ts'), 'transient');
      await pause();
      await writeFile(path.join(cwd, 'source.ts'), 'before');
      await pause();
    },
  });
  assert.equal(summary.sourceBefore.fingerprint, summary.sourceAfter.fingerprint);
  assert.equal(summary.passes, 2);
  assert.equal(summary.status, 'invalidated');
  assert.ok(summary.sourceChanges.includes('source.ts'));
});

test('an edit during the first pass reruns the same selection once and converges', async (t) => {
  const cwd = await gitFixture(t);
  const runs = [];
  const logs = [];
  const summary = await runValidation({
    ...offline,
    cwd,
    identify: sourceIdentity,
    log: (message) => logs.push(message),
    runCommand: async (command) => {
      runs.push(command.args);
      if (runs.length === 1) {
        await writeFile(path.join(cwd, 'source.ts'), 'edited by another thread');
        await pause();
      }
    },
  });
  assert.equal(summary.status, 'passed');
  assert.equal(summary.passes, 2);
  assert.deepEqual(runs[1], runs[0]);
  assert.deepEqual(summary.firstPassSourceChanges, ['source.ts']);
  assert.deepEqual(summary.sourceChanges, []);
  assert.equal(summary.supersededPhases.length, 1);
  assert.match(summary.phases[0].logPath, /-rerun\.log$/);
  assert.ok(logs.some((message) => /running the same selection once more/.test(message)));
});

test('changed files are formatted before source identity and do not force a rerun', async (t) => {
  const cwd = await gitFixture(t);
  let formatRequest;
  const summary = await runValidation({
    ...offline,
    cwd,
    options: { since: 'HEAD' },
    identify: sourceIdentity,
    log: () => {},
    format: async (formatCwd, request) => {
      formatRequest = { formatCwd, since: request.since };
      await writeFile(path.join(cwd, 'source.ts'), 'formatted');
      return ['source.ts'];
    },
    runCommand: pause,
  });
  assert.deepEqual(formatRequest, { formatCwd: cwd, since: 'HEAD' });
  assert.deepEqual(summary.formatted, ['source.ts']);
  assert.equal(summary.passes, 1);
  assert.equal(summary.status, 'passed');
  assert.equal(summary.sourceBefore.files, 1);
});

test('slots and formatting apply only to local Nx runs; CI keeps check-only formatting', async (t) => {
  const cwd = await fixture(t);
  const calls = [];
  const run = (options, env = {}) =>
    runValidation({
      cwd,
      options,
      env,
      identify: identity,
      log: () => {},
      acquire: async (request) => {
        calls.push(`slots ${request.label}`);
        return { count: 1, release: async () => calls.push('release') };
      },
      format: async () => {
        calls.push('format');
        return [];
      },
      history: () => {},
      runCommand: async (command) => calls.push(command.args.at(-1)),
    });
  const ci = await run({}, { GITHUB_ACTIONS: 'true' });
  const ciPlan = await run({ plan: true }, { GITHUB_ACTIONS: 'true' });
  // CI runs and their plans omit --nxBail, so a failure cannot kill sibling tasks into collateral failures.
  assert.ok(!ci.phases[0].args.includes('--nxBail'));
  assert.deepEqual(ciPlan.plannedPhases[0].args.slice(-2), ['typecheck', '--graph=stdout']);
  await run({ plan: true });
  await run({ editor: true });
  assert.deepEqual(calls, [
    'typecheck',
    '--graph=stdout',
    '--graph=stdout',
    'build:staff',
    'scripts/test-preview-policy.mjs',
    'scripts/test-content-workspace.mjs',
    '--firefox',
  ]);
  calls.length = 0;
  await run({ full: true });
  await run({ lintOnly: true });
  await run({ scope: 'web' });
  assert.deepEqual(calls, [
    'slots validate full',
    '--parallel=1',
    'release',
    'slots validate lint',
    '--parallel=1',
    'release',
    'slots validate affected',
    'format',
    '--parallel=1',
    'release',
  ]);
});

test('runs that start in the same millisecond keep separate evidence', async (t) => {
  const cwd = await fixture(t);
  // CI runners start consecutive runs within one millisecond; a frozen clock makes that deterministic.
  const toISOString = Date.prototype.toISOString;
  Date.prototype.toISOString = () => '2026-10-02T00:00:00.000Z';
  t.after(() => {
    Date.prototype.toISOString = toISOString;
  });
  const ran = [];
  const run = () =>
    runValidation({
      ...offline,
      cwd,
      options: {},
      identify: identity,
      log: () => {},
      runCommand: async () => ran.push(1),
    });
  const [first, second] = [await run(), await run()];
  assert.equal(first.status, 'passed');
  assert.equal(second.status, 'passed');
  assert.equal(ran.length, 2);
  assert.notEqual(first.runId, second.runId);
});

test('validation takes and releases real machine slots in its checkout', async (t) => {
  const cwd = await gitFixture(t);
  const { loadPolicy } = await import('./feedback-policy.mjs');
  const { listSlots } = await import('./machine-slots.mjs');
  let held;
  const summary = await runValidation({
    cwd,
    env: {},
    format: async () => [],
    identify: identity,
    log: () => {},
    runCommand: async (command) => {
      held = await listSlots(cwd);
      assert.equal(command.args.at(-1), `--parallel=${loadPolicy().machine.slots}`);
    },
  });
  assert.equal(summary.status, 'passed');
  assert.equal(summary.slots.count, loadPolicy().machine.slots);
  assert.ok(held.every(({ pid, label }) => pid === process.pid && label === 'validate affected'));
  assert.deepEqual(await listSlots(cwd), []);
});

test('changed files are relative to the affected base and include untracked files', async (t) => {
  const cwd = await gitFixture(t);
  await writeFile(path.join(cwd, 'source.ts'), 'after');
  await writeFile(path.join(cwd, 'new.ts'), 'new');
  await mkdir(path.join(cwd, '.codex-artifacts'));
  await writeFile(path.join(cwd, '.codex-artifacts', 'ignored.json'), '{}');
  assert.deepEqual(await changedFiles(cwd, 'HEAD'), ['new.ts', 'source.ts']);
  assert.equal(await changedFiles(cwd, 'missing-base'), null);
  assert.equal(await changedFiles(cwd), null, 'no nx.json defaultBase');
});

test('the cached formatter rewrites unformatted changed files and skips unknown types', async (t) => {
  // Inside the checkout so the formatter and its Astro plugin resolve from this repository's node_modules.
  await mkdir(path.join(process.cwd(), '.codex-artifacts'), { recursive: true });
  const cwd = await mkdtemp(path.join(process.cwd(), '.codex-artifacts', 'format-changed-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  for (const name of ['package.json', 'pnpm-lock.yaml', 'prettier.config.mjs', '.prettierignore', '.editorconfig'])
    await copyFile(name, path.join(cwd, name));
  await execa('git', ['init', '--quiet'], { cwd });
  await execa('git', ['add', '.'], { cwd });
  await execa('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'fixture'], { cwd });
  await writeFile(path.join(cwd, 'unformatted.mjs'), 'const value={answer:42};\n');
  await writeFile(path.join(cwd, 'formatted.mjs'), 'const value = { answer: 42 };\n');
  await writeFile(path.join(cwd, 'notes.unknown-type'), 'x');
  const logs = [];
  assert.deepEqual(await formatChangedFiles(cwd, { since: 'HEAD', log: (message) => logs.push(message) }), [
    'unformatted.mjs',
  ]);
  assert.equal(await readFile(path.join(cwd, 'unformatted.mjs'), 'utf8'), 'const value = { answer: 42 };\n');
  assert.deepEqual(logs, ['Formatted 1 changed file(s): unformatted.mjs']);
});

test('source identity covers changed, untracked, renamed and reverted files', async (t) => {
  const cwd = await gitFixture(t);
  const original = await sourceIdentity(cwd);
  assert.equal(original.files, 0);
  await writeFile(path.join(cwd, 'new.ts'), 'new');
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, original.fingerprint);
  await rm(path.join(cwd, 'new.ts'));
  await writeFile(path.join(cwd, 'source.ts'), 'after');
  const edited = await sourceIdentity(cwd);
  assert.notEqual(edited.fingerprint, original.fingerprint);
  await writeFile(path.join(cwd, 'source.ts'), 'after again');
  assert.notEqual((await sourceIdentity(cwd)).fingerprint, edited.fingerprint);
  await writeFile(path.join(cwd, 'source.ts'), 'before');
  assert.deepEqual(await sourceIdentity(cwd), original);
  await execa('git', ['mv', 'source.ts', 'renamed.ts'], { cwd });
  const renamed = await sourceIdentity(cwd);
  assert.equal(renamed.files, 1);
  assert.notEqual(renamed.fingerprint, original.fingerprint);
});

async function lockFixture(t, content) {
  const cwd = await fixture(t);
  const lockPath = path.join(cwd, '.codex-artifacts', 'validation', 'active.lock');
  await mkdir(path.dirname(lockPath), { recursive: true });
  await writeFile(lockPath, content);
  const run = (overrides = {}) =>
    runValidation({ ...offline, cwd, identify: identity, log: () => {}, runCommand: async () => {}, ...overrides });
  return { lockPath, run };
}

const waitMessage = (holder) => `Waiting for the validation already running in this checkout (${holder}).`;

test('a second validation in the checkout waits for the first, then completes', async (t) => {
  const cwd = await fixture(t);
  const firstRunning = Promise.withResolvers();
  const firstMayFinish = Promise.withResolvers();
  const first = runValidation({
    ...offline,
    cwd,
    identify: identity,
    log: () => {},
    runCommand: async () => {
      firstRunning.resolve();
      await firstMayFinish.promise;
    },
  });
  await firstRunning.promise;
  const logs = [];
  const secondWaiting = Promise.withResolvers();
  const second = runValidation({
    ...offline,
    cwd,
    identify: identity,
    log: (message) => {
      logs.push(message);
      secondWaiting.resolve();
    },
    runCommand: async () => {},
  });
  await secondWaiting.promise;
  assert.deepEqual(logs, [waitMessage(`pid ${process.pid}`)]);
  firstMayFinish.resolve();
  const [firstSummary, secondSummary] = await Promise.all([first, second]);
  assert.equal(firstSummary.status, 'passed');
  assert.equal(secondSummary.status, 'passed');
  assert.ok(secondSummary.lockWaitMs > 0);
  await assert.rejects(access(path.join(cwd, '.codex-artifacts', 'validation', 'active.lock')), { code: 'ENOENT' });
});

test('a lock left by a dead process is reclaimed', async (t) => {
  const child = execa(process.execPath, ['-e', '']);
  await child;
  const { lockPath, run } = await lockFixture(t, JSON.stringify({ pid: child.pid }));
  const logs = [];
  assert.equal((await run({ log: (message) => logs.push(message) })).status, 'passed');
  assert.ok(!logs.some((message) => message.startsWith('Waiting')));
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});

test('aborting a run that waits for the lock rejects and leaves the holder lock intact', async (t) => {
  // A live holder, and an unparseable lock whose writer may still be between open and write.
  for (const [content, holder] of [
    [JSON.stringify({ pid: process.pid }), `pid ${process.pid}`],
    ['', 'starting'],
  ]) {
    const { lockPath, run } = await lockFixture(t, content);
    const controller = new AbortController();
    const logs = [];
    const log = (message) => {
      logs.push(message);
      controller.abort();
    };
    await assert.rejects(run({ signal: controller.signal, log }), { name: 'AbortError' });
    assert.deepEqual(logs, [waitMessage(holder)]);
    assert.equal(await readFile(lockPath, 'utf8'), content);
  }
});

test('a plan does not queue behind the checkout lock', async (t) => {
  const content = JSON.stringify({ pid: process.pid });
  const { lockPath, run } = await lockFixture(t, content);
  const summary = await run({ options: { plan: true } });
  assert.equal(summary.status, 'planned');
  assert.equal(summary.lockWaitMs, null);
  assert.equal(await readFile(lockPath, 'utf8'), content);
});

test('local runs append one history record; plans and CI runs record nothing', async (t) => {
  const cwd = await fixture(t);
  const records = [];
  const run = (options, { env = {}, history = (...entry) => records.push(entry) } = {}) =>
    runValidation({ ...offline, cwd, env, options, history, identify: identity, log: () => {}, runCommand: pause });
  const summary = await run({});
  await run({ plan: true });
  await run({}, { env: { GITHUB_ACTIONS: 'true' } });
  assert.deepEqual(records, [
    [
      {
        kind: 'validate',
        mode: 'local',
        scope: 'all',
        status: 'passed',
        durationMs: summary.durationMs,
        nxMs: summary.phases[0].durationMs,
        slotCount: 2,
        slotWaitMs: summary.slots.waitMs,
        lockWaitMs: summary.lockWaitMs,
        passes: 1,
        formatted: 0,
      },
      { cwd },
    ],
  ]);
  const unrecorded = await run(
    {},
    {
      history: () => {
        throw new Error('history unavailable');
      },
    },
  );
  assert.equal(unrecorded.status, 'passed');
  assert.equal(unrecorded.exitCode, 0);
});
