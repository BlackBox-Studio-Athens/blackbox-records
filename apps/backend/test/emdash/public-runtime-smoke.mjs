import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { getPlatformProxy, unstable_dev } from 'wrangler';
import { parseContentSnapshot } from '@blackbox/content-model';

const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
const json = await readFile(input.path, 'utf8');
const digest = (data) => createHash('sha256').update(data).digest('hex');
assert.equal(digest(json), input.sha256);
const snapshot = parseContentSnapshot(json, 'local');
const persistTo = resolve('../../.codex-artifacts', `ps-${randomUUID().slice(0, 8)}`);
await mkdir(persistTo, { recursive: true });
const config = resolve('dist-public/server/wrangler.json');
const storageConfig = resolve(persistTo, 'storage.json');
await writeFile(
  storageConfig,
  JSON.stringify({
    name: 'public-smoke-storage',
    compatibility_date: '2026-08-31',
    r2_buckets: JSON.parse(await readFile(config, 'utf8')).r2_buckets,
  }),
);
const proxy = await getPlatformProxy({
  configPath: storageConfig,
  persist: { path: resolve(persistTo, 'v3') },
  envFiles: [],
});
const bucket = proxy.env.MEDIA;
const pointer = { id: randomUUID(), snapshotSha256: input.sha256, generation: 1 };
const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
for (const media of snapshot.media) {
  const bytes = await readFile(resolve(dirname(input.path), 'media', `${media.sha256}.${extensions[media.mimeType]}`));
  assert.equal(digest(bytes), media.sha256);
  await bucket.put(`snapshots/local/media/${media.sha256}`, bytes, { sha256: media.sha256 });
}
await bucket.put(`snapshots/local/manifest/${input.sha256}`, json, { sha256: input.sha256 });
await bucket.put('snapshots/local/current.json', JSON.stringify(pointer));
await proxy.dispose();
const worker = await unstable_dev(resolve('dist-public/server/entry.mjs'), {
  config,
  ip: '127.0.0.1',
  port: 8798,
  local: true,
  persist: true,
  persistTo,
  envFiles: [],
  logLevel: 'error',
  experimental: { disableExperimentalWarning: true },
});
try {
  const root = 'http://127.0.0.1:8798/blackbox-records';
  const paths = ['/', '/artists/', '/releases/', '/news/', '/about/', '/services/', '/store/', '/sitemap.xml'];
  for (const record of snapshot.records.filter((record) =>
    ['artists', 'releases', 'news'].includes(record.collection),
  )) {
    paths.push(`/${record.collection}/${record.slug}/`, `/app-shell-overlay/${record.collection}/${record.slug}/`);
  }
  for (const item of snapshot.storeItems ?? []) paths.push(`/store/${item.storeItemSlug}/`);
  const releasePages = new Map();
  for (const path of paths) {
    const response = await fetch(root + path);
    const body = await response.text();
    assert.equal(response.status, 200, `${path}: ${body.slice(0, 300)}`);
    if (path === '/sitemap.xml') {
      assert.match(response.headers.get('Content-Type') ?? '', /^application\/xml/);
      assert.ok(body.includes('<urlset'), path);
    } else {
      assert.equal(response.headers.get('X-Content-SHA256'), input.sha256, path);
      assert.equal(
        response.headers.get('Cache-Control'),
        'public, max-age=0, s-maxage=30, stale-while-revalidate=30',
        path,
      );
    }
    if (path.startsWith('/releases/')) releasePages.set(path, body);
    if (path === '/') {
      const images = [...body.matchAll(/<img[^>]*src="([^"]+)"/g)].map((match) => match[1].replaceAll('&amp;', '&'));
      for (const source of images) {
        const image = await fetch(new URL(source, root));
        assert.equal(image.status, 200, source);
        assert.match(image.headers.get('Content-Type') ?? '', /^image\//);
        await image.body?.cancel();
      }
    }
  }
  const showcaseUrl = root + '/preorder-showcase.json';
  const showcase = await fetch(showcaseUrl);
  assert.equal(showcase.status, 200);
  assert.match(showcase.headers.get('Content-Type') ?? '', /^application\/json/);
  assert.equal(showcase.headers.get('X-Content-SHA256'), input.sha256);
  assert.equal(showcase.headers.get('Cache-Control'), 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
  const etag = showcase.headers.get('ETag');
  assert.match(etag ?? '', /^W\/"[a-f0-9]{64}"$/);
  assert.ok(showcase.headers.get('Cache-Tag')?.includes(`publication-${input.sha256}`));
  const candidates = await showcase.json();
  const releaseItems = (snapshot.storeItems ?? []).filter((item) => item.sourceKind === 'release');
  assert.deepEqual(candidates.map((item) => item.slug).sort(), releaseItems.map((item) => item.storeItemSlug).sort());
  for (const item of releaseItems) {
    const record = snapshot.records.find((entry) => entry.collection === 'releases' && entry.slug === item.sourceId);
    const candidate = candidates.find((entry) => entry.slug === item.storeItemSlug);
    const clips = record.data.clips ?? [];
    assert.equal(candidate.firstClipId, clips[0]?.youtube_video_id ?? null);
    assert.deepEqual(
      candidate.clips.map((clip) => clip.id),
      clips.map((clip) => clip.youtube_video_id),
    );
    for (const clip of clips)
      assert.ok(releasePages.get(`/releases/${record.slug}/`)?.includes(clip.youtube_video_id), record.slug);
  }
  const head = await fetch(showcaseUrl, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('ETag'), etag);
  assert.equal(await head.text(), '');
  assert.deepEqual(await (await fetch(showcaseUrl)).json(), candidates);
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(showcaseUrl, { method, headers: { 'If-None-Match': etag } });
    assert.equal(response.status, 304, method);
    assert.equal(response.headers.get('ETag'), etag);
    assert.equal(await response.text(), '', method);
  }
  for (const path of [
    '/_emdash/api/content/news',
    '/content/',
    '/api/internal/orders',
    '/__publication/validate',
    `/media/content/${'a'.repeat(64)}/${snapshot.media[0].sha256}`,
  ]) {
    const response = await fetch(root + path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('Cache-Control'), 'no-store', path);
    await response.body?.cancel();
  }
  console.log(
    `Public runtime smoke passed: ${paths.length} pages, ${candidates.length} showcase candidates with GET/HEAD/304, homepage images, private routes and unaccepted media.`,
  );
} finally {
  await worker.stop();
}
