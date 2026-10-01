import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { historyPath, loadPolicy } from '../feedback-policy.mjs';
import { commandSegments, evaluateCommand } from './command-guard.mjs';

const policy = loadPolicy();
const { grantCommand, grantFile, overrideEnv } = policy.releaseTier;
const closed = () => ({ allowed: false, reason: 'none' });
const granted = () => ({ allowed: true, reason: 'grant', expiresAt: '2026-10-01T12:30:00.000Z' });
const rule = (command, allowance = closed) => evaluateCommand(command, { policy, allowance })?.rule ?? null;

const denied = [
  ['pnpm validate:full', 'release-tier:validate:full'],
  ['pnpm run test:unit', 'release-tier:test:unit'],
  ['npm run build', 'release-tier:build'],
  ['pnpm -s validate:editor', 'release-tier:validate:editor'],
  ['rtk pnpm validate:full', 'release-tier:validate:full'],
  ['rtk err pnpm build', 'release-tier:build'],
  ['rtk run "pnpm validate:full"', 'release-tier:validate:full'],
  ["& 'C:/Users/SVall/.local/bin/rtk.exe' proxy pnpm check", 'release-tier:check'],
  ['cd apps/web && pnpm lint', 'release-tier:lint'],
  ['git status; pnpm validate:checks', 'release-tier:validate:checks'],
  ['Get-Location | Out-Null; if ($?) { pnpm check:types }', 'release-tier:check:types'],
  ['git status\npnpm test:web', 'release-tier:test:web'],
  ['git fetch || pnpm build', 'release-tier:build'],
  ['(pnpm validate:full)', 'release-tier:validate:full'],
  ['FOO=1 pnpm validate:full', 'release-tier:validate:full'],
  ['env CI=1 pnpm build', 'release-tier:build'],
  ['bash -c "pnpm validate:full"', 'release-tier:validate:full'],
  ["sh -lc 'cd x && pnpm build'", 'release-tier:build'],
  ['pwsh -NoProfile -Command "pnpm validate:checks"', 'release-tier:validate:checks'],
  ['powershell -c pnpm check', 'release-tier:check'],
  ['cmd /c "pnpm test:unit"', 'release-tier:test:unit'],
  ['echo $(pnpm validate:full)', 'release-tier:validate:full'],
  ['echo "built: `pnpm build`"', 'release-tier:build'],
  ['npx nx run-many -t test', 'nx-run-many'],
  ['pnpm exec nx run-many -t lint', 'nx-run-many'],
  ['pnpm nx run-many -t build', 'nx-run-many'],
  ['node_modules\\.bin\\nx.cmd run-many -t test', 'nx-run-many'],
  ['pnpm exec vitest run --config vitest.modules.config.ts', 'vitest-package-wide'],
  ['npx vitest', 'vitest-package-wide'],
  ['rtk vitest run', 'vitest-package-wide'],
  [
    'pnpm --filter @blackbox/web exec vitest --root ../.. --config scripts/vitest.contracts.config.ts run',
    'vitest-package-wide',
  ],
  ['pnpm --filter @blackbox/web test', 'pnpm-filter-suite'],
  ['pnpm -F @blackbox/backend run check', 'pnpm-filter-suite'],
  ['pnpm -C apps/staff test:unit', 'pnpm-filter-suite'],
  ['pnpm -r test', 'pnpm-recursive-suite'],
  ['pnpm --recursive run lint', 'pnpm-recursive-suite'],
  ['npx playwright test', 'playwright-whole-suite'],
  ['pnpm exec playwright test --project chromium-desktop', 'playwright-whole-suite'],
  ['rtk playwright test', 'playwright-whole-suite'],
  ['pnpm test:e2e', 'filtered-only:test:e2e'],
  ['pnpm test:e2e --headed', 'filtered-only:test:e2e'],
  ['pnpm test:e2e > e2e.log 2>&1', 'filtered-only:test:e2e'],
  ['pnpm exec nx affected -t test --skip-nx-cache', 'nx-skip-cache'],
  ['npx nx affected -t lint --skipNxCache', 'nx-skip-cache'],
  ['pnpm validate --no-cache', 'nx-skip-cache'],
  ['NX_SKIP_NX_CACHE=true pnpm validate', 'nx-skip-cache-env'],
  ['$env:NX_SKIP_NX_CACHE = "true"; pnpm validate', 'nx-skip-cache-env'],
  ['eslint .', 'eslint-whole-repo'],
  ['pnpm exec eslint --fix', 'eslint-whole-repo'],
  ['rtk lint', 'eslint-whole-repo'],
  ['prettier . --check', 'prettier-whole-repo'],
  ['pnpm exec eslint apps/web --max-warnings=0', 'eslint-whole-package'],
  ['npx eslint ./packages/api-client/', 'eslint-whole-package'],
  ['pnpm --filter @blackbox/web exec astro check', 'typecheck-whole-package'],
  ['pnpm exec tsc --noEmit -p apps/backend/tsconfig.json', 'typecheck-whole-package'],
  ["cd apps/web; $env:NX_TASK_HASH = 'x'; pnpm test", 'forge-nx-task'],
  ['npx playwright test -g .', 'playwright-whole-suite'],
  ['pnpm test:e2e --grep=.*', 'filtered-only:test:e2e'],
  [`pnpm ${grantCommand} 30`, 'lift-guard'],
  [`rtk pnpm ${grantCommand} --revoke`, 'lift-guard'],
  ['node scripts/feedback-grant.mjs 5', 'lift-guard'],
  [`${overrideEnv}=1 pnpm validate:full`, 'forge-grant'],
  [`$env:${overrideEnv.toLowerCase()} = '1'`, 'forge-grant'],
  [`set ${overrideEnv}=1 && pnpm build`, 'forge-grant'],
  [`Set-Content .git/blackbox-feedback/${grantFile} '{}'`, 'forge-grant'],
  [`node -e "require('fs').writeFileSync('.git/blackbox-feedback/${grantFile}', '{}')"`, 'forge-grant'],
  ['pnpm exec nx affected -t test', 'nx-affected'],
  ['npx nx affected:lint', 'nx-affected'],
  ['node node_modules/nx/bin/nx.js run-many -t test', 'nx-run-many'],
  ['node node_modules\\.pnpm\\nx@22.0.0\\node_modules\\nx\\dist\\bin\\nx.js affected -t lint', 'nx-affected'],
  ['node --import tsx node_modules/vitest/vitest.mjs run', 'vitest-package-wide'],
  ['node node_modules/@playwright/test/cli.js test', 'playwright-whole-suite'],
  ['node node_modules/eslint/bin/eslint.js .', 'eslint-whole-repo'],
  ['node node_modules/prettier/bin/prettier.cjs . --check', 'prettier-whole-repo'],
  ['node node_modules/typescript/bin/tsc -p apps/web', 'typecheck-whole-package'],
  ['pnpm --filter @blackbox/web exec node node_modules/astro/bin/astro.mjs check', 'typecheck-whole-package'],
  ['pnpm exec vitest run src/', 'vitest-package-wide'],
  ['npx vitest run test\\', 'vitest-package-wide'],
  ['pnpm exec vitest run apps/web/', 'vitest-package-wide'],
  ['pnpm exec vitest run apps/web/src', 'vitest-package-wide'],
  ['pnpm exec vitest run packages/api-client/test/', 'vitest-package-wide'],
  ['pnpm validate --lint-only', 'release-tier:validate --lint-only'],
  ['pnpm run validate -- --checks', 'release-tier:validate --checks'],
  ['pnpm validate --full --scope web', 'release-tier:validate --full'],
  ['node scripts/test-content-workspace.mjs --firefox', 'release-tier:validate:editor'],
  ['node C:\\repo\\scripts\\test-content-workspace.mjs', 'release-tier:validate:editor'],
  ['node --import tsx scripts/validate.mjs --full', 'release-tier:validate --full'],
  ['node --import=tsx ./scripts/validate-local.mjs --editor', 'release-tier:validate --editor'],
  ['tsx scripts/benchmark-validation.mjs --mode commands', 'release-tier:benchmark:validation'],
  ['node --import tsx scripts/run-release-preparation.mjs browsers', 'release-tier:validate:editor'],
];

