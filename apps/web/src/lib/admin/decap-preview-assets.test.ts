import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

import { decapCollectionMediaKeys } from './decap-media';

type PreviewAssetResolver = (input: {
  adminMediaBaseUrl: string;
  allowedCollections?: readonly string[];
  collectionKey: string;
  getAsset?: ((value: unknown) => unknown) | undefined;
  value: unknown;
}) => string;

const source = readFileSync(new URL('../../../public/admin/preview-assets.js', import.meta.url), 'utf8');
const adminMediaBaseUrl = 'http://127.0.0.1:4322/blackbox-records/admin/media/';

function loadResolver(): PreviewAssetResolver {
  const targetWindow: {
    __BLACKBOX_PREVIEW_ASSETS__?: { resolvePreviewAssetUrl: PreviewAssetResolver; supportedExtensions: string[] };
  } = {};

  runInNewContext(source, { Set, URL, window: targetWindow });

  expect(targetWindow.__BLACKBOX_PREVIEW_ASSETS__?.supportedExtensions).toEqual([
    '.avif',
    '.gif',
    '.jpeg',
    '.jpg',
    '.png',
    '.webp',
  ]);
  return targetWindow.__BLACKBOX_PREVIEW_ASSETS__!.resolvePreviewAssetUrl;
}

function resolve(value: unknown, collectionKey = 'home', getAsset?: (value: unknown) => unknown): string {
  return loadResolver()({
    value,
    getAsset,
    collectionKey,
    adminMediaBaseUrl,
    allowedCollections: decapCollectionMediaKeys,
  });
}

describe('preview asset resolution', () => {
  it.each(decapCollectionMediaKeys)(
    'resolves existing %s collection assets through the admin media route',
    (collection) => {
      expect(resolve('./cover image.jpg', collection)).toBe(`${adminMediaBaseUrl}${collection}/cover%20image.jpg`);
    },
  );

  it('resolves existing cross-collection News artwork without a broken admin URL', () => {
    expect(resolve('../releases/anarchotribal-cover.webp', 'news')).toBe(
      `${adminMediaBaseUrl}releases/anarchotribal-cover.webp`,
    );
    expect(
      resolve(
        '../releases/anarchotribal-cover.webp',
        'news',
        () => '/blackbox-records/admin/media/news/anarchotribal-cover.webp',
      ),
    ).toBe(`${adminMediaBaseUrl}releases/anarchotribal-cover.webp`);
    expect(
      resolve(
        { toString: () => '../releases/anarchotribal-cover.webp' },
        'news',
        () => '/blackbox-records/admin/media/news/anarchotribal-cover.webp',
      ),
    ).toBe(`${adminMediaBaseUrl}releases/anarchotribal-cover.webp`);
  });

  it.each(decapCollectionMediaKeys)('preserves newly selected blob and image data assets for %s', (collection) => {
    expect(resolve('blob:http://127.0.0.1:4322/asset-id', collection)).toBe('blob:http://127.0.0.1:4322/asset-id');
    expect(resolve('data:image/png;base64,cHJldmlldw==', collection)).toBe('data:image/png;base64,cHJldmlldw==');
  });

  it.each([
    ['string', 'https://cdn.example.com/art.jpg'],
    ['url object', { url: 'https://cdn.example.com/art.jpg' }],
    ['path object', { path: 'blob:http://127.0.0.1:4322/path-object' }],
    ['serializable object', { toString: (): string => 'data:image/webp;base64,cHJldmlldw==' }],
  ])('supports Decap %s asset results', (_description, asset) => {
    expect(resolve('./art.jpg', 'artists', () => asset)).toMatch(/^(https:\/\/|blob:|data:image\/)/);
  });

  it('falls back to the raw collection path when Decap returns or throws an invalid admin URL', () => {
    expect(resolve('./hero-live-band.jpg', 'home', () => '/blackbox-records/admin/hero-live-band.jpg')).toBe(
      `${adminMediaBaseUrl}home/hero-live-band.jpg`,
    );
    expect(
      resolve('./hero-live-band.jpg', 'home', () => {
        throw new Error('unsaved asset');
      }),
    ).toBe(`${adminMediaBaseUrl}home/hero-live-band.jpg`);
  });

  it('contains malformed Decap asset objects without throwing', () => {
    const malformedAsset = {} as { toString?: () => string; url?: string };
    Object.defineProperty(malformedAsset, 'url', {
      get() {
        throw new Error('asset getter failed');
      },
    });
    malformedAsset.toString = () => {
      throw new Error('asset serialization failed');
    };

    expect(resolve(malformedAsset, 'artists')).toBe('');
    expect(resolve('./artist.jpg', 'artists', () => malformedAsset)).toBe(`${adminMediaBaseUrl}artists/artist.jpg`);
  });

  it.each([
    '/blackbox-records/admin/hero.jpg',
    '/blackbox-records/admin/media/uploads/hero.jpg',
    '../releases/../../secret.jpg',
    './not-an-image.txt',
    'data:text/html,<script>alert(1)</script>',
    { url: '/blackbox-records/admin/broken.jpg' },
    null,
  ])('returns a bounded empty fallback for unsupported value %#', (value) => {
    expect(resolve(value)).toBe('');
  });
});
