import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { applyCmsImport } from './apply-cms-import.mjs';
import { inventory } from './inventory-cms-content.mjs';
import { markdownToPortableText } from './cms-markdown.mjs';
import { sourceCollectionNames, validateCmsContent } from '../apps/backend/src/cms/content-schema.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const mimeTypes = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };

function contentData(record, manifest, mediaIds, recordIds) {
  const imagePaths = new Map(
    manifest.media.flatMap((image) =>
      image.references
        .filter((reference) => reference.source === record.source)
        .map((reference) => [reference.original, mediaIds.get(image.path)]),
    ),
  );
  const data = JSON.parse(JSON.stringify(record.data), (name, value) => {
    if (name === '$schema') return undefined;
    return typeof value === 'string' && imagePaths.has(value) && name !== 'logo'
      ? { id: imagePaths.get(value) }
      : value;
  });
  if (record.collection === 'artists') delete data.slug;
  for (const reference of record.references) {
    const id = recordIds.get(`${reference.collection}/${reference.id}`);
    if (!id) throw new Error(`Unresolved reference: ${record.source} -> ${reference.id}`);
    data[reference.field] = id;
  }
  if (record.body.trim()) data.body = markdownToPortableText(record.body);
  return data;
}

// Import is an explicit diagnostic command. Existing records must match exactly;
// changes made by editors are never overwritten by rerunning the source import.
export async function importCmsContent({
  base = 'http://127.0.0.1:8787',
  apply = false,
  verifyOnly = false,
  prepareUat,
  prepareLocal,
} = {}) {
  const target = new URL(base);
  if (
    target.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(target.hostname) ||
    !['8787', '8799'].includes(target.port) ||
    target.pathname !== '/' ||
    target.search ||
    target.hash ||
    target.username ||
    target.password
  )
    throw new Error('This importer currently supports the local CMS only.');
  const manifest = await inventory();
  assert.deepEqual(manifest.anomalies, [], 'Resolve source anomalies before importing.');
  const retainedAssets = manifest.media.filter(
    (media) => media.path === 'apps/web/public/assets/vendor/stripe/powered-by-stripe.svg',
  );
  assert.ok(retainedAssets.every((media) => media.references.length === 0));
  const importMedia = manifest.media.filter((media) => !retainedAssets.includes(media));
  const collectionNames = Object.fromEntries(
    Object.entries(sourceCollectionNames).map(([cms, source]) => [source, cms]),
  );
  const mediaIds = new Map(manifest.media.map((media) => [media.path, 'validated-image']));
  const recordIds = new Map(
    manifest.records.map((record) => [`${record.collection}/${record.id}`, 'validated-record']),
  );
  for (const record of manifest.records) {
    assert.deepEqual(
      validateCmsContent(collectionNames[record.collection], contentData(record, manifest, mediaIds, recordIds)),
      [],
      record.source,
    );
  }
  for (const media of manifest.media) {
    const resolved = path.resolve(root, media.path);
    assert.ok(resolved.startsWith(path.resolve(root, 'apps/web') + path.sep), 'Media must remain within web sources.');
    const bytes = readFileSync(resolved);
    assert.equal(hash(bytes), media.sha256, media.path);
    media.contentHash = 'sha1:' + createHash('sha1').update(bytes).digest('hex');
    assert.equal(bytes.length, media.bytes, media.path);
    assert.ok(bytes.length > 0 && bytes.length <= 20 * 1024 * 1024 && mimeTypes[media.format], media.path);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, media.format, media.path);
    assert.equal(metadata.width, media.width, media.path);
    assert.equal(metadata.height, media.height, media.path);
  }
  if ((prepareUat || prepareLocal) && apply) throw new Error('Prepare and apply are separate operations.');
  if (prepareUat && prepareLocal) throw new Error('Prepare one CMS environment at a time.');
  for (const media of manifest.media) mediaIds.set(media.path, 'urn:blackbox:media:' + media.path);
  for (const record of manifest.records)
    recordIds.set(`${record.collection}/${record.id}`, `urn:blackbox:record:${record.collection}/${record.id}`);
  const plan = {
    target: prepareUat ? 'https://staff-uat.blackboxrecordsathens.com' : target.origin,
    retainedAssets: retainedAssets.map((media) => media.path),
    media: importMedia,
    records: [...manifest.records]
      .sort((a, b) => Number(b.collection === 'artists') - Number(a.collection === 'artists'))
      .map((record) => ({
        identity: `${record.collection}/${record.id}`,
        collection: collectionNames[record.collection],
        slug: record.id,
        source: record.source,
        data: contentData(record, manifest, mediaIds, recordIds),
      })),
  };
  async function readMedia(media) {
    const bytes = readFileSync(path.resolve(root, media.path));
    return {
      file: new Blob([bytes], { type: mimeTypes[media.format] }),
      thumbnail: new Blob([await sharp(bytes).resize({ width: 32, height: 32, fit: 'inside' }).png().toBuffer()], {
        type: 'image/png',
      }),
    };
  }
  const prepareDirectory = prepareUat || prepareLocal;
  if (prepareDirectory) {
    for (const media of plan.media) {
      const { thumbnail } = await readMedia(media);
      media.thumbnail = Buffer.from(await thumbnail.arrayBuffer()).toString('base64');
      media.mimeType = mimeTypes[media.format];
      media.localPath = path.resolve(root, media.path);
    }
    mkdirSync(prepareDirectory, { recursive: true });
    writeFileSync(path.join(prepareDirectory, 'plan.json'), JSON.stringify(plan));
    writeFileSync(path.join(prepareDirectory, 'apply.js'), applyCmsImport.toString());
    return {
      target: plan.target,
      apply: false,
      records: plan.records.length,
      media: plan.media.length,
      output: path.resolve(prepareDirectory),
    };
  }
  return applyCmsImport(plan, readMedia, { apply, verifyOnly });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      base: { type: 'string' },
      apply: { type: 'boolean', default: false },
      verifyOnly: { type: 'boolean', default: false },
      prepareUat: { type: 'string' },
      prepareLocal: { type: 'string' },
    },
  });
  console.log(JSON.stringify(await importCmsContent(values), null, 2));
}
