import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { captureCmsSnapshot } from './capture-cms-snapshot.mjs';
import { writeCmsSnapshot } from './export-cms-snapshot.mjs';
import { prepareContentPublication } from './prepare-content-publication.mjs';
import { acknowledgeContentPublication } from './acknowledge-content-publication.mjs';
import { restorePublishedContent } from './restore-published-content.mjs';
import { mkdtemp, mkdir, readFile, rm, access, writeFile } from 'node:fs/promises';
import { activateLocalBuild } from '../apps/web/scripts/start-local-publication.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const imageBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=',
  'base64',
);

test('omits legacy catalog identities that have no published CMS source', async () => {
  const capture = await captureCmsSnapshot({
    ...readers(),
    readStoreItems: async () => [
      {
        sourceKind: 'distro',
        sourceId: '___',
        storeItemSlug: 'local-invalid-fixture',
        variantId: 'variant_____standard',
      },
    ],
  });
  assert.deepEqual(capture.snapshot.storeItems, []);
});

test('activates a prepared Local build and restores the served build when replacement fails', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'blackbox-publication-'));
  try {
    for (const name of ['public', 'next']) {
      await mkdir(join(directory, name));
      await writeFile(join(directory, name, 'index.html'), name);
    }
    await activateLocalBuild(directory);
    assert.equal(await readFile(join(directory, 'public/index.html'), 'utf8'), 'next');
    assert.equal(await readFile(join(directory, 'previous/index.html'), 'utf8'), 'public');
    await assert.rejects(activateLocalBuild(directory));
    assert.equal(await readFile(join(directory, 'public/index.html'), 'utf8'), 'next');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('publication acknowledges only matching canonical deployment and public content without forwarding credentials', async () => {
  const env = {
    PUBLICATION_TARGET: 'prd',
    CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
    CLOUDFLARE_API_TOKEN: 'provider-secret',
    CMS_PUBLICATION_EXPORT_TOKEN: 'b'.repeat(64),
    PUBLICATION_ID: '12345678-1234-4234-8234-123456789012',
    GITHUB_RUN_ID: '123',
    CMS_EXPORT_ACCESS_CLIENT_ID: 'access-id',
    CMS_EXPORT_ACCESS_CLIENT_SECRET: 'access-secret',
  };
  const expected = {
    sha: 'c'.repeat(40),
    runId: '100',
    runNumber: 1,
    content: { publicationId: env.PUBLICATION_ID, ciRunId: '123', snapshotSha256: 'd'.repeat(64) },
  };
  let calls = 0;
  let wrongContent = false;
  const send = async (url, init) => {
    calls++;
    const target = new URL(url);
    if (target.hostname === 'api.cloudflare.com')
      return Response.json({
        success: true,
        result: {
          name: 'blackbox-records-web',
          canonical_deployment: {
            id: env.PUBLICATION_ID,
            url: 'https://abc123.blackbox-records-web.pages.dev',
            environment: 'production',
            latest_stage: { name: 'deploy', status: 'success' },
            deployment_trigger: { metadata: { commit_hash: expected.sha } },
          },
        },
      });
    if (
      target.hostname === 'blackbox-records-web.pages.dev' ||
      target.hostname === 'abc123.blackbox-records-web.pages.dev'
    ) {
      assert.deepEqual(init.headers, {});
      return Response.json(wrongContent ? { ...expected, content: {} } : expected);
    }
    assert.equal(target.hostname, 'staff.blackboxrecordsathens.com');
    assert.equal(JSON.parse(init.body).deploymentId, env.PUBLICATION_ID);
    assert.equal(init.headers.Authorization, `Bearer ${env.CMS_PUBLICATION_EXPORT_TOKEN}`);
    return Response.json({ id: env.PUBLICATION_ID, status: 'live' });
  };
  await acknowledgeContentPublication({ env, expected }, send);
  assert.equal(calls, 4);
  calls = 0;
  wrongContent = true;
  await assert.rejects(acknowledgeContentPublication({ env, expected }, send), /Deployment content identity differs/);
  assert.equal(calls, 2);
});

test('publication preparation claims before bounded export and stops immediately on a rejected claim', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'publication-prepare-'));
  const input = {
    environment: 'local',
    target: 'http://127.0.0.1:8799/',
    directory: join(parent, 'snapshot'),
    publicationId: '12345678-1234-4234-8234-123456789012',
    dispatchToken: '12345678-1234-4234-8234-123456789013',
    ciRunId: '123',
    codeSha: 'a'.repeat(40),
    token: 'b'.repeat(64),
    exportToken: 'ec_pat_' + 'c'.repeat(43),
    maxRequests: 30,
    accessClientId: '',
    accessClientSecret: '',
  };
  try {
    let calls = 0;
    await assert.rejects(
      prepareContentPublication(input, async () => {
        calls++;
        return new Response('', { status: 409 });
      }),
      /claim failed/,
    );
    assert.equal(calls, 1);
    calls = 0;
    const result = await prepareContentPublication(input, async (url, init) => {
      calls++;
      if (calls === 1) {
        assert.ok(url.pathname.endsWith('/run'));
        assert.equal(JSON.parse(init.body).codeSha, input.codeSha);
        return Response.json({ id: input.publicationId, status: 'pending' });
      }
      if (init.method === 'GET') {
        if (url.pathname.endsWith('/catalog')) {
          assert.equal(init.headers.get('Authorization'), null);
          return Response.json({ data: [] });
        }
        assert.equal(init.headers.get('Authorization'), `Bearer ${input.exportToken}`);
        return Response.json({ data: { items: [], total: 0, nextCursor: null } });
      }
      assert.ok(url.pathname.endsWith('/snapshot'));
      assert.equal(init.headers.get('Authorization'), `Bearer ${input.token}`);
      return Response.json({
        id: input.publicationId,
        snapshotSha256: createHash('sha256').update(init.body).digest('hex'),
      });
    });
    assert.equal(result.requests, 28);
    assert.equal(calls, 30);
    assert.equal(JSON.parse(await readFile(result.path, 'utf8')).environment, 'local');
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
const imageMetadata = {
  id: 'image',
  filename: 'image.png',
  mimeType: 'image/png',
  size: imageBytes.length,
  width: 1,
  height: 1,
  storageKey: 'original.png',
  status: 'ready',
  contentHash: `sha1:${createHash('sha1').update(imageBytes).digest('hex')}`,
};

test('restores the pinned public snapshot without reading editable CMS content or forwarding public credentials', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'published-restore-'));
  const sha256 = createHash('sha256').update(imageBytes).digest('hex');
  const json = JSON.stringify({
    schemaVersion: 1,
    environment: 'uat',
    records: [
      {
        collection: 'news',
        id: 'one',
        slug: 'news',
        revisionId: 'live-one',
        data: { title: 'Published', date: '2026-09-14', summary: 'Copy', image: { id: 'image' }, image_alt: 'Cover' },
      },
    ],
    media: [
      {
        id: 'image',
        filename: 'cover.png',
        mimeType: 'image/png',
        size: imageBytes.length,
        width: 1,
        height: 1,
        sha256,
      },
    ],
  });
  const content = {
    publicationId: '12345678-1234-4234-8234-123456789012',
    ciRunId: '123',
    snapshotSha256: createHash('sha256').update(json).digest('hex'),
  };
  const input = {
    environment: 'uat',
    target: 'https://staff-uat.blackboxrecordsathens.com/',
    directory: join(parent, 'snapshot'),
    token: 'a'.repeat(64),
    accessClientId: 'id',
    accessClientSecret: 'secret',
    maxRequests: 2,
  };
  let calls = 0;
  const send = async (url, init) => {
    calls++;
    const address = new URL(url);
    if (address.hostname === 'blackbox-records-web-uat.pages.dev') {
      assert.deepEqual(init.headers, {});
      return Response.json({ sha: 'b'.repeat(40), content });
    }
    assert.equal(address.hostname, 'staff-uat.blackboxrecordsathens.com');
    assert.equal(init.headers['X-Publication-ID'], content.publicationId);
    assert.equal(init.headers.Authorization, `Bearer ${input.token}`);
    assert.ok(!address.pathname.includes('/content/'));
    return new Response(address.pathname.endsWith('/snapshot') ? json : imageBytes);
  };
  try {
    assert.deepEqual(await restorePublishedContent(input, send), {
      source: 'snapshot',
      sha256: content.snapshotSha256,
    });
    assert.equal(calls, 3);
    assert.equal(await readFile(join(input.directory, 'snapshot.json'), 'utf8'), json);
    calls = 0;
    await assert.rejects(
      restorePublishedContent({ ...input, directory: join(parent, 'limited'), maxRequests: 1 }, send),
      /request budget/,
    );
    assert.equal(calls, 2);
    await assert.rejects(access(join(parent, 'limited')));
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
const mediaReaders = { readMedia: async () => imageMetadata, readMediaFile: async () => imageBytes };

const published = {
  id: 'one',
  slug: 'record',
  status: 'published',
  version: 3,
  liveRevisionId: 'live-one',
  draftRevisionId: 'draft-two',
  data: { title: 'Unpublished secret', image: { id: 'private-draft-image' } },
};
const revision = {
  id: 'live-one',
  collection: 'socials',
  entryId: 'one',
  data: { title: 'Published title', url: '#', order: 0, _slug: 'record' },
};
function readers(change = () => {}) {
  let scans = 0;
  return {
    environment: 'uat',
    readPage: async (collection) => {
      if (collection !== 'socials') return { items: [], total: 0, nextCursor: null };
      const item = structuredClone(published);
      if (++scans === 2) change(item);
      return {
        items: [item, { ...published, id: 'draft-only', slug: 'draft-only', status: 'draft', liveRevisionId: null }],
        total: 2,
        nextCursor: null,
      };
    },
    readRevision: async (id) => {
      assert.equal(id, 'live-one');
      return revision;
    },
  };
}
test('normalizes only native navigation boolean columns before validating published content', async () => {
  const original = readers();
  const input = {
    ...original,
    readPage: (collection) => (collection === 'navigation' ? original.readPage('socials') : { items: [], total: 0 }),
    readRevision: async () => ({
      ...revision,
      collection: 'navigation',
      data: { title: 'Home', url: '/', order: 0, show_in_header: 1, show_in_footer: 0 },
    }),
  };
  const result = await captureCmsSnapshot(input);
  assert.equal(result.snapshot.records[0].data.show_in_header, true);
  assert.equal(result.snapshot.records[0].data.show_in_footer, false);
  const record = await input.readRevision();
  await assert.rejects(
    captureCmsSnapshot({
      ...input,
      readRevision: async () => ({ ...record, data: { ...record.data, show_in_header: 2 } }),
    }),
    /Invalid published CMS content/,
  );
});

test('captures only pinned live data with a deterministic digest, omitting draft data and pointers', async () => {
  const first = await captureCmsSnapshot(readers());
  assert.equal(first.snapshot.records.length, 1);
  assert.equal(first.snapshot.records[0].data.title, 'Published title');
  assert.equal(first.json.includes('secret'), false);
  assert.equal(first.json.includes('draft-two'), false);
  assert.equal(first.sha256, (await captureCmsSnapshot(readers())).sha256);
  assert.equal(first.requests, 27);
});

test('exports captured bytes into a fresh build directory and rejects invalid input before writes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'blackbox-snapshot-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const capture = await captureCmsSnapshot(readers());
  const output = join(root, 'capture');
  const input = await writeCmsSnapshot(capture, output, 'uat');
  assert.equal(await readFile(input.path, 'utf8'), capture.json);
  assert.equal(input.sha256, capture.sha256);
  const repeated = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      fileURLToPath(new URL('./export-cms-snapshot.mjs', import.meta.url)),
      '--env',
      'local',
      '--target',
      'http://127.0.0.1:8799/',
      '--out',
      output,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(repeated.status, 1);
  assert.match(repeated.stderr, /no CMS reads were made/);
  await assert.rejects(writeCmsSnapshot(capture, output, 'uat'), { code: 'EEXIST' });
  for (const invalid of [
    { ...capture, sha256: '0'.repeat(64) },
    { ...capture, files: new Map([['extra', imageBytes]]) },
  ]) {
    await assert.rejects(writeCmsSnapshot(invalid, join(root, 'invalid'), 'uat'));
    await assert.rejects(access(join(root, 'invalid')), { code: 'ENOENT' });
  }
  await assert.rejects(writeCmsSnapshot(capture, join(root, 'wrong-target'), 'prd'));
});
test('rejects edits, revision mismatches, incomplete pages, and exhausted budgets without returning a snapshot', async () => {
  await assert.rejects(captureCmsSnapshot(readers((item) => item.version++)), /changed/);
  await assert.rejects(
    captureCmsSnapshot({ ...readers(), readRevision: async () => ({ ...revision, entryId: 'other' }) }),
    /identity/,
  );
  await assert.rejects(captureCmsSnapshot({ ...readers(), maxRequests: 1 }), /budget/);
  await assert.rejects(
    captureCmsSnapshot({ ...readers(), readPage: async () => ({ items: [], total: 1, nextCursor: null }) }),
    /Incomplete/,
  );
});

