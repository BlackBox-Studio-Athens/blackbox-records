import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, test } from 'vitest';
import {
  bindPublicationRun,
  claimPublicationDispatch,
  readPublication,
  requestPublication,
} from '../../src/cms/publication-journal';

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

test('serializes dispatch, recovers an expired attempt, and binds only one verified CI run', async () => {
  const input = {
    id: crypto.randomUUID(),
    environment: 'local' as const,
    actorEmail: 'operator@example.com',
    requestedRevision: 'dispatch-revision',
  };
  const saved = await requestPublication(env.TEST_CMS_DB, input);
  const now = Date.now();
  const attempts = await Promise.all([
    claimPublicationDispatch(env.TEST_CMS_DB, 'local', now),
    claimPublicationDispatch(env.TEST_CMS_DB, 'local', now),
  ]);
  expect(attempts.filter(Boolean)).toHaveLength(1);
  const first = attempts.find((attempt) => attempt !== null)!;
  expect(first.id).toBe(input.id);
  expect(first.requestedRevision).toBe(input.requestedRevision);
  expect(await claimPublicationDispatch(env.TEST_CMS_DB, 'local', now + 299_999)).toBeNull();
  expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toEqual(saved);
  const run = { id: input.id, environment: input.environment, dispatchToken: first.dispatchToken, ciRunId: '1234' };
  expect(await bindPublicationRun(env.TEST_CMS_DB, { ...run, environment: 'uat' }, now)).toBe(false);
  expect(await bindPublicationRun(env.TEST_CMS_DB, run, now + 300_000)).toBe(false);
  const retried = await claimPublicationDispatch(env.TEST_CMS_DB, 'local', now + 300_000);
  expect(retried?.id).toBe(input.id);
  expect(retried?.dispatchToken).not.toBe(first.dispatchToken);
  expect(await bindPublicationRun(env.TEST_CMS_DB, run, now + 300_001)).toBe(false);
  const recovered = { ...run, dispatchToken: retried!.dispatchToken };
  const competing = await Promise.all([
    bindPublicationRun(env.TEST_CMS_DB, recovered, now + 300_001),
    bindPublicationRun(env.TEST_CMS_DB, { ...recovered, ciRunId: '5678' }, now + 300_001),
  ]);
  expect(competing.filter(Boolean)).toHaveLength(1);
  const retainedRun = competing[0] ? '1234' : '5678';
  expect(await bindPublicationRun(env.TEST_CMS_DB, { ...recovered, ciRunId: retainedRun }, now + 900_000)).toBe(true);
  expect(await claimPublicationDispatch(env.TEST_CMS_DB, 'local', now + 900_000)).toBeNull();
  expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toEqual({ ...saved, ciRunId: retainedRun });
  for (const ciRunId of ['', '0', '../runs/123', '1e4', '9'.repeat(21)])
    await expect(bindPublicationRun(env.TEST_CMS_DB, { ...recovered, ciRunId }, now)).rejects.toThrow();
});

test('dispatches the latest waiting request without reviving an older request after the latest finishes', async () => {
  const makeRequest = () =>
    requestPublication(env.TEST_CMS_DB, {
      id: crypto.randomUUID(),
      environment: 'uat',
      actorEmail: 'operator@example.com',
      requestedRevision: crypto.randomUUID(),
    });
  const older = await makeRequest();
  const latest = await makeRequest();
  const now = Date.now();
  const first = await claimPublicationDispatch(env.TEST_CMS_DB, 'uat', now);
  expect(first?.id).toBe(latest.id);
  const newer = await makeRequest();
  expect(await claimPublicationDispatch(env.TEST_CMS_DB, 'uat', now + 1)).toBeNull();
  const next = await claimPublicationDispatch(env.TEST_CMS_DB, 'uat', now + 300_000);
  expect(next?.id).toBe(newer.id);
  await env.TEST_CMS_DB.prepare("UPDATE _blackbox_publications SET status = 'failed' WHERE id = ?")
    .bind(newer.id)
    .run();
  expect(await claimPublicationDispatch(env.TEST_CMS_DB, 'uat', now + 600_000)).toBeNull();
  expect((await readPublication(env.TEST_CMS_DB, 'uat', older.id))?.status).toBe('pending');
  expect((await readPublication(env.TEST_CMS_DB, 'uat', latest.id))?.status).toBe('pending');
  expect(await claimPublicationDispatch(env.TEST_CMS_DB, 'prd', now)).toBeNull();
  await expect(claimPublicationDispatch(env.TEST_CMS_DB, 'uat', Number.NaN)).rejects.toThrow();
});
