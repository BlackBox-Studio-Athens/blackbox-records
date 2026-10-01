import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { historyPath, loadPolicy } from './feedback-policy.mjs';
import { runE2e } from './run-e2e.mjs';

const policy = loadPolicy();

function harness(t, { exitCode = 0, fail } = {}) {
  const cwd = realpathSync(mkdtempSync(path.join(tmpdir(), 'run-e2e-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet'], { cwd, stdio: 'ignore', windowsHide: true });
  const events = [];
  return {
    cwd,
    events,
    error: t.mock.method(console, 'error', () => {}),
    acquireSlots: async (options) => {
      events.push(['acquire', options.want, options.label]);
      return { count: 1, release: async () => events.push(['release']) };
    },
    run: async (args) => {
      events.push(['run', ...args]);
      if (fail) throw new Error(fail);
      return exitCode;
    },
  };
}

const options = ({ cwd, acquireSlots, run }, env = {}) => ({ env, cwd, policy, acquireSlots, run });
const history = (cwd) =>
  existsSync(historyPath(cwd, policy))
    ? readFileSync(historyPath(cwd, policy), 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
    : [];

test('an unfiltered local run refuses before taking a slot or starting Playwright', async (t) => {
  const context = harness(t);
  assert.equal(await runE2e(['--headed'], options(context)), 1);
  assert.deepEqual(context.events, []);
  assert.equal(context.error.mock.calls[0].arguments[0], policy.filteredOnly.instead);
  assert.deepEqual(history(context.cwd), []);
});

test('a filtered run holds one slot around Playwright, records it and returns its exit code', async (t) => {
  const context = harness(t, { exitCode: 3 });
  const filter = `e2e/store-cart.spec.ts -g ${'x'.repeat(200)}`;
  assert.equal(await runE2e(filter.split(' '), options(context)), 3);
  assert.deepEqual(context.events, [['acquire', 1, 'e2e'], ['run', ...filter.split(' ')], ['release']]);
  const [entry, ...rest] = history(context.cwd);
  assert.deepEqual(rest, []);
  assert.deepEqual(
    { kind: entry.kind, filter: entry.filter, exitCode: entry.exitCode, checkout: entry.checkout },
    { kind: 'e2e', filter: filter.slice(0, 120), exitCode: 3, checkout: context.cwd },
  );
  assert.ok(Number.isInteger(entry.durationMs) && entry.durationMs >= 0);
});

test('the slot is released when Playwright cannot run', async (t) => {
  const context = harness(t, { fail: 'spawn failed' });
  await assert.rejects(runE2e(['-g', 'player'], options(context)), /spawn failed/);
  assert.deepEqual(context.events.at(-1), ['release']);
  assert.deepEqual(history(context.cwd), []);
});

test('CI runs without a slot and a grant or override allows the whole suite', async (t) => {
  const context = harness(t);
  assert.equal(await runE2e([], options(context, { GITHUB_ACTIONS: 'true' })), 0);
  assert.deepEqual(context.events, [['run']]);
  assert.deepEqual(history(context.cwd), []);
  context.events.length = 0;
  assert.equal(await runE2e([], options(context, { [policy.releaseTier.overrideEnv]: '1' })), 0);
  assert.deepEqual(context.events, [['acquire', 1, 'e2e'], ['run'], ['release']]);
});
