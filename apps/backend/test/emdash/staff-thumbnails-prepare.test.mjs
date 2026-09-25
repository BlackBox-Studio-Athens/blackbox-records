import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import sharp from 'sharp';
import {
  maxOriginalBytes,
  auditStaffMediaReferences,
  parsePreparationArgs,
  prepareStaffThumbnailPage,
  createPreparationConfig,
} from '../../scripts/prepare-staff-thumbnails.mjs';
import { staffThumbnailStorageKey } from '../../src/cms/staff-thumbnails.ts';

async function image({ width = 240, height = 120, format = 'jpeg', orientation } = {}) {
  let source = sharp({
    create: { width, height, channels: 3, background: { r: 32, g: 96, b: 160 } },
  });
  if (orientation) source = source.withMetadata({ orientation });
  const bytes = await source[format]().toBuffer();
  return new Uint8Array(bytes);
}

function makeObject(key, bytes, { etag = `etag-${key}`, size = bytes.byteLength, ...metadata } = {}) {
  return { key, bytes, etag, size, ...metadata };
}

function bucket({ objects, files = [], getEtags = {}, truncated = false, nextCursor = null }) {
  const stored = new Map(files.map((file) => [file.key, file]));
  const calls = { list: [], head: [], get: [], put: [] };
  return {
    stored,
    calls,
    getEtags,
    async list(options) {
      calls.list.push(options);
      return { objects, truncated, cursor: nextCursor };
    },
    async head(key) {
      calls.head.push(key);
      const file = stored.get(key);
      return (
        file && {
          size: file.bytes.byteLength,
          etag: file.etag,
          httpMetadata: file.httpMetadata,
          customMetadata: file.customMetadata,
        }
      );
    },
    async get(key) {
      calls.get.push(key);
      const file = stored.get(key);
      return (
        file && {
          etag: getEtags[key] ?? file.etag,
          arrayBuffer: async () =>
            file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength),
        }
      );
    },
    async put(key, bytes, options) {
      calls.put.push({ key, options });
      const data = new Uint8Array(bytes);
      stored.set(
        key,
        makeObject(key, data, { httpMetadata: options.httpMetadata, customMetadata: options.customMetadata }),
      );
    },
  };
}

test('parses bounded local arguments and creates an R2-only config', () => {
  assert.deepEqual(parsePreparationArgs(['--env', 'local']), {
    environment: 'local',
    limit: 25,
    cursor: undefined,
    startAfter: undefined,
    sourceKey: undefined,
    auditMedia: false,
    hashOriginals: false,
    mediaLimit: 25,
    mediaAfter: undefined,
    maxBytes: 64 * 1024 * 1024,
    apply: false,
    hostedBudgetReviewed: false,
  });
  assert.deepEqual(parsePreparationArgs(['--help']), { help: true });
  assert.throws(() => parsePreparationArgs(['--env', 'uat']), /hosted preparation/);
  assert.throws(
    () => parsePreparationArgs(['--env', 'local', '--source-key', '../cover.jpg']),
    /native image object key/,
  );
  assert.throws(() => parsePreparationArgs(['--env', 'local', '--source-key', '']), /native image object key/);
  assert.throws(
    () => parsePreparationArgs(['--env', 'local', '--source-key', 'cover.jpg', '--cursor', 'page-2']),
    /cannot be combined/,
  );
  assert.throws(() => parsePreparationArgs(['--env', 'local', '--dry-run']), /Unknown option/);
  assert.throws(() => parsePreparationArgs(['--env', 'local', '--hash-originals']), /requires --audit-media/);
  assert.equal(
    parsePreparationArgs(['--env', 'local', '--source-key', 'café cover (live).png']).sourceKey,
    'café cover (live).png',
  );
  assert.throws(
    () => parsePreparationArgs(['--env', 'local', '--cursor', 'opaque', '--start-after', 'cover.jpg']),
    /cannot be combined/,
  );

  const config = createPreparationConfig({ environment: 'uat', bucketName: 'cms-media-uat', remote: true });
  assert.deepEqual(config.r2_buckets, [{ binding: 'MEDIA', bucket_name: 'cms-media-uat', remote: true }]);
  assert.equal(config.d1_databases, undefined);
  assert.deepEqual(
    createPreparationConfig({
      environment: 'local',
      bucketName: 'cms-media-local',
      remote: false,
      database: { name: 'cms-local', id: 'local-db' },
    }).d1_databases,
    [{ binding: 'CMS_DB', database_name: 'cms-local', database_id: 'local-db', remote: false }],
  );
});

