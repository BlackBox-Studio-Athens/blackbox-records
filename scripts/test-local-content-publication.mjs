// Run against pnpm dev:stack:stripe-mock. Mutates and restores two Local artist drafts.
import assert from 'node:assert/strict';
import { editorialWriteData } from '../apps/staff/src/lib/backend/editorial-api.ts';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

const staff = 'http://127.0.0.1:8787';
const site = 'http://127.0.0.1:4321/blackbox-records';
async function api(path, body, method = 'POST') {
  const response = await fetch(`${staff}/_emdash/api/${path}`, {
    method: body ? method : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1', Origin: staff },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, `${path}: ${response.status}`);
  return response.json();
}
async function save(item, data) {
  const path = `content/artists/${item.id}`;
  const current = (await api(path)).data;
  return (await api(path, { _rev: current._rev, data: editorialWriteData(data) }, 'PUT')).data;
}
async function publish(item, saved, extra = []) {
  const started = performance.now();
  const input = {
    id: randomUUID(),
    records: [{ collection: 'artists', recordId: item.id, expectedRevision: saved._rev }, ...extra],
  };
  await api('blackbox/content-publications', input);
  // Repeat the same request to exercise response-loss recovery without duplicate publication.
  await api('blackbox/content-publications', input);
  while (performance.now() - started < 60000) {
    const { items } = await api('blackbox/publications');
    const publication = items.find((entry) => entry.id === input.id);
    assert.notEqual(publication?.status, 'failed', JSON.stringify(publication));
    if (publication?.status === 'live') {
      const html = await fetch(`${site}/artists/${item.slug}/`).then((response) => response.text());
      assert.ok(html.includes(saved.item.data.genre));
      return Math.round(performance.now() - started);
    }
    await setTimeout(500);
  }
  assert.fail('Publication exceeded 60 seconds.');
}
const { items } = (await api('content/artists?limit=3')).data;
assert.ok(items.length >= 2);
const [selected, other] = await Promise.all(
  items.slice(0, 2).map(async (item) => (await api(`content/artists/${item.id}`)).data.item),
);
const marker = `Private draft ${randomUUID()}`;
try {
  await save(other, { ...other.data, genre: marker });
  const saved = await save(selected, { ...selected.data, genre: `Publication check ${randomUUID()}` });
  const elapsedMs = await publish(selected, saved);
  const unrelated = await fetch(`${site}/artists/${other.slug}/`).then((response) => response.text());
  assert.ok(!unrelated.includes(marker), 'Unrelated draft leaked to the public site.');
  const second = (await api(`content/artists/${other.id}`)).data;
  const latest = (await api(`content/artists/${selected.id}`)).data;
  const batchElapsedMs = await publish(selected, latest, [
    { collection: 'artists', recordId: other.id, expectedRevision: second._rev },
  ]);
  const together = await fetch(`${site}/artists/${other.slug}/`).then((response) => response.text());
  assert.ok(together.includes(marker), 'Selected batch record did not go live.');
  console.log(JSON.stringify({ elapsedMs, batchElapsedMs, unrelatedDraftPrivate: true, idempotency: true }));
} finally {
  const restoredOther = await save(other, other.data);
  const restored = await save(selected, selected.data);
  await publish(selected, restored, [
    { collection: 'artists', recordId: other.id, expectedRevision: restoredOther._rev },
  ]);
}
