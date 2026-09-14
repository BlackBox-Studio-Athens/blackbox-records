import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inventory, readSource, sourceId } from './inventory-cms-content.mjs';

test('inventory preserves frontmatter types, Markdown, and Astro slug overrides', () => {
  const source =
    '---\r\nslug: afterwise\r\ncredits:\r\n  - role: Music\r\n    name: Artist\r\ndate: 2026-06-09\r\n---\r\n\r\n_Album_ [link](../../releases/album/)\r\n';
  const result = readSource(source, '.md');
  assert.deepEqual(result.data.credits, [{ role: 'Music', name: 'Artist' }]);
  assert.equal(result.data.date, '2026-06-09');
  assert.equal(result.body, '\r\n_Album_ [link](../../releases/album/)\r\n');
  assert.equal(sourceId('mass-culture.md', result.data), 'afterwise');
  assert.equal(sourceId('A Band/index.md', {}), 'a-band');
  assert.throws(() => readSource('---\ntitle: A\ntitle: B\n---\n', '.md'));
});

test('actual collection inventory is deterministic and resolves references and media', async () => {
  const first = await inventory();
  assert.deepEqual(await inventory(), first);
  assert.equal(first.collections.length, 13);
  assert.deepEqual(first.anomalies, []);
  const release = first.records.find((record) => record.collection === 'releases' && record.id === 'disintegration');
  assert.deepEqual(release.references, [{ field: 'artist', collection: 'artists', id: 'afterwise' }]);
  assert.ok(first.media.some((image) => image.references.some((reference) => reference.alt)));
});