test('prepares bounded PNGs, skips non-source objects, and keeps dry runs write-free', async () => {
  const source = makeObject('cover.jpg', await image({ orientation: 6 }));
  const existingSource = makeObject('already.png', await image({ width: 32, height: 24 }));
  const existingDerivative = makeObject(
    staffThumbnailStorageKey(existingSource.key),
    await image({ width: 32, height: 24, format: 'png' }),
    {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { version: '1', width: '32', height: '24' },
    },
  );
  const notes = makeObject('notes.txt', new Uint8Array([1]));
  const published = makeObject('published/old.jpg', source.bytes);
  const snapshot = makeObject('snapshots/old.jpg', source.bytes);
  const fixture = bucket({
    objects: [source, existingSource, notes, published, snapshot].map(({ key, size, etag }) => ({ key, size, etag })),
    files: [source, existingSource, existingDerivative, notes, published, snapshot],
  });

  const dryRun = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local' });
  assert.equal(dryRun.counts.listed, 5);
  assert.equal(dryRun.counts.skipped, 3);
  assert.equal(dryRun.counts.validExisting, 1);
  assert.equal(dryRun.counts.missingThumbnails, 1);
  assert.equal(dryRun.counts.prepared, 1);
  assert.equal(dryRun.counts.written, 0);
  assert.equal(dryRun.r2.put, 0);
  assert.deepEqual(dryRun.keys.missingThumbnails, [source.key]);
  assert.equal(fixture.calls.put.length, 0);
  assert.equal(dryRun.nextCursor, null);
  assert.equal(fixture.calls.list[0].limit, 25);
  assert.deepEqual(fixture.calls.list[0].include, ['httpMetadata', 'customMetadata']);

  const applied = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local', apply: true });
  const derivativeKey = staffThumbnailStorageKey(source.key);
  assert.equal(applied.counts.written, 1);
  assert.deepEqual(fixture.stored.get(source.key).bytes, source.bytes);
  assert.equal(applied.r2.put, 1);
  assert.ok(fixture.stored.has(derivativeKey));
  assert.equal(fixture.stored.get(derivativeKey).httpMetadata.contentType, 'image/png');
  const outputMetadata = await sharp(fixture.stored.get(derivativeKey).bytes).metadata();
  assert.ok(outputMetadata.width <= 96 && outputMetadata.height <= 96);
  assert.ok(!outputMetadata.orientation || outputMetadata.orientation === 1);

  const replay = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local', apply: true });
  assert.equal(replay.counts.validExisting, 2);
  assert.equal(replay.counts.written, 0);
});

test('prepares only an explicitly selected source key', async () => {
  const target = makeObject('focus.jpg', await image({ width: 1440, height: 1440 }));
  const sibling = makeObject('focus.jpg.backup', await image());
  const unrelated = makeObject('other.jpg', await image());
  const fixture = bucket({ objects: [sibling, unrelated, target], files: [target, sibling, unrelated] });
  const derivativeKey = staffThumbnailStorageKey(target.key);

  const dryRun = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local', sourceKey: target.key });
  assert.deepEqual(fixture.calls.list[0], {
    limit: 1,
    prefix: target.key,
    include: ['httpMetadata', 'customMetadata'],
  });
  assert.equal(dryRun.counts.listed, 1);
  assert.equal(dryRun.counts.prepared, 1);
  assert.equal(dryRun.counts.written, 0);
  assert.deepEqual(fixture.calls.head, [derivativeKey]);
  assert.deepEqual(fixture.calls.get, [target.key]);
  assert.equal(fixture.calls.put.length, 0);

  const applied = await prepareStaffThumbnailPage({
    bucket: fixture,
    environment: 'local',
    sourceKey: target.key,
    apply: true,
  });
  assert.equal(applied.counts.written, 1);
  assert.deepEqual(
    fixture.calls.put.map(({ key }) => key),
    [derivativeKey],
  );
  assert.equal(fixture.stored.has(staffThumbnailStorageKey(sibling.key)), false);
  assert.equal(fixture.stored.has(staffThumbnailStorageKey(unrelated.key)), false);
});

