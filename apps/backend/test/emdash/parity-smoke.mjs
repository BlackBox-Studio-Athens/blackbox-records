import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unstable_dev } from 'wrangler';
import { inventory } from '../../../../scripts/inventory-cms-content.mjs';
import { markdownToPortableText } from '../../../../scripts/cms-markdown.mjs';

const webRequire = createRequire(new URL('../../../web/package.json', import.meta.url));
const astroRequire = createRequire(webRequire.resolve('astro/package.json'));
// Reuse Astro's installed parser and Markdown engine through their public exports.
const htmlPackage = astroRequire('ultrahtml/package.json');
const { parse } = await import(
  new URL(htmlPackage.exports['.'].import, pathToFileURL(astroRequire.resolve('ultrahtml/package.json')))
);
const { unescape } = astroRequire('html-escaper');
const markdown = await astroRequire('@astrojs/markdown-satteri').createSatteriMarkdownProcessor({});
function meaning(node, parent = '') {
  if (node.type === 2) {
    if (!node.value || (['', 'ol', 'ul'].includes(parent) && !node.value.trim())) return null;
    return unescape(node.value).replace(/\s+/g, ' ');
  }
  if (![0, 1].includes(node.type)) return null;
  const attributes = {};
  for (const name of ['href', 'src', 'alt', 'title']) {
    if (node.attributes?.[name] !== undefined) attributes[name] = unescape(node.attributes[name]);
  }
  if (node.name === 'ol') attributes.start = Number(node.attributes.start ?? 1);
  return {
    tag: node.name ?? 'root',
    attributes,
    children: (node.children ?? []).map((child) => meaning(child, node.name)).filter((child) => child !== null),
  };
}
const root = new URL('./', import.meta.url);
const worker = await unstable_dev(fileURLToPath(new URL('dist/server/entry.mjs', root)), {
  config: fileURLToPath(new URL('dist/server/wrangler.json', root)),
  ip: '127.0.0.1',
  port: 8799,
  local: true,
  persist: false,
  logLevel: 'error',
  experimental: { disableExperimentalWarning: true },
});
try {
  const manifest = await inventory();
  const records = manifest.records.filter((record) => record.body.trim());
  assert.equal(records.length, 4, 'Reconcile newly introduced Markdown bodies explicitly.');
  for (const record of records) {
    const value = markdownToPortableText(record.body);
    const response = await fetch('http://127.0.0.1:8799/_emdash/api/content/parity/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
      body: JSON.stringify(value),
    });
    assert.equal(response.status, 200, record.source);
    const actual = await response.text();
    const expected = (await markdown.render(record.body)).code;
    assert.deepEqual(meaning(parse(actual)), meaning(parse(expected)), record.source);
  }
  console.log(
    `Rendered parity passed for all ${records.length} nonempty source Markdown bodies using EmDash PortableText and Astro Markdown.`,
  );
} finally {
  await worker.stop();
}
