import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { unstable_dev } from 'wrangler';

const root = new URL('./', import.meta.url);
const config = JSON.parse(await readFile(new URL('dist/server/wrangler.json', root), 'utf8'));
assert.equal(config.assets.run_worker_first, true);
for (const key of ['ai', 'images', 'worker_loaders']) {
  assert.ok(!config[key] || JSON.stringify(config[key]) === '{"bindings":[]}' || config[key].length === 0, key);
}
assert.deepEqual(config.durable_objects.bindings, [
  { name: 'CMS_RUNTIME', class_name: 'CmsRuntime' },
  { name: 'COMMERCE_RUNTIME', class_name: 'CommerceRuntime' },
]);
assert.deepEqual(config.migrations, [
  { tag: 'cms-runtime-v1', new_sqlite_classes: ['CmsRuntime'] },
  { tag: 'commerce-runtime-v1', new_sqlite_classes: ['CommerceRuntime'] },
]);
assert.deepEqual(
  config.kv_namespaces.map(({ binding }) => binding),
  ['SESSION'],
);

let entered;
const barrier = createServer((_request, response) => {
  entered = true;
  response.end();
});
barrier.listen(8800, '127.0.0.1');
await once(barrier, 'listening');
let worker;
try {
  worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), {
    config: fileURLToPath(new URL('dist/server/wrangler.json', root)),
    ip: '127.0.0.1',
    port: 8799,
    local: true,
    logLevel: 'error',
    experimental: { disableExperimentalWarning: true },
  });
  const base = 'http://127.0.0.1:8799';
  const page = await fetch(base + '/checkpoint.html');
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('cache-control'), 'private, no-store');
  assert.match(await page.text(), /Run CMS checks/);
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + '/_emdash/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    return { status: response.status, ...payload };
  }

  const contract = await request('/openapi.json');
  assert.equal(contract.status, 200);
  assert.ok(contract.paths['/_emdash/api/content/{collection}/{id}'].put);
  const created = await request('/content/posts', 'POST', {
    slug: `revision-check-${Date.now()}`,
    data: { title: 'Initial' },
  });
  assert.equal(created.status, 201);
  const path = '/content/posts/' + created.data.item.id;
  const lockPath = path + '/lock';
  assert.equal((await request(lockPath, 'POST', {})).status, 200);
  assert.equal((await request(lockPath)).status, 200);
  assert.equal((await request(lockPath, 'DELETE')).status, 200);
  const current = await request(path);
  const first = await request(path, 'PUT', { _rev: current.data._rev, data: { title: 'First' } });
  assert.equal(first.status, 200);
  assert.equal((await request(path, 'PUT', { _rev: current.data._rev, data: { title: 'Stale' } })).status, 409);
  assert.equal((await request(path + '/revisions')).status, 200);
  assert.equal((await request(path, 'PUT', { data: { title: 'No revision' } })).status, 400);
  assert.equal(
    (await request(path, 'PUT', { _rev: first.data._rev, data: { title: 'Partial' }, status: 'published' })).status,
    400,
  );
  assert.equal((await request(path)).data._rev, first.data._rev, 'Rejected shapes must not partially save');
  assert.equal((await fetch(base + '/_emdash/api/auth/register', { method: 'POST' })).status, 404);
  assert.equal(
    (
      await fetch(base + '/_emdash/api/content/posts', {
        method: 'POST',
        headers: { Origin: 'https://foreign.example', 'X-EmDash-Request': '1' },
      })
    ).status,
    403,
  );

  const publishedRevision = await request(path, 'PUT', {
    _rev: first.data._rev,
    data: { title: 'Live title' },
  });
  assert.equal((await request(path + '/publish', 'POST', { _rev: publishedRevision.data._rev })).status, 200);
  const liveBeforeDraft = await request(path);
  const savedDraft = await request(path, 'PUT', {
    _rev: liveBeforeDraft.data._rev,
    data: { title: 'Saved draft title' },
  });
  assert.equal((await request(path + '/discard-draft', 'POST', { _rev: liveBeforeDraft.data._rev })).status, 409);
  assert.equal((await request(path + '/discard-draft', 'POST', { _rev: savedDraft.data._rev })).status, 200);
  const restored = await request(path);
  assert.equal(restored.data.item.data.title, 'Live title', 'Discarding a draft restores live content');

  // Exercise both a never-published draft and a previously published entry.
  for (const published of [false, true]) {
    if (published) {
      const latest = await request(path);
      assert.equal((await request(path + '/publish', 'POST', { _rev: latest.data._rev })).status, 200);
    }
    const before = await request(path);
    entered = false;
    const delayed = request(path, 'PUT', { _rev: before.data._rev, data: { title: 'delayed-save' } });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (entered) break;
      await setTimeout(10);
    }
    assert.ok(entered, 'Delayed save must enter its hook before the competing save');
    assert.equal((await request(path, 'PUT', { _rev: before.data._rev, data: { title: 'Winner' } })).status, 200);
    assert.equal((await delayed).status, 409, 'Concurrent stale save must lose');
    const after = await request(path);
    assert.equal(after.data.item.data.title, 'Winner');
    assert.equal((await request(path + '/publish', 'POST', { _rev: before.data._rev })).status, 409);
    assert.equal((await request(path + '/publish', 'POST', { _rev: after.data._rev })).status, 200);
    const live = await request(path);
    assert.equal((await request(path + '/unpublish', 'POST', { _rev: before.data._rev })).status, 409);
    assert.equal((await request(path + '/unpublish', 'POST', { _rev: live.data._rev })).status, 200);
  }
  for (const published of [false, true]) {
    if (published) {
      const latest = await request(path);
      assert.equal((await request(path + '/publish', 'POST', { _rev: latest.data._rev })).status, 200);
    }
    const before = await request(path);
    entered = false;
    const deleting = request(path, 'DELETE', { _rev: before.data._rev });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (entered) break;
      await setTimeout(10);
    }
    assert.ok(entered, 'Delete must enter its hook before the competing save');
    const winner = await request(path, 'PUT', {
      _rev: before.data._rev,
      data: { title: `Preserved edit ${published}` },
    });
    assert.equal(winner.status, 200);
    assert.equal((await deleting).status, 409, 'A stale delete must not remove the winning save');
    assert.equal((await request(path)).data.item.data.title, `Preserved edit ${published}`);
  }
  const beforeDelete = await request(path);
  entered = false;
  const losingSave = request(path, 'PUT', { _rev: beforeDelete.data._rev, data: { title: 'delayed-save' } });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (entered) break;
    await setTimeout(10);
  }
  assert.ok(entered, 'Save must enter its hook before the winning delete');
  assert.equal((await request(path, 'DELETE', { _rev: beforeDelete.data._rev })).status, 200);
  assert.equal((await losingSave).status, 409, 'A delayed save must not resurrect deleted content');
  assert.equal(
    (await request(path, 'PUT', { _rev: beforeDelete.data._rev, data: { title: 'Stale restore' } })).status,
    404,
  );
  const capabilities = await fetch(base + '/api/store/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(
    (
      await fetch(base + '/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
    400,
  );
  assert.equal((await fetch(base + '/api/stripe/webhooks', { method: 'POST', body: '{}' })).status, 400);
  console.log(
    'EmDash compiled REST checkpoint passed: CRUD, contract, revisions, concurrent saves, lifecycle conflicts, and Hono capabilities.',
  );
} finally {
  await worker?.stop();
  barrier.close();
}
