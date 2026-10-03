import { readFile } from 'node:fs/promises';
import type { APIContext } from 'astro';
import { afterEach, expect, it, vi } from 'vitest';
import * as contentLoader from '../lib/content-loader';
import { GET, getStaticPaths } from './assets/catalog/[collection]/[asset]';

afterEach(() => vi.restoreAllMocks());

it('emits only catalog images with original bytes and image content types', async () => {
  const paths = await getStaticPaths();
  expect(paths.length).toBeGreaterThan(0);
  expect(paths.some(({ params }) => params.asset === 'afterwise-album-cover-distro-mockup.webp')).toBe(true);
  for (const { params, props } of paths) {
    expect(['distro', 'releases']).toContain(params.collection);
    expect(params.asset).not.toMatch(/\.(?:md|json)$/);
    expect(props.contentType).toMatch(/^image\//);
  }
  for (const collection of ['distro', 'releases']) {
    const { props } = paths.find(({ params }) => params.collection === collection)!;
    const response = await GET({ props } as unknown as APIContext);
    expect(response.headers.get('Content-Type')).toMatch(/^image\//);
    expect(Buffer.compare(Buffer.from(await response.arrayBuffer()), await readFile(props.assetPath))).toBe(0);
  }
});

it('reuses the shared snapshot loader for aliases and retains conflicting-alias rejection', async () => {
  const input = { path: '/accepted/snapshot.json', sha256: 'a'.repeat(64), environment: 'local' as const };
  vi.spyOn(contentLoader, 'contentSnapshotInput').mockReturnValue(input);
  const item = {
    id: 'image',
    sha256: 'b'.repeat(64),
    filename: 'cover.png',
    mimeType: 'image/png' as const,
    size: 1,
    width: 2,
    height: 3,
  };
  const loaded = {
    path: input.path,
    snapshot: {
      schemaVersion: 1 as const,
      environment: 'local' as const,
      records: [
        {
          collection: 'distro' as const,
          id: 'record',
          revisionId: 'accepted',
          slug: 'record',
          data: { image: { id: item.id }, gallery: [{ image: { id: item.id } }] },
        },
      ],
      media: [item],
    },
    media: new Map([[item.id, { path: '/accepted/media/cover.png', relativePath: './media/cover.png', item }]]),
  };
  const load = vi.spyOn(contentLoader, 'loadContentSnapshot').mockResolvedValue(loaded);
  await expect(getStaticPaths()).resolves.toEqual([
    {
      params: { collection: 'distro', asset: 'cover.png' },
      props: { assetPath: '/accepted/media/cover.png', contentType: 'image/png' },
    },
  ]);
  expect(load).toHaveBeenCalledExactlyOnceWith(input);
  const other = { ...item, id: 'other', sha256: 'c'.repeat(64) };
  loaded.media.set(other.id, { path: '/accepted/media/other.png', relativePath: './media/other.png', item: other });
  loaded.snapshot.records[0]!.data.gallery.push({ image: { id: other.id } });
  await expect(getStaticPaths()).rejects.toThrow('Conflicting catalog image aliases.');
});
