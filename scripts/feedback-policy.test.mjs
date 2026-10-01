import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  appendHistory,
  commandTier,
  grantPath,
  historyPath,
  loadPolicy,
  readGrant,
  releaseTierAllowance,
  sharedStateDir,
} from './feedback-policy.mjs';

const policy = loadPolicy();

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function repositoryWithWorktree(t) {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'feedback-policy-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const primary = path.join(base, 'primary');
  mkdirSync(primary);
  git(primary, 'init', '--quiet');
  git(primary, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '--allow-empty', '-qm', 'init');
  const linked = path.join(base, 'linked');
  git(primary, 'worktree', 'add', '--quiet', '--detach', linked);
  return { primary, linked };
}

test('the committed policy classifies commands into exactly one tier', () => {
  assert.equal(commandTier(policy, 'validate'), 'complete');
  assert.equal(commandTier(policy, 'validate:full'), 'release');
  assert.equal(commandTier(policy, 'test'), 'iterate');
  assert.equal(commandTier(policy, 'dev'), 'operational');
  assert.equal(commandTier(policy, 'not-a-command'), undefined);
});

test('every checkout of a repository resolves the same shared state directory', (t) => {
  const { primary, linked } = repositoryWithWorktree(t);
  const fromPrimary = sharedStateDir(primary, policy);
  assert.equal(sharedStateDir(linked, policy), fromPrimary);
  assert.equal(path.basename(fromPrimary), policy.sharedState.directory);
  assert.equal(path.basename(path.dirname(fromPrimary)), '.git');
});

test('only an unexpired, well-formed grant allows release-tier work', (t) => {
  const { primary, linked } = repositoryWithWorktree(t);
  const now = Date.parse('2026-10-01T12:00:00Z');
  const allowance = (cwd, env = {}) => releaseTierAllowance({ cwd, env, policy, now });

  assert.deepEqual(allowance(primary), { allowed: false, reason: 'none' });

  writeFileSync(grantPath(primary, policy), JSON.stringify({ expiresAt: '2026-10-01T12:30:00Z' }));
  assert.equal(allowance(linked).reason, 'grant');
  assert.equal(readGrant(linked, { policy, now }).expiresAt, '2026-10-01T12:30:00.000Z');

  writeFileSync(grantPath(primary, policy), JSON.stringify({ expiresAt: '2026-10-01T11:59:59Z' }));
  assert.equal(allowance(linked).allowed, false);

  writeFileSync(grantPath(primary, policy), 'not json');
  assert.equal(allowance(primary).allowed, false);
});

test('every checkout appends to one machine-wide history, one JSON line per record', (t) => {
  const { primary, linked } = repositoryWithWorktree(t);
  const now = Date.parse('2026-10-01T12:00:00Z');
  appendHistory({ kind: 'e2e', exitCode: 0 }, { cwd: primary, policy, now });
  appendHistory({ kind: 'denial', rule: 'nx-affected' }, { cwd: linked, policy, now: now + 1000 });
  assert.equal(historyPath(linked, policy), historyPath(primary, policy));
  assert.equal(path.dirname(historyPath(primary, policy)), sharedStateDir(primary, policy));
  const lines = readFileSync(historyPath(primary, policy), 'utf8').split('\n');
  assert.equal(lines.pop(), '');
  assert.deepEqual(
    lines.map((line) => JSON.parse(line)),
    [
      { time: '2026-10-01T12:00:00.000Z', checkout: primary, kind: 'e2e', exitCode: 0 },
      { time: '2026-10-01T12:00:01.000Z', checkout: linked, kind: 'denial', rule: 'nx-affected' },
    ],
  );
});

test('appending history never throws', (t) => {
  const outside = realpathSync(mkdtempSync(path.join(tmpdir(), 'feedback-history-')));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  assert.equal(appendHistory({ kind: 'validate' }, { cwd: outside, policy }), undefined);
  assert.equal(appendHistory({ kind: 'validate' }, null), undefined);
  assert.equal(existsSync(path.join(outside, '.git')), false);
});

test('CI and the maintainer override allow release-tier work without a grant', (t) => {
  const { primary } = repositoryWithWorktree(t);
  assert.equal(releaseTierAllowance({ cwd: primary, env: { GITHUB_ACTIONS: 'true' }, policy }).reason, 'ci');
  assert.equal(
    releaseTierAllowance({ cwd: primary, env: { [policy.releaseTier.overrideEnv]: '1' }, policy }).reason,
    'override',
  );
  assert.equal(
    releaseTierAllowance({ cwd: primary, env: { [policy.releaseTier.overrideEnv]: '0' }, policy }).allowed,
    false,
  );
});
