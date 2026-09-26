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

async function main() {
  const { values } = parseArgs({ options: { scope: { type: 'string' } } });
  console.log('PARTIAL test watch: this does not establish implementation completion.');
  const children = watchConfigurations(values.scope).map((config) =>
    execa(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['--filter', `@blackbox/${values.scope}`, 'exec', 'vitest', '--watch', ...(config ? ['--config', config] : [])],
      { stdio: 'inherit', reject: false },
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
