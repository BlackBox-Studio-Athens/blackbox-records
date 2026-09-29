import { existsSync } from 'node:fs';
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

/** Normalize an existing file or directory argument to a repo-relative posix path; otherwise undefined. */
export function existingPath(arg, cwd = process.cwd(), exists = existsSync) {
  const resolved = arg && path.resolve(cwd, arg.replaceAll('\\', '/'));
  if (!resolved || !exists(resolved)) return undefined;
  return path.relative(cwd, resolved).replaceAll('\\', '/') || '.';
}

/** `exclude` drops the root `workspace` and `*-tooling` script-contract suites, which run in validate and CI. */
export function nxTestArguments(arg, file, rest = [], exclude = true) {
  const affected = ['exec', 'nx', 'affected', '-t', 'test', ...(exclude ? ['--exclude=workspace,*-tooling'] : [])];
  if (!arg) return [...affected, '--base=HEAD', ...rest];
  if (file) return [...affected, `--files=${file}`, ...rest];
  return ['exec', 'nx', 'run', `${arg}:test`, ...rest];
}

/** Owner is the project with the longest root prefix; the workspace root '.' is the last resort. */
export function owningProject(nodes, file) {
  const prefix = (root) => root !== '.' && (file === root || file.startsWith(`${root}/`));
  const owner = nodes
    .filter(({ data }) => prefix(data.root))
    .sort((a, b) => b.data.root.length - a.data.root.length)[0];
  return owner ?? nodes.find(({ data }) => data.root === '.');
}

async function projectNodes() {
  const { createProjectGraphAsync } = await import('nx/src/project-graph/project-graph.js');
  return Object.values((await createProjectGraphAsync()).nodes);
}

export async function main(
  args = process.argv.slice(2),
  { runCommand = runFiniteCommand, cwd = process.cwd(), nodes = projectNodes } = {},
) {
  const rawArgs = args.filter((arg) => arg !== '--');
  if (rawArgs[0] === '--run') {
    // Only --run and the first positional are ours; everything else reaches nx unchanged.
    const rest = rawArgs.slice(1);
    const index = rest.findIndex((arg) => !arg.startsWith('-'));
    const arg = index < 0 ? undefined : rest[index];
    if (arg) rest.splice(index, 1);
    const file = existingPath(arg, cwd);
    const owner = file && owningProject(await nodes(), file)?.name;
    const exclude = !owner || !(owner === 'workspace' || owner.endsWith('-tooling'));
    const label = file ? `tests for ${file}` : arg ? `tests for ${arg}` : 'tests for working-tree changes';
    console.log(`PARTIAL ${label}: this does not establish implementation completion.`);
    return runCommand(
      { name: 'test', command: 'pnpm', args: nxTestArguments(arg, file, rest, exclude) },
      { cwd, stdio: 'inherit' },
    );
  }
  const parsed = parseArgs({
    args: rawArgs,
    options: {
      scope: { type: 'string' },
      changed: { type: 'boolean' },
      since: { type: 'string' },
    },
    allowPositionals: true,
  });
  if (parsed.positionals.length > 1 || (parsed.values.scope && parsed.positionals.length))
    throw new Error('Specify the module once, either as a positional argument or with --scope.');
  let scope = parsed.values.scope ?? parsed.positionals[0];
  const { changed } = parsed.values;
  const file = changed ? undefined : existingPath(scope, cwd);
  if (file) {
    const owner = owningProject(await nodes(), file);
    if (!owner?.data.targets?.['test-watch'])
      throw new Error(
        `${file} is owned by ${owner?.name ?? 'no project'}, which has no test-watch target; run \`pnpm test ${file}\`.`,
      );
    scope = owner.name;
  }
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
