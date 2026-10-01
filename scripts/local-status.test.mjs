import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { decideChromeLease } from './agent-hooks/browser-lease.mjs';
import { grantPath, loadPolicy } from './feedback-policy.mjs';
import { acquireStackLease, sitePort } from './local-resources.mjs';
import { localStatus } from './local-status.mjs';
import { acquireSlots } from './machine-slots.mjs';

const policy = loadPolicy();
const { primary: canonical, first } = policy.localResources.sitePort;

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

test('status lists slot holders, site ports, the stack, the Chrome lease and the grant', async (t) => {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'local-status-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const primary = path.join(base, 'primary');
  mkdirSync(primary);
  git(primary, 'init', '--quiet');
  git(primary, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '--allow-empty', '-qm', 'init');
  const linked = path.join(base, 'linked');
  git(primary, 'worktree', 'add', '--quiet', '--detach', linked);
  const probe = async (port) => port === first;
  const now = Date.parse('2026-10-01T12:00:00Z');

  assert.equal(
    await localStatus(primary, { policy, now, probe }),
    [
      `Validation slots: 0 of ${policy.machine.slots} held`,
      'Site ports:',
      `  ${canonical} free ${primary}`,
      'Full Local stack: not running',
      'Chrome lease: free',
      'Maintainer grant: none',
    ].join('\n'),
  );

  assert.equal(sitePort(linked, policy), first);
  const slots = await acquireSlots({ cwd: linked, policy, want: 1, label: 'validate affected' });
  t.after(() => slots.release());
  const release = acquireStackLease(linked, policy);
  t.after(release);
  await decideChromeLease({ session_id: 's1', cwd: linked }, { policy, now: now - 60_000 });
  writeFileSync(grantPath(primary, policy), JSON.stringify({ expiresAt: new Date(now + 600_000).toISOString() }));

  const status = (await localStatus(primary, { policy, now, probe })).split('\n');
  assert.equal(status[0], `Validation slots: 1 of ${policy.machine.slots} held`);
  assert.match(status[1], new RegExp(`^  .+linked \\(pid ${process.pid}, validate affected, since `));
  assert.deepEqual(status.slice(2, 5), [
    'Site ports:',
    `  ${canonical} free ${primary}`,
    `  ${first} listening ${linked}`,
  ]);
  assert.match(status[5], new RegExp(`^Full Local stack: .+linked \\(pid ${process.pid}, since `));
  assert.equal(
    status[6],
    `Chrome lease: ${linked} (session s1, last used 60 s ago, free in at most ${policy.localResources.chromeLeaseIdleSeconds - 60} s)`,
  );
  assert.equal(status[7], `Maintainer grant: active until ${new Date(now + 600_000).toISOString()}`);
});
