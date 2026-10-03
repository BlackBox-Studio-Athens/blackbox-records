import { expect, it } from 'vitest';
import {
  deliverPublicCmsImage,
  isPublicImageRequestWidth,
  parsePublicMediaPath,
  publicImageTransformUrl,
  type PublicImageProfile,
} from './public-image-transform';

const snapshot = 'a'.repeat(64);
const media = 'b'.repeat(64);
const sourceOrigin = 'https://blackbox-records-web-uat.pages.dev';
const config = { sourceOrigin, transformationOrigin: 'https://images.blackboxrecordsathens.com' };
const source = `${sourceOrigin}/media/content/${media}`;
const bodyText = async (response: Response) => new TextDecoder().decode(await response.arrayBuffer());
const original = async () => new Response('original', { headers: { 'Content-Type': 'image/jpeg' } });

it('parses media-SHA paths and the legacy snapshot-scoped shape', () => {
  expect(parsePublicMediaPath(`/media/content/${media}`)).toEqual({ mediaSha256: media });
  expect(parsePublicMediaPath(`/media/content/${snapshot}/${media}`)).toEqual({
    mediaSha256: media,
    snapshotSha256: snapshot,
  });
  for (const path of [`/media/content/${media}/`, `/media/content/${media.toUpperCase()}`, '/media/content/abc'])
    expect(parsePublicMediaPath(path)).toBeNull();
});

it('uses fixed semantic profiles with one metadata ceiling and one blurred-fill width', () => {
  expect(publicImageTransformUrl(media, config, 540, 'editorial')?.pathname).toBe(
    `/cdn-cgi/image/width=640,format=webp,quality=68/${source}`,
  );
  expect(publicImageTransformUrl(media, config, 176, 'webp')?.pathname).toBe(
    `/cdn-cgi/image/width=240,format=webp/${source}`,
  );
  expect(publicImageTransformUrl(media, config, 160, 'blur')?.pathname).toBe(
    `/cdn-cgi/image/width=160,format=webp,quality=40/${source}`,
  );
  expect(publicImageTransformUrl(media, config, 1000, 'metadata')?.pathname).toBe(
    `/cdn-cgi/image/width=1200,format=jpeg/${source}`,
  );
  expect(publicImageTransformUrl(media, config, 480, 'blur')).toBeNull();
  expect(publicImageTransformUrl(media, config, 1400, 'metadata')).toBeNull();
  expect(publicImageTransformUrl(media, config, 480, 'arbitrary' as PublicImageProfile)).toBeNull();
  expect(publicImageTransformUrl(media, config, 480, 'constructor' as PublicImageProfile)).toBeNull();
});

it('accepts only widths the image components emit, plus the intrinsic src fallback', () => {
  for (const width of ['96', '144', '176', '216', '480', '540', '1800'])
    expect(isPublicImageRequestWidth(width, 2400)).toBe(true);
  expect(isPublicImageRequestWidth('2400', 2400)).toBe(true);
  for (const width of ['481', '0', '-480', '480.0', '0480', '', 'abc', '2400'])
    expect(isPublicImageRequestWidth(width, 1333)).toBe(false);
});

it('keys transformations to the configured canonical source, never the request host', () => {
  const transformed = publicImageTransformUrl(media, config, 320);
  expect(transformed?.origin).toBe(config.transformationOrigin);
  expect(transformed?.pathname).toBe(`/cdn-cgi/image/width=320,format=auto/${source}`);
  const apex = publicImageTransformUrl(media, { ...config, sourceOrigin: 'https://blackboxrecordsathens.com' }, 320);
  expect(apex?.pathname).toBe(
    `/cdn-cgi/image/width=320,format=auto/https://blackboxrecordsathens.com/media/content/${media}`,
  );
  const widthOf = (width: number) => publicImageTransformUrl(media, config, width)?.pathname;
  expect(widthOf(321)).toBe(`/cdn-cgi/image/width=360,format=auto/${source}`);
  expect(widthOf(80)).toBe(`/cdn-cgi/image/width=96,format=auto/${source}`);
  expect(widthOf(5000)).toBe(`/cdn-cgi/image/width=1800,format=auto/${source}`);
  expect(widthOf(0)).toBeUndefined();
  expect(widthOf(Number.NaN)).toBeUndefined();
  for (const invalid of [
    '',
    'http://blackbox-records-web-uat.pages.dev',
    `${sourceOrigin}/base/`,
    `${sourceOrigin}/?x=1`,
  ])
    expect(publicImageTransformUrl(media, { ...config, sourceOrigin: invalid }, 320), invalid).toBeNull();
  expect(
    publicImageTransformUrl(media, { ...config, transformationOrigin: 'https://foreign.invalid' }, 320),
  ).toBeNull();
  expect(publicImageTransformUrl('not-a-sha', config, 320)).toBeNull();
});

