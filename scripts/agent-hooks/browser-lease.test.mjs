import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execa } from 'execa';
import { loadPolicy } from '../feedback-policy.mjs';
import { chromeLeasePath, decideChromeLease, readChromeLease } from './browser-lease.mjs';

const policy = loadPolicy();
const idleMs = policy.localResources.chromeLeaseIdleSeconds * 1000;
const { first } = policy.localResources.sitePort;
const hook = path.join(import.meta.dirname, 'browser-lease.mjs');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function repository(t) {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'browser-lease-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const primary = path.join(base, 'primary');
  mkdirSync(primary);
  git(primary, 'init', '--quiet');
  git(primary, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '--allow-empty', '-qm', 'init');
  const linked = path.join(base, 'linked');
  git(primary, 'worktree', 'add', '--quiet', '--detach', linked);
  return { primary, linked };
}

const event = (session_id, cwd) => ({
  session_id,
  cwd,
  hook_event_name: 'PreToolUse',
  tool_name: 'mcp__claude-in-chrome__navigate',
});

test('one session holds Chrome until it has been idle for the policy time', async (t) => {
  const { primary, linked } = repository(t);
  const start = Date.parse('2026-10-01T12:00:00Z');
  assert.deepEqual(await decideChromeLease(event('a', primary), { policy, root: primary, now: start }), {
    allowed: true,
  });
  assert.deepEqual(await decideChromeLease(event('a', primary), { policy, root: primary, now: start + idleMs - 1 }), {
    allowed: true,
  });
  const denied = await decideChromeLease(event('b', linked), {
    policy,
    root: primary,
    now: start + idleMs - 1 + 42_000,
  });
  assert.equal(denied.allowed, false);
  assert.ok(denied.message.includes(`in ${primary} (last used 42 s ago; free in at most `), denied.message);
  assert.match(denied.message, /pnpm test:e2e e2e\/<spec>\.spec\.ts/);
  assert.ok(denied.message.includes(`http://127.0.0.1:${first}/blackbox-records/`), denied.message);
  assert.equal(readChromeLease(chromeLeasePath(primary, policy)).sessionId, 'a');
  const later = start + 2 * idleMs;
  assert.deepEqual(await decideChromeLease(event('b', linked), { policy, root: primary, now: later }), {
    allowed: true,
  });
  assert.deepEqual(readChromeLease(chromeLeasePath(primary, policy)), {
    sessionId: 'b',
    checkout: linked,
    renewedAt: new Date(later).toISOString(),
  });
});

test('a malformed lease is free', async (t) => {
  const { primary } = repository(t);
  writeFileSync(chromeLeasePath(primary, policy), '{');
  assert.deepEqual(await decideChromeLease(event('a', primary), { policy, root: primary }), { allowed: true });
});

test('the hook exits 2 with a reason to deny, 0 silently to allow, and fails open', { timeout: 60_000 }, async (t) => {
  const { primary, linked } = repository(t);
  const run = (input) =>
    execa(process.execPath, [hook], {
      input,
      reject: false,
      windowsHide: true,
      env: { NODE_TEST_CONTEXT: undefined, CLAUDE_PROJECT_DIR: primary },
    });
  const allowed = await run(JSON.stringify(event('a', primary)));
  assert.deepEqual([allowed.exitCode, allowed.stdout, allowed.stderr], [0, '', '']);
  const denied = await run(JSON.stringify(event('b', linked)));
  assert.equal(denied.exitCode, 2);
  assert.equal(denied.stdout, '');
  assert.match(
    denied.stderr,
    /^Chrome is leased to another agent session in .+ \(last used \d+ s ago; free in at most \d+ s\)/,
  );
  for (const input of ['not json', '{}']) {
    const result = await run(input);
    assert.equal(result.exitCode, 0, input);
    assert.match(result.stderr, /^Chrome lease hook skipped: [^\n]+\n?$/, input);
  }
});

test('a session whose working directory left the repository still meets its lease', async (t) => {
  const { primary } = repository(t);
  const other = repository(t).primary;
  const outside = path.dirname(other);
  assert.deepEqual(await decideChromeLease(event('a', primary), { policy, root: primary }), { allowed: true });
  for (const cwd of [other, outside]) {
    const denied = await decideChromeLease(event('b', cwd), { policy, root: primary });
    assert.equal(denied.allowed, false, cwd);
  }
  assert.equal(readChromeLease(chromeLeasePath(other, policy)), null);
});
