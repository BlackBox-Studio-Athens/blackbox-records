import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, test } from 'vitest';
import { readPublication, requestPublication } from './publication-journal';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});

test('persists a pending request across callers, deduplicates concurrent submissions, and rejects changed identity', async () => {
  const input = {
    id: crypto.randomUUID(),
    environment: 'local' as const,
    actorEmail: 'operator@example.com',
    requestedRevision: 'live-revision-one',
  };
  const [first, repeated] = await Promise.all([
    requestPublication(env.TEST_CMS_DB, input),
    requestPublication(env.TEST_CMS_DB, input),
  ]);
  expect(repeated).toEqual(first);
  expect(first.status).toBe('pending');
  expect(first.snapshotSha256).toBeNull();
  expect(first.deploymentId).toBeNull();
  expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toEqual(first);
  expect(await readPublication(env.TEST_CMS_DB, 'uat', input.id)).toBeNull();
  for (const patch of [
    { actorEmail: 'other@example.com' },
    { requestedRevision: 'different-revision' },
    { environment: 'uat' as const },
  ])
    await expect(requestPublication(env.TEST_CMS_DB, { ...input, ...patch })).rejects.toThrow('conflicts');
  expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toEqual(first);
  expect(
    await env.COMMERCE_DB.prepare("SELECT name FROM sqlite_master WHERE name = '_blackbox_publications'").first(),
  ).toBeNull();
});

test('rejects malformed requests and prevents Live without deployment evidence', async () => {
  const input = {
    id: crypto.randomUUID(),
    environment: 'local' as const,
    actorEmail: 'operator@example.com',
    requestedRevision: 'live-revision-two',
  };
  for (const patch of [{ requestedRevision: '' }, { actorEmail: 'invalid' }, { id: '../private' }, { status: 'live' }])
    await expect(requestPublication(env.TEST_CMS_DB, { ...input, ...patch })).rejects.toThrow();
  expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toBeNull();
  await requestPublication(env.TEST_CMS_DB, input);
  await expect(
    env.TEST_CMS_DB.prepare("UPDATE _blackbox_publications SET status = 'live' WHERE id = ?").bind(input.id).run(),
  ).rejects.toThrow();
  expect((await readPublication(env.TEST_CMS_DB, 'local', input.id))?.status).toBe('pending');
});
