import { env } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { publishedCollection } from '@blackbox/content-model';
import { PublicMedia, publicMediaBase } from './public-media';

// Other suites publish into `local`; these cases own the `prd` prefix of the shared test bucket.
const environment = 'prd';
const bucket = env.TEST_SNAPSHOTS;
const config = {
  sourceOrigin: 'https://blackbox-records-web.pages.dev',
  transformationOrigin: 'https://images.blackboxrecordsathens.com',
};
const encoder = new TextEncoder();
const hex = async (bytes: Uint8Array<ArrayBuffer>) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
const bodyText = async (response: Response) => new TextDecoder().decode(await response.arrayBuffer());
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

beforeEach(async () => {
  let cursor: string | undefined;
  do {
    const listed = await bucket.list({ prefix: `snapshots/${environment}/`, cursor });
    if (listed.objects.length) await bucket.delete(listed.objects.map((object) => object.key));
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
});

async function storeMedia(label: string, width = 1333) {
  const bytes = encoder.encode(`image bytes ${label}`);
  const sha256 = await hex(bytes);
  await bucket.put(`snapshots/${environment}/media/${sha256}`, bytes, { sha256 });
  return {
    id: label,
    sha256,
    filename: `${label}.png`,
    mimeType: 'image/png' as const,
    size: bytes.byteLength,
    width,
    height: 1600,
  };
}

type Media = Awaited<ReturnType<typeof storeMedia>>;
const record = (title: string, image: string) => ({
  collection: 'news' as const,
  id: 'story',
  slug: 'story',
  revisionId: title,
  data: { title, date: '2026-09-14', summary: 'Copy', image: { id: image }, image_alt: 'Cover' },
});

async function storeSnapshot(media: Media[], title = 'Story', accepted = true) {
  const snapshot = { schemaVersion: 1, environment, records: [record(title, media[0]!.id)], media };
  const bytes = encoder.encode(JSON.stringify(snapshot));
  const sha256 = await hex(bytes);
  await bucket.put(`snapshots/${environment}/manifest/${sha256}`, bytes, { sha256 });
  if (accepted) {
    await bucket.put(`snapshots/${environment}/accepted/${sha256}`, 'publication');
    await tick();
  }
  return { pointer: { id: crypto.randomUUID(), snapshotSha256: sha256, generation: 1 }, snapshot };
}

function countingBucket() {
  const reads = { manifests: 0, lists: 0 };
  const counted = new Proxy(bucket, {
    get(target, property) {
      if (property === 'list')
        return (...args: Parameters<R2Bucket['list']>) => {
          reads.lists++;
          return target.list(...args);
        };
      if (property === 'get')
        return (key: string) => {
          if (key.includes('/manifest/')) reads.manifests++;
          return target.get(key);
        };
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return { counted, reads };
}

const get = (path: string, host = 'https://blackbox-records-web.pages.dev') => new Request(`${host}${path}`);

it('addresses media by media SHA, so a text-only publication keeps every image URL', async () => {
  const cover = await storeMedia('cover');
  const before = await storeSnapshot([cover], 'Before');
  const after = await storeSnapshot([cover], 'After');
  expect(after.pointer.snapshotSha256).not.toBe(before.pointer.snapshotSha256);
  const src = (live: typeof before, url: string) =>
    (publishedCollection(live.snapshot, 'news', publicMediaBase(new URL(url)))[0]!.data.image as { src: string }).src;
  expect(src(before, 'https://x.test/news/story/')).toBe(`/media/content/${cover.sha256}`);
  expect(src(after, 'https://x.test/news/story/')).toBe(src(before, 'https://x.test/news/story/'));
  expect(src(after, 'http://127.0.0.1/blackbox-records/news/')).toBe(`/blackbox-records/media/content/${cover.sha256}`);

  const media = new PublicMedia(bucket, environment, config);
  for (const live of [before, after]) {
    const response = await media.media(get(''), `/media/content/${cover.sha256}`, async () => live);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(await bodyText(response)).toBe('image bytes cover');
  }
});

it('keeps unknown, draft and retired media private', async () => {
  const draft = await storeMedia('draft');
  const retired = await storeMedia('retired');
  const recent = await storeMedia('recent');
  const live = await storeMedia('live');
  await storeSnapshot([draft], 'Candidate', false);
  await storeSnapshot([retired], 'Oldest');
  for (const title of ['Older', 'Old']) await storeSnapshot([live], title);
  const previous = await storeSnapshot([recent], 'Previous');
  const current = await storeSnapshot([live], 'Current');
  const media = new PublicMedia(bucket, environment, config);
  const status = async (path: string) => {
    const response = await media.media(get(''), path, async () => current);
    await response.body?.cancel();
    return [response.status, response.headers.get('Cache-Control')];
  };

  expect(await status(`/media/content/${live.sha256}`)).toEqual([200, 'public, max-age=31536000, immutable']);
  expect(await status(`/media/content/${recent.sha256}`)).toEqual([200, 'public, max-age=31536000, immutable']);
  // Stored for a candidate that never became an accepted publication.
  expect(await status(`/media/content/${draft.sha256}`)).toEqual([404, 'no-store']);
  // Accepted, but more than three publications ago.
  expect(await status(`/media/content/${retired.sha256}`)).toEqual([404, 'no-store']);
  expect(await status(`/media/content/${'c'.repeat(64)}`)).toEqual([404, 'no-store']);
  expect(await status('/media/content/not-a-sha')).toEqual([404, 'no-store']);

  // Legacy snapshot-scoped URLs stay readable for current and recent snapshots only, and only for their own media.
  const legacy = (snapshot: string, item: Media) => `/media/content/${snapshot}/${item.sha256}`;
  expect(await status(legacy(current.pointer.snapshotSha256, live))).toEqual([
    200,
    'public, max-age=31536000, immutable',
  ]);
  expect(await status(legacy(previous.pointer.snapshotSha256, recent))).toEqual([
    200,
    'public, max-age=31536000, immutable',
  ]);
  expect(await status(legacy(previous.pointer.snapshotSha256, live))).toEqual([404, 'no-store']);
  expect(await status(legacy(current.pointer.snapshotSha256, recent))).toEqual([404, 'no-store']);
  expect(await status(legacy('d'.repeat(64), live))).toEqual([404, 'no-store']);

  const transform = await media.transformed(
    get(`/_image?href=/media/content/${draft.sha256}&w=480`),
    new URL(`https://blackbox-records-web.pages.dev/media/content/${draft.sha256}`),
    async () => current,
  );
  expect([transform.status, transform.headers.get('Cache-Control')]).toEqual([404, 'no-store']);
});

it('reads recent snapshot media once instead of re-parsing a manifest per request', async () => {
  const recent = await storeMedia('recent');
  const live = await storeMedia('live');
  const previous = await storeSnapshot([recent], 'Previous');
  const current = await storeSnapshot([live], 'Current');
  const { counted, reads } = countingBucket();
  const media = new PublicMedia(counted, environment, config);
  const paths = [
    `/media/content/${live.sha256}`,
    ...Array.from({ length: 5 }, () => `/media/content/${recent.sha256}`),
    `/media/content/${previous.pointer.snapshotSha256}/${recent.sha256}`,
    `/media/content/${'e'.repeat(64)}`,
  ];
  for (const path of paths) await (await media.media(get(''), path, async () => current)).body?.cancel();
  expect(reads).toEqual({ manifests: 1, lists: 1 });
  // Serving from the live snapshot alone needs neither a listing nor a manifest read.
  const fresh = countingBucket();
  await (
    await new PublicMedia(fresh.counted, environment, config).media(get(''), paths[0]!, async () => current)
  ).body?.cancel();
  expect(fresh.reads).toEqual({ manifests: 0, lists: 0 });
});

it('transforms only emitted widths from the canonical source, whatever the public host or URL shape', async () => {
  const cover = await storeMedia('cover', 2400);
  const live = await storeSnapshot([cover]);
  const calls: URL[] = [];
  const media = new PublicMedia(bucket, environment, config, async (url) => {
    calls.push(url);
    return new Response('optimized', { headers: { 'Content-Type': 'image/avif' } });
  });
  const image = async (host: string, href: string, width: string | null) => {
    const query = width === null ? '' : `&w=${width}`;
    const request = get(`/_image?href=${encodeURIComponent(href)}${query}`, host);
    const response = await media.transformed(request, new URL(href, host), async () => live);
    return [response.status, response.headers.get('Cache-Control'), await bodyText(response)];
  };
  const apex = 'https://blackboxrecordsathens.com';
  const canonical = `https://images.blackboxrecordsathens.com/cdn-cgi/image/width=480,format=auto/${config.sourceOrigin}/media/content/${cover.sha256}`;

  const immutable = 'public, max-age=31536000, immutable';
  expect(await image(apex, `/media/content/${cover.sha256}`, '480')).toEqual([200, immutable, 'optimized']);
  expect(await image(config.sourceOrigin, `/media/content/${cover.sha256}`, '480')).toEqual([
    200,
    immutable,
    'optimized',
  ]);
  const legacy = `/blackbox-records/media/content/${live.pointer.snapshotSha256}/${cover.sha256}`;
  expect(await image(apex, legacy, '480')).toEqual([200, immutable, 'optimized']);
  expect(calls.map(String)).toEqual([canonical, canonical, canonical]);

  expect(await image(apex, `/media/content/${cover.sha256}`, '540')).toEqual([200, immutable, 'optimized']);
  expect(await image(apex, `/media/content/${cover.sha256}`, '2400')).toEqual([200, immutable, 'optimized']);
  expect(calls.at(-1)?.pathname).toContain('/width=1800,format=auto/');
  for (const width of ['481', '0', '-1', 'abc', '1333'])
    expect(await image(apex, `/media/content/${cover.sha256}`, width), width).toEqual([404, 'no-store', 'Not found']);
  expect(calls).toHaveLength(5);
  expect(await image(apex, `/media/content/${cover.sha256}`, null)).toEqual([200, immutable, 'image bytes cover']);

  for (const href of [
    `https://foreign.test/media/content/${cover.sha256}`,
    `/media/content/${cover.sha256}?v=1`,
    `/media/content/${cover.sha256}/extra`,
    '/content/private',
  ])
    expect((await image(apex, href, '480'))[0], href).toBe(404);
  expect(calls).toHaveLength(5);
});
