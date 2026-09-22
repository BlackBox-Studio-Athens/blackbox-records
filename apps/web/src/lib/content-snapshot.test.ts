import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, expect, it, vi } from 'vitest';
import { readContentSnapshot, snapshotCollection } from './content-snapshot';
import { contentSnapshotInput } from './content-loader';
import { parseContentSnapshot, publishedCollection } from '@blackbox/content-model';

afterEach(() => vi.unstubAllEnvs());

it('never falls back to repository content when snapshot mode is incomplete', () => {
  vi.stubEnv('CMS_CONTENT_SOURCE', 'snapshot');
  vi.stubEnv('CMS_CONTENT_SNAPSHOT', '');
  vi.stubEnv('CMS_CONTENT_SHA256', '');
  vi.stubEnv('CMS_CONTENT_ENVIRONMENT', 'local');
  expect(() => contentSnapshotInput()).toThrow('Snapshot builds require');
});

it('loads only checksum-bound content, maps stable references and rejects altered media and targets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'blackbox-snapshot-'));
  try {
    const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: '#333' } })
      .png()
      .toBuffer();
    const digest = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
    const image = { id: 'image', provider: 'local', width: 2, height: 3, filename: 'cover.png' };
    const snapshot = {
      schemaVersion: 1,
      environment: 'local',
      storeItems: [
        {
          sourceKind: 'release',
          sourceId: 'stable-release',
          storeItemSlug: 'original-store-slug',
          variantId: 'variant_persisted',
        },
      ],
      records: [
        {
          collection: 'artists',
          id: 'artist-identity',
          revisionId: 'artist-revision',
          slug: 'stable-artist',
          data: { title: 'Renamed artist', genre: 'Rock', bio: 'Biography', image, image_alt: 'Cover' },
        },
        {
          collection: 'releases',
          id: 'release-identity',
          revisionId: 'release-revision',
          slug: 'stable-release',
          data: {
            title: 'Release',
            artist: 'artist-identity',
            release_date: '2026-09-14',
            cover_image: image,
            cover_image_alt: 'Cover',
          },
        },
      ],
      media: [
        {
          id: 'image',
          sha256: digest(bytes),
          filename: 'cover.png',
          mimeType: 'image/png',
          size: bytes.length,
          width: 2,
          height: 3,
        },
      ],
    };
    const json = JSON.stringify(snapshot);
    const path = join(directory, 'snapshot.json');
    const mediaPath = join(directory, 'media', `${digest(bytes)}.png`);
    await mkdir(join(directory, 'media'));
    await writeFile(path, json);
    await writeFile(mediaPath, bytes);
    const input = { path, sha256: digest(json), environment: 'local' as const };
    const loaded = await readContentSnapshot(input);
    expect(snapshotCollection(loaded, 'artists')[0]).toMatchObject({
      id: 'stable-artist',
      data: {
        slug: 'stable-artist',
        title: 'Renamed artist',
        image: `./media/${digest(bytes)}.png`,
        editorial_body: [],
      },
    });
    expect(snapshotCollection(loaded, 'releases')[0]!.data.tracklist).toBeUndefined();
    const tracklist = {
      format: 'vinyl',
      sides: [
        { label: 'A', tracks: [{ title: 'First song', duration: '3:20' }] },
        { label: 'B', tracks: [{ title: 'Δεύτερο τραγούδι' }] },
      ],
    };
    loaded.snapshot.records.find((record) => record.collection === 'releases')!.data.tracklist = tracklist;
    expect(parseContentSnapshot(JSON.stringify(loaded.snapshot), 'local').records[1]!.data.tracklist).toEqual(
      tracklist,
    );
    expect(snapshotCollection(loaded, 'releases')[0]!.data.tracklist).toEqual(tracklist);
    expect(publishedCollection(loaded.snapshot, 'releases', '/media/content')[0]!.data.tracklist).toEqual(tracklist);
    loaded.snapshot.records.push({
      collection: 'distro',
      id: 'distro',
      revisionId: 'distro-revision',
      slug: 'distro',
      data: {
        title: 'Distro',
        artist_or_label: 'Band',
        group: 'CDs',
        summary: 'Album',
        image,
        image_alt: 'Cover',
        order: 0,
        tracklist,
      },
    });
    expect(parseContentSnapshot(JSON.stringify(loaded.snapshot), 'local').records[2]!.data.tracklist).toEqual(
      tracklist,
    );
    expect(snapshotCollection(loaded, 'distro')[0]!.data.tracklist).toEqual(tracklist);
    expect(snapshotCollection(loaded, 'releases')[0]!.data.artist).toBe('stable-artist');
    expect(snapshotCollection(loaded, 'releases')[0]!.data.store_item).toEqual({
      storeItemSlug: 'original-store-slug',
      variantId: 'variant_persisted',
    });
    expect(() =>
      parseContentSnapshot(
        JSON.stringify({ ...snapshot, storeItems: [...snapshot.storeItems, ...snapshot.storeItems] }),
        'local',
      ),
    ).toThrow('Duplicate');
    expect(() =>
      parseContentSnapshot(
        JSON.stringify({ ...snapshot, storeItems: [{ ...snapshot.storeItems[0], sourceId: 'missing' }] }),
        'local',
      ),
    ).toThrow('published source');
    loaded.snapshot.storeItems = [];
    expect(snapshotCollection(loaded, 'releases')[0]!.data.store_item).toBeNull();
    loaded.snapshot.records.push({
      collection: 'services',
      id: 'services',
      revisionId: 'services-revision',
      slug: 'site',
      data: { services: { items: [{ id: 'image', title: 'Service', image: { id: 'image' } }] } },
    });
    expect(snapshotCollection(loaded, 'services')[0]!.data.services).toEqual({
      items: [{ id: 'image', title: 'Service', image: `./media/${digest(bytes)}.png` }],
    });
    await expect(readContentSnapshot({ ...input, environment: 'prd' })).rejects.toThrow();
    await expect(readContentSnapshot({ ...input, sha256: '0'.repeat(64) })).rejects.toThrow('checksum');
    const altered = Buffer.from(bytes);
    altered[20] = altered[20]! ^ 1;
    await writeFile(mediaPath, altered);
    await expect(readContentSnapshot(input)).rejects.toThrow('checksum');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