const allowed = [
  'pnpm validate',
  'pnpm validate --plan',
  'pnpm validate:fast',
  'pnpm test src/layouts',
  'pnpm test apps/web/src/lib/site-data.test.ts',
  'pnpm test:app-shell',
  'pnpm test:e2e e2e/store-cart.spec.ts',
  'pnpm test:e2e -g player',
  'pnpm test:e2e --grep=player',
  'pnpm test:e2e --list',
  'pnpm test:e2e -- e2e/routes.spec.ts',
  'npx playwright test e2e/routes.spec.ts',
  'pnpm exec vitest run --config vitest.modules.config.ts src/layouts',
  'npx vitest run apps/web/src/lib/site-data.test.ts',
  'pnpm exec vitest run apps/web/src/layouts',
  'pnpm exec vitest run packages/api-client/test/contracts',
  'pnpm exec nx run player:test',
  'pnpm exec nx show projects --affected',
  'pnpm exec nx graph --file=graph.json',
  'pnpm validate --since=HEAD~1',
  'node --import tsx scripts/validate.mjs --fast',
  'pnpm --filter @blackbox/backend build:cms --env mock',
  'git commit -m "run pnpm validate:full later"',
  'node scripts/test-content-workspace.mjs --serve',
  'node --import tsx scripts/test-content-workspace.mjs --selling',
  'node node_modules/playwright/cli.js install chromium',
  'node node_modules/typescript/bin/tsc --version',
  'node scripts/check-agent-guidance.mjs',
  'pnpm site:dev:status',
  'rtk git status',
  'git commit -m "mentions pnpm validate:full"',
  "git commit -m 'Run `pnpm validate:full` only under a grant; never npx nx run-many'",
  "git commit -F - <<'EOF'\nfeat(guard): deny release-tier runs\n\npnpm validate:full needs a grant (see docs).\nEOF",
  'git commit -m "$(cat <<\'EOF\'\nfeat(guard): add the guard\n\npnpm build is release-tier; npx nx run-many too.\nEOF\n)"',
  "@'\npnpm validate:full is guarded\n'@ | git commit -F -",
  'echo "pnpm build"',
  'rg -n "nx run-many" scripts',
  'Write-Output "pnpm test:unit; npx playwright test"',
  'pnpm validate # never --no-cache',
  'pnpm exec prettier --write scripts/feedback-grant.mjs',
  'pnpm exec eslint scripts/run-e2e.mjs --max-warnings=0',
  'pnpm exec eslint apps/web/src/lib/site-data.ts packages/api-client/src/index.ts',
  'pnpm exec tsc --version',
  'node --import tsx --test --test-concurrency=1 scripts/feedback-grant.test.mjs',
];

