import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { contentPublicationIdentity } from './release-candidate.mjs';

const { values } = parseArgs({
  options: {
    snapshot: { type: 'string' },
    sha256: { type: 'string' },
    env: { type: 'string' },
    'release-identity': { type: 'string' },
    'publication-id': { type: 'string' },
    'ci-run-id': { type: 'string' },
  },
});
if (!values.snapshot || !/^[a-f0-9]{64}$/.test(values.sha256 ?? '') || !['local', 'uat', 'prd'].includes(values.env))
  throw new Error('Use --snapshot <snapshot.json> --sha256 <digest> --env local|uat|prd.');
let publication;
if (values['release-identity'] || values['publication-id'] || values['ci-run-id']) {
  if (!values['release-identity'] || !values['publication-id'] || !values['ci-run-id'])
    throw new Error('Publication builds require --release-identity, --publication-id and --ci-run-id together.');
  if (statSync(values['release-identity']).size > 4096) throw new Error('Release identity exceeds byte limit.');
  publication = contentPublicationIdentity(
    JSON.parse(readFileSync(values['release-identity'], 'utf8')),
    {
      publicationId: values['publication-id'],
      ciRunId: values['ci-run-id'],
      snapshotSha256: values.sha256,
    },
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  );
}
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
if (result.status === 0 && publication) writeFileSync('apps/web/dist/release.json', JSON.stringify(publication));
process.exit(result.status ?? 1);
