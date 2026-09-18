import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, test, vi } from 'vitest';
import { handlePublicationRequest } from '../../src/cms/publication-routes';
import { readPublication } from '../../src/cms/publication-journal';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});
const root = 'https://staff.example/_emdash/api/blackbox/publications';
const headers = { Origin: 'https://staff.example', 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const post = (body: unknown, extra: HeadersInit = headers) =>
  new Request(root, { method: 'POST', headers: extra, body: JSON.stringify(body) });
function context() {
  return {
    db: env.TEST_CMS_DB,
    environment: 'local' as const,
    identity: { email: 'operator@example.com', role: 30 },
    fetchCms: vi.fn(async (path: string) =>
      Response.json({
        data: {
          item: path.includes('/revisions/')
            ? { id: 'live-one', collection: 'news', entryId: 'news-one' }
            : { id: 'news-one', status: 'published', liveRevisionId: 'live-one' },
        },
      }),
    ),
  };
}

test('requests publication with verified identities, preserves replay after later CMS changes, and reads honest status', async () => {
  const input = { id: crypto.randomUUID(), requestedRevision: 'live-one' };
  const ctx = context();
  const onAccepted = vi.fn();
  Object.assign(ctx, { onAccepted });
  const response = await handlePublicationRequest(post(input), ctx);
  expect(response.status).toBe(202);
  expect(onAccepted).toHaveBeenCalledTimes(1);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  const result = await response.json();
  expect(result).toEqual({ id: input.id, status: 'pending', requestedAt: expect.any(Number) });
  expect(ctx.fetchCms.mock.calls.map(([path]) => path)).toEqual([
    '/_emdash/api/revisions/live-one',
    '/_emdash/api/content/news/news-one',
  ]);
  ctx.fetchCms.mockImplementation(async () => {
    throw new Error('CMS changed after acceptance');
  });
  expect(await (await handlePublicationRequest(post(input), ctx)).json()).toEqual(result);
  expect(onAccepted).toHaveBeenCalledTimes(2);
  expect(ctx.fetchCms).toHaveBeenCalledTimes(2);
  expect(await (await handlePublicationRequest(new Request(root + '/' + input.id), ctx)).json()).toEqual(result);
  expect((await readPublication(env.TEST_CMS_DB, 'local', input.id))?.actorEmail).toBe(ctx.identity.email);
  expect(
    (await handlePublicationRequest(post(input), { ...ctx, identity: { email: 'other@example.com', role: 30 } }))
      .status,
  ).toBe(409);
  expect(
    (await handlePublicationRequest(new Request(root + '/' + input.id), { ...ctx, environment: 'uat' })).status,
  ).toBe(404);
});

test('rejects CSRF, wrong role, injected fields, oversized bodies and forged completion before CMS reads', async () => {
  const input = { id: crypto.randomUUID(), requestedRevision: 'live-one' };
  const ctx = context();
  for (const badHeaders of [{ ...headers, Origin: 'https://foreign.example' }, { 'Content-Type': 'application/json' }])
    expect((await handlePublicationRequest(post(input, badHeaders), ctx)).status).toBe(403);
  expect(
    (await handlePublicationRequest(post(input), { ...ctx, identity: { ...ctx.identity, role: 10 } })).status,
  ).toBe(403);
  for (const extra of [
    { actorEmail: 'forged@example.com' },
    { environment: 'prd' },
    { status: 'live' },
    { codeSha: 'forged' },
    { padding: 'x'.repeat(5000) },
  ])
    expect((await handlePublicationRequest(post({ ...input, ...extra }), ctx)).status).toBe(400);
  expect(
    (
      await handlePublicationRequest(
        new Request(root + '/' + input.id + '/complete', { method: 'POST', body: '{}' }),
        ctx,
      )
    ).status,
  ).toBe(404);
  expect(ctx.fetchCms).not.toHaveBeenCalled();
  expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toBeNull();
});

test('requires the current published revision and fails closed on CMS or migration unavailability', async () => {
  for (const item of [
    { id: 'news-one', status: 'draft', liveRevisionId: 'live-one' },
    { id: 'news-one', status: 'published', liveRevisionId: 'newer-revision' },
    { id: 'wrong-entry', status: 'published', liveRevisionId: 'live-one' },
  ]) {
    const ctx = context();
    ctx.fetchCms
      .mockResolvedValueOnce(
        Response.json({ data: { item: { id: 'live-one', collection: 'news', entryId: 'news-one' } } }),
      )
      .mockResolvedValueOnce(Response.json({ data: { item } }));
    const input = { id: crypto.randomUUID(), requestedRevision: 'live-one' };
    expect((await handlePublicationRequest(post(input), ctx)).status).toBe(409);
    expect(await readPublication(env.TEST_CMS_DB, 'local', input.id)).toBeNull();
  }
  const ctx = context();
  ctx.fetchCms.mockResolvedValue(new Response(null, { status: 429 }));
  expect(
    (await handlePublicationRequest(post({ id: crypto.randomUUID(), requestedRevision: 'live-one' }), ctx)).status,
  ).toBe(503);
  expect(ctx.fetchCms).toHaveBeenCalledTimes(1);
  const unavailable = await handlePublicationRequest(post({ id: crypto.randomUUID(), requestedRevision: 'live-one' }), {
    ...context(),
    db: env.COMMERCE_DB,
  });
  expect(unavailable.status).toBe(503);
  expect(unavailable.headers.get('Content-Type')).toContain('application/problem+json');
  expect(await unavailable.json()).toEqual({
    type: '/problems/publication_unavailable',
    title: 'Publication unavailable.',
    status: 503,
    detail: 'Publication is temporarily unavailable.',
    code: 'publication_unavailable',
    error: 'PUBLICATION_UNAVAILABLE',
  });
});

test('reopens a bounded, redacted publication history for the current environment without browser state', async () => {
  const ctx = context();
  const ids = [];
  for (let index = 0; index < 12; index++) {
    const id = crypto.randomUUID();
    ids.push(id);
    expect((await handlePublicationRequest(post({ id, requestedRevision: 'live-one' }), ctx)).status).toBe(202);
  }
  const response = await handlePublicationRequest(new Request(root), ctx);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(await response.json()).toEqual({
    items: ids
      .slice(-10)
      .reverse()
      .map((id) => ({ id, status: 'pending', requestedAt: expect.any(Number) })),
  });
  expect(await (await handlePublicationRequest(new Request(root), { ...ctx, environment: 'uat' })).json()).toEqual({
    items: [],
  });
  expect(
    (await handlePublicationRequest(new Request(root), { ...ctx, identity: { ...ctx.identity, role: 10 } })).status,
  ).toBe(403);
});