it('serves negotiated immutable image bytes and a bounded original fallback on transform failure', async () => {
  const request = new Request('https://blackboxrecordsathens.com/_image?w=320', {
    headers: { Accept: 'image/avif,image/webp,*/*' },
  });
  let calledUrl: URL | undefined;
  let calledAccept: string | null = null;
  let originalReads = 0;
  const countedOriginal = async () => {
    originalReads++;
    return original();
  };
  const transformed = await deliverPublicCmsImage(
    request,
    media,
    320,
    config,
    countedOriginal,
    async (url, imageRequest) => {
      calledUrl = url;
      calledAccept = imageRequest.headers.get('Accept');
      return new Response('optimized', {
        headers: { 'Content-Type': 'image/webp; charset=binary', Vary: 'Accept-Language' },
      });
    },
  );
  expect(await bodyText(transformed)).toBe('optimized');
  expect(calledUrl?.href).toBe(`${config.transformationOrigin}/cdn-cgi/image/width=320,format=auto/${source}`);
  expect(calledAccept).toBe('image/avif,image/webp,*/*');
  expect(originalReads).toBe(0);
  expect(transformed.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  expect(transformed.headers.get('Vary')).toBe('accept-language, accept');

  // e.g. error 9422 past the monthly Images quota: the original is served, but never pinned immutably.
  const fallback = await deliverPublicCmsImage(
    request,
    media,
    320,
    config,
    countedOriginal,
    async () => new Response('rejected', { status: 403, headers: { 'Content-Type': 'text/plain' } }),
  );
  expect(await bodyText(fallback)).toBe('original');
  expect(fallback.headers.get('Cache-Control')).toBe('public, max-age=300');
  expect(fallback.headers.get('X-Blackbox-Image')).toBe('original-fallback');
  expect(originalReads).toBe(1);

  const misconfigured = await deliverPublicCmsImage(
    request,
    media,
    320,
    { ...config, sourceOrigin: '' },
    original,
    async () => {
      throw new Error('A misconfigured source must not reach Images.');
    },
  );
  expect(await bodyText(misconfigured)).toBe('original');
  expect(misconfigured.headers.get('Cache-Control')).toBe('public, max-age=300');

  const unavailable = await deliverPublicCmsImage(
    request,
    media,
    320,
    config,
    async () => new Response('Not found', { status: 404 }),
    async () => {
      throw new Error('Transform unavailable.');
    },
  );
  expect(unavailable.status).toBe(404);
  expect(unavailable.headers.get('Cache-Control')).toBe('no-store');
});

it('keeps originals without a width or transformation host and returns bodyless HEAD responses', async () => {
  const transformedUrls: URL[] = [];
  const transform = async (url: URL) => {
    transformedUrls.push(url);
    return new Response('optimized', { headers: { 'Content-Type': 'image/webp' } });
  };
  const request = new Request('https://blackbox-records-web-uat.pages.dev/_image');
  const withoutWidth = await deliverPublicCmsImage(request, media, null, config, original, transform);
  expect(await bodyText(withoutWidth)).toBe('original');
  expect(withoutWidth.headers.get('Cache-Control')).toBeNull();
  const local = await deliverPublicCmsImage(
    request,
    media,
    320,
    { sourceOrigin: '', transformationOrigin: '' },
    original,
    transform,
  );
  expect(await bodyText(local)).toBe('original');
  expect(transformedUrls).toHaveLength(0);

  const head = await deliverPublicCmsImage(
    new Request('https://blackbox-records-web-uat.pages.dev/_image?w=320', { method: 'HEAD' }),
    media,
    320,
    config,
    original,
    async () => new Response(null, { headers: { 'Content-Type': 'image/avif' } }),
  );
  expect(head.status).toBe(200);
  expect(head.body).toBeNull();
});