test('reports absent and unsupported media keys separately', async () => {
  const unsupported = makeObject('folder/cover.webp', await image());
  const nonImage = makeObject('notes.txt', new Uint8Array([1]));
  const fixture = bucket({ objects: [unsupported, nonImage], files: [unsupported, nonImage] });
  const report = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local' });
  assert.equal(report.counts.unsupportedKeys, 1);
  assert.equal(report.counts.nonImages, 1);
  assert.deepEqual(report.keys.unsupported, [unsupported.key]);

  const missing = await prepareStaffThumbnailPage({
    bucket: bucket({ objects: [], files: [] }),
    environment: 'local',
    sourceKey: 'missing.png',
  });
  assert.equal(missing.counts.missingOriginals, 1);
  assert.deepEqual(missing.keys.missingOriginals, ['missing.png']);
});

test('replaces a corrupt derivative without changing its Unicode source key or bytes', async () => {
  const source = makeObject('café cover (live).jpg', await image());
  const broken = makeObject(staffThumbnailStorageKey(source.key), new Uint8Array([1, 2, 3]), {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: { version: '1', width: '96', height: '48' },
  });
  const fixture = bucket({
    objects: [{ key: source.key, size: source.size, etag: source.etag }],
    files: [source, broken],
  });
  const report = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local', apply: true });
  assert.equal(report.counts.invalidThumbnails, 1);
  assert.deepEqual(report.keys.invalidThumbnails, [source.key]);
  assert.equal(report.counts.written, 1);
  assert.deepEqual(fixture.stored.get(source.key).bytes, source.bytes);
  assert.deepEqual(
    fixture.calls.put.map(({ key }) => key),
    [staffThumbnailStorageKey(source.key)],
  );
});

test('resumes R2 listing by key and stops if a start-after page repeats', async () => {
  const first = makeObject('first.jpg', await image());
  const next = makeObject('next.jpg', await image());
  const fixture = bucket({
    objects: [next].map(({ key, size, etag }) => ({ key, size, etag })),
    files: [next],
    truncated: true,
    nextCursor: 'opaque-cursor',
  });
  const page = await prepareStaffThumbnailPage({ bucket: fixture, environment: 'local', startAfter: first.key });
  assert.equal(fixture.calls.list[0].startAfter, first.key);
  assert.equal(page.nextCursor, null);
  assert.equal(page.nextStartAfter, next.key);

  const repeated = bucket({
    objects: [{ key: first.key, size: first.size, etag: first.etag }],
    files: [first],
    truncated: true,
    nextCursor: 'repeating-cursor',
  });
  const stalled = await prepareStaffThumbnailPage({ bucket: repeated, environment: 'local', startAfter: next.key });
  assert.equal(stalled.stopped, 'pagination-stalled');
  assert.equal(stalled.r2.head, 0);
  assert.equal(stalled.r2.get, 0);
  assert.equal(stalled.r2.put, 0);
});

test('audits image references against originals and private derivatives', async () => {
  const missingOriginal = { id: 'a', filename: 'missing.jpg', storageKey: 'missing.jpg' };
  const unsupported = { id: 'b', filename: 'folder.webp', storageKey: 'folder/folder.webp' };
  const missingThumbnail = makeObject('missing-thumbnail.jpg', await image());
  const invalidSource = makeObject('invalid.png', await image({ format: 'png' }));
  const invalidDerivative = makeObject(staffThumbnailStorageKey(invalidSource.key), new Uint8Array([1]), {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: { version: '1', width: '20', height: '20' },
  });
  const validSource = makeObject('valid.webp', await image({ format: 'webp' }));
  const validDerivative = makeObject(
    staffThumbnailStorageKey(validSource.key),
    await image({ width: 20, height: 10, format: 'png' }),
    {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { version: '1', width: '20', height: '10' },
    },
  );
  const rows = [
    missingOriginal,
    unsupported,
    { id: 'c', filename: missingThumbnail.key, storageKey: missingThumbnail.key },
    { id: 'd', filename: invalidSource.key, storageKey: invalidSource.key },
    { id: 'e', filename: validSource.key, storageKey: validSource.key },
  ];
  let query = '';
  let bindings;
  const database = {
    prepare(statement) {
      query = statement;
      return {
        bind(...values) {
          bindings = values;
          return { all: async () => ({ results: rows }) };
        },
      };
    },
  };
  const fixture = bucket({
    objects: [],
    files: [missingThumbnail, invalidSource, invalidDerivative, validSource, validDerivative],
  });
  const report = await auditStaffMediaReferences({ database, bucket: fixture, environment: 'local' });
  assert.match(query, /FROM media WHERE mime_type LIKE 'image\/%'/);
  assert.deepEqual(bindings, ['', 26]);
  assert.deepEqual(report.counts, {
    listed: 5,
    unsupportedKeys: 1,
    missingOriginals: 1,
    missingThumbnails: 1,
    invalidThumbnails: 1,
    validExisting: 1,
    errors: 0,
  });
  assert.equal(report.r2.put, undefined);
  assert.equal(fixture.calls.put.length, 0);
});

