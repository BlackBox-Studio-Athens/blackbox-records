import { readFile } from 'node:fs/promises';
import type { APIContext } from 'astro';
import { expect, it } from 'vitest';
import { GET, getStaticPaths } from '../pages/assets/catalog/[collection]/[asset]';

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
