import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runFiniteCommand } from './local-process.ts';

export const watchScopes = ['web', 'staff', 'backend', 'api-client'];

export function nxWatchArguments(scope, { changed = false, since } = {}) {
  if (!changed && !scope) throw new Error('Specify a module: pnpm test:watch <module>.');
  if (changed && scope && !watchScopes.includes(scope)) throw new Error(`Unknown changed-test scope: ${scope}.`);
  if (since && !changed) throw new Error('--since requires --changed.');
  return changed
    ? [
        'exec',
        'nx',
        'affected',
        '-t',
        'test',
        ...(scope ? [`--exclude=*,!tag:scope:${scope}`] : []),
        ...(since ? [`--base=${since}`] : []),
      ]
    : ['exec', 'nx', 'run', `${scope}:test-watch`];
}

export async function main(args = process.argv.slice(2), { runCommand = runFiniteCommand, cwd = process.cwd() } = {}) {
  const parsed = parseArgs({
    args: args.filter((arg) => arg !== '--'),
    options: { scope: { type: 'string' }, changed: { type: 'boolean' }, since: { type: 'string' } },
    allowPositionals: true,
  });
  if (parsed.positionals.length > 1 || (parsed.values.scope && parsed.positionals.length))
    throw new Error('Specify the module once, either as a positional argument or with --scope.');
  const scope = parsed.values.scope ?? parsed.positionals[0];
  const changed = parsed.values.changed;
  const command = {
    name: changed ? 'affected-tests' : 'test-watch',
    command: 'pnpm',
    args: nxWatchArguments(scope, parsed.values),
  };
  console.log(
    `PARTIAL ${changed ? 'affected tests' : 'test watch'}${scope ? ` for ${scope}` : ''}: this does not establish implementation completion.`,
  );
  return runCommand(command, { cwd, stdio: 'inherit' });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.on('SIGINT', cancel);
  process.on('SIGTERM', cancel);
  main(process.argv.slice(2), {
    runCommand: (command, options) => runFiniteCommand(command, { ...options, cancelSignal: controller.signal }),
  })
    .then((result) => {
      process.exitCode = result?.exitCode ?? 0;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = error.exitCode || 1;
    })
    .finally(() => {
      process.off('SIGINT', cancel);
      process.off('SIGTERM', cancel);
    });
}
