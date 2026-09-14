import assert from 'node:assert/strict';
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { captureCmsSnapshot } from './capture-cms-snapshot.mjs';
import { createCmsSnapshotReaders, cmsSnapshotTarget } from './cms-snapshot-readers.mjs';
import { stageCmsSnapshot } from './stage-cms-snapshot.mjs';
import { writeCmsSnapshot } from './export-cms-snapshot.mjs';

export async function prepareContentPublication(input, fetchImpl = fetch) {
  const config = z
    .object({
      environment: z.enum(['local', 'uat', 'prd']),
      target: z.string(),
      publicationId: z.uuid(),
      dispatchToken: z.uuid(),
      ciRunId: z.string().regex(/^[1-9][0-9]{0,19}$/),
      codeSha: z.string().regex(/^[a-f0-9]{40}$/),
      token: z.string().regex(/^[a-f0-9]{64}$/),
      exportToken: z.string().regex(/^ec_pat_[A-Za-z0-9_-]{32,128}$/),
      maxRequests: z.number().int().min(1).max(1000),
      directory: z.string().min(1),
      accessClientId: z.string(),
      accessClientSecret: z.string(),
    })
    .parse(input);
  const origin = cmsSnapshotTarget(config.environment, config.target);
  assert.ok(!existsSync(config.directory), 'Publication output must be a new directory.');
  if (config.environment !== 'local')
    assert.ok(config.accessClientId && config.accessClientSecret, 'Hosted publication requires Access credentials.');
  const headers = {
    'cf-access-client-id': config.accessClientId,
    'cf-access-client-secret': config.accessClientSecret,
  };
  const response = await fetchImpl(new URL('/_emdash/api/blackbox/publications/run', origin), {
    method: 'POST',
    headers: { ...headers, Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: config.publicationId,
      dispatchToken: config.dispatchToken,
      ciRunId: config.ciRunId,
      codeSha: config.codeSha,
    }),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  await response.body?.cancel();
  assert.equal(response.status, 200, 'Publication claim failed; no content export was attempted.');
  const capture = await captureCmsSnapshot({
    ...createCmsSnapshotReaders({
      environment: config.environment,
      target: config.target,
      token: config.exportToken,
      headers,
      fetchImpl,
    }),
    maxRequests: config.maxRequests,
  });
  const output = await writeCmsSnapshot(capture, config.directory, config.environment);
  await stageCmsSnapshot({ ...config, capture, headers, fetchImpl });
  return { ...output, requests: capture.requests };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const env = process.env;
  const resources = JSON.parse(readFileSync(new URL('../apps/backend/cms-resources.json', import.meta.url), 'utf8'));
  const code = JSON.parse(readFileSync('.codex-artifacts/publication-code.json', 'utf8'));
  const result = await prepareContentPublication({
    environment: env.PUBLICATION_TARGET,
    target: `https://${resources[env.PUBLICATION_TARGET]?.hostname}/`,
    publicationId: env.PUBLICATION_ID,
    dispatchToken: env.PUBLICATION_DISPATCH_TOKEN,
    ciRunId: env.GITHUB_RUN_ID,
    codeSha: code.sha,
    token: env.CMS_PUBLICATION_EXPORT_TOKEN,
    exportToken: env.CMS_EXPORT_TOKEN,
    maxRequests: Number(env.CMS_PUBLICATION_MAX_REQUESTS),
    directory: '.codex-artifacts/publication-snapshot',
    accessClientId: env.CMS_EXPORT_ACCESS_CLIENT_ID,
    accessClientSecret: env.CMS_EXPORT_ACCESS_CLIENT_SECRET,
  });
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `sha256=${result.sha256}\n`);
  console.log(`Captured and staged ${result.requests} bounded CMS reads.`);
}