test('hashes original bytes only when explicitly requested by the bounded media audit', async () => {
  const source = makeObject('hash-me.jpg', await image());
  const database = {
    prepare() {
      return {
        bind: () => ({
          all: async () => ({ results: [{ id: 'media-id', filename: 'hash-me.jpg', storageKey: source.key }] }),
        }),
      };
    },
  };
  const fixture = bucket({ objects: [], files: [source] });
  const report = await auditStaffMediaReferences({
    database,
    bucket: fixture,
    environment: 'local',
    hashOriginals: true,
  });
  assert.equal(report.media[0].original.sha256, createHash('sha256').update(source.bytes).digest('hex'));
  assert.equal(report.bytes.original, source.size);
  assert.equal(report.r2.get, 1);
  assert.equal(fixture.calls.put.length, 0);
});

test('retains the input cursor on interruption and resumes an interrupted page', async () => {
  const first = makeObject('first.jpg', await image({ width: 180, height: 90 }));
  const second = makeObject('second.jpg', await image({ width: 90, height: 180 }));
  const fixture = bucket({
    objects: [first, second].map(({ key, size, etag }) => ({ key, size, etag })),
    files: [first, second],
    getEtags: { [second.key]: 'changed-after-list' },
    truncated: true,
    nextCursor: 'page-2',
  });

  const interrupted = await prepareStaffThumbnailPage({
    bucket: fixture,
    environment: 'local',
    cursor: 'resume-me',
    apply: true,
  });
  assert.equal(interrupted.stopped, 'etag-mismatch');
  assert.equal(interrupted.nextCursor, 'resume-me');
  assert.equal(interrupted.counts.written, 1);
  assert.equal(interrupted.r2.put, 1);

  fixture.getEtags[second.key] = second.etag;
  const resumed = await prepareStaffThumbnailPage({
    bucket: fixture,
    environment: 'local',
    cursor: 'resume-me',
    apply: true,
  });
  assert.equal(resumed.stopped, null);
  assert.equal(resumed.counts.validExisting, 1);
  assert.equal(resumed.counts.written, 1);
  assert.equal(resumed.nextCursor, 'page-2');
});

test('stops before R2 reads when the cumulative or per-image byte limit is exceeded', async () => {
  const source = makeObject('cover.jpg', await image());
  const budget = bucket({
    objects: [{ key: source.key, size: source.size, etag: source.etag }],
    files: [source],
  });
  const budgetReport = await prepareStaffThumbnailPage({
    bucket: budget,
    environment: 'local',
    cursor: 'budget-cursor',
    maxBytes: source.size - 1,
  });
  assert.equal(budgetReport.stopped, 'byte-budget');
  assert.equal(budgetReport.nextCursor, 'budget-cursor');
  assert.equal(budgetReport.r2.get, 0);

  const tooLarge = makeObject('large.jpg', source.bytes, { size: maxOriginalBytes + 1 });
  const large = bucket({
    objects: [{ key: tooLarge.key, size: tooLarge.size, etag: tooLarge.etag }],
    files: [tooLarge],
  });
  const largeReport = await prepareStaffThumbnailPage({ bucket: large, environment: 'local' });
  assert.equal(largeReport.stopped, 'original-too-large');
  assert.equal(largeReport.r2.get, 0);
});
