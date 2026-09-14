import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { dispatchPendingPublication } from '../../src/cms/publication-dispatch';
import { bindPublicationRun, readPublication, requestPublication } from '../../src/cms/publication-journal';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});
beforeEach(async () => {
  await env.TEST_CMS_DB.prepare('DELETE FROM _blackbox_publications').run();
});
const token = 'github_test_credential_only';
const create = () =>
  requestPublication(env.TEST_CMS_DB, {
    id: crypto.randomUUID(),
    environment: 'uat',
    actorEmail: 'operator@example.com',
    requestedRevision: 'published-one',
  });

test('dispatches only the fixed workflow payload, waits for queued CI, and preserves pending status', async () => {
  const item = await create();
  const send = vi.fn(async (_request: RequestInfo | URL) => new Response(null, { status: 204 }));
  const now = Date.now();
  expect(await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now)).toEqual({
    id: item.id,
    status: 'dispatched',
  });
  const request = send.mock.calls[0][0] as Request;
  expect(request.url).toBe(
    'https://api.github.com/repos/BlackBox-Studio-Athens/blackbox-records/actions/workflows/content-publication.yml/dispatches',
  );
  expect(request.method).toBe('POST');
  expect(request.redirect).toBe('manual');
  expect(request.signal).toBeDefined();
  expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`);
  expect(request.headers.get('X-GitHub-Api-Version')).toBe('2022-11-28');
  const body = (await request.json()) as { inputs: { dispatch_token: string } };
  expect(body).toEqual({
    ref: 'main',
    return_run_details: false,
    inputs: {
      target: 'uat',
      publication_id: item.id,
      dispatch_token: expect.any(String),
    },
  });
  expect(await readPublication(env.TEST_CMS_DB, 'uat', item.id)).toEqual(item);
  expect(await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 900_000)).toEqual({
    status: 'idle',
  });
  expect(
    await bindPublicationRun(
      env.TEST_CMS_DB,
      { id: item.id, environment: 'uat', dispatchToken: body.inputs.dispatch_token, ciRunId: '12345' },
      now + 900_000,
    ),
  ).toBe(true);
  expect(await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 3_600_000)).toEqual({
    status: 'idle',
  });
  expect(send).toHaveBeenCalledTimes(1);
});

test.each([429, 500, 401, 302, 'lost-response'] as const)(
  'retains a bounded retry after %s without an inline retry',
  async (outcome) => {
    const item = await create();
    const send = vi.fn(async () => {
      if (outcome === 'lost-response') throw new Error('Private provider response');
      return new Response('Private provider response', { status: outcome });
    });
    const now = Date.now();
    expect(await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now)).toEqual({
      id: item.id,
      status: 'pending',
    });
    expect(await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 1)).toEqual({ status: 'idle' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(await readPublication(env.TEST_CMS_DB, 'uat', item.id)).toEqual(item);
    expect((await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 300_000)).status).toBe(
      'pending',
    );
    expect(send).toHaveBeenCalledTimes(2);
  },
);

test('deduplicates simultaneous scheduler calls and retries an acknowledged dispatch only after its CI window', async () => {
  const item = await create();
  const send = vi.fn(async () => new Response(null, { status: 204 }));
  const now = Date.now();
  const results = await Promise.all([
    dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now),
    dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now),
  ]);
  expect(results.map(({ status }) => status).sort()).toEqual(['dispatched', 'idle']);
  expect((await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 3_599_999)).status).toBe('idle');
  expect((await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 3_600_000)).status).toBe(
    'dispatched',
  );
  expect(send).toHaveBeenCalledTimes(2);
  expect((await readPublication(env.TEST_CMS_DB, 'uat', item.id))?.status).toBe('pending');
});

test('never dispatches Local, missing credentials, invalid configuration, or an empty target', async () => {
  const send = vi.fn();
  expect(await dispatchPendingPublication(env.COMMERCE_DB, 'local', token, send)).toEqual({ status: 'disabled' });
  expect(await dispatchPendingPublication(env.COMMERCE_DB, 'uat', undefined, send)).toEqual({ status: 'disabled' });
  for (const [environment, credential] of [
    ['unknown', token],
    ['uat', 'short'],
    ['uat', token + '\n'],
  ])
    await expect(dispatchPendingPublication(env.COMMERCE_DB, environment, credential, send)).rejects.toThrow(
      'Invalid publication dispatch configuration',
    );
  await create();
  expect(await dispatchPendingPublication(env.TEST_CMS_DB, 'prd', token, send)).toEqual({ status: 'idle' });
  expect(send).not.toHaveBeenCalled();
});

test('does not dispatch again when CI claimed a run but the dispatch response was lost', async () => {
  const item = await create();
  const now = Date.now();
  const send = vi.fn(async (request: RequestInfo | URL) => {
    const body = (await (request as Request).json()) as { inputs: { dispatch_token: string } };
    expect(
      await bindPublicationRun(
        env.TEST_CMS_DB,
        {
          id: item.id,
          environment: 'uat',
          dispatchToken: body.inputs.dispatch_token,
          ciRunId: '12345',
        },
        now,
      ),
    ).toBe(true);
    throw new Error('Response lost after CI accepted');
  });
  expect((await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now)).status).toBe('pending');
  expect((await dispatchPendingPublication(env.TEST_CMS_DB, 'uat', token, send, now + 300_000)).status).toBe('idle');
  expect(send).toHaveBeenCalledTimes(1);
  expect((await readPublication(env.TEST_CMS_DB, 'uat', item.id))?.ciRunId).toBe('12345');
});
