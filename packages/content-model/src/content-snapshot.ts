import { z } from 'zod';
import { contentMediaIds, isCmsCollection, validateCmsRevisionContent } from './emdash-content';

export function parseContentSnapshot(json: string, environment: 'local' | 'uat' | 'prd', requiredRevision?: string) {
  z.enum(['local', 'uat', 'prd']).parse(environment);
  if (new TextEncoder().encode(json).byteLength > 4 * 1024 * 1024) throw new Error('Invalid snapshot manifest size.');
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
  return snapshot;
}

export type ContentSnapshot = ReturnType<typeof parseContentSnapshot>;