test('rejects deletion between scans and repeated pagination cursors', async () => {
  const original = readers();
  let scans = 0;
  await assert.rejects(
    captureCmsSnapshot({
      ...original,
      readPage: async (...args) => {
        if (args[0] === 'socials' && ++scans === 2) return { items: [], total: 0, nextCursor: null };
        return original.readPage(...args);
      },
    }),
    /changed/,
  );
  let page = 0;
  await assert.rejects(
    captureCmsSnapshot({
      ...readers(),
      readPage: async () => ({ items: [{ ...published, id: `page-${++page}` }], total: 100, nextCursor: 'repeated' }),
    }),
    /pagination/,
  );
});

test('requires the pinned Release reference to resolve to a published Artist and rejects duplicate published slugs', async () => {
  const records = [
    {
      collection: 'artists',
      id: 'artist',
      slug: 'artist',
      data: {
        title: 'Artist',
        genre: 'Rock',
        image: { id: 'image' },
        image_alt: 'Artist portrait',
        bio: 'Biography',
      },
    },
    {
      collection: 'releases',
      id: 'release',
      slug: 'release',
      data: {
        title: 'Release',
        artist: 'artist',
        release_date: '2026-09-14',
        cover_image: { id: 'image' },
        cover_image_alt: 'Cover',
      },
    },
  ];
  let artistStatus = 'published';
  const input = {
    environment: 'local',
    ...mediaReaders,
    readPage: async (collection) => {
      const items = records
        .filter((record) => record.collection === collection)
        .map((record) => ({
          ...published,
          ...record,
          status: record.collection === 'artists' ? artistStatus : 'published',
          liveRevisionId: `live-${record.id}`,
          // Current editable data is deliberately different from the pinned revision.
          data: { artist: 'draft-artist' },
        }));
      return { items, total: items.length };
    },
    readRevision: async (id) => {
      const record = records.find((record) => `live-${record.id}` === id);
      return { id, collection: record.collection, entryId: record.id, data: record.data };
    },
  };
  assert.equal((await captureCmsSnapshot(input)).snapshot.records.length, 2);
  for (const status of ['draft', 'scheduled', 'archived']) {
    artistStatus = status;
    await assert.rejects(captureCmsSnapshot(input), /published Artist/);
  }
  artistStatus = 'published';
  records[1].data.artist = 'missing';
  await assert.rejects(captureCmsSnapshot(input), /published Artist/);
  records[1].data.artist = 'artist';
  records.push({ ...records[1], id: 'another-release' });
  await assert.rejects(captureCmsSnapshot(input), /Duplicate published CMS slug/);
});

