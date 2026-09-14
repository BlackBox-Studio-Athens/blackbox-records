import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { stageCmsSnapshot } from './stage-cms-snapshot.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
function input() {
  const bytes = new Uint8Array([1, 2, 3]);
  const sha256 = digest(bytes);
  const json = JSON.stringify({ environment: 'local', media: [{ sha256 }] });
  return {
    environment: 'local',
    target: 'http://127.0.0.1:8799/',
    publicationId: '5a6babfe-2034-4ab8-9bc3-f122c6ac466a',
    ciRunId: '123',
    token: 'a'.repeat(64),
    capture: { json, sha256: digest(json), files: new Map([[sha256, bytes]]) },
  };
}
test('stages each unique file before the manifest with only fixed target credentials', async () => {
  const options = input();
  const paths = [];
  const result = await stageCmsSnapshot({
    ...options,
    headers: { cookie: 'private', Authorization: 'foreign', 'cf-access-client-id': 'access-id' },
    fetchImpl: async (url, init) => {
      paths.push(url.pathname);
      assert.equal(url.origin, 'http://127.0.0.1:8799');
      assert.equal(init.method, 'PUT');
      assert.equal(init.redirect, 'manual');
      assert.equal(init.headers.get('Authorization'), `Bearer ${options.token}`);
      assert.equal(init.headers.has('cookie'), false);
      assert.equal(init.headers.get('cf-access-client-id'), 'access-id');
      assert.equal(init.headers.get('X-CI-Run-ID'), '123');
      return Response.json(
        paths.length === 1
          ? { sha256: digest(init.body) }
          : { id: options.publicationId, snapshotSha256: options.capture.sha256 },
      );
    },
  });
  assert.deepEqual(paths, ['/_emdash/api/blackbox/publications/media', '/_emdash/api/blackbox/publications/snapshot']);
  assert.equal(result.snapshotSha256, options.capture.sha256);
});
test('rejects wrong targets and inconsistent captures before any remote write', async () => {
  let calls = 0;
  for (const mutate of [
    (value) => {
      value.target = 'https://foreign.invalid';
    },
    (value) => {
      value.environment = 'uat';
    },
    (value) => {
      value.capture.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.capture.files.clear();
    },
    (value) => {
      value.capture.files.values().next().value[0] = 9;
    },
    (value) => {
      value.ciRunId = '123/other';
    },
  ]) {
    const options = input();
    mutate(options);
    await assert.rejects(
      stageCmsSnapshot({
        ...options,
        fetchImpl: async () => {
          calls++;
        },
      }),
    );
  }
  assert.equal(calls, 0);
});
test('stops on throttling, redirects, uncertain responses and corrupt acknowledgements without retries', async () => {
  for (const response of [
    () => new Response('private provider error', { status: 429 }),
    () => new Response(null, { status: 302, headers: { Location: 'https://foreign.invalid' } }),
    () => Response.json({ sha256: '0'.repeat(64) }),
    () => new Response('x'.repeat(4097)),
    () => {
      throw new Error('Network unavailable');
    },
  ]) {
    let calls = 0;
    await assert.rejects(
      stageCmsSnapshot({
        ...input(),
        fetchImpl: async () => {
          calls++;
          return response();
        },
      }),
      (error) => !error.message.includes('private provider error'),
    );
    assert.equal(calls, 1);
  }
});
