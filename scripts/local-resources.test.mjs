import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { execa } from 'execa';
import { loadPolicy, sharedStateDir } from './feedback-policy.mjs';
import {
  acquireStackLease,
  checkoutOf,
  releaseStackLease,
  sitePort,
  sitePortRegistry,
  siteUrl,
  stackLease,
} from './local-resources.mjs';

const policy = loadPolicy();
const { primary: canonical, first, step } = policy.localResources.sitePort;
const moduleUrl = pathToFileURL(path.join(import.meta.dirname, 'local-resources.mjs')).href;

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function repository(t) {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'local-resources-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const primary = path.join(base, 'primary');
  mkdirSync(primary);
  git(primary, 'init', '--quiet');
  git(primary, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '--allow-empty', '-qm', 'init');
  const worktree = (name) => {
    const linked = path.join(base, name);
    git(primary, 'worktree', 'add', '--quiet', '--detach', linked);
    return linked;
  };
  return { primary, worktree };
}

async function deadPid() {
  const child = execa(process.execPath, ['-e', ''], { windowsHide: true });
  await child;
  return child.pid;
}

test('the primary checkout keeps the canonical port and records nothing', (t) => {
  const { primary, worktree } = repository(t);
  worktree('linked');
  assert.equal(checkoutOf(primary).primary, true);
  assert.equal(sitePort(primary, policy), canonical);
  assert.equal(siteUrl(primary, policy), `http://127.0.0.1:${canonical}/blackbox-records/`);
  assert.deepEqual(sitePortRegistry(primary, policy), {});
});

test('a linked worktree keeps its own stable port, distinct from other worktrees', (t) => {
  const { primary, worktree } = repository(t);
  const one = worktree('one');
  const two = worktree('two');
  const nested = path.join(one, 'apps', 'web');
  mkdirSync(nested, { recursive: true });
  assert.equal(checkoutOf(one).primary, false);
  assert.equal(sitePort(nested, policy), first);
  assert.equal(sitePort(two, policy), first + step);
  assert.equal(sitePort(one, policy), first);
  assert.equal(siteUrl(two, policy), `http://127.0.0.1:${first + step}/blackbox-records/`);
  assert.deepEqual(Object.values(sitePortRegistry(primary, policy)), [first, first + step]);
});

test('a removed worktree releases its port for reuse', (t) => {
  const { primary, worktree } = repository(t);
  const one = worktree('one');
  const two = worktree('two');
  assert.equal(sitePort(one, policy), first);
  assert.equal(sitePort(two, policy), first + step);
  git(primary, 'worktree', 'remove', one);
  const three = worktree('three');
  assert.equal(sitePort(three, policy), first);
  assert.deepEqual(new Set(Object.values(sitePortRegistry(primary, policy))), new Set([first, first + step]));
  assert.ok(!Object.keys(sitePortRegistry(primary, policy)).some((entry) => entry.endsWith(`${path.sep}one`)));
});

test('concurrent allocations from separate processes never share a port', { timeout: 60_000 }, async (t) => {
  const { primary, worktree } = repository(t);
  const groups = [0, 1].map((group) => [0, 1, 2, 3].map((index) => worktree(`w${group}${index}`)));
  // A crashed allocator's lock must not block the next ones.
  writeFileSync(
    path.join(sharedStateDir(primary, policy), 'site-ports.lock'),
    JSON.stringify({ pid: await deadPid() }),
  );
  const code = `
    import { sitePort } from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify(JSON.parse(process.argv[1]).map((cwd) => sitePort(cwd))));
  `;
  const results = await Promise.all(
    groups.map((checkouts) =>
      execa(process.execPath, ['--input-type=module', '-e', code, JSON.stringify(checkouts)], { windowsHide: true }),
    ),
  );
  const ports = results.flatMap(({ stdout }) => JSON.parse(stdout));
  assert.equal(new Set(ports).size, 8, ports.join(', '));
  const registry = sitePortRegistry(primary, policy);
  assert.deepEqual(
    groups.flat().map((checkout) => registry[checkout]),
    ports,
  );
  assert.equal(existsSync(path.join(sharedStateDir(primary, policy), 'site-ports.lock')), false);
});

test('the stack lease names its owner, is released, and is reclaimed from an exited process', async (t) => {
  const { primary, worktree } = repository(t);
  const linked = worktree('linked');
  const file = path.join(sharedStateDir(primary, policy), 'stack.lease');
  const release = acquireStackLease(linked, policy);
  assert.equal(stackLease(primary, policy).checkout, linked);
  // A hard-killed stack can leave a lease whose pid another process reuses, so refusals name the file to delete.
  assert.throws(
    () => acquireStackLease(primary, policy),
    (error) =>
      error.message.includes(`runs from ${linked}`) && error.message.includes(`delete the stale lease ${file}`),
  );
  // The stack binds canonical ports, so its checkout serves there and the primary cannot.
  assert.equal(sitePort(linked, policy), canonical);
  assert.throws(
    () => sitePort(primary, policy),
    (error) => error.message.includes(linked) && error.message.includes(`delete the stale lease ${file}`),
  );
  release();
  assert.equal(stackLease(primary, policy), null);

  writeFileSync(file, JSON.stringify({ pid: await deadPid(), checkout: linked, startedAt: new Date().toISOString() }));
  assert.equal(sitePort(linked, policy), first);
  acquireStackLease(primary, policy);
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).checkout, primary);
  releaseStackLease(primary, policy);
  assert.equal(existsSync(file), false);
});

test('releasing leaves a lease that another process holds', (t) => {
  const { primary } = repository(t);
  const file = path.join(sharedStateDir(primary, policy), 'stack.lease');
  writeFileSync(file, JSON.stringify({ pid: process.ppid, checkout: 'elsewhere', startedAt: '' }));
  releaseStackLease(primary, policy);
  assert.equal(stackLease(primary, policy).checkout, 'elsewhere');
});
