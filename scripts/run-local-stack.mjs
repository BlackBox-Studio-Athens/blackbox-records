import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const validModes = new Set(['stripe-test', 'stripe-mock', 'stripe-mock-api', 'uat-connected']);
const binSuffix = process.platform === 'win32' ? '.cmd' : '';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

if (!validModes.has(mode)) {
  console.error('Usage: pnpm dev:stack:stripe-mock');
  process.exit(1);
}

const requiredBinaries = [
  ['root tsx', path.join('node_modules', '.bin', `tsx${binSuffix}`)],
  ['backend tsx', path.join('apps', 'backend', 'node_modules', '.bin', `tsx${binSuffix}`)],
  ['backend Wrangler', path.join('apps', 'backend', 'node_modules', '.bin', `wrangler${binSuffix}`)],
  ['web Astro', path.join('apps', 'web', 'node_modules', '.bin', `astro${binSuffix}`)],
];

function missingBinaries() {
  return requiredBinaries
    .filter(([, relativePath]) => !existsSync(path.join(rootDir, relativePath)))
    .map(([name]) => name);
}

function lockfileNeedsInstall() {
  try {
    const lockfileTime = statSync(path.join(rootDir, 'pnpm-lock.yaml')).mtimeMs;
    const modulesFileTime = statSync(path.join(rootDir, 'node_modules', '.modules.yaml')).mtimeMs;
    return lockfileTime > modulesFileTime;
  } catch {
    return true;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    console.error(result.error.message);
  }

  return result.status ?? 1;
}

const missing = missingBinaries();
if (missing.length > 0 || lockfileNeedsInstall()) {
  const reason = missing.length > 0 ? `missing ${missing.join(', ')}` : 'lockfile is newer than the installed modules';
  console.log(`[local-stack] ${reason}; running pnpm install --frozen-lockfile`);

  const installStatus = run(pnpmCommand, ['install', '--frozen-lockfile']);
  if (installStatus !== 0) {
    console.error('[local-stack] Dependency install failed; stack not started.');
    process.exit(installStatus);
  }
}

const remaining = missingBinaries();
if (remaining.length > 0) {
  console.error(`[local-stack] Required tools are still missing: ${remaining.join(', ')}`);
  process.exit(1);
}

process.exit(run(pnpmCommand, ['exec', 'tsx', 'scripts/start-local-stack.ts', mode]));
