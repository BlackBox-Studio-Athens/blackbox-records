import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cmsSnapshotTarget } from './cms-snapshot-readers.mjs';
import { waitForDeployment } from './release-candidate.mjs';

export async function acknowledgeContentPublication({ env, expected }, fetchImpl = fetch) {
  assert.ok(['uat', 'prd'].includes(env.PUBLICATION_TARGET));
  assert.match(env.CLOUDFLARE_ACCOUNT_ID ?? '', /^[a-f0-9]{32}$/);
  assert.match(env.CMS_PUBLICATION_EXPORT_TOKEN ?? '', /^[a-f0-9]{64}$/);
  const name = env.PUBLICATION_TARGET === 'uat' ? 'blackbox-records-web-uat' : 'blackbox-records-web';

  assert.equal(expected.content.publicationId, env.PUBLICATION_ID);
  assert.equal(expected.content.ciRunId, env.GITHUB_RUN_ID);
  async function json(url, headers = {}) {
    const response = await fetchImpl(url, {
      headers,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 200, `Publication verification failed (${response.status}).`);
    return response.json();
  }
  const project = await json(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${name}`,
    {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
  );
  assert.equal(project.success, true);
  assert.equal(project.result.name, name);
  const deployment = project.result.canonical_deployment;
  assert.equal(deployment.environment, 'production');
  assert.equal(deployment.latest_stage.name, 'deploy');
  assert.equal(deployment.latest_stage.status, 'success');
  assert.equal(deployment.deployment_trigger.metadata.commit_hash, expected.sha);
  assert.match(deployment.id, /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
  const immutable = new URL(deployment.url);
  assert.equal(immutable.protocol, 'https:');
  assert.ok(new RegExp(`^[a-z0-9]+\\.${name}\\.pages\\.dev$`).test(immutable.hostname));
  assert.equal(immutable.href, immutable.origin + '/');
  assert.deepEqual(await json(`${immutable.origin}/release.json`), expected, 'Deployment content identity differs.');
  const resources = JSON.parse(readFileSync(new URL('../apps/backend/cms-resources.json', import.meta.url), 'utf8'));
  const target = cmsSnapshotTarget(env.PUBLICATION_TARGET, `https://${resources[env.PUBLICATION_TARGET].hostname}/`);
  // CMS retains this receipt before checking public propagation; a failed check can be reconciled later.
  const response = await fetchImpl(new URL('/_emdash/api/blackbox/publications/complete', target), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CMS_PUBLICATION_EXPORT_TOKEN}`,
      'Content-Type': 'application/json',
      'cf-access-client-id': env.CMS_EXPORT_ACCESS_CLIENT_ID,
      'cf-access-client-secret': env.CMS_EXPORT_ACCESS_CLIENT_SECRET,
    },
    body: JSON.stringify({
      id: env.PUBLICATION_ID,
      ciRunId: env.GITHUB_RUN_ID,
      codeSha: expected.sha,
      snapshotSha256: expected.content.snapshotSha256,
      deploymentId: deployment.id,
    }),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, 'Publication acknowledgement failed; reconcile the pending request.');
  assert.deepEqual(await response.json(), { id: env.PUBLICATION_ID, status: 'live' });
  assert.deepEqual(
    await json(`https://${name}.pages.dev/release.json`),
    expected,
    'Public publication identity differs.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const expected = JSON.parse(readFileSync('.codex-artifacts/publication-source/apps/web/dist/release.json', 'utf8'));
  await waitForDeployment(() => acknowledgeContentPublication({ env: process.env, expected }));
  console.log('Public deployment verified and publication marked live.');
}
