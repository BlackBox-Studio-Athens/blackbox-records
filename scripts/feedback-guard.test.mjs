import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertValidationAllowed, guardedScript, main, satisfiesFilter, scriptRefusal } from './feedback-guard.mjs';
import { grantPath, loadPolicy } from './feedback-policy.mjs';

const policy = loadPolicy();
const now = Date.parse('2026-10-01T12:00:00Z');

function temporaryDirectory(t) {
  const directory = realpathSync(mkdtempSync(path.join(tmpdir(), 'feedback-guard-')));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function repository(t) {
  const directory = temporaryDirectory(t);
  execFileSync('git', ['init', '--quiet'], { cwd: directory, stdio: 'ignore', windowsHide: true });
  return directory;
}

function captured(t) {
  return { log: t.mock.method(console, 'log', () => {}), error: t.mock.method(console, 'error', () => {}) };
}

const printed = (mock) => mock.mock.calls.map(({ arguments: [message] }) => message).join('\n');

test('release-tier commands run only in CI, under the override or under a grant', (t) => {
  const cwd = repository(t);
  const output = captured(t);
  assert.equal(main(['validate:full'], { env: {}, cwd, now }), 1);
  assert.match(printed(output.error), /`pnpm validate:full` is release-tier work/);
  assert.ok(printed(output.error).includes(policy.releaseTier.instead));

  assert.equal(main(['build'], { env: { GITHUB_ACTIONS: 'true' }, cwd, now }), 0);
  assert.equal(main(['build'], { env: { [policy.releaseTier.overrideEnv]: '1' }, cwd, now }), 0);
  writeFileSync(grantPath(cwd, policy), JSON.stringify({ expiresAt: '2026-10-01T12:30:00Z' }));
  assert.equal(main(['test:unit'], { env: {}, cwd, now }), 0);
  assert.match(printed(output.log), /grant until 2026-10-01T12:30:00\.000Z/);
});

test('whole-package suites run inside Nx tasks, in CI or under a grant', (t) => {
  const cwd = repository(t);
  const output = captured(t);
  const { nxTaskEnv } = policy.packageSuites;
  assert.equal(main(['@blackbox/web:test'], { env: {}, cwd, now }), 1);
  assert.match(printed(output.error), /`pnpm --filter @blackbox\/web test` is release-tier work/);
  assert.equal(main(['@blackbox/backend:test:node'], { env: {}, cwd, now }), 1);
  assert.equal(main(['@blackbox/web:check'], { env: { [nxTaskEnv]: 'abc123' }, cwd, now }), 0);
  assert.equal(main(['@blackbox/api-client:test'], { env: { GITHUB_ACTIONS: 'true' }, cwd, now }), 0);
  // The Nx marker lifts only package suites, never root release-tier commands.
  assert.equal(main(['test:unit'], { env: { [nxTaskEnv]: 'abc123' }, cwd, now }), 1);
  assert.equal(main(['@blackbox/web:build'], { env: {}, cwd, now }), 1);
  assert.match(printed(output.error), /`@blackbox\/web:build` is unclassified/);
});

test('other tiers pass and unclassified names refuse', (t) => {
  const output = captured(t);
  const cwd = temporaryDirectory(t);
  assert.equal(main(['validate'], { env: {}, cwd, now }), 0);
  assert.equal(main(['test:e2e'], { env: {}, cwd, now }), 0);
  assert.equal(main(['not-a-command'], { env: {}, cwd, now }), 1);
  assert.equal(main([], { env: {}, cwd, now }), 1);
  assert.match(printed(output.error), /`not-a-command` is unclassified/);
});

test('the guard refuses when the policy cannot be read', (t) => {
  const root = temporaryDirectory(t);
  mkdirSync(path.join(root, 'scripts'));
  const source = fileURLToPath(new URL('.', import.meta.url));
  for (const file of ['feedback-guard.mjs', 'feedback-policy.mjs'])
    copyFileSync(path.join(source, file), path.join(root, 'scripts', file));
  const guard = (name) =>
    spawnSync(process.execPath, [path.join(root, 'scripts', 'feedback-guard.mjs'), name], {
      cwd: root,
      encoding: 'utf8',
      timeout: 15_000,
      windowsHide: true,
    });

  const missing = guard('validate');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Feedback guard refused/);
  writeFileSync(path.join(root, 'feedback-policy.json'), '{');
  assert.equal(guard('validate').status, 1);
});

test('release-tier validation modes need an allowance; scoped modes never resolve one', (t) => {
  const cwd = repository(t);
  for (const mode of policy.releaseTier.validateModes)
    assert.throws(() => assertValidationAllowed([mode], { policy, env: {}, cwd, now }), /release-tier work/, mode);
  assert.doesNotThrow(() =>
    assertValidationAllowed(['--full'], { policy, env: { [policy.releaseTier.overrideEnv]: '1' }, cwd, now }),
  );
  const outsideRepository = temporaryDirectory(t);
  assert.doesNotThrow(() =>
    assertValidationAllowed(['--plan', '--scope', 'web'], { policy, env: {}, cwd: outsideRepository, now }),
  );
});

test('a guarded leaf script is recognized by its path as typed unless a focused mode exempts it', () => {
  const editor = 'scripts/test-content-workspace.mjs';
  for (const typed of [editor, `./${editor}`, `C:\\repo\\${editor.replace('/', '\\')}`, `../../${editor}`])
    assert.equal(guardedScript(policy, typed, ['--firefox'])?.command, 'validate:editor', typed);
  assert.equal(guardedScript(policy, editor, ['--serve']), undefined);
  assert.equal(guardedScript(policy, 'scripts/check-agent-guidance.mjs', []), undefined);
  assert.equal(guardedScript(policy, 'test-content-workspace.mjs', []), undefined);
});

test('a guarded leaf script runs only in CI, under the override, under a grant or in a focused mode', (t) => {
  const cwd = repository(t);
  const refusal = (file, args, env = {}) => scriptRefusal(file, { args, env, cwd, now });
  assert.match(refusal('scripts/test-content-workspace.mjs', ['--firefox']), /belong to `pnpm validate:editor`/);
  assert.match(refusal('scripts/not-listed.mjs', []), /not listed in feedback-policy\.json/);
  assert.equal(refusal('scripts/test-content-workspace.mjs', ['--serve']), undefined);
  assert.equal(refusal('scripts/test-content-workspace.mjs', ['--firefox'], { GITHUB_ACTIONS: 'true' }), undefined);
  assert.equal(
    refusal('scripts/test-content-workspace.mjs', ['--firefox'], { [policy.releaseTier.overrideEnv]: '1' }),
    undefined,
  );
  writeFileSync(grantPath(cwd, policy), JSON.stringify({ expiresAt: '2026-10-01T12:30:00Z' }));
  assert.equal(refusal('scripts/test-content-workspace.mjs', []), undefined);
});

test('a filtered-only command needs a spec path, title filter or listing', () => {
  for (const args of [['e2e/store-cart.spec.ts'], ['-g', 'player'], ['--grep=player'], ['--list']])
    assert.equal(satisfiesFilter('test:e2e', args, policy), true, args.join(' '));
  for (const args of [
    [],
    ['--headed'],
    ['--project', 'chromium-desktop'],
    ['--grep-invert', 'slow'],
    ['-g', '.'],
    ['--grep=.*'],
    ['-g', ''],
    ['.spec.ts'],
  ])
    assert.equal(satisfiesFilter('test:e2e', args, policy), false, args.join(' '));
  assert.equal(satisfiesFilter('validate', [], policy), true);
});
