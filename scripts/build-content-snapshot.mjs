import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const { values } = parseArgs({
  options: { snapshot: { type: 'string' }, sha256: { type: 'string' }, env: { type: 'string' } },
});
if (!values.snapshot || !/^[a-f0-9]{64}$/.test(values.sha256 ?? '') || !['local', 'uat', 'prd'].includes(values.env))
  throw new Error('Use --snapshot <snapshot.json> --sha256 <digest> --env local|uat|prd.');
const result = spawnSync('pnpm', ['build:web'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    CMS_CONTENT_SOURCE: 'snapshot',
    CMS_CONTENT_SNAPSHOT: resolve(values.snapshot),
    CMS_CONTENT_SHA256: values.sha256,
    CMS_CONTENT_ENVIRONMENT: values.env,
  },
});
process.exit(result.status ?? 1);
