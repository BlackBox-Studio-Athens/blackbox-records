import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseContentSnapshot } from '@blackbox/content-model';
import { cmsSnapshotTarget } from './cms-snapshot-readers.mjs';
import { writeCmsSnapshot } from './export-cms-snapshot.mjs';

export async function restorePublishedContent(
  { environment, target, directory, token, accessClientId, accessClientSecret, maxRequests },
  send = fetch,
) {
  assert.ok(['uat', 'prd'].includes(environment));
  const origin = cmsSnapshotTarget(environment, target);
  assert.ok(!existsSync(directory), 'Restore destination must be new.');
  const name = environment === 'uat' ? 'blackbox-records-web-uat' : 'blackbox-records-web';
  async function bytes(url, limit, headers = {}) {
    const response = await send(url, {
      headers,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Published content read failed (${response.status}).`);
    }
    assert.ok(response.body, 'Missing published content response.');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        assert.ok(size <= limit, 'Published content exceeds byte budget.');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
    return Buffer.concat(chunks);
  }
  const current = JSON.parse((await bytes(`https://${name}.pages.dev/release.json`, 4096)).toString('utf8'));
  assert.match(current.sha ?? '', /^[a-f0-9]{40}$/);
  const content = current.content;
  // Pre-cutover releases still use the existing repository source. A published snapshot never falls back.
  if (content === undefined) {
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'identity.json'), 'null', { flag: 'wx' });
    return { source: 'files' };
  }
  assert.match(
    content.publicationId ?? '',
    /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
  );
  assert.match(content.ciRunId ?? '', /^(?:[1-9][0-9]{0,19}|runtime)$/);
  assert.match(content.snapshotSha256 ?? '', /^[a-f0-9]{64}$/);
  assert.match(token ?? '', /^[a-f0-9]{64}$/);
  assert.ok(accessClientId && accessClientSecret, 'Snapshot restore requires target Access credentials.');
  assert.ok(
    Number.isSafeInteger(maxRequests) && maxRequests > 0 && maxRequests <= 1000,
    'Explicit restore budget required.',
  );
  const headers = {
    Authorization: `Bearer ${token}`,
    'cf-access-client-id': accessClientId,
    'cf-access-client-secret': accessClientSecret,
    'X-Publication-ID': content.publicationId,
    'X-CI-Run-ID': content.ciRunId,
  };
  const json = (
    await bytes(new URL('/_emdash/api/blackbox/publications/snapshot', origin), 4 * 1024 * 1024, headers)
  ).toString('utf8');
  assert.equal(createHash('sha256').update(json).digest('hex'), content.snapshotSha256);
  const snapshot = parseContentSnapshot(json, environment);
  const media = new Map(snapshot.media.map((item) => [item.sha256, item]));
  assert.ok(media.size + 1 <= maxRequests, 'Published snapshot exceeds restore request budget.');
  assert.ok(
    [...media.values()].reduce((total, item) => total + item.size, 0) <= 256 * 1024 * 1024,
    'Snapshot media budget exceeded.',
  );
  const files = new Map();
  for (const [sha256, item] of media) {
    const body = await bytes(new URL('/_emdash/api/blackbox/publications/media', origin), item.size, {
      ...headers,
      'X-Snapshot-Media-SHA256': sha256,
    });
    assert.equal(createHash('sha256').update(body).digest('hex'), sha256);
    files.set(sha256, body);
  }
  await mkdir(resolve(directory, '..'), { recursive: true });
  await writeCmsSnapshot({ json, sha256: content.snapshotSha256, files }, directory, environment);
  await writeFile(resolve(directory, 'identity.json'), JSON.stringify(content), { flag: 'wx' });
  return { source: 'snapshot', sha256: content.snapshotSha256 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const env = process.env;
  const environment = process.argv[2];
  const resources = JSON.parse(readFileSync(new URL('../apps/backend/cms-resources.json', import.meta.url), 'utf8'));
  const result = await restorePublishedContent({
    environment,
    target: `https://${resources[environment]?.hostname}/`,
    directory: `.codex-artifacts/release-content/${environment}`,
    token: env.CMS_PUBLICATION_EXPORT_TOKEN,
    accessClientId: env.CMS_EXPORT_ACCESS_CLIENT_ID,
    accessClientSecret: env.CMS_EXPORT_ACCESS_CLIENT_SECRET,
    maxRequests: Number(env.CMS_PUBLICATION_MAX_REQUESTS),
  });
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `source=${result.source}\nsha256=${result.sha256 ?? ''}\n`);
  console.log(`Selected ${environment} published content: ${result.source}.`);
}
