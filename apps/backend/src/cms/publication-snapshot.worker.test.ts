import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach, expect, test } from 'vitest';
import { readPublication, requestPublication } from './publication-journal';
import { handlePublicationWorkflow } from './publication-routes';
import { completeSnapshot, storeSnapshotMedia } from './snapshot-storage';
import { createPrismaClient } from '../infrastructure/persistence/prisma';

test('exports only stable catalog identities behind the target publication credential', async () => {
  const db = createPrismaClient(env);
  try {
    const item = {
      sourceKind: 'release' as const,
      sourceId: 'catalog-source',
      storeItemSlug: 'stable-item',
      variantId: 'variant_catalog_export',
    };
    await db.storeItemOption.create({ data: { ...item, cmsSourceId: 'private-cms-id', catalogRevision: 1 } });
    const ctx = { ...context, commerce: env.COMMERCE_DB };
    const url = 'https://staff.example/_emdash/api/blackbox/publications/catalog';
    expect((await handlePublicationWorkflow(new Request(url), ctx)).status).toBe(403);
    const response = await handlePublicationWorkflow(
      new Request(url, { headers: { Authorization: `Bearer ${token}` } }),
      ctx,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ data: [item] });
    expect(
      (
        await handlePublicationWorkflow(
          new Request(url.replace('staff.example', 'other.example'), { headers: { Authorization: `Bearer ${token}` } }),
          ctx,
        )
      ).status,
    ).toBe(403);
  } finally {
    await db.$disconnect();
  }
});

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});
beforeEach(async () => {
  await env.TEST_CMS_DB.prepare('DELETE FROM _blackbox_publications').run();
});
const token = 'a'.repeat(64);
const context = {
  db: env.TEST_CMS_DB,
  bucket: env.TEST_SNAPSHOTS,
  environment: 'uat',
  hostname: 'staff.example',
  token,
};
const pixels = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII='),
  (character) => character.charCodeAt(0),
);
async function prepare() {
  const item = await requestPublication(env.TEST_CMS_DB, {
    id: crypto.randomUUID(),
    environment: 'uat',
    actorEmail: 'operator@example.com',
    requestedRevision: 'live-one',
  });
  const stored = await storeSnapshotMedia(env.TEST_SNAPSHOTS, 'uat', pixels);
  const snapshot = await completeSnapshot(
    env.TEST_SNAPSHOTS,
    'uat',
    JSON.stringify(manifest(stored.sha256)),
    'live-one',
  );
  const goLive = () =>
    env.TEST_CMS_DB.prepare(
      "UPDATE _blackbox_publications SET status = 'live', ci_run_id = '12345', code_sha = ?, deployment_id = ?, snapshot_sha256 = ? WHERE id = ?",
    )
      .bind('c'.repeat(40), crypto.randomUUID(), snapshot.sha256, item.id)
      .run();
  return { item, sha256: stored.sha256, json: JSON.stringify(manifest(stored.sha256)), goLive };
}
const manifest = (sha256: string) => ({
  schemaVersion: 1,
  environment: 'uat',
  records: [
    {
      collection: 'news',
      id: 'news',
      slug: 'news',
      revisionId: 'live-one',
      data: { title: 'News', date: '2026-09-14', summary: 'Copy', image: { id: 'image' }, image_alt: 'Cover' },
    },
  ],
  media: [
    { id: 'image', sha256, filename: 'cover.png', mimeType: 'image/png', size: pixels.byteLength, width: 1, height: 1 },
  ],
});

test('exports only a live snapshot and its referenced media through authenticated workflow reads', async () => {
  const { item, sha256, json, goLive } = await prepare();
  const read = (kind: string, media = sha256, credential = token) =>
    new Request(`https://staff.example/_emdash/api/blackbox/publications/${kind}`, {
      headers: {
        Authorization: `Bearer ${credential}`,
        'X-Publication-ID': item.id,
        'X-CI-Run-ID': '12345',
        'X-Snapshot-Media-SHA256': media,
      },
    });
  expect((await handlePublicationWorkflow(read('snapshot'), context)).status).toBe(409);
  await goLive();
  expect((await readPublication(env.TEST_CMS_DB, 'uat', item.id))?.status).toBe('live');
  expect((await handlePublicationWorkflow(read('snapshot', sha256, 'b'.repeat(64)), context)).status).toBe(403);
  expect(await (await handlePublicationWorkflow(read('snapshot'), context)).text()).toBe(json);
  expect(new Uint8Array(await (await handlePublicationWorkflow(read('media'), context)).arrayBuffer())).toEqual(pixels);
  expect((await handlePublicationWorkflow(read('media', 'e'.repeat(64)), context)).status).toBe(404);
  expect((await handlePublicationWorkflow(read('snapshot'), { ...context, environment: 'prd' })).status).toBe(409);
  const write = await handlePublicationWorkflow(
    new Request('https://staff.example/_emdash/api/blackbox/publications/snapshot', {
      method: 'PUT',
      body: json,
      headers: { Authorization: `Bearer ${token}` },
    }),
    context,
  );
  expect(write.status).toBe(405);
});