test('captures referenced image bytes once and rejects missing, corrupt, oversized, or mismatched media', async () => {
  const bytes = imageBytes;
  const metadata = imageMetadata;
  let downloads = 0;
  const original = readers();
  const input = {
    ...original,
    readPage: async (collection) => (collection === 'news' ? original.readPage('socials') : { items: [], total: 0 }),
    readRevision: async () => ({
      ...revision,
      collection: 'news',
      data: {
        title: 'News',
        date: '2026-09-14',
        summary: 'Copy',
        image_alt: 'Image',
        image: { id: 'image', provider: 'local', width: 1, height: 1 },
        body: [{ _type: 'image', _key: 'image-block', asset: { _ref: 'image' }, alt: 'Body image' }],
      },
    }),
    readMedia: async (id) => {
      assert.equal(id, 'image');
      return metadata;
    },
    readMediaFile: async (key) => {
      assert.equal(key, 'original.png');
      downloads++;
      return bytes;
    },
  };
  const result = await captureCmsSnapshot(input);
  assert.equal(downloads, 1);
  assert.equal(result.requests, 29);
  assert.equal(result.snapshot.media.length, 1);
  assert.deepEqual(result.files.get(result.snapshot.media[0].sha256), bytes);
  assert.equal(result.json.includes('storageKey'), false);
  for (const patch of [
    { id: 'foreign' },
    { width: 2 },
    { size: bytes.length + 1 },
    { status: 'pending' },
    { contentHash: 'sha1:' + '0'.repeat(40) },
    { mimeType: 'image/svg+xml' },
  ])
    await assert.rejects(captureCmsSnapshot({ ...input, readMedia: async () => ({ ...metadata, ...patch }) }));
  await assert.rejects(captureCmsSnapshot({ ...input, readMedia: async () => null }));
  await assert.rejects(
    captureCmsSnapshot({ ...input, readMediaFile: async () => bytes.subarray(0, 10) }),
    /bytes differ/,
  );
  downloads = 0;
  await assert.rejects(captureCmsSnapshot({ ...input, maxMediaBytes: 1 }), /byte budget/);
  assert.equal(downloads, 0, 'Budget rejection must precede the media download');
  const live = await input.readRevision();
  for (const patch of [
    { date: '2026-02-30' },
    { image_alt: null },
    { stripe_price_id: 'private' },
    { image: { id: 'image', provider: 'external', src: 'https://foreign.invalid/image.png' } },
    { image: { id: 'image', provider: 'local', secret: true } },
    { image: { id: 'image', provider: 'local', width: 'invalid' } },
    { image: { id: 'image', provider: 'local', meta: false } },
    { image: { id: 'image', provider: 'local', meta: { secret: true } } },
    { body: [{ _type: 'htmlBlock', html: '<script>unsafe</script>' }] },
  ])
    await assert.rejects(
      captureCmsSnapshot({ ...input, readRevision: async () => ({ ...live, data: { ...live.data, ...patch } }) }),
      /Invalid published CMS content/,
    );
  assert.equal(downloads, 0, 'Invalid content must fail before downloading its media');
  let changed = false;
  const changing = readers((item) => {
    if (changed) item.version++;
  });
  await assert.rejects(
    captureCmsSnapshot({
      ...input,
      readPage: async (collection) => (collection === 'news' ? changing.readPage('socials') : { items: [], total: 0 }),
      readMediaFile: async () => {
        changed = true;
        return bytes;
      },
    }),
    /inventory changed/,
  );
});
