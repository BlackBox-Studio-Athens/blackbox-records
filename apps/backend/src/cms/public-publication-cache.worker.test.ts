import { createExecutionContext, env } from 'cloudflare:test';
import { afterEach, expect, it, vi } from 'vitest';
import { PublicSnapshotSelection, currentPublicationKey, type PublicationPointer } from './published-storage';
import { invalidatePublicPublication, publicInvalidationPath, publicPublicationTags } from './public-publication-cache';

const bucket = env.TEST_SNAPSHOTS;
const key = currentPublicationKey('uat');
const pointer: PublicationPointer = { id: crypto.randomUUID(), snapshotSha256: 'a'.repeat(64), generation: 1 };
const request = (body: unknown = pointer) =>
  new Request(`https://site.invalid${publicInvalidationPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
afterEach(async () => {
  await bucket.delete(key);
  vi.restoreAllMocks();
});

it('fails closed for malformed, oversized, queried and non-POST requests without purging', async () => {
  const invalidate = vi.fn(async () => {});
  const cache = { purge: vi.fn(async () => ({ success: true, errors: [] })) };
  for (const input of [
    request({ ...pointer, tags: ['attacker'] }),
    request({ ...pointer, generation: -1 }),
    request({ ...pointer, id: 'draft' }),
    request('x'.repeat(4097)),
    new Request(`https://site.invalid${publicInvalidationPath}?purge=all`, request()),
    new Request(`https://site.invalid${publicInvalidationPath}`, { method: 'POST', body: '{' }),
    new Request(`https://site.invalid${publicInvalidationPath}`, { method: 'POST', body: JSON.stringify(pointer) }),
  ]) {
    const response = await invalidatePublicPublication(input, invalidate, cache);
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  }
  expect((await invalidatePublicPublication(new Request(request().url), invalidate, cache)).status).toBe(405);
  expect(invalidate).not.toHaveBeenCalled();
  expect(cache.purge).not.toHaveBeenCalled();
});

it('never purges without an active pointer, and reports missing API and rejected results as retryable', async () => {
  const selection = new PublicSnapshotSelection(bucket, 'uat', pointer);
  const invalidate = (value: typeof pointer) => selection.invalidate(value);
  const cache = { purge: vi.fn(async () => ({ success: false, errors: [{ code: 1, message: 'rate limited' }] })) };
  expect((await invalidatePublicPublication(request(), invalidate, cache)).status).toBe(503);
  expect(cache.purge).not.toHaveBeenCalled();
  await bucket.put(key, JSON.stringify(pointer));
  expect((await invalidatePublicPublication(request(), invalidate, undefined)).status).toBe(503);
  expect((await invalidatePublicPublication(request(), invalidate, cache)).status).toBe(503);
  expect((await selection.selected()).pointer).toEqual(pointer);
});

it('tags published HTML for publication-wide purge and release/snapshot identity', () => {
  expect(publicPublicationTags('b'.repeat(40), pointer.snapshotSha256)).toEqual([
    'blackbox-publication',
    `release-${'b'.repeat(40)}`,
    `publication-${pointer.snapshotSha256}`,
  ]);
});

it('allows only Local to finish without an edge API after verifying the active pointer', async () => {
  const selection = new PublicSnapshotSelection(bucket, 'uat', null);
  const invalidate = (value: typeof pointer) => selection.invalidate(value);
  expect((await invalidatePublicPublication(request(), invalidate, undefined, 'local')).status).toBe(503);
  await bucket.put(key, JSON.stringify(pointer));
  const response = await invalidatePublicPublication(request(), invalidate, undefined, 'local');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(pointer);
  expect((await selection.selected()).pointer).toEqual(pointer);
  for (const environment of ['uat', 'prd'] as const)
    expect((await invalidatePublicPublication(request(), invalidate, undefined, environment)).status).toBe(503);
  const cache = { purge: vi.fn(async () => ({ success: false, errors: [] })) };
  expect((await invalidatePublicPublication(request(), invalidate, cache, 'local')).status).toBe(503);
  expect(cache.purge).toHaveBeenCalledTimes(1);
});

it('records the installed workerd purge API capability without claiming hosted purge acceptance', async () => {
  const context = createExecutionContext();
  // The local harness may omit Workers Caching entirely. Never substitute Cache API/zone purge.
  if (!context.cache) {
    expect(context.cache).toBeUndefined();
    console.log('Local Workers Cache: execution context.cache is unavailable.');
    return;
  }
  const result = await context.cache.purge({ tags: ['blackbox-publication'] });
  expect(typeof result.success).toBe('boolean');
  console.log('Local Workers Cache purge result:', JSON.stringify(result));
});
