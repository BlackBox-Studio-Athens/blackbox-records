import { createHash } from 'node:crypto';
import { env } from 'cloudflare:test';
import { beforeEach, expect, test, vi } from 'vitest';
import { productEnvironmentProfiles } from '../../src/env';
import {
  handleItemArtwork,
  itemArtworkPath,
  publishedMediaPath,
  servePublishedMedia,
} from '../../src/cms/item-artwork';
import { storeSnapshotMedia } from '../../src/cms/snapshot-storage';

const pixels = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII='),
  (character) => character.charCodeAt(0),
);
const sha256 = createHash('sha256').update(pixels).digest('hex');
const command = { collection: 'releases', entryId: 'release-one', _rev: 'saved-one' };
const headers = { Origin: 'https://staff.example', 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const post = (body: unknown = command, requestHeaders: HeadersInit = headers) =>
  new Request('https://staff.example' + itemArtworkPath, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
const publicRequest = (suffix = sha256, method = 'GET') =>
  new Request(productEnvironmentProfiles.UAT.publicBackendOrigin + publishedMediaPath + suffix, { method });
const serve = (request: Request, profile = productEnvironmentProfiles.UAT) =>
  servePublishedMedia(request, env.TEST_SNAPSHOTS, profile);
function context(collection: 'releases' | 'distro' = 'releases') {
  const entry = {
    id: 'release-one',
    status: 'draft',
    draftRevisionId: null,
    liveRevisionId: null,
    data: {
      [collection === 'releases' ? 'cover_image' : 'image']: {
        id: 'cover-one',
        url: 'https://foreign.example/never-fetch',
      },
    },
  };
  const record = { item: entry, _rev: 'saved-one' };
  const media = {
    id: 'cover-one',
    filename: 'cover.png',
    mimeType: 'image/png',
    size: pixels.byteLength,
    storageKey: 'originals/cover.png',
    status: 'ready',
    contentHash: 'sha1:' + createHash('sha1').update(pixels).digest('hex'),
  };
  return {
    bucket: env.TEST_SNAPSHOTS,
    profile: productEnvironmentProfiles.UAT,
    identity: { role: 30 },
    entry,
    record,
    media,
    fetchCms: vi.fn(async (path: string) => {
      if (path === `/_emdash/api/content/${collection}/release-one`) return Response.json({ data: record });
      if (path === '/_emdash/api/media/cover-one') return Response.json({ data: { item: media } });
      if (path === '/_emdash/api/media/file/originals%2Fcover.png') return new Response(pixels);
      throw new Error('Unexpected CMS path: ' + path);
    }),
  };
}
beforeEach(async () => {
  for (const object of (await env.TEST_SNAPSHOTS.list()).objects) await env.TEST_SNAPSHOTS.delete(object.key);
});

test('approves only the selected saved artwork, replays without writes, and serves immutable bytes without exposing private snapshots', async () => {
  await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'uat', pixels);
  expect((await serve(publicRequest())).status).toBe(404);
  const ctx = context();
  const response = await handleItemArtwork(post(), ctx);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ _rev: 'saved-one', imageUrl: publicRequest().url });
  expect((await handleItemArtwork(post({ ...command, collection: 'distro' }), context('distro'))).status).toBe(200);
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  try {
    expect((await handleItemArtwork(post(), ctx)).status).toBe(200);
    expect(put).not.toHaveBeenCalled();
  } finally {
    put.mockRestore();
  }
  const image = await serve(publicRequest());
  expect(image.status).toBe(200);
  expect(image.headers.get('Content-Type')).toBe('image/png');
  expect(image.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  expect(image.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(new Uint8Array(await image.arrayBuffer())).toEqual(pixels);
  expect(await (await serve(publicRequest(sha256, 'HEAD'))).text()).toBe('');
  expect(
    (
      await serve(
        new Request(productEnvironmentProfiles.PRD.publicBackendOrigin + publishedMediaPath + sha256),
        productEnvironmentProfiles.PRD,
      )
    ).status,
  ).toBe(404);
  for (const suffix of [
    '',
    'originals%2Fcover.png',
    '../snapshots/uat/media/' + sha256,
    sha256 + '?key=private',
    'a'.repeat(64),
  ])
    expect((await serve(publicRequest(suffix))).status).toBe(404);
  expect((await serve(publicRequest(sha256, 'POST'))).status).toBe(404);
  expect((await serve(new Request('https://foreign.example' + publishedMediaPath + sha256))).status).toBe(404);
});

test('rejects untrusted approval commands and stale or mismatched revisions before making anything public', async () => {
  const ctx = context();
  expect((await handleItemArtwork(post(), { ...ctx, identity: { role: 10 } })).status).toBe(403);
  expect((await handleItemArtwork(post(command, { ...headers, Origin: 'https://foreign.example' }), ctx)).status).toBe(
    403,
  );
  expect((await handleItemArtwork(post(command, {}), ctx)).status).toBe(403);
  for (const body of [
    { ...command, collection: 'news' },
    { ...command, url: 'https://foreign.example' },
    { ...command, mediaId: 'other-image' },
    { ...command, padding: 'x'.repeat(5000) },
  ])
    expect((await handleItemArtwork(post(body), ctx)).status).toBe(400);
  expect(ctx.fetchCms).not.toHaveBeenCalled();
  ctx.record._rev = 'newer-draft';
  expect((await handleItemArtwork(post(), ctx)).status).toBe(409);
  ctx.record._rev = 'saved-one';
  ctx.entry.id = 'other-item';
  expect((await handleItemArtwork(post(), ctx)).status).toBe(409);
  expect((await env.TEST_SNAPSHOTS.list()).objects).toHaveLength(0);
});

test('does not approve corrupted media or a source changed while its artwork was being read', async () => {
  for (const change of ['hash', 'size', 'type', 'revision']) {
    const ctx = context();
    if (change === 'hash') ctx.media.contentHash = 'sha1:' + 'a'.repeat(40);
    if (change === 'size') ctx.media.size--;
    if (change === 'type') ctx.media.mimeType = 'image/jpeg';
    if (change === 'revision') {
      const fetch = ctx.fetchCms.getMockImplementation()!;
      ctx.fetchCms.mockImplementation(async (path) => {
        const response = await fetch(path);
        if (path.includes('/file/')) ctx.record._rev = 'newer-draft';
        return response;
      });
    }
    expect((await handleItemArtwork(post(), ctx)).status).toBe(change === 'revision' ? 409 : 503);
    expect((await env.TEST_SNAPSHOTS.list()).objects).toHaveLength(0);
  }
});
