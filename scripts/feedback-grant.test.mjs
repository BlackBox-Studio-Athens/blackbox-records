import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { main } from './feedback-grant.mjs';
import { grantPath, loadPolicy, readGrant } from './feedback-policy.mjs';

const policy = loadPolicy();
const now = Date.parse('2026-10-01T12:00:00Z');

function repository(t) {
  const directory = realpathSync(mkdtempSync(path.join(tmpdir(), 'feedback-grant-')));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet'], { cwd: directory, stdio: 'ignore', windowsHide: true });
  return directory;
}

function captured(t) {
  return { log: t.mock.method(console, 'log', () => {}), error: t.mock.method(console, 'error', () => {}) };
}

const printed = (mock) => mock.mock.calls.map(({ arguments: [message] }) => message).join('\n');

test('the maintainer issues, reads and revokes a time-boxed grant', (t) => {
  const cwd = repository(t);
  const output = captured(t);
  const run = (args) => main(args, { env: {}, cwd, now, policy });

  assert.equal(run([]), 0);
  assert.equal(run(['--', '30']), 0);
  assert.deepEqual(JSON.parse(readFileSync(grantPath(cwd, policy), 'utf8')), {
    grantedAt: '2026-10-01T12:00:00.000Z',
    expiresAt: '2026-10-01T12:30:00.000Z',
  });
  assert.equal(readGrant(cwd, { policy, now }).active, true);
  assert.equal(run([]), 0);
  assert.equal(run(['--revoke']), 0);
  assert.equal(existsSync(grantPath(cwd, policy)), false);
  assert.match(
    printed(output.log),
    /^No active release-tier grant\.\nRelease-tier grant active until 2026-10-01T12:30:00\.000Z for every checkout.*\nRelease-tier grant active until 2026-10-01T12:30:00\.000Z\.\nRelease-tier grant revoked\.$/,
  );
});

test('a grant needs whole minutes within the policy maximum', (t) => {
  const cwd = repository(t);
  const output = captured(t);
  for (const args of [['0'], [String(policy.releaseTier.maxGrantMinutes + 1)], ['abc'], ['1.5'], ['5', '6']])
    assert.equal(main(args, { env: {}, cwd, now, policy }), 1, args.join(' '));
  assert.equal(existsSync(grantPath(cwd, policy)), false);
  assert.match(printed(output.error), /Usage: pnpm feedback:grant-full/);
  assert.equal(main([String(policy.releaseTier.maxGrantMinutes)], { env: {}, cwd, now, policy }), 0);
});

test('a shell started by Claude Code or Codex cannot issue a grant', (t) => {
  const cwd = repository(t);
  const output = captured(t);
  const markers = policy.releaseTier.agentEnvMarkers;
  assert.ok(markers.includes('CLAUDE_CODE_CHILD_SESSION'));
  assert.ok(markers.includes('CODEX_THREAD_ID'));
  for (const marker of markers) {
    assert.equal(main(['30'], { env: { [marker]: '1' }, cwd, now, policy }), 1, marker);
    assert.match(printed(output.error), new RegExp(`${marker} shows that an agent tool started this command`));
  }
  assert.equal(existsSync(grantPath(cwd, policy)), false);
});

test("the maintainer's IDE terminal can issue a grant although it carries CLAUDECODE", (t) => {
  // IDE extensions and app terminals can set CLAUDECODE for the maintainer's own shell; agent tool shells also
  // carry CLAUDE_CODE_CHILD_SESSION, which stays a refusal marker.
  const cwd = repository(t);
  captured(t);
  assert.equal(main(['30'], { env: { CLAUDECODE: '1' }, cwd, now, policy }), 0);
  assert.equal(readGrant(cwd, { policy, now }).active, true);
});
