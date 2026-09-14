import { createHash } from 'node:crypto';
import { z } from 'zod';
import { contentMediaIds, sourceCollectionNames, validateCmsRevisionContent } from '@blackbox/content-model';
import { validateImage } from '../apps/backend/src/cms/media-upload.ts';

const identifier = z.string().min(1).max(128);
const itemSchema = z.object({
  id: identifier,
  slug: identifier,
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  version: z.number().int().positive(),
  liveRevisionId: identifier.nullable(),
  draftRevisionId: identifier.nullable(),
});
const pageSchema = z.object({
  items: z.array(itemSchema),
  total: z.number().int().nonnegative(),
  nextCursor: z.string().min(1).nullable().default(null),
});
const revisionSchema = z.object({
  id: identifier,
  collection: identifier,
  entryId: identifier,
  data: z.record(z.string(), z.json()),
});
const collections = Object.keys(sourceCollectionNames);
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;

// Readers use supported CMS REST. This function never writes or retries a hosted request.
export async function captureCmsSnapshot({
  environment,
  readPage,
  readRevision,
  readMedia,
  readMediaFile,
  maxRequests = 200,
  maxMediaBytes = 256 * 1024 * 1024,
}) {
  z.enum(['local', 'uat', 'prd']).parse(environment);
  z.number().int().min(1).max(1000).parse(maxRequests);
  z.number()
    .int()
    .min(1)
    .max(256 * 1024 * 1024)
    .parse(maxMediaBytes);
  let requests = 0;
  const read = async (reader, ...args) => {
    if (++requests > maxRequests) throw new Error('CMS snapshot request budget exceeded.');
    return reader(...args);
  };
  async function inventory() {
    const items = [];
    for (const collection of collections) {
      const seen = new Set();
      const cursors = new Set();
      let cursor = null;
      let total;
      do {
        const page = pageSchema.parse(await read(readPage, collection, cursor, 100));
        if (page.items.length > 100 || (total !== undefined && total !== page.total))
          throw new Error('CMS inventory changed during capture.');
        total = page.total;
        for (const item of page.items) {
          if (seen.has(item.id)) throw new Error('Duplicate CMS record during capture.');
          seen.add(item.id);
          items.push({ collection, ...item });
        }
        cursor = page.nextCursor;
        if (cursor && (!page.items.length || cursors.has(cursor))) throw new Error('Invalid CMS pagination.');
        if (cursor) cursors.add(cursor);
      } while (cursor);
      if (seen.size !== total) throw new Error('Incomplete CMS inventory.');
    }
    return items.sort((a, b) => `${a.collection}/${a.id}`.localeCompare(`${b.collection}/${b.id}`));
  }
  const before = await inventory();
  const records = [];
  for (const item of before.filter((item) => item.status === 'published')) {
    if (!item.liveRevisionId) throw new Error('Published CMS record has no live revision.');
    const revision = revisionSchema.parse(await read(readRevision, item.liveRevisionId));
    if (revision.id !== item.liveRevisionId || revision.collection !== item.collection || revision.entryId !== item.id)
      throw new Error('CMS revision identity mismatch.');
    const { _slug, ...data } = revision.data;
    // Native SQLite-backed revisions encode these declared booleans as 0/1.
    // Keep numeric values invalid everywhere else, including editorial writes.
    if (item.collection === 'navigation') {
      for (const field of ['show_in_header', 'show_in_footer'])
        if (data[field] === 0 || data[field] === 1) data[field] = data[field] === 1;
    }
    const issues = validateCmsRevisionContent(item.collection, data);
    if (issues.length)
      throw new Error(`Invalid published CMS content (${item.collection}/${item.id}): ${issues.join('; ')}`);
    const slug = z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .parse(_slug ?? item.slug);
    records.push({ collection: item.collection, id: item.id, slug, revisionId: revision.id, data });
  }
  const publishedArtists = new Set(
    records.filter((record) => record.collection === 'artists').map((record) => record.id),
  );
  const paths = new Set();
  for (const record of records) {
    const path = `${record.collection}/${record.slug}`;
    if (paths.has(path)) throw new Error('Duplicate published CMS slug.');
    paths.add(path);
    if (record.collection === 'releases' && !publishedArtists.has(record.data.artist))
      throw new Error('Published Release must reference a published Artist.');
  }
  const media = [];
  const files = new Map();
  let mediaBytes = 0;
  for (const id of [...new Set(records.flatMap((record) => contentMediaIds(record.data)))].sort()) {
    const item = z
      .object({
        id: identifier,
        filename: z.string().min(1).max(200),
        mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
        size: z
          .number()
          .int()
          .positive()
          .max(20 * 1024 * 1024),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        storageKey: z.string().min(1),
        status: z.literal('ready'),
        contentHash: z.string().regex(/^sha1:[a-f0-9]{40}$/),
      })
      .parse(await read(readMedia, id));
    if (item.id !== id) throw new Error('CMS media identity mismatch.');
    mediaBytes += item.size;
    if (mediaBytes > maxMediaBytes) throw new Error('CMS snapshot media byte budget exceeded.');
    const bytes = await read(readMediaFile, item.storageKey);
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength !== item.size ||
      `sha1:${createHash('sha1').update(bytes).digest('hex')}` !== item.contentHash
    )
      throw new Error('CMS media bytes differ from stored metadata.');
    const dimensions = await validateImage(new File([bytes], item.filename, { type: item.mimeType }));
    if (dimensions.width !== item.width || dimensions.height !== item.height)
      throw new Error('CMS media dimensions differ from stored metadata.');
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    files.set(sha256, bytes);
    media.push({
      id,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      width: item.width,
      height: item.height,
      sha256,
    });
  }
  const after = await inventory();
  if (JSON.stringify(canonical(before)) !== JSON.stringify(canonical(after)))
    throw new Error('CMS inventory changed; capture again.');
  const snapshot = canonical({ schemaVersion: 1, environment, records, media });
  const json = JSON.stringify(snapshot);
  return { snapshot, json, sha256: createHash('sha256').update(json).digest('hex'), requests, files };
}
