import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { readdir, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { execa } from 'execa';
import { loadPolicy, sharedStateDir } from './feedback-policy.mjs';
import { acquireSlots, listSlots } from './machine-slots.mjs';

const policy = { ...loadPolicy(), machine: { slots: 2, waitReportSeconds: 1 } };
const moduleUrl = pathToFileURL(path.join(import.meta.dirname, 'machine-slots.mjs')).href;

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function repositoryWithWorktree(t) {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'machine-slots-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const primary = path.join(base, 'primary');
  mkdirSync(primary);
  git(primary, 'init', '--quiet');
  git(primary, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '--allow-empty', '-qm', 'init');
  const linked = path.join(base, 'linked');
  git(primary, 'worktree', 'add', '--quiet', '--detach', linked);
  return { primary, linked };
}

async function until(condition) {
  const deadline = Date.now() + 10_000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for the condition.');
    await delay(20);
  }
}

/** A separate process that holds its slots until it reads a line on stdin. */
function holder(t, cwd, options = {}) {
  const code = `
    import { acquireSlots } from ${JSON.stringify(moduleUrl)};
    const options = JSON.parse(process.argv[1]);
    const slots = await acquireSlots({ ...options, log: (message) => console.log(JSON.stringify({ message })) });
    console.log(JSON.stringify({ count: slots.count }));
    process.stdin.once('data', async () => {
      await slots.release();
      process.exit(0);
    });
  `;
  const child = execa(
    process.execPath,
    ['--input-type=module', '-e', code, JSON.stringify({ cwd, policy, ...options })],
    {
      cwd,
      env: { NODE_TEST_CONTEXT: undefined },
      reject: false,
      windowsHide: true,
    },
  );
  t.after(() => child.kill());
  const lines = [];
  let buffer = '';
  let exited = false;
  void child.then(() => {
    exited = true;
  });
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    const parts = buffer.split('\n');
    buffer = parts.pop();
    lines.push(...parts.filter(Boolean).map((line) => JSON.parse(line)));
  });
  const next = async (key) => {
    await until(() => lines.some((line) => key in line) || exited);
    const line = lines.find((entry) => key in entry);
    if (!line) throw new Error(`Holder exited before printing ${key}: ${(await child).stderr}`);
    return line[key];
  };
  return { child, lines, next, release: () => child.stdin.write('release\n') };
}

test('a second checkout waits for the slots another process holds and names it', { timeout: 30_000 }, async (t) => {
  const { primary, linked } = repositoryWithWorktree(t);
  const first = holder(t, primary, { label: 'validate affected' });
  assert.equal(await first.next('count'), 2);
  const second = holder(t, linked, { label: 'validate full' });
  const message = await second.next('message');
  assert.match(message, /^Waiting for a validation slot; held by /);
  assert.ok(message.includes(`${primary} (pid ${first.child.pid}, validate affected)`), message);
  assert.ok(!second.lines.some((line) => 'count' in line));
  first.release();
  assert.equal(await second.next('count'), 2);
  assert.deepEqual(
    (await listSlots(primary, policy)).map(({ pid, checkout }) => [pid, checkout]),
    [
      [second.child.pid, linked],
      [second.child.pid, linked],
    ],
  );
  second.release();
  await Promise.all([first.child, second.child]);
  assert.deepEqual(await listSlots(linked, policy), []);
});

test('slots held by a killed process are reclaimed', { timeout: 30_000 }, async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const crashed = holder(t, primary);
  assert.equal(await crashed.next('count'), 2);
  crashed.child.kill('SIGKILL');
  await crashed.child;
  const slots = await acquireSlots({ cwd: primary, policy, wait: false });
  assert.equal(slots.count, 2);
  await slots.release();
});

test('waiters claim in arrival order', { timeout: 30_000 }, async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const single = { ...policy, machine: { ...policy.machine, slots: 1 } };
  const held = await acquireSlots({ cwd: primary, policy: single });
  const logs = [[], []];
  const first = acquireSlots({ cwd: primary, policy: single, log: (message) => logs[0].push(message) });
  await until(() => logs[0].length);
  const second = acquireSlots({ cwd: primary, policy: single, log: (message) => logs[1].push(message) });
  await until(() => logs[1].length);
  assert.match(logs[1][0], /; 1 queued ahead\.$/);
  await held.release();
  const winner = await first;
  assert.equal(winner.count, 1);
  assert.equal(await Promise.race([second.then(() => 'claimed'), delay(800).then(() => 'waiting')]), 'waiting');
  await winner.release();
  await (await second).release();
});

test('a run that must not wait gets no slot while every slot is held', async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const held = await acquireSlots({ cwd: primary, policy, label: 'validate affected' });
  assert.equal(held.count, 2);
  const focused = await acquireSlots({ cwd: primary, policy, want: 1, wait: false });
  assert.equal(focused.count, 0);
  await focused.release();
  assert.equal((await listSlots(primary, policy)).length, 2);
  await held.release();
  await held.release();
  assert.deepEqual(await listSlots(primary, policy), []);
});

test('aborting a waiting run removes its ticket', { timeout: 30_000 }, async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const held = await acquireSlots({ cwd: primary, policy });
  const controller = new AbortController();
  const logs = [];
  const waiting = acquireSlots({
    cwd: primary,
    policy,
    signal: controller.signal,
    log: (message) => logs.push(message),
  });
  await until(() => logs.length);
  controller.abort();
  await assert.rejects(waiting, { name: 'AbortError' });
  assert.deepEqual(await readdir(path.join(sharedStateDir(primary, policy), 'queue')), []);
  await held.release();
});

test('a ticket or slot whose live PID stopped beating is reclaimed', { timeout: 30_000 }, async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const state = sharedStateDir(primary, policy);
  // This process stands in for an unrelated one that reused a crashed holder's PID.
  const reused = JSON.stringify({ pid: process.pid, checkout: primary, label: 'crashed' });
  const past = new Date(Date.now() - 120_000);
  for (const file of [path.join(state, 'queue', '0.json'), path.join(state, 'slots', '0.json')]) {
    mkdirSync(path.dirname(file), { recursive: true });
    await writeFile(file, reused);
    await utimes(file, past, past);
  }
  const slots = await acquireSlots({ cwd: primary, policy, signal: AbortSignal.timeout(5000), log: () => {} });
  assert.equal(slots.count, 2);
  await slots.release();
});

test('a holder keeps its slots beating while it runs', { timeout: 30_000 }, async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const held = await acquireSlots({ cwd: primary, policy });
  const slot = path.join(sharedStateDir(primary, policy), 'slots', '0.json');
  const past = new Date(Date.now() - 120_000);
  await utimes(slot, past, past);
  await until(() => statSync(slot).mtimeMs > past.getTime());
  const focused = await acquireSlots({ cwd: primary, policy, want: 1, wait: false });
  assert.equal(focused.count, 0);
  await held.release();
});

test('an unparseable slot is held briefly and reclaimed once stale', async (t) => {
  const { primary } = repositoryWithWorktree(t);
  const slots = path.join(sharedStateDir(primary, policy), 'slots');
  mkdirSync(slots, { recursive: true });
  await writeFile(path.join(slots, '0.json'), '');
  const fresh = await acquireSlots({ cwd: primary, policy, wait: false });
  assert.equal(fresh.count, 1);
  await fresh.release();
  const past = new Date(Date.now() - 60_000);
  await utimes(path.join(slots, '0.json'), past, past);
  const stale = await acquireSlots({ cwd: primary, policy, wait: false });
  assert.equal(stale.count, 2);
  await stale.release();
});
