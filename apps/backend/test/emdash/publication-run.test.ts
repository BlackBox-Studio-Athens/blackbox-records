import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, expect, test } from 'vitest';
import {
  bindPublicationSnapshot,
  claimPublicationDispatch,
  readPublication,
  requestPublication,
} from '../../src/cms/publication-journal';
import { handlePublicationWorkflow, publicationRunPath } from '../../src/cms/publication-routes';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});
const token = 'a'.repeat(64);
const context = {
  db: env.TEST_CMS_DB,
  bucket: env.TEST_SNAPSHOTS,
  environment: 'uat',
  hostname: 'staff.example',
  token,
};
const post = (body: unknown, credential = token, origin = 'https://staff.example') =>
  new Request(origin + publicationRunPath, {
    method: 'POST',
    headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('authenticates a target-specific CI claim and preserves one pending run on replay', async () => {
  const item = await requestPublication(env.TEST_CMS_DB, {
    id: crypto.randomUUID(),
    environment: 'uat',
    actorEmail: 'operator@example.com',
    requestedRevision: 'published-for-ci',
  });
  const claim = await claimPublicationDispatch(env.TEST_CMS_DB, 'uat');
  const input = { id: item.id, dispatchToken: claim!.dispatchToken, ciRunId: '12345', codeSha: 'c'.repeat(40) };
  for (const credential of ['', 'b'.repeat(64), 'a'.repeat(63)])
    expect((await handlePublicationWorkflow(post(input, credential), context)).status).toBe(403);
  for (const origin of ['https://wrong.example', 'http://staff.example'])
    expect((await handlePublicationWorkflow(post(input, token, origin), context)).status).toBe(403);
  for (const settings of [
    { token: undefined },
    { token: 'short' },
    { hostname: undefined },
    { environment: 'unknown' },
  ])
    expect((await handlePublicationWorkflow(post(input), { ...context, ...settings })).status).toBe(403);
  expect((await readPublication(env.TEST_CMS_DB, 'uat', item.id))?.ciRunId).toBeNull();
  const accepted = await handlePublicationWorkflow(post(input), context);
  expect(accepted.status).toBe(200);
  expect(accepted.headers.get('Cache-Control')).toBe('private, no-store');
  expect(await accepted.json()).toEqual({ id: item.id, status: 'pending' });
  expect((await handlePublicationWorkflow(post(input), context)).status).toBe(200);
  expect((await handlePublicationWorkflow(post({ ...input, ciRunId: '54321' }), context)).status).toBe(409);
  expect((await handlePublicationWorkflow(post({ ...input, codeSha: 'd'.repeat(40) }), context)).status).toBe(409);
  expect((await handlePublicationWorkflow(post(input), { ...context, environment: 'prd' })).status).toBe(409);
  expect(await readPublication(env.TEST_CMS_DB, 'uat', item.id)).toEqual({
    ...item,
    ciRunId: input.ciRunId,
    codeSha: input.codeSha,
  });
});

test('restricts the machine credential to the exact route, method and bounded claim payload', async () => {
  const input = {
    id: crypto.randomUUID(),
    dispatchToken: crypto.randomUUID(),
    ciRunId: '12345',
    codeSha: 'c'.repeat(40),
  };
  for (const codeSha of [undefined, 'main', 'c'.repeat(39), 'C'.repeat(40)])
    expect((await handlePublicationWorkflow(post({ ...input, codeSha }), context)).status).toBe(400);
  for (const extra of [{ environment: 'prd' }, { status: 'live' }, { padding: 'x'.repeat(5000) }, { ciRunId: '../1' }])
    expect((await handlePublicationWorkflow(post({ ...input, ...extra }), context)).status).toBe(400);
  for (const path of [publicationRunPath + '?target=prd', publicationRunPath + '/complete', '/api/internal/orders'])
    expect(
      (await handlePublicationWorkflow(new Request('https://staff.example' + path, post(input)), context)).status,
    ).toBe(404);
  expect(
    (
      await handlePublicationWorkflow(
        new Request('https://staff.example' + publicationRunPath, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        context,
      )
    ).status,
  ).toBe(405);
  expect(
    (
      await handlePublicationWorkflow(
        new Request('https://staff.example' + publicationRunPath, {
          method: 'POST',
          headers: { Cookie: 'staff-session=fake', 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }),
        context,
      )
    ).status,
  ).toBe(403);
  expect((await handlePublicationWorkflow(post(input), { ...context, environment: 'local' })).status).toBe(403);
  expect(
    (await handlePublicationWorkflow(post(input, token, 'http://127.0.0.1'), { ...context, environment: 'local' }))
      .status,
  ).toBe(409);
  expect((await handlePublicationWorkflow(post(input), { ...context, db: env.COMMERCE_DB })).status).toBe(503);
});

test('marks only a matching deployed code and snapshot Live and replays acknowledgement without another fetch', async () => {
  const item = await requestPublication(env.TEST_CMS_DB, {
    id: crypto.randomUUID(),
    environment: 'prd',
    actorEmail: 'operator@example.com',
    requestedRevision: 'live-completion',
  });
  const claim = await claimPublicationDispatch(env.TEST_CMS_DB, 'prd');
  const target = { ...context, environment: 'prd' };
  const run = { id: item.id, dispatchToken: claim!.dispatchToken, ciRunId: '67890', codeSha: 'e'.repeat(40) };
  expect((await handlePublicationWorkflow(post(run), target)).status).toBe(200);
  const input = {
    id: item.id,
    ciRunId: run.ciRunId,
    codeSha: run.codeSha,
    snapshotSha256: 'f'.repeat(64),
    deploymentId: crypto.randomUUID(),
  };
  await bindPublicationSnapshot(env.TEST_CMS_DB, {
    id: input.id,
    ciRunId: input.ciRunId,
    snapshotSha256: input.snapshotSha256,
    environment: 'prd',
  });
  const complete = (body = input, credential = token) =>
    new Request('https://staff.example/_emdash/api/blackbox/publications/complete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  let calls = 0;
  let valid = false;
  const send: typeof fetch = async (url, options) => {
    calls++;
    expect(url).toBe('https://blackbox-records-web.pages.dev/release.json');
    expect(options?.redirect).toBe('manual');
    expect(options?.headers).toBeUndefined();
    return Response.json({
      sha: valid ? input.codeSha : 'a'.repeat(40),
      content: {
        publicationId: input.id,
        ciRunId: input.ciRunId,
        snapshotSha256: input.snapshotSha256,
      },
    });
  };
  expect((await handlePublicationWorkflow(complete(input, 'b'.repeat(64)), target, send)).status).toBe(403);
  expect((await handlePublicationWorkflow(complete({ ...input, codeSha: 'a'.repeat(40) }), target, send)).status).toBe(
    409,
  );
  expect(calls).toBe(0);
  expect((await handlePublicationWorkflow(complete(), target, send)).status).toBe(503);
  expect((await readPublication(env.TEST_CMS_DB, 'prd', item.id))?.status).toBe('pending');
  valid = true;
  expect(await (await handlePublicationWorkflow(complete(), target, send)).json()).toEqual({
    id: item.id,
    status: 'live',
  });
  expect(await (await handlePublicationWorkflow(complete(), target, send)).json()).toEqual({
    id: item.id,
    status: 'live',
  });
  expect(calls).toBe(2);
  expect(
    (await handlePublicationWorkflow(complete({ ...input, deploymentId: crypto.randomUUID() }), target, send)).status,
  ).toBe(409);
});
