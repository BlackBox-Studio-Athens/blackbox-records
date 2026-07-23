import { describe, expect, it } from 'vitest';

import { createDecapMediaResponse, getStaticPaths } from '../../pages/admin/media/[collection]/[asset]';
import {
  decapCollectionMedia,
  decapCollectionMediaKeys,
  decapGlobalMedia,
  decapMediaCacheControl,
  decapMediaContentTypes,
  decodeDecapMediaSegment,
  getDecapMediaContentType,
  resolveDecapMediaAsset,
} from './decap-media';

const representativeAssets = {
  about: '36585142_187676541905905_5704427450599997440_n.jpg',
  artists: 'Ouranopithecus-band-photo.jpg',
  distro: 'indoctrinate-aftermaths.jpg',
  home: 'hero-live-band.jpg',
  news: 'img_0697.jpg',
  releases: 'anarchotribal-cover.webp',
  services: 'image-asset.webp',
} as const;

async function requestMedia(collection: string, asset: string): Promise<Response> {
  return createDecapMediaResponse({ appRoot: process.cwd(), asset, collection });
}

describe('Decap collection media contract', () => {
  it('owns exactly the seven collection image roots and excludes global uploads', () => {
    expect(decapCollectionMediaKeys).toEqual(['about', 'artists', 'distro', 'home', 'news', 'releases', 'services']);
    expect(Object.values(decapCollectionMedia).map(({ mediaFolder }) => mediaFolder)).toEqual(
      Array.from({ length: 7 }, () => '.'),
    );
    expect(Object.values(decapCollectionMedia).map(({ publicFolder }) => publicFolder)).toEqual(
      Array.from({ length: 7 }, () => './'),
    );
    expect(JSON.stringify(decapCollectionMedia)).not.toContain('uploads');
    expect(decapGlobalMedia).toEqual({
      mediaFolder: 'apps/web/src/content/home',
      publicFolder: './',
      topLevelLibrary: 'hidden',
    });
  });

  it.each(Object.entries(decapMediaContentTypes))('maps %s to %s', (extension, contentType) => {
    expect(getDecapMediaContentType(`asset${extension}`)).toBe(contentType);
    expect(getDecapMediaContentType(`asset${extension.toUpperCase()}`)).toBe(contentType);
  });

  it.each(['.svg', '.ico', '.txt', ''])('rejects unsupported extension %s', (extension) => {
    expect(getDecapMediaContentType(`asset${extension}`)).toBeNull();
  });

  it.each([
    ['plain', 'hero.jpg', 'hero.jpg'],
    ['encoded filename', 'hero%20image.jpg', 'hero image.jpg'],
    ['separator', 'nested/hero.jpg', null],
    ['encoded separator', 'nested%2Fhero.jpg', null],
    ['backslash', 'nested\\hero.jpg', null],
    ['dot', '.', null],
    ['dot-dot', '..', null],
    ['double encoded traversal', '%252e%252e', null],
    ['malformed encoding', '%E0%A4%A', null],
  ])('decodes route segment %s once', (_description, input, expected) => {
    expect(decodeDecapMediaSegment(input)).toBe(expected);
  });

  it('never resolves a path outside the allowlisted collection directory', () => {
    const appRoot = 'C:\\repo\\apps\\web';
    expect(resolveDecapMediaAsset({ appRoot, collection: 'home', asset: '../settings/site.json' })).toBeNull();
    expect(resolveDecapMediaAsset({ appRoot, collection: 'uploads', asset: 'hero.jpg' })).toBeNull();
    expect(resolveDecapMediaAsset({ appRoot, collection: 'home', asset: 'hero.svg' })).toBeNull();
  });
});

describe('/admin/media route', () => {
  it('generates image paths for every allowlisted root', async () => {
    const paths = (await getStaticPaths({} as never)) as Array<{ params: { asset: string; collection: string } }>;

    for (const [collection, asset] of Object.entries(representativeAssets)) {
      expect(paths).toContainEqual({ params: { asset, collection } });
    }
    expect(new Set(paths.map(({ params }) => params.collection))).toEqual(new Set(decapCollectionMediaKeys));
    expect(paths.every(({ params }) => getDecapMediaContentType(params.asset))).toBe(true);
  });

  it.each(Object.entries(representativeAssets))(
    'serves an existing %s image with bounded cache headers',
    async (collection, asset) => {
      const response = await requestMedia(collection, asset);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe(getDecapMediaContentType(asset));
      expect(response.headers.get('cache-control')).toBe(decapMediaCacheControl);
      expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    },
  );

  it.each(Object.entries(decapMediaContentTypes))(
    'serves %s through the route response contract as %s',
    async (extension, contentType) => {
      const readAsset = async () => new Uint8Array([1, 2, 3]);
      const response = await createDecapMediaResponse({
        appRoot: process.cwd(),
        asset: `fixture${extension}`,
        collection: 'home',
        readAsset,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe(contentType);
      expect(response.headers.get('cache-control')).toBe(decapMediaCacheControl);
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    },
  );

  it('decodes a valid encoded asset name once', async () => {
    const response = await requestMedia('home', 'hero-live-band%2Ejpg');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
  });

  it('decodes a valid encoded collection key once', async () => {
    const response = await requestMedia('h%6fme', 'hero-live-band.jpg');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
  });

  it.each([
    ['unknown collection', 'uploads', 'hero-live-band.jpg'],
    ['missing asset', 'home', 'missing.jpg'],
    ['unsupported extension', 'home', 'site.json'],
    ['separator traversal', 'home', '../settings/site.json'],
    ['encoded traversal', 'home', '%2e%2e%2fsettings%2fsite.json'],
    ['encoded backslash traversal', 'home', '%2e%2e%5csettings%5csite.json'],
    ['double encoded traversal', 'home', '%252e%252e%252fsettings%252fsite.json'],
    ['encoded collection separator', 'home%2fnews', 'hero-live-band.jpg'],
    ['double encoded collection', 'h%256fme', 'hero-live-band.jpg'],
    ['encoded control character', 'home', 'hero%00.jpg'],
  ])('returns the same bounded 404 for %s', async (_description, collection, asset) => {
    const response = await requestMedia(collection, asset);

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe('Media asset not found.\n');
  });
});
