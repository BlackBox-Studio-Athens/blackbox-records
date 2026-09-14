import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import {
  bindPublicationRun,
  completePublication,
  claimPublicationDispatch,
  readPublication,
  requestPublication,
} from '../../src/cms/publication-journal';
import { handlePublicationWorkflow } from '../../src/cms/publication-routes';

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
  const claim = await claimPublicationDispatch(env.TEST_CMS_DB, 'uat');
  await bindPublicationRun(env.TEST_CMS_DB, {
    id: item.id,
    environment: 'uat',
    dispatchToken: claim!.dispatchToken,
    ciRunId: '12345',
    codeSha: 'c'.repeat(40),
  });
  const upload = (kind: 'media' | 'snapshot', body: BodyInit, headers: Record<string, string> = {}) =>
    new Request(`https://staff.example/_emdash/api/blackbox/publications/${kind}`, {
      method: 'PUT',
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Publication-ID': item.id,
        'X-CI-Run-ID': '12345',
        'Content-Type': kind === 'media' ? 'application/octet-stream' : 'application/json',
        ...headers,
      },
    });
  return { item, upload };
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
  const { item, upload } = await prepare();
  const { sha256 } = (await (await handlePublicationWorkflow(upload('media', pixels), context)).json()) as {
    sha256: string;
  };
  const json = JSON.stringify(manifest(sha256));
  const { snapshotSha256 } = (await (await handlePublicationWorkflow(upload('snapshot', json), context)).json()) as {
    snapshotSha256: string;
  };
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
  await completePublication(env.TEST_CMS_DB, {
    id: item.id,
    environment: 'uat',
    ciRunId: '12345',
    codeSha: 'c'.repeat(40),
    snapshotSha256,
    deploymentId: crypto.randomUUID(),
  });
  expect((await handlePublicationWorkflow(read('snapshot', sha256, 'b'.repeat(64)), context)).status).toBe(403);
  expect(await (await handlePublicationWorkflow(read('snapshot'), context)).text()).toBe(json);
  expect(new Uint8Array(await (await handlePublicationWorkflow(read('media'), context)).arrayBuffer())).toEqual(pixels);
  expect((await handlePublicationWorkflow(read('media', 'e'.repeat(64)), context)).status).toBe(404);
  expect((await handlePublicationWorkflow(read('snapshot'), { ...context, environment: 'prd' })).status).toBe(409);
});

test('uploads private media and binds one complete snapshot, with write-free replay and no Live transition', async () => {
  const { item, upload } = await prepare();
  const media = await handlePublicationWorkflow(upload('media', pixels), context);
  expect(media.status).toBe(200);
  const { sha256 } = (await media.json()) as { sha256: string };
  const json = JSON.stringify(manifest(sha256));
  const response = await handlePublicationWorkflow(upload('snapshot', json), context);
  expect(response.status).toBe(200);
  const result = (await response.json()) as { id: string; snapshotSha256: string };
  expect(result).toEqual({ id: item.id, snapshotSha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  const object = await env.TEST_SNAPSHOTS.get(`snapshots/uat/manifest/${result.snapshotSha256}`);
  expect(await object!.text()).toBe(json);
  expect(object!.httpMetadata?.cacheControl).toBe('private, no-store');
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  try {
    expect(await (await handlePublicationWorkflow(upload('snapshot', json), context)).json()).toEqual(result);
    expect((await handlePublicationWorkflow(upload('snapshot', json + ' '), context)).status).toBe(409);
    expect((await handlePublicationWorkflow(upload('media', pixels), context)).status).toBe(409);
    expect(put).not.toHaveBeenCalled();
  } finally {
    put.mockRestore();
  }
  expect(await readPublication(env.TEST_CMS_DB, 'uat', item.id)).toEqual({
    ...item,
    ciRunId: '12345',
    codeSha: 'c'.repeat(40),
    snapshotSha256: result.snapshotSha256,
  });
});

test('rejects unauthorized runs, targets, missing media and foreign revisions without binding a snapshot', async () => {
  const { item, upload } = await prepare();
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  try {
    expect(
      (await handlePublicationWorkflow(upload('media', pixels, { Authorization: 'Bearer invalid' }), context)).status,
    ).toBe(403);
    expect((await handlePublicationWorkflow(upload('media', pixels, { 'X-CI-Run-ID': '54321' }), context)).status).toBe(
      409,
    );
    expect((await handlePublicationWorkflow(upload('media', pixels), { ...context, environment: 'prd' })).status).toBe(
      409,
    );
    expect(
      (await handlePublicationWorkflow(upload('media', pixels, { 'Content-Type': 'text/plain' }), context)).status,
    ).toBe(400);
    expect((await handlePublicationWorkflow(upload('snapshot', 'x'.repeat(4 * 1024 * 1024 + 1)), context)).status).toBe(
      400,
    );
    const candidate = manifest('b'.repeat(64));
    expect((await handlePublicationWorkflow(upload('snapshot', JSON.stringify(candidate)), context)).status).toBe(503);
    candidate.records[0].revisionId = 'foreign-revision';
    expect((await handlePublicationWorkflow(upload('snapshot', JSON.stringify(candidate)), context)).status).toBe(503);
    expect(put).not.toHaveBeenCalled();
  } finally {
    put.mockRestore();
  }
  expect((await readPublication(env.TEST_CMS_DB, 'uat', item.id))?.snapshotSha256).toBeNull();
});

test('requires the requested revision even with valid media, and accepts only one competing snapshot', async () => {
  const { item, upload } = await prepare();
  const { sha256 } = (await (await handlePublicationWorkflow(upload('media', pixels), context)).json()) as {
    sha256: string;
  };
  const candidate = manifest(sha256);
  expect(
    (await handlePublicationWorkflow(upload('snapshot', '\uFEFF' + JSON.stringify(candidate)), context)).status,
  ).toBe(503);
  candidate.records[0].revisionId = 'foreign-revision';
  const put = vi.spyOn(env.TEST_SNAPSHOTS, 'put');
  try {
    expect((await handlePublicationWorkflow(upload('snapshot', JSON.stringify(candidate)), context)).status).toBe(503);
    expect(put).not.toHaveBeenCalled();
  } finally {
    put.mockRestore();
  }
  candidate.records[0].revisionId = 'live-one';
  const first = JSON.stringify(candidate);
  candidate.records[0].data.title = 'Other copy';
  const replies = await Promise.all(
    [first, JSON.stringify(candidate)].map((json) => handlePublicationWorkflow(upload('snapshot', json), context)),
  );
  expect(replies.map(({ status }) => status).sort()).toEqual([200, 409]);
  const accepted = (await replies.find(({ status }) => status === 200)!.json()) as { snapshotSha256: string };
  expect((await readPublication(env.TEST_CMS_DB, 'uat', item.id))?.snapshotSha256).toBe(accepted.snapshotSha256);
});
