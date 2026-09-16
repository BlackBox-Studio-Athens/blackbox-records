import { z } from 'zod';
import { parseContentSnapshot } from '@blackbox/content-model';
import { validateImage } from './media-upload';

/** Private immutable bytes only; publication acceptance and live pointers are separate. */
async function storeSnapshotObject(
  bucket: R2Bucket,
  environment: 'local' | 'uat' | 'prd',
  kind: 'manifest' | 'media' | 'approved-media',
  bytes: Uint8Array,
  contentType = 'application/octet-stream',
) {
  z.enum(['local', 'uat', 'prd']).parse(environment);
  z.enum(['manifest', 'media', 'approved-media']).parse(kind);
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
  const key =
    kind === 'approved-media'
      ? `approved-media/${environment}/${sha256}`
      : `snapshots/${environment}/${kind}/${sha256}`;
  let object = await bucket.head(key);
  if (!object) {
    object = await bucket.put(key, body, {
      onlyIf: new Headers({ 'If-None-Match': '*' }),
      sha256,
      httpMetadata: { contentType, cacheControl: 'private, no-store' },
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

/** Only the selected item artwork is approved; the CMS original remains private. */
export async function approvePublicationImage(bucket: R2Bucket, environment: 'local' | 'uat' | 'prd', file: File) {
  await validateImage(file);
  return storeSnapshotObject(
    bucket,
    environment,
    'approved-media',
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  );
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
  const snapshot = parseContentSnapshot(json, environment, requiredRevision);
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
