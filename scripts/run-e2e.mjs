import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { satisfiesFilter } from './feedback-guard.mjs';
import { appendHistory, loadPolicy, releaseTierAllowance } from './feedback-policy.mjs';
import { runFiniteCommand } from './local-process.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playwrightCli = path.join(
  path.dirname(createRequire(import.meta.url).resolve('playwright/package.json')),
  'cli.js',
);

async function runPlaywright(args) {
  try {
    await runFiniteCommand({
      name: 'playwright',
      command: process.execPath,
      args: [playwrightCli, 'test', ...args],
      cwd: repositoryRoot,
    });
    return 0;
  } catch (error) {
    return error.exitCode ?? 1;
  }
}

/**
 * `pnpm test:e2e`: a local run names a spec or title filter, holds one machine slot and records its filter, exit
 * code and duration in the machine-wide history; CI runs as asked.
 */
export async function runE2e(
  args,
  { env = process.env, cwd = repositoryRoot, policy = loadPolicy(), acquireSlots, run = runPlaywright, signal } = {},
) {
  if (env.GITHUB_ACTIONS === 'true') return run(args);
  if (!satisfiesFilter('test:e2e', args, policy) && !releaseTierAllowance({ env, cwd, policy }).allowed) {
    console.error(policy.filteredOnly.instead);
    return 1;
  }
  const acquire = acquireSlots ?? (await import('./machine-slots.mjs')).acquireSlots;
  const slot = await acquire({ cwd, policy, want: 1, label: 'e2e', signal });
  try {
    const started = Date.now();
    const exitCode = await run(args);
    const filter = args.join(' ').slice(0, 120);
    appendHistory({ kind: 'e2e', filter, exitCode, durationMs: Date.now() - started }, { cwd, policy });
    return exitCode;
  } finally {
    await slot.release();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Ctrl+C reaches Playwright directly; the handler only ends a slot wait and keeps this process alive to release.
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  runE2e(process.argv.slice(2), { signal: controller.signal })
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
