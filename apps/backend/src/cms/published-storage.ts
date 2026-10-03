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

const publishedMediaSchema = z.object({
  media: z
    .array(
      z.object({
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
        size: z
          .number()
          .int()
          .positive()
          .max(20 * 1024 * 1024),
        width: z.number().int().positive(),
      }),
    )
    .max(1000),
});
export type PublishedMedia = z.infer<typeof publishedMediaSchema>['media'][number];

/** Media of an accepted manifest. Acceptance validated the whole manifest and R2 verifies its checksum here. */
export async function readPublishedSnapshotMedia(
  bucket: R2Bucket,
  environment: PublicationEnvironment,
  sha256: string,
): Promise<PublishedMedia[]> {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Invalid publication checksum.');
  const object = await bucket.get(`snapshots/${environment}/manifest/${sha256}`);
  if (!object || object.size > 4 * 1024 * 1024 || object.checksums.toJSON().sha256 !== sha256) {
    await object?.body.cancel();
    throw new Error('Published snapshot is unavailable.');
  }
  return publishedMediaSchema.parse(await object.json()).media;
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

/** Pointer refresh is single-flight; parsed content is loaded only for a render or media lookup. */
export class PublicSnapshotSelection {
  private current:
    | { pointer: PublicationPointer; checkedAt: number; snapshot?: Promise<ReturnType<typeof parseContentSnapshot>> }
    | undefined;
  private refreshing: Promise<NonNullable<PublicSnapshotSelection['current']>> | undefined;
  private epoch = 0;

  constructor(
    private bucket: R2Bucket,
    private environment: PublicationEnvironment,
    private bootstrap: PublicationPointer | null,
    private waitUntil: (work: Promise<unknown>) => void = () => {},
  ) {}

  selected(): Promise<NonNullable<PublicSnapshotSelection['current']>> {
    if (this.current && Date.now() - this.current.checkedAt < 5000) return Promise.resolve(this.current);
    if (!this.refreshing) {
      const refreshing = this.refresh(this.epoch);
      this.refreshing = refreshing;
      if (this.current) this.waitUntil(refreshing.catch(() => {}));
      refreshing
        .finally(() => {
          if (this.refreshing === refreshing) this.refreshing = undefined;
        })
        .catch(() => {});
    }
    return this.current ? Promise.resolve(this.current) : this.refreshing;
  }

  async content() {
    const selected = await this.selected();
    if (!selected.snapshot) {
      const snapshot = readPublishedSnapshot(this.bucket, this.environment, selected.pointer.snapshotSha256);
      selected.snapshot = snapshot;
      snapshot.catch(() => {
        if (selected.snapshot === snapshot) selected.snapshot = undefined;
      });
    }
    return { pointer: selected.pointer, snapshot: await selected.snapshot };
  }

  async invalidate(expected: PublicationPointer) {
    const epoch = ++this.epoch;
    this.current = undefined;
    this.refreshing = undefined;
    const stored = await readPublicationPointer(this.bucket, this.environment);
    const pointer = stored?.pointer;
    if (
      !pointer ||
      pointer.id !== expected.id ||
      pointer.snapshotSha256 !== expected.snapshotSha256 ||
      pointer.generation !== expected.generation ||
      epoch !== this.epoch
    )
      throw new Error('Publication is no longer active.');
    ++this.epoch;
    this.refreshing = undefined;
    this.current = { pointer, checkedAt: Date.now() };
  }

  private async refresh(epoch: number): Promise<NonNullable<PublicSnapshotSelection['current']>> {
    let stored;
    try {
      stored = await readPublicationPointer(this.bucket, this.environment);
    } catch (error) {
      if (epoch !== this.epoch) return this.selected();
      if (!this.current) throw error;
      this.current.checkedAt = Date.now();
      return this.current;
    }
    // An activation can invalidate a pointer read that was already in flight.
    if (epoch !== this.epoch) return this.selected();
    const pointer = stored?.pointer ?? this.bootstrap;
    if (!pointer) throw new Error('No accepted publication.');
    return (this.current = {
      pointer,
      checkedAt: Date.now(),
      snapshot: this.current?.pointer.snapshotSha256 === pointer.snapshotSha256 ? this.current.snapshot : undefined,
    });
  }
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
