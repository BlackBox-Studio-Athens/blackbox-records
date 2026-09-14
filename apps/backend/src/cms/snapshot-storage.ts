import { z } from 'zod';
import { contentMediaIds, isCmsCollection, validateCmsRevisionContent } from './content-schema';
import { validateImage } from './media-upload';

/** Private immutable bytes only; publication acceptance and live pointers are separate. */
async function storeSnapshotObject(
  bucket: R2Bucket,
  environment: 'local' | 'uat' | 'prd',
  kind: 'manifest' | 'media',
  bytes: Uint8Array,
) {
  z.enum(['local', 'uat', 'prd']).parse(environment);
  z.enum(['manifest', 'media']).parse(kind);
  if (
    !(bytes instanceof Uint8Array) ||
    !bytes.byteLength ||
    bytes.byteLength > (kind === 'manifest' ? 4 : 20) * 1024 * 1024
  )
    throw new Error('Invalid snapshot object size.');
  // Own the bytes across async hashing/storage so a caller cannot change their identity.
  const body = new Uint8Array(bytes);
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const key = `snapshots/${environment}/${kind}/${sha256}`;
  let object = await bucket.head(key);
  if (!object) {
    object = await bucket.put(key, body, {
      onlyIf: new Headers({ 'If-None-Match': '*' }),
      sha256,
      httpMetadata: { contentType: 'application/octet-stream', cacheControl: 'private, no-store' },
    });
    // Another writer may have won the conditional put. Never overwrite its object.
    object ??= await bucket.head(key);
  }
  if (!object || object.size !== body.byteLength || object.checksums.toJSON().sha256 !== sha256)
    throw new Error('Stored snapshot object failed integrity verification.');
  return { key, sha256, size: object.size };
}

export function storeSnapshotMedia(bucket: R2Bucket, environment: 'local' | 'uat' | 'prd', bytes: Uint8Array) {
  return storeSnapshotObject(bucket, environment, 'media', bytes);
}

/** A manifest is the completion marker. Validate all references and bytes before writing it. */
export async function completeSnapshot(
  bucket: R2Bucket,
  environment: 'local' | 'uat' | 'prd',
  json: string,
  requiredRevision?: string,
) {
  z.enum(['local', 'uat', 'prd']).parse(environment);
  if (typeof json !== 'string' || json.length > 4 * 1024 * 1024) throw new Error('Invalid snapshot manifest size.');
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > 4 * 1024 * 1024) throw new Error('Invalid snapshot manifest size.');
  const id = z.string().min(1).max(128);
  const snapshot = z
    .object({
      schemaVersion: z.literal(1),
      environment: z.literal(environment),
      records: z
        .array(
          z
            .object({
              collection: z.string().refine(isCmsCollection),
              id,
              revisionId: id,
              slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
              data: z.record(z.string(), z.json()),
            })
            .strict(),
        )
        .max(1000),
      media: z
        .array(
          z
            .object({
              id,
              sha256: z.string().regex(/^[a-f0-9]{64}$/),
              filename: z.string().min(1).max(200),
              mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
              size: z
                .number()
                .int()
                .positive()
                .max(20 * 1024 * 1024),
              width: z.number().int().positive(),
              height: z.number().int().positive(),
            })
            .strict(),
        )
        .max(1000),
    })
    .strict()
    .parse(JSON.parse(json));
  if (requiredRevision !== undefined && !snapshot.records.some((record) => record.revisionId === requiredRevision))
    throw new Error('Requested publication revision is absent from the snapshot.');
  const identities = new Set<string>();
  const paths = new Set<string>();
  const artists = new Set(
    snapshot.records.filter((record) => record.collection === 'artists').map((record) => record.id),
  );
  const referencedMedia = new Set<string>();
  for (const record of snapshot.records) {
    if (!isCmsCollection(record.collection) || validateCmsRevisionContent(record.collection, record.data).length)
      throw new Error('Invalid snapshot content.');
    const identity = `${record.collection}/${record.id}`;
    const path = `${record.collection}/${record.slug}`;
    if (identities.has(identity) || paths.has(path)) throw new Error('Duplicate snapshot record.');
    identities.add(identity);
    paths.add(path);
    if (record.collection === 'releases' && !artists.has(record.data.artist as string))
      throw new Error('Missing published Artist.');
    for (const mediaId of contentMediaIds(record.data)) referencedMedia.add(mediaId);
  }
  const mediaIds = new Set(snapshot.media.map((media) => media.id));
  if (
    mediaIds.size !== snapshot.media.length ||
    mediaIds.size !== referencedMedia.size ||
    [...referencedMedia].some((mediaId) => !mediaIds.has(mediaId))
  )
    throw new Error('Snapshot media references do not match the manifest.');
  if (snapshot.media.reduce((total, media) => total + media.size, 0) > 256 * 1024 * 1024)
    throw new Error('Snapshot media exceeds byte budget.');
  const groups = new Map<string, typeof snapshot.media>();
  for (const media of snapshot.media) {
    const group = groups.get(media.sha256) ?? [];
    group.push(media);
    groups.set(media.sha256, group);
  }
  // Validate one stored object at a time; never load the entire media library into a Worker.
  for (const group of groups.values()) {
    const media = group[0];
    const object = await bucket.get(`snapshots/${environment}/media/${media.sha256}`);
    if (
      !object ||
      group.some((item) => object.size !== item.size) ||
      object.checksums.toJSON().sha256 !== media.sha256
    ) {
      await object?.body.cancel();
      throw new Error('Missing or corrupt snapshot media.');
    }
    const original = await object.arrayBuffer();
    for (const item of group) {
      const image = new File([original], item.filename, { type: item.mimeType });
      const dimensions = await validateImage(image);
      if (dimensions.width !== item.width || dimensions.height !== item.height)
        throw new Error('Snapshot media dimensions do not match.');
    }
  }
  return storeSnapshotObject(bucket, environment, 'manifest', bytes);
}
