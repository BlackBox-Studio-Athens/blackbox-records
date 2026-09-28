import { execa } from 'execa';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const watchScopes = {
  web: ['vitest.config.ts', 'vitest.request.config.ts'],
  staff: [undefined],
  backend: ['vitest.config.ts', 'vitest.node.config.ts'],
  'api-client': [undefined],
};

export function watchConfigurations(scope) {
  const configs = watchScopes[scope];
  if (!configs) throw new Error(`Specify --scope from: ${Object.keys(watchScopes).join(', ')}.`);
  return configs;
}

export function vitestArguments(config, { changed = false, since } = {}) {
  if (since && !changed) throw new Error('--since requires --changed.');
  return [
    ...(changed ? ['run', `--changed=${since || 'HEAD'}`, '--passWithNoTests'] : ['--watch']),
    ...(config ? ['--config', config] : []),
  ];
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: { scope: { type: 'string' }, changed: { type: 'boolean' }, since: { type: 'string' } },
  });
  const configs = watchConfigurations(values.scope);
  vitestArguments(undefined, values);
  console.log(
    `PARTIAL ${values.changed ? 'affected tests' : 'test watch'}: this does not establish implementation completion.`,
  );
  if (values.changed)
    console.log('Import-based selection only; use validate:fast --scope all for shared/configuration/content changes.');
  const children = configs.map((config) =>
    execa(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['--filter', `@blackbox/${values.scope}`, 'exec', 'vitest', ...vitestArguments(config, values)],
      { stdio: 'inherit', reject: false, windowsHide: true },
    ),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => children.forEach((child) => child.kill(signal)));
  const results = await Promise.all(children);
  process.exitCode = results.some(({ exitCode }) => exitCode !== 0) ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
