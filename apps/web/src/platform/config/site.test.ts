import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({ base: '/blackbox-records/', site: undefined }));

import { createCanonicalUrl } from './site';

describe('createCanonicalUrl', () => {
  it.each(['/store', '/artists/afterwise', '/news', '/releases/disintegration', '/terms'])(
    'consolidates %s with its slash variant',
    (path) => {
      const site = new URL('https://blackboxrecordsathens.com/');
      const canonical = `https://blackboxrecordsathens.com${path}/`;
      expect(createCanonicalUrl(new URL(`https://preview.invalid${path}?utm_source=test#top`), site)).toBe(canonical);
      expect(createCanonicalUrl(new URL(`https://preview.invalid${path}/`), site)).toBe(canonical);
    },
  );

  it('preserves the application base and strips tracking queries and fragments', () => {
    expect(createCanonicalUrl(new URL('http://localhost:4321/blackbox-records/store?filter=vinyl#top'))).toBe(
      'http://localhost:4321/blackbox-records/store/',
    );
    expect(createCanonicalUrl(new URL('http://localhost:4321/blackbox-records'))).toBe(
      'http://localhost:4321/blackbox-records/',
    );
  });

  it.each([
    '/',
    '/assets/image.jpg',
    '/_image',
    '/api/store',
    '/media/content/abc',
    '/app-shell-overlay/artists/afterwise',
    '/email-preferences',
    '/store/checkout',
    '/store/item/checkout',
    '/private',
    '/artists/band/admin',
    '/unknown',
    '/store/data.json',
  ])('leaves excluded path %s unchanged', (path) => {
    expect(new URL(createCanonicalUrl(new URL(`https://site.invalid${path}?tracking=yes`))).pathname).toBe(path);
  });
});