test('statements, subshells and substitutions are command positions', () => {
  assert.deepEqual(commandSegments('a && b || c; d | e & f\ng'), ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  assert.deepEqual(commandSegments('x $(y) `z` "$(w)"'), ['y', 'z', 'w', 'x $(y) `z` "$(w)"']);
  assert.deepEqual(commandSegments('echo \'a; b\' "c && d"'), ['echo \'a; b\' "c && d"']);
});

test('guarded commands are denied at command positions', () => {
  for (const [command, expected] of denied) assert.equal(rule(command), expected, command);
});

test('scoped commands and mere mentions are allowed', () => {
  for (const command of allowed) assert.equal(rule(command), null, command);
});

test('a grant lifts every rule except lifting the guard itself', () => {
  for (const command of [
    'pnpm validate:full',
    'pnpm test:e2e',
    'npx nx run-many -t test',
    'pnpm validate --no-cache',
    'pnpm validate --lint-only',
    'pnpm exec nx affected -t test',
    'node scripts/test-content-workspace.mjs --firefox',
  ])
    assert.equal(rule(command, granted), null, command);
  for (const command of [
    `pnpm ${grantCommand} 30`,
    `${overrideEnv}=1 pnpm build`,
    `cat .git/blackbox-feedback/${grantFile}`,
  ])
    assert.match(rule(command, granted), /^(lift-guard|forge-grant)$/, command);
});

test('the grant is resolved only after a pattern matched', () => {
  let calls = 0;
  const counting = () => {
    calls += 1;
    return closed();
  };
  for (const command of ['pnpm validate', 'git status', `pnpm ${grantCommand} 5`])
    evaluateCommand(command, { policy, allowance: counting });
  assert.equal(calls, 0);
  evaluateCommand('pnpm validate:full', { policy, allowance: counting });
  assert.equal(calls, 1);
});

test('a file tool writing the grant file is denied', () => {
  const verdict = evaluateCommand('', {
    policy,
    allowance: closed,
    raw: `C:/repo/.git/blackbox-feedback/${grantFile}`,
  });
  assert.equal(verdict.rule, 'forge-grant');
  assert.equal(evaluateCommand('', { policy, allowance: closed, raw: 'C:/repo/docs/guide.md' }), null);
});

function hookCheckout(t) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'command-guard-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'scripts', 'agent-hooks'), { recursive: true });
  const source = fileURLToPath(new URL('../..', import.meta.url));
  for (const file of [
    'feedback-policy.json',
    'scripts/feedback-policy.mjs',
    'scripts/feedback-guard.mjs',
    'scripts/agent-hooks/command-guard.mjs',
  ])
    copyFileSync(path.join(source, file), path.join(root, file));
  execFileSync('git', ['init', '--quiet'], { cwd: root, stdio: 'ignore', windowsHide: true });
  return root;
}

