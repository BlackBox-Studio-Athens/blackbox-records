import { expect, it } from 'vitest';
import { deliverPublicCmsImage, publicImageTransformUrl } from '../../src/cms/public-image-transform';

const snapshot = 'a'.repeat(64);
const media = 'b'.repeat(64);
const source = new URL(`https://blackbox-records-web-uat.pages.dev/media/content/${snapshot}/${media}`);
const transformOrigin = 'https://images.blackboxrecordsathens.com';
const bodyText = async (response: Response) => new TextDecoder().decode(await response.arrayBuffer());

it('builds transformations only for approved Pages sources and responsive widths', () => {
  const transformed = publicImageTransformUrl(source, transformOrigin, 'uat', 320);
  expect(transformed?.origin).toBe(transformOrigin);
  expect(transformed?.pathname).toBe(`/cdn-cgi/image/width=320,format=auto/${source.href}`);
  expect(publicImageTransformUrl(source, transformOrigin, 'local', 320)).toBeNull();
  expect(
    publicImageTransformUrl(new URL(source.href.replace('uat.pages.dev', 'pages.dev')), transformOrigin, 'uat', 320),
  ).toBeNull();
  expect(publicImageTransformUrl(source, transformOrigin, 'uat', 321)).toBeNull();
  expect(publicImageTransformUrl(new URL(`${source.href}?token=private`), transformOrigin, 'uat', 320)).toBeNull();
  expect(publicImageTransformUrl(source, 'https://foreign.invalid', 'uat', 320)).toBeNull();
});

it('serves negotiated immutable image bytes and falls back to the original on transform failure', async () => {
  const request = new Request('https://blackbox-records-web-uat.pages.dev/_image?w=320', {
    headers: { Accept: 'image/avif,image/webp,*/*' },
  });
  let calledUrl: URL | undefined;
  let calledAccept: string | null = null;
  let originalReads = 0;
  const transformed = await deliverPublicCmsImage(
    request,
    source,
    'uat',
    transformOrigin,
    async () => {
      originalReads++;
      return new Response('original', { headers: { 'Content-Type': 'image/jpeg' } });
    },
    async (url, imageRequest) => {
      calledUrl = url;
      calledAccept = imageRequest.headers.get('Accept');
      return new Response('optimized', {
        headers: { 'Content-Type': 'image/webp; charset=binary', Vary: 'Accept-Language' },
      });
    },
  );
  expect(await bodyText(transformed)).toBe('optimized');
  expect(calledUrl?.origin).toBe(transformOrigin);
  expect(calledAccept).toBe('image/avif,image/webp,*/*');
  expect(originalReads).toBe(0);
  expect(transformed.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  expect(transformed.headers.get('Vary')).toBe('accept-language, accept');

  const fallback = await deliverPublicCmsImage(
    request,
    source,
    'uat',
    transformOrigin,
    async () => {
      originalReads++;
      return new Response('original', { headers: { 'Content-Type': 'image/jpeg' } });
    },
    async () => new Response('rejected', { status: 403, headers: { 'Content-Type': 'text/plain' } }),
  );
  expect(await bodyText(fallback)).toBe('original');
  expect(originalReads).toBe(1);
});

it('skips transforms for unsupported requests and returns bodyless HEAD responses', async () => {
  let transforms = 0;
  const original = async () => new Response('original', { headers: { 'Content-Type': 'image/jpeg' } });
  const unsupported = await deliverPublicCmsImage(
    new Request('https://blackbox-records-web-uat.pages.dev/_image?w=999'),
    source,
    'uat',
    transformOrigin,
    original,
    async () => {
      transforms++;
      return new Response('optimized', { headers: { 'Content-Type': 'image/webp' } });
    },
  );
  expect(await bodyText(unsupported)).toBe('original');
  expect(transforms).toBe(0);

  const head = await deliverPublicCmsImage(
    new Request('https://blackbox-records-web-uat.pages.dev/_image?w=320', { method: 'HEAD' }),
    source,
    'uat',
    transformOrigin,
    original,
    async () => new Response(null, { headers: { 'Content-Type': 'image/avif' } }),
  );
  expect(head.status).toBe(200);
  expect(head.body).toBeNull();
});
