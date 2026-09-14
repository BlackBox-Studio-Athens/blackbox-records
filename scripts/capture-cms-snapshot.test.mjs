import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { captureCmsSnapshot } from './capture-cms-snapshot.mjs';
import { writeCmsSnapshot } from './export-cms-snapshot.mjs';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const imageBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=',
  'base64',
);
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
