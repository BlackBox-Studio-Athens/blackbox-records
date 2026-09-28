import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { execa } from 'execa';
import { runValidation } from './validate.mjs';
import { runFiniteCommand } from './local-process.ts';
import { watchConfigurations } from './test-watch.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const packages = { web: 'apps/web', staff: 'apps/staff', backend: 'apps/backend', 'api-client': 'packages/api-client' };
const sourceFile = /\.(?:[cm]?[jt]sx?|astro|css|json|ya?ml|sql|prisma)$/;

export function localSelection(files) {
  const scopes = new Set();
  let contracts = false;
  const fullTests = new Set();
  for (const file of files) {
    if (/^(?:docs|openspec)\//.test(file)) continue;
    const scope = Object.keys(packages).find((name) => file.startsWith(`${packages[name]}/`));
    if (scope) {
      scopes.add(scope);
      if (scope === 'api-client') for (const name of ['web', 'staff', 'backend']) scopes.add(name);
      // Astro content, migrations, assets and filesystem fixtures have no complete import graph.
      if (!/\.[cm]?[jt]sx?$/.test(file) || /(?:package\.json|config\.[^/]+)$/.test(file)) fullTests.add(scope);
      if (file.includes('/scripts/') || /(?:package\.json|config\.[^/]+)$/.test(file)) contracts = true;
    } else if (file.startsWith('packages/') || (sourceFile.test(file) && !file.startsWith('.github/'))) {
      for (const name of Object.keys(packages)) scopes.add(name);
      contracts = true;
    } else if (file.startsWith('.github/')) contracts = true;
  }
  return { files, scopes: Object.keys(packages).filter((name) => scopes.has(name)), fullTests, contracts };
}

export async function changedFiles(cwd, since) {
  await execa('git', ['rev-parse', '--verify', `${since}^{commit}`], { cwd, windowsHide: true });
  const results = await Promise.all([
    execa('git', ['diff', '--name-only', '-z', since, '--'], { cwd, windowsHide: true }),
    execa('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd, windowsHide: true }),
  ]);
  return [...new Set(results.flatMap(({ stdout }) => stdout.split('\0').filter(Boolean)))].sort();
}

export function localCommands(selection, cwd = root) {
  const command = (name, args) => ({ name, command: 'pnpm', args });
  // Package/config files are handled by scope broadening. Passing them to Vitest's
  // related list would trigger its global force-rerun rule in unrelated packages.
  const related = selection.files
    .filter((file) => /\.[cm]?[jt]sx?$/.test(file) && !/(?:^|\/)[^/]*config\.[^/]+$/.test(file))
    .map((file) => path.resolve(cwd, file));
  const tests = selection.scopes.flatMap((scope) =>
    watchConfigurations(scope).map((config) =>
      command(`tests:${scope}${config ? `:${config}` : ''}`, [
        '--filter',
        `@blackbox/${scope}`,
        'exec',
        'vitest',
        ...(selection.fullTests.has(scope) ? ['run'] : ['related', '--run', ...related]),
        '--passWithNoTests',
        ...(config ? ['--config', config] : []),
      ]),
    ),
  );
  if (selection.contracts) tests.push(command('contracts', ['test:contracts']));
  const lint = selection.files.filter(
    (file) => /\.[cm]?[jt]sx?$|\.astro$/.test(file) && existsSync(path.join(cwd, file)),
  );
  const checks = selection.files.length ? [command('format', ['format:check'])] : [];
  if (lint.length)
    checks.push(
      command('lint:changed', [
        'exec',
        'eslint',
        '--max-warnings=0',
        '--no-warn-ignored',
        ...lint.map((file) => path.resolve(cwd, file)),
      ]),
    );
  if (selection.scopes.length)
    checks.push(
      command('types:affected', [
        '--parallel',
        ...selection.scopes.flatMap((scope) => ['--filter', `@blackbox/${scope}`]),
        'check',
      ]),
    );
  return { tests, checks };
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  // Keep explicit full/check/editor commands and the committed Fresh IDE launcher compatible.
  if (args.some((arg) => ['--full', '--no-cache', '--resume', '--fast', '--checks', '--editor'].includes(arg))) {
    await execa(
      process.execPath,
      ['--import', 'tsx', 'scripts/validate.mjs', ...args.filter((arg) => arg !== '--full')],
      {
        cwd: root,
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    return;
  }
  const { values } = parseArgs({
    args,
    options: {
      since: { type: 'string' },
      lane: { type: 'string' },
    },
  });
  if (values.lane && !['tests', 'checks'].includes(values.lane)) throw new Error('Unknown local validation lane.');
  const reference =
    values.since ??
    ((
      await execa('git', ['rev-parse', '--verify', 'refs/remotes/origin/main'], {
        cwd: root,
        reject: false,
        windowsHide: true,
      })
    ).exitCode === 0
      ? 'origin/main'
      : 'HEAD');
  const { stdout: since } = await execa('git', ['rev-parse', '--verify', `${reference}^{commit}`], {
    cwd: root,
    windowsHide: true,
  });
  const selection = localSelection(await changedFiles(root, since));
  const commands = localCommands(selection);
  if (values.lane) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    process.once('SIGINT', cancel);
    process.once('SIGTERM', cancel);
    try {
      for (const command of commands[values.lane])
        await runFiniteCommand(command, { cwd: root, cancelSignal: controller.signal });
    } finally {
      process.off('SIGINT', cancel);
      process.off('SIGTERM', cancel);
    }
    return;
  }
  console.log(
    `LOCAL validation against ${reference}: ${selection.files.length} changed files; packages: ${selection.scopes.join(', ') || 'none'}.`,
  );
  console.log('Full tests and release builds run in CI. Use pnpm validate:full for the complete local suite.');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    const summary = await runValidation({
      cwd: root,
      local: true,
      signal: controller.signal,
      phases: ['tests', 'checks'].map((lane) => ({
        name: lane,
        command: process.execPath,
        args: ['--import', 'tsx', 'scripts/validate-local.mjs', '--lane', lane, '--since', since],
      })),
    });
    process.exitCode = summary.exitCode;
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.shortMessage ?? error.message);
    process.exitCode = error.exitCode ?? 1;
  });
}
