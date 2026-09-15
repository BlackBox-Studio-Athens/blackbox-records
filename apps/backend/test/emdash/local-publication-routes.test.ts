import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { handleLocalPublicationRequest, localPublicationRoot } from '../../src/cms/local-publication-routes';
import { readPublication, requestPublication } from '../../src/cms/publication-journal';

beforeAll(() => applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS));
beforeEach(async () => {
  await env.TEST_CMS_DB.prepare('DELETE FROM _blackbox_publications').run();
});
const origin = 'http://127.0.0.1:8787';
const hash = 'a'.repeat(64);
const ctx = { db: env.TEST_CMS_DB, environment: 'local', identity: { role: 30 } };
function request(action: string, body?: unknown, headers = {}) {
  return new Request(origin + localPublicationRoot + action, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, 'X-EmDash-Request': '1', 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function seed(environment: 'local' | 'uat' = 'local') {
  const id = crypto.randomUUID();
  await requestPublication(env.TEST_CMS_DB, {
    id,
    environment,
    actorEmail: 'operator@example.com',
    requestedRevision: 'revision-' + id,
  });
  return id;
}
const receipt = (id: string) =>
  vi.fn<typeof fetch>().mockResolvedValue(Response.json({ publicationId: id, sha256: hash }));

test('selects newest Local pending request and completes atomically with idempotent acknowledgements', async () => {
  expect(await (await handleLocalPublicationRequest(request('next'), ctx)).json()).toEqual({ request: null });
  const old = await seed();
  const id = await seed();
  const hosted = await seed('uat');
  expect(await (await handleLocalPublicationRequest(request('next'), ctx)).json()).toEqual({
    request: { id, revision: 'revision-' + id },
  });
  const send = receipt(id);
  expect(
    (await handleLocalPublicationRequest(request('complete', { id, snapshotSha256: hash }), ctx, send)).status,
  ).toBe(200);
  expect(send).toHaveBeenCalledWith(
    'http://127.0.0.1:4321/blackbox-records/local-publication.json',
    expect.objectContaining({ redirect: 'manual', signal: expect.any(AbortSignal) }),
  );
  expect((await readPublication(ctx.db, 'local', id))?.status).toBe('live');
  expect((await readPublication(ctx.db, 'local', old))?.status).toBe('failed');
  expect((await readPublication(ctx.db, 'uat', hosted))?.status).toBe('pending');
  expect(
    (await handleLocalPublicationRequest(request('complete', { id, snapshotSha256: hash }), ctx, send)).status,
  ).toBe(200);
  expect(send).toHaveBeenCalledTimes(1);
  expect(
    (await handleLocalPublicationRequest(request('complete', { id, snapshotSha256: 'b'.repeat(64) }), ctx)).status,
  ).toBe(409);
  expect((await handleLocalPublicationRequest(request('fail', { id }), ctx)).status).toBe(409);
  expect((await handleLocalPublicationRequest(request('fail', { id: old }), ctx)).status).toBe(200);
});

test('rejects mismatched receipts and converts unavailable or malformed receipts and D1 errors to 503', async () => {
  const id = await seed();
  const complete = () => request('complete', { id, snapshotSha256: hash });
  expect((await handleLocalPublicationRequest(complete(), ctx, receipt(crypto.randomUUID()))).status).toBe(409);
  for (const response of [
    new Response('internal error', { status: 500 }),
    new Response('not JSON'),
    new Response('x'.repeat(5000)),
  ]) {
    expect(
      (await handleLocalPublicationRequest(complete(), ctx, vi.fn<typeof fetch>().mockResolvedValue(response))).status,
    ).toBe(503);
  }
  const broken = {
    ...ctx,
    db: {
      prepare() {
        throw new Error('D1_ERROR: Failed to parse body as JSON');
      },
    } as unknown as D1Database,
  };
  expect((await handleLocalPublicationRequest(request('next'), broken)).status).toBe(503);
  expect((await readPublication(ctx.db, 'local', id))?.status).toBe('pending');
});

test('validates Local boundary, permissions, methods, CSRF and exact request bodies', async () => {
  const id = await seed();
  for (const environment of ['uat', 'prd', undefined])
    expect((await handleLocalPublicationRequest(request('next'), { ...ctx, environment })).status).toBe(403);
  expect(
    (await handleLocalPublicationRequest(new Request('http://evil.example' + localPublicationRoot + 'next'), ctx))
      .status,
  ).toBe(403);
  expect((await handleLocalPublicationRequest(request('next'), { ...ctx, identity: { role: 10 } })).status).toBe(403);
  expect(
    (await handleLocalPublicationRequest(request('fail', { id }, { Origin: 'http://evil.example' }), ctx)).status,
  ).toBe(403);
  expect((await handleLocalPublicationRequest(request('fail', { id }, { 'X-EmDash-Request': '' }), ctx)).status).toBe(
    403,
  );
  for (const body of [{ id: 'invalid' }, { id, environment: 'prd' }, { id, padding: 'x'.repeat(5000) }])
    expect((await handleLocalPublicationRequest(request('fail', body), ctx)).status).toBe(400);
  expect((await handleLocalPublicationRequest(request('complete', { id }), ctx)).status).toBe(400);
  expect((await handleLocalPublicationRequest(request('fail'), ctx)).status).toBe(405);
  expect((await handleLocalPublicationRequest(request('next?limit=1'), ctx)).status).toBe(400);
  expect((await handleLocalPublicationRequest(request('fail', { id }), ctx)).status).toBe(200);
  expect((await handleLocalPublicationRequest(request('fail', { id }), ctx)).status).toBe(200);
  expect((await handleLocalPublicationRequest(request('complete', { id, snapshotSha256: hash }), ctx)).status).toBe(
    409,
  );
});

test('rolls back completion if superseding older requests fails', async () => {
  const old = await seed();
  const id = await seed();
  await ctx.db.exec(
    "CREATE TRIGGER reject_local_failure BEFORE UPDATE ON _blackbox_publications WHEN NEW.status = 'failed' BEGIN SELECT RAISE(ABORT, 'injected failure'); END",
  );
  try {
    expect(
      (await handleLocalPublicationRequest(request('complete', { id, snapshotSha256: hash }), ctx, receipt(id))).status,
    ).toBe(503);
    expect((await readPublication(ctx.db, 'local', id))?.status).toBe('pending');
    expect((await readPublication(ctx.db, 'local', old))?.status).toBe('pending');
  } finally {
    await ctx.db.exec('DROP TRIGGER reject_local_failure');
  }
});
