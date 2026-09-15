// Native-only so a dependency installation failure can still be reported.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const env = process.env;
const action = process.argv[2];
assert.ok(['start', 'failed'].includes(action), 'Expected start or failed.');
assert.ok(['uat', 'prd'].includes(env.PUBLICATION_TARGET), 'Invalid publication target.');
assert.match(env.PUBLICATION_ID ?? '', /^[a-f0-9-]{36}$/i);
assert.match(env.GITHUB_RUN_ID ?? '', /^[1-9][0-9]{0,19}$/);
assert.match(env.CMS_PUBLICATION_EXPORT_TOKEN ?? '', /^[a-f0-9]{64}$/);
assert.ok(env.CMS_EXPORT_ACCESS_CLIENT_ID && env.CMS_EXPORT_ACCESS_CLIENT_SECRET, 'Access credentials required.');
const resources = JSON.parse(readFileSync(new URL('../apps/backend/cms-resources.json', import.meta.url), 'utf8'));
const body = { id: env.PUBLICATION_ID, ciRunId: env.GITHUB_RUN_ID };
if (action === 'start') {
  assert.match(env.PUBLICATION_DISPATCH_TOKEN ?? '', /^[a-f0-9-]{36}$/i);
  body.dispatchToken = env.PUBLICATION_DISPATCH_TOKEN;
}
const response = await fetch(
  `https://${resources[env.PUBLICATION_TARGET].hostname}/_emdash/api/blackbox/publications/${action === 'start' ? 'run' : 'failed'}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CMS_PUBLICATION_EXPORT_TOKEN}`,
      'Content-Type': 'application/json',
      'cf-access-client-id': env.CMS_EXPORT_ACCESS_CLIENT_ID,
      'cf-access-client-secret': env.CMS_EXPORT_ACCESS_CLIENT_SECRET,
    },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  },
);
await response.body?.cancel();
assert.equal(response.status, 200, `Publication ${action} acknowledgement failed (${response.status}).`);
console.log(`Publication ${action} acknowledged.`);