function runHook(root, input) {
  const env = { ...process.env };
  delete env.GITHUB_ACTIONS;
  delete env[overrideEnv];
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'agent-hooks', 'command-guard.mjs')], {
    env,
    input,
    encoding: 'utf8',
    timeout: 15_000,
    windowsHide: true,
  });
}

test('the hook blocks with exit 2, names the alternative and records the denial', (t) => {
  const root = hookCheckout(t);
  const event = { session_id: 'session-1', tool_name: 'PowerShell', tool_input: { command: 'pnpm validate:full' } };
  const result = runHook(root, JSON.stringify(event));
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /release-tier:validate:full/);
  assert.ok(result.stderr.includes(policy.releaseTier.instead));
  const [entry, ...rest] = readFileSync(path.join(root, '.codex-artifacts/feedback-guard/denials.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.deepEqual(rest, []);
  assert.deepEqual(
    { rule: entry.rule, session: entry.session, command: entry.command },
    { rule: 'release-tier:validate:full', session: 'session-1', command: 'pnpm validate:full' },
  );
  assert.ok(Number.isFinite(Date.parse(entry.time)));
  const history = readFileSync(historyPath(root, policy), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.deepEqual(
    history.map(({ kind, rule, session, checkout }) => ({ kind, rule, session, checkout })),
    [{ kind: 'denial', rule: 'release-tier:validate:full', session: 'session-1', checkout: root }],
  );

  const write = runHook(
    root,
    JSON.stringify({
      tool_name: 'Write',
      tool_input: { file_path: `.git/blackbox-feedback/${grantFile}`, content: '{}' },
    }),
  );
  assert.equal(write.status, 2, write.stderr);
});

test('the hook allows scoped commands silently and fails open on bad input or policy', (t) => {
  const root = hookCheckout(t);
  const scoped = runHook(root, JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'pnpm validate' } }));
  assert.equal(scoped.status, 0, scoped.stderr);
  assert.equal(scoped.stderr, '');
  assert.equal(existsSync(path.join(root, '.codex-artifacts')), false);
  assert.equal(existsSync(historyPath(root, policy)), false);

  const malformed = runHook(root, 'not json');
  assert.equal(malformed.status, 0);
  assert.match(malformed.stderr, /^Feedback command guard skipped: /);

  writeFileSync(path.join(root, 'feedback-policy.json'), '{');
  const broken = runHook(root, JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'pnpm validate:full' } }));
  assert.equal(broken.status, 0);
  assert.match(broken.stderr, /^Feedback command guard skipped: /);
});
