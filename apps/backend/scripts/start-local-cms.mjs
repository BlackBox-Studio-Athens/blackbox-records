import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { unstable_dev } from 'wrangler';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const { values } = parseArgs({
  options: { port: { type: 'string', default: '8787' }, 'persist-to': { type: 'string' } },
});
if (values.port !== '8787') throw new Error('The Local stack requires port 8787.');
const config = resolve('dist/server/wrangler.json');
const bindings = JSON.parse(readFileSync(config, 'utf8')).vars;
if (bindings.PRODUCT_ENVIRONMENT !== 'LOCAL' || bindings.STRIPE_API_BASE_URL !== 'http://127.0.0.1:12110')
  throw new Error('Build the Local mock CMS before starting this launcher.');
const persistTo = resolve(values['persist-to'] ?? '.wrangler/state');
const migration = spawnSync(
  process.execPath,
  ['scripts/migrate-cms-application.mjs', '--persist-to', persistTo, '--apply'],
  {
    stdio: 'inherit',
    windowsHide: true,
  },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);
const worker = await unstable_dev(resolve('dist/server/entry.mjs'), {
  config,
  ip: '127.0.0.1',
  port: 8787,
  local: true,
  persist: true,
  persistTo,
  envFiles: [],
  experimental: { disableExperimentalWarning: true },
});
const stop = async () => {
  await worker.stop();
  process.exit();
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
try {
  console.log('[Local CMS] Staff: http://127.0.0.1:8787/content/');
  await worker.waitUntilExit();
} finally {
  await worker.stop();
}
