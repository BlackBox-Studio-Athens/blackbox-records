import { execFileSync } from 'node:child_process';
import { readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPolicy, sharedStateDir } from './feedback-policy.mjs';
import { processAlive } from './machine-slots.mjs';

const registryFile = 'site-ports.json';
const registryLockFile = 'site-ports.lock';
const stackLeaseFile = 'stack.lease';
const lockWaitMs = 10_000;
const unparseableGraceMs = 5000;

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

/** Comparable form of a checkout path; git prints forward slashes and Windows ignores case. */
function pathKey(value) {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/** This checkout's root, the live worktrees of its repository, and whether it is the primary checkout. */
export function checkoutOf(cwd = process.cwd()) {
  const checkout = path.resolve(git(cwd, ['rev-parse', '--show-toplevel']).trim());
  const worktrees = git(cwd, ['worktree', 'list', '--porcelain'])
    .split(/\r?\n\r?\n/)
    .filter((block) => block.startsWith('worktree ') && !/^prunable\b/m.test(block))
    .map((block) => path.resolve(block.split(/\r?\n/)[0].slice('worktree '.length)));
  return { checkout, primary: pathKey(worktrees[0]) === pathKey(checkout), worktrees };
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

function writeJson(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, file);
}

function createExclusive(file, record) {
  try {
    writeFileSync(file, JSON.stringify(record), { flag: 'wx' });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') return false;
    throw error;
  }
}

/** The recorded holder of a lock or lease; a file whose process has exited is removed and yields null. */
function liveHolder(file) {
  let holder;
  try {
    holder = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    // An unparseable file is not stolen at once: its writer may sit between open and write.
    const modified = statSync(file, { throwIfNoEntry: false })?.mtimeMs;
    if (modified === undefined) return null;
    if (Date.now() - modified < unparseableGraceMs) return { pid: null, checkout: 'unknown (starting)' };
  }
  if (Number.isSafeInteger(holder?.pid) && holder.pid > 0 && processAlive(holder.pid)) return holder;
  // ponytail: read-then-remove can race a concurrent reclaim of the same file; acceptable for a few local runs.
  rmSync(file, { force: true });
  return null;
}

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function withRegistryLock(directory, action) {
  const lock = path.join(directory, registryLockFile);
  const deadline = Date.now() + lockWaitMs;
  while (!createExclusive(lock, { pid: process.pid })) {
    const holder = liveHolder(lock);
    if (holder && Date.now() > deadline)
      throw new Error(
        `Site port registry lock ${lock} is held by pid ${holder.pid}; delete it if that process is gone.`,
      );
    pause(25);
  }
  try {
    return action();
  } finally {
    rmSync(lock, { force: true });
  }
}

/**
 * Port that this checkout serves the Local public site on. The primary checkout keeps the canonical port; each
 * linked worktree keeps a stable port from the registry until git no longer lists it. The checkout running the full
 * Local stack serves on the canonical port, because the stack binds canonical ports.
 */
export function sitePort(cwd = process.cwd(), policy = loadPolicy()) {
  const { primary: canonical, first, step, count } = policy.localResources.sitePort;
  const { checkout, primary, worktrees } = checkoutOf(cwd);
  const directory = sharedStateDir(cwd, policy);
  const stack = liveHolder(path.join(directory, stackLeaseFile));
  if (stack && pathKey(stack.checkout) === pathKey(checkout)) return canonical;
  if (primary) {
    if (stack)
      throw new Error(
        `Port ${canonical} serves the full Local stack running from ${stack.checkout}; work from that checkout or stop the stack there.`,
      );
    return canonical;
  }
  return withRegistryLock(directory, () => {
    const file = path.join(directory, registryFile);
    const registry = readJson(file) ?? {};
    const candidates = Array.from({ length: count }, (_, index) => first + step * index);
    const live = new Set(worktrees.map(pathKey));
    const kept = Object.fromEntries(
      Object.entries(registry).filter(([entry, port]) => live.has(pathKey(entry)) && candidates.includes(port)),
    );
    let port = Object.entries(kept).find(([entry]) => pathKey(entry) === pathKey(checkout))?.[1];
    if (port === undefined) {
      const taken = new Set(Object.values(kept));
      port = candidates.find((candidate) => !taken.has(candidate));
      if (port === undefined)
        throw new Error(`All ${count} linked-worktree site ports are assigned; remove worktrees you no longer use.`);
      kept[checkout] = port;
    }
    if (JSON.stringify(kept) !== JSON.stringify(registry)) writeJson(file, kept);
    return port;
  });
}

export function siteUrl(cwd = process.cwd(), policy = loadPolicy()) {
  return `http://127.0.0.1:${sitePort(cwd, policy)}/blackbox-records/`;
}

/** Linked-worktree port assignments as recorded, without pruning or allocating. */
export function sitePortRegistry(cwd = process.cwd(), policy = loadPolicy()) {
  return readJson(path.join(sharedStateDir(cwd, policy), registryFile)) ?? {};
}

/** The recorded stack lease, or null, without reclaiming it. */
export function stackLease(cwd = process.cwd(), policy = loadPolicy()) {
  return readJson(path.join(sharedStateDir(cwd, policy), stackLeaseFile));
}

function removeOwnLease(file) {
  if (readJson(file)?.pid === process.pid) rmSync(file, { force: true });
}

/** Makes this process the machine's only full Local stack, or throws naming the checkout that runs it. */
export function acquireStackLease(cwd = process.cwd(), policy = loadPolicy()) {
  const file = path.join(sharedStateDir(cwd, policy), stackLeaseFile);
  const record = { pid: process.pid, checkout: checkoutOf(cwd).checkout, startedAt: new Date().toISOString() };
  for (;;) {
    if (createExclusive(file, record)) return () => removeOwnLease(file);
    const holder = liveHolder(file);
    if (holder)
      throw new Error(
        `The full Local stack already runs from ${holder.checkout} (pid ${holder.pid}, since ${holder.startedAt}). Stop it there first; one checkout runs it at a time.`,
      );
  }
}

export function releaseStackLease(cwd = process.cwd(), policy = loadPolicy()) {
  removeOwnLease(path.join(sharedStateDir(cwd, policy), stackLeaseFile));
}

// Prints this checkout's site URL for callers that cannot load ES modules, such as playwright.config.ts.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(siteUrl());
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
