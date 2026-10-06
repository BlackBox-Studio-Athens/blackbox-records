import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const { values } = parseArgs({
  options: {
    env: { type: 'string', default: 'uat' },
    apply: { type: 'boolean', default: false },
    manifest: { type: 'string', default: '.emdash/migrations.json' },
    'confirm-live-cms-changes': { type: 'boolean', default: false },
    'wrangler-config': { type: 'string', default: '.emdash/wrangler.build.json' },
  },
});
if (!['uat', 'prd'].includes(values.env)) throw new Error('Select uat or prd; Local uses isolated Wrangler storage.');
if (values.env === 'prd' && values.apply && !values['confirm-live-cms-changes']) {
  throw new Error('PRD apply requires --confirm-live-cms-changes.');
}
const config = JSON.parse(readFileSync(values['wrangler-config'], 'utf8'));
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
// Plans first; --apply then applies exactly the planned target, because EmDash rejects a changed fingerprint.
function migrate(...mode) {
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/emdash/dist/cli/index.mjs',
      'migrate',
      '--manifest',
      values.manifest,
      '--wrangler-config',
      values['wrangler-config'],
      '--d1',
      cms.database_id,
      '--account-id',
      '2004bfa6f5ad8b48008f1243b195ab61',
      '--json',
      ...mode,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CLOUDFLARE_API_TOKEN: token } },
  );
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error('CMS migration command failed without a valid report.');
  }
  const text = JSON.stringify(report, null, 2);
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```json\n' + text + '\n```\n');
  return { report, status: result.status ?? 1 };
}
// Exit 0: nothing to apply. Exit 2: changes pending, applied when --apply is set. Anything else is a failure.
const plan = migrate('--check');
let status = plan.status;
if (values.apply && status === 2) {
  const fingerprint = plan.report.target?.fingerprint;
  if (!/^[a-f0-9]{64}$/.test(fingerprint ?? '')) throw new Error('The migration plan has no reviewed fingerprint.');
  status = migrate('--expected-target-fingerprint', fingerprint).status;
}
process.exitCode = status;
