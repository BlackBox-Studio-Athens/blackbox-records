import { env } from 'cloudflare:test';
import { afterEach, expect, it, vi } from 'vitest';
import { PublicSnapshotSelection, currentPublicationKey, readPublishedSnapshot } from './published-storage';

const bucket = env.TEST_SNAPSHOTS;
const pointer = (sha = 'a'.repeat(64)) => ({ id: crypto.randomUUID(), snapshotSha256: sha, generation: 1 });
const key = currentPublicationKey('uat');

it('upgrades checksum-bound accepted legacy Releases without rewriting R2 and refuses unmapped slugs', async () => {
  const manifest = (slug: string) =>
    JSON.stringify({
      schemaVersion: 1,
      environment: 'uat',
      records: [
        {
          collection: 'artists',
          id: 'cms-artist',
          slug: 'artist',
          revisionId: 'a',
          data: { title: 'Artist', genre: 'Rock', bio: 'Bio', image: { id: 'image' }, image_alt: 'Portrait' },
        },
        {
          collection: 'releases',
          id: 'environment-specific-id',
          slug,
          revisionId: 'r',
          data: {
            title: slug,
            artist: 'cms-artist',
            release_stage: 'upcoming',
            cover_image: { id: 'image' },
            cover_image_alt: 'Cover',
          },
        },
      ],
      media: [
        {
          id: 'image',
          sha256: 'a'.repeat(64),
          filename: 'cover.png',
          mimeType: 'image/png',
          size: 1,
          width: 1,
          height: 1,
        },
      ],
    });
  for (const slug of ['caregivers', 'lotus', 'fictional-unmapped-release']) {
    const json = manifest(slug);
    const sha = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))),
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('');
    const path = `snapshots/uat/manifest/${sha}`;
    await bucket.put(path, json, { sha256: sha });
    if (slug === 'caregivers')
      expect((await readPublishedSnapshot(bucket, 'uat', sha)).records[1]!.data.catalog_number).toBe('BBR#001');
    else if (slug === 'lotus')
      expect((await readPublishedSnapshot(bucket, 'uat', sha)).records[1]!.data.catalog_number).toBe('BBR#004');
    else
      await expect(readPublishedSnapshot(bucket, 'uat', sha)).rejects.toThrow(
        '"fictional-unmapped-release" has no catalog number',
      );
    expect(await (await bucket.get(path))!.text()).toBe(json);
    await bucket.delete(path);
  }
});

afterEach(async () => {
  vi.restoreAllMocks();
  await bucket.delete(key);
});

it('cold concurrent requests share one pointer read and no snapshot is parsed until needed', async () => {
  const accepted = pointer();
  await bucket.put(key, JSON.stringify(accepted));
  const get = vi.fn((path: string) => bucket.get(path));
  const selection = new PublicSnapshotSelection({ get } as unknown as R2Bucket, 'uat', null);
  const selected = await Promise.all(Array.from({ length: 10 }, () => selection.selected()));
  expect(selected.every((value) => value.pointer.snapshotSha256 === accepted.snapshotSha256)).toBe(true);
  expect(get).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledWith(key);
  await expect(Promise.all([selection.content(), selection.content()])).rejects.toThrow(
    'Published snapshot is unavailable',
  );
  expect(get).toHaveBeenCalledTimes(2);
});

it('serves the current pointer while one refresh is pending, then selects the new identity', async () => {
  const old = pointer();
  const next = pointer('b'.repeat(64));
  await bucket.put(key, JSON.stringify(old));
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  let release!: () => void;
  let pause = false;
  const get = vi.fn(async (path: string) => {
    if (pause)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return bucket.get(path);
  });
  const selection = new PublicSnapshotSelection({ get } as unknown as R2Bucket, 'uat', null);
  await selection.selected();
  await bucket.put(key, JSON.stringify(next));
  clock.mockReturnValue(6001);
  pause = true;
  const current = await Promise.all(Array.from({ length: 10 }, () => selection.selected()));
  expect(current.every((value) => value.pointer.snapshotSha256 === old.snapshotSha256)).toBe(true);
  expect(get).toHaveBeenCalledTimes(2);
  release();
  await vi.waitFor(async () => expect((await selection.selected()).pointer.snapshotSha256).toBe(next.snapshotSha256));
  expect(get).toHaveBeenCalledTimes(2);
});

it('pointer failure retains only a previously selected pointer; a cold object fails explicitly', async () => {
  const accepted = pointer();
  await bucket.put(key, JSON.stringify(accepted));
  const get = vi.fn((path: string) => bucket.get(path));
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  const selection = new PublicSnapshotSelection({ get } as unknown as R2Bucket, 'uat', null);
  await selection.selected();
  get.mockRejectedValue(new Error('R2 unavailable'));
  clock.mockReturnValue(6001);
  expect((await selection.selected()).pointer).toEqual(accepted);
  await expect(new PublicSnapshotSelection({ get } as unknown as R2Bucket, 'uat', null).selected()).rejects.toThrow(
    'R2 unavailable',
  );
});

it('activation invalidation cannot be overwritten by an older in-flight refresh', async () => {
  const old = pointer();
  const next = { ...pointer('b'.repeat(64)), generation: 2 };
  await bucket.put(key, JSON.stringify(old));
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  let release!: () => void;
  let captured!: () => void;
  const started = new Promise<void>((resolve) => {
    captured = resolve;
  });
  const get = vi.fn((path: string) => bucket.get(path));
  const work: Promise<unknown>[] = [];
  const selection = new PublicSnapshotSelection({ get } as unknown as R2Bucket, 'uat', null, (pending) =>
    work.push(pending),
  );
  await selection.selected();
  get.mockImplementationOnce(async (path) => {
    const stale = await bucket.get(path);
    captured();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return stale;
  });
  clock.mockReturnValue(6001);
  expect((await selection.selected()).pointer).toEqual(old);
  await started;
  await bucket.put(key, JSON.stringify(next));
  await selection.invalidate(next);
  expect((await selection.selected()).pointer).toEqual(next);
  release();
  await Promise.all(work);
  expect((await selection.selected()).pointer).toEqual(next);
  expect(get).toHaveBeenCalledTimes(3);
});

it('invalidation requires the exact active R2 pointer and never accepts a draft/bootstrap or older generation', async () => {
  const accepted = pointer();
  const selection = new PublicSnapshotSelection(bucket, 'uat', accepted);
  await expect(selection.invalidate(accepted)).rejects.toThrow('no longer active');
  await bucket.put(key, JSON.stringify(accepted));
  await expect(selection.invalidate({ ...accepted, generation: 0 })).rejects.toThrow('no longer active');
  await expect(selection.invalidate(pointer('b'.repeat(64)))).rejects.toThrow('no longer active');
  await selection.invalidate(accepted);
  expect((await selection.selected()).pointer).toEqual(accepted);
});
