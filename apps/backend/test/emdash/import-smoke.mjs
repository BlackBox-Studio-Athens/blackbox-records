import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { unstable_dev } from 'wrangler';
import { importCmsContent } from '../../../../scripts/import-cms-content.mjs';

const root = new URL('../../', import.meta.url);
const worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), {
  config: fileURLToPath(new URL('dist/server/wrangler.json', root)),
  ip: '127.0.0.1',
  port: 8799,
  local: true,
  persist: false,
  logLevel: 'error',
  experimental: { disableExperimentalWarning: true },
});
try {
  const dryRun = await importCmsContent({ base: 'http://127.0.0.1:8799' });
  assert.equal(dryRun.createdRecords, 0);
  assert.equal(dryRun.createdMedia, 0);
  const first = await importCmsContent({ base: 'http://127.0.0.1:8799', apply: true });
  assert.equal(first.createdRecords, first.records);
  const second = await importCmsContent({ base: 'http://127.0.0.1:8799', apply: true });
  assert.equal(second.createdRecords, 0);
  assert.equal(second.createdMedia, 0);
  assert.deepEqual(second.identities, first.identities);
  assert.deepEqual(second.mediaIdentities, first.mediaIdentities);
  const originalFetch = globalThis.fetch;
  const methods = [];
  globalThis.fetch = (input, options) => {
    methods.push(options?.method ?? 'GET');
    return originalFetch(input, options);
  };
  try {
    const verified = await importCmsContent({ base: 'http://127.0.0.1:8799', verifyOnly: true });
    assert.deepEqual(verified.identities, first.identities);
    assert.deepEqual(verified.mediaIdentities, first.mediaIdentities);
    assert.ok(methods.length > 0 && methods.every((method) => method === 'GET'));
  } finally {
    globalThis.fetch = originalFetch;
  }
  console.log(
    `Local import passed: ${first.records} records and ${first.media} media paths; second import preserved all identities with no duplicates.`,
  );
} finally {
  await worker.stop();
}
