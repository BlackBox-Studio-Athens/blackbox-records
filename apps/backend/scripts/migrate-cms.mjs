import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const { values } = parseArgs({
  options: {
    env: { type: 'string', default: 'uat' },
    apply: { type: 'boolean', default: false },
    fingerprint: { type: 'string' },
  },
});
if (!['uat', 'prd'].includes(values.env)) throw new Error('Select uat or prd; Local uses isolated Wrangler storage.');
if (values.apply && !/^[a-f0-9]{64}$/.test(values.fingerprint ?? '')) {
  throw new Error('Apply requires the reviewed --fingerprint from a migration check.');
}
const config = JSON.parse(readFileSync('.emdash/wrangler.build.json', 'utf8'));
const resources = JSON.parse(readFileSync('cms-resources.json', 'utf8'));
const cms = resources[values.env];
const binding = config.d1_databases.find((db) => db.binding === 'CMS_DB');
if (config.vars.PRODUCT_ENVIRONMENT !== values.env.toUpperCase() || binding?.database_id !== cms.database_id) {
  throw new Error(`Build the combined artifact for ${values.env} before checking its CMS migrations.`);
}
let token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  const auth = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'auth', 'token', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (auth.status !== 0) throw new Error('Wrangler requires an authorized session.');
  token = JSON.parse(auth.stdout).token;
}
if (!token) throw new Error('Cloudflare authentication is unavailable.');
const result = spawnSync(
  process.execPath,
  [
    'node_modules/emdash/dist/cli/index.mjs',
    'migrate',
    '--manifest',
    '.emdash/migrations.json',
    '--wrangler-config',
    '.emdash/wrangler.build.json',
    '--d1',
    cms.database_id,
    '--account-id',
    '2004bfa6f5ad8b48008f1243b195ab61',
    '--json',
    ...(values.apply ? ['--expected-target-fingerprint', values.fingerprint] : ['--check']),
  ],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CLOUDFLARE_API_TOKEN: token } },
);
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  throw new Error('CMS migration command failed without a valid report.');
}
console.log(JSON.stringify(report, null, 2));
process.exitCode = result.status ?? 1;
