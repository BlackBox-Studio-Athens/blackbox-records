import { env } from 'cloudflare:test';
import { afterEach, expect, it } from 'vitest';
import { currentPublicationKey, PublicSnapshotSelection, type PublicationPointer } from './published-storage';
import { invalidatePublicPublication, publicInvalidationPath } from './public-publication-cache';

const bucket = env.TEST_SNAPSHOTS;
const key = currentPublicationKey('local');
afterEach(async () => {
  await bucket.delete(key);
});

it('refreshes accepted Local content without requiring an unavailable edge purge API', async () => {
  const old = { id: crypto.randomUUID(), snapshotSha256: 'a'.repeat(64), generation: 1 };
  const next = { id: crypto.randomUUID(), snapshotSha256: 'b'.repeat(64), generation: 2 };
  await bucket.put(key, JSON.stringify(old));
  const selection = new PublicSnapshotSelection(bucket, 'local', null);
  expect((await selection.selected()).pointer).toEqual(old);
  await bucket.put(key, JSON.stringify(next));
  const request = () =>
    new Request(`http://127.0.0.1${publicInvalidationPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  const invalidate = (pointer: PublicationPointer) => selection.invalidate(pointer);
  const local = await invalidatePublicPublication(request(), invalidate, undefined, 'local');
  expect(local.status).toBe(200);
  expect(await local.json()).toEqual(next);
  expect((await selection.selected()).pointer).toEqual(next);
  for (const environment of ['uat', 'prd'] as const) {
    expect((await invalidatePublicPublication(request(), invalidate, undefined, environment)).status).toBe(503);
  }
  await bucket.delete(key);
  expect((await invalidatePublicPublication(request(), invalidate, undefined, 'local')).status).toBe(503);
});
