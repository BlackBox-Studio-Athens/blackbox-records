import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCmsSnapshotReaders } from './cms-snapshot-readers.mjs';
import { captureCmsSnapshot } from './capture-cms-snapshot.mjs';

test('captures through fixed GET routes without forwarding unrelated credentials', async () => {
  const requests = [];
  const readers = createCmsSnapshotReaders({
    environment: 'uat',
    target: 'https://staff-uat.blackboxrecordsathens.com/',
    headers: {
      'cf-access-client-id': 'test-id',
      'cf-access-client-secret': 'test-secret',
      cookie: 'private',
      authorization: 'private',
    },
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      assert.equal(url.origin, 'https://staff-uat.blackboxrecordsathens.com');
      assert.equal(init.method, 'GET');
      assert.equal(init.redirect, 'manual');
      assert.equal(init.headers.has('cookie'), false);
      assert.equal(init.headers.has('authorization'), false);
      assert.equal(init.headers.get('cf-access-client-id'), 'test-id');
      if (url.pathname.includes('/revisions/'))
        return Response.json({
          data: {
            item: {
              id: 'live-one',
              collection: 'socials',
              entryId: 'one',
              data: { title: 'Live title', url: '#', order: 0 },
            },
          },
        });
      assert.equal(url.searchParams.get('limit'), '100');
      assert.equal(url.searchParams.has('status'), false);
      return Response.json({
        data: {
          items: url.pathname.endsWith('/socials')
            ? [
                {
                  id: 'one',
                  slug: 'record',
                  version: 1,
                  status: 'published',
                  liveRevisionId: 'live-one',
                  draftRevisionId: null,
                },
              ]
            : [],
          total: url.pathname.endsWith('/socials') ? 1 : 0,
          nextCursor: null,
        },
      });
    },
  });
  const result = await captureCmsSnapshot(readers);
  assert.equal(result.snapshot.records[0].data.title, 'Live title');
  assert.equal(requests.length, 27);
  await assert.rejects(readers.readRevision('../private'), /Invalid/);
});

test('rejects wrong targets, redirects, errors, and oversized bodies without retrying', async () => {
  for (const target of [
    'https://attacker.example/',
    'https://staff.blackboxrecordsathens.com/',
    'https://staff-uat.blackboxrecordsathens.com/?token=x',
  ])
    assert.throws(() => createCmsSnapshotReaders({ environment: 'uat', target }), /target/);
  for (const response of [
    new Response(null, { status: 302, headers: { location: 'https://attacker.example/' } }),
    new Response('secret', { status: 429 }),
    new Response('x'.repeat(4 * 1024 * 1024 + 1)),
  ]) {
    let calls = 0;
    const readers = createCmsSnapshotReaders({
      environment: 'local',
      target: 'http://127.0.0.1:8799/',
      fetchImpl: async () => {
        calls++;
        return response;
      },
    });
    await assert.rejects(readers.readPage('socials', null, 100));
    assert.equal(calls, 1);
  }
});

test('media reads use fixed routes and reject unsafe storage keys before fetching', async () => {
  const paths = [];
  const readers = createCmsSnapshotReaders({
    environment: 'local',
    target: 'http://127.0.0.1:8799/',
    fetchImpl: async (url) => {
      paths.push(url.pathname);
      return url.pathname.includes('/file/')
        ? new Response(new Uint8Array([1, 2, 3]))
        : Response.json({ data: { item: { id: 'image' } } });
    },
  });
  assert.deepEqual(await readers.readMedia('image'), { id: 'image' });
  assert.deepEqual(await readers.readMediaFile('original.png'), Buffer.from([1, 2, 3]));
  assert.deepEqual(paths, ['/_emdash/api/media/image', '/_emdash/api/media/file/original.png']);
  for (const key of [
    '../secret.png',
    '%2e%2e/secret.png',
    '//foreign/image.png',
    'http://foreign/image.png',
    'file.png?secret=x',
    'file.png#fragment',
    'file.svg',
    'folder\\file.png',
  ])
    await assert.rejects(readers.readMediaFile(key), /storage key/);
  await assert.rejects(readers.readMedia('../secret'), /media ID/);
  assert.equal(paths.length, 2);
});
