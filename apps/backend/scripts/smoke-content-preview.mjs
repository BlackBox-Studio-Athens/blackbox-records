import assert from 'node:assert/strict';
import { sourceCollectionNames } from '@blackbox/content-model';

// Local only: previews are unsaved and the smoke verifies that stored drafts/history stay unchanged.
const base = 'http://127.0.0.1:8787';
const get = async (path) => {
  const response = await fetch(`${base}/_emdash/api/${path}`);
  assert.equal(response.status, 200, path);
  return (await response.json()).data;
};
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  if (value.provider === 'local') return { id: value.id };
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
}
const headers = { Origin: base, 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const history = await get('blackbox/publications');
const results = [];
for (const collection of Object.keys(sourceCollectionNames)) {
  const { items } = await get(`content/${collection}?limit=1`);
  assert.ok(items.length, `Missing Local fixture: ${collection}`);
  const before = await get(`content/${collection}/${items[0].id}`);
  const item = before.item;
  const data = clean(item.data);
  if (typeof data.title === 'string') data.title += ' — unsaved preview smoke';
  const body = JSON.stringify({ collection, id: item.id, slug: item.slug, data });
  for (const view of [
    'detail',
    ...(['artists', 'releases', 'news', 'distro'].includes(collection) ? ['listing'] : []),
  ]) {
    const start = performance.now();
    const response = await fetch(`${base}/_emdash/preview?view=${view}`, { method: 'POST', headers, body });
    const html = await response.text();
    assert.equal(response.status, 200, `${collection}/${view}: ${html.slice(0, 1000)}`);
    assert.match(response.headers.get('Cache-Control'), /private, no-store/);
    assert.match(response.headers.get('Content-Security-Policy'), /script-src 'none'/);
    assert.match(html, /<!DOCTYPE html>/i);
    assert.doesNotMatch(html, /<(?:script|iframe|object|embed)\b/i);
    assert.ok(!/<a\s[^>]*\shref=/i.test(html), `${collection}: interactive link remains`);
    if (collection === 'artists') assert.ok(html.includes('unsaved preview smoke'));
    results.push({
      collection,
      view,
      ms: Math.round(performance.now() - start),
      bytes: Buffer.byteLength(html),
      reads: Number(response.headers.get('X-Preview-Reads')),
      cacheMisses: Number(response.headers.get('X-Preview-Cache-Misses')),
    });
  }
  assert.deepEqual(await get(`content/${collection}/${item.id}`), before, `${collection} must remain unsaved`);
  for (const override of [{ Origin: 'https://example.com' }, { 'X-EmDash-Request': '' }]) {
    const response = await fetch(`${base}/_emdash/preview`, {
      method: 'POST',
      headers: { ...headers, ...override },
      body,
    });
    assert.equal(response.status, 403);
    await response.text();
  }
}
assert.deepEqual(await get('blackbox/publications'), history, 'Preview must not publish');
console.log(JSON.stringify(results, null, 2));
