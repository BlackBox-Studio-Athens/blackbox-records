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
  for (const path of paths) {
    const response = await fetch(root + path);
    const body = await response.text();
    assert.equal(response.status, 200, `${path}: ${body.slice(0, 300)}`);
    assert.equal(response.headers.get('X-Content-SHA256'), input.sha256, path);
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
  for (const path of [
    '/_emdash/api/content/news',
    '/content/',
    '/api/internal/orders',
    '/__publication/validate',
    `/media/content/${'a'.repeat(64)}/${snapshot.media[0].sha256}`,
  ]) {
    const response = await fetch(root + path);
    assert.equal(response.status, 404, path);
    await response.body?.cancel();
  }
  console.log(
    `Public runtime smoke passed: ${paths.length} pages, homepage images, private routes and unaccepted media.`,
  );
} finally {
  await worker.stop();
}
