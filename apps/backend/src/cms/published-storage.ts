import { z } from 'zod';
import { parseContentSnapshot } from '@blackbox/content-model';

export const publicationPointerSchema = z
  .object({
    id: z.uuid(),
    snapshotSha256: z.string().regex(/^[a-f0-9]{64}$/),
    generation: z.number().int().nonnegative(),
    ciRunId: z
      .string()
      .regex(/^(?:[1-9][0-9]{0,19}|runtime)$/)
      .optional(),
  })
  .strict();
export type PublicationPointer = z.infer<typeof publicationPointerSchema>;
export type PublicationEnvironment = 'local' | 'uat' | 'prd';
export const currentPublicationKey = (environment: PublicationEnvironment) => `snapshots/${environment}/current.json`;

export async function readPublishedSnapshot(bucket: R2Bucket, environment: PublicationEnvironment, sha256: string) {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Invalid publication checksum.');
  const object = await bucket.get(`snapshots/${environment}/manifest/${sha256}`);
  if (!object || object.size > 4 * 1024 * 1024 || object.checksums.toJSON().sha256 !== sha256) {
    await object?.body.cancel();
    throw new Error('Published snapshot is unavailable.');
  }
  return parseContentSnapshot(await object.text(), environment);
}

export async function readPublicationPointer(bucket: R2Bucket, environment: PublicationEnvironment) {
  const object = await bucket.get(currentPublicationKey(environment));
  if (!object) return null;
  if (object.size > 4096) {
    await object.body.cancel();
    throw new Error('Invalid publication pointer.');
  }
  return { pointer: publicationPointerSchema.parse(await object.json()), etag: object.etag };
}

export async function activatePublication(
  bucket: R2Bucket,
  environment: PublicationEnvironment,
  pointer: PublicationPointer,
  previousEtag?: string,
) {
  return bucket.put(currentPublicationKey(environment), JSON.stringify(publicationPointerSchema.parse(pointer)), {
    onlyIf: previousEtag ? { etagMatches: previousEtag } : { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
  });
}
