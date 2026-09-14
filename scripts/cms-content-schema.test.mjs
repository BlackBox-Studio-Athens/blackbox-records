import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inventory, parseMarkdown } from './inventory-cms-content.mjs';
import { markdownTreeToPortableText } from './cms-markdown.mjs';
import { sourceCollectionNames, validateCmsContent, contentMediaIds, cmsBodySchema } from '@blackbox/content-model';
import { isSupportedCmsApiRequest } from '../apps/backend/src/middleware.ts';

test('snapshot revision reads do not enable revision restore or alternate writers', () => {
  const root = 'https://staff.example/_emdash/api/revisions/live-one';
  assert.equal(isSupportedCmsApiRequest(new Request(root)), true);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'])
    assert.equal(isSupportedCmsApiRequest(new Request(root, { method })), false);
  assert.equal(isSupportedCmsApiRequest(new Request(root + '/restore', { method: 'POST' })), false);
  assert.equal(isSupportedCmsApiRequest(new Request(root + '/restore')), false);
  assert.equal(isSupportedCmsApiRequest(new Request('https://staff.example/_emdash/api/admin/users')), false);
});

test('CMS schemas accept every source shape without optional-field loss', async () => {
  const manifest = await inventory();
  for (const record of manifest.records) {
    const collection = Object.keys(sourceCollectionNames).find(
      (name) => sourceCollectionNames[name] === record.collection,
    );
    assert.ok(collection, record.collection);
    const imageFields = new Set(
      manifest.media.flatMap((media) =>
        media.references
          .filter((reference) => reference.source === record.source)
          .map((reference) => reference.original),
      ),
    );
    const data = JSON.parse(JSON.stringify(record.data), (name, value) => {
      if (name === '$schema') return undefined;
      return typeof value === 'string' && imageFields.has(value) && name !== 'logo' ? { id: 'fixture-image' } : value;
    });
    if (collection === 'artists') delete data.slug;
    if (record.body.trim()) data.body = markdownTreeToPortableText(parseMarkdown(record.body));
    assert.deepEqual(validateCmsContent(collection, data), [], record.source);
    assert.ok(validateCmsContent(collection, { ...data, stripe_price_id: 'forged' }).length, record.source);
    assert.ok(validateCmsContent(collection, {}).length, record.source);
  }
});

test('direct editorial payloads reject nested extras, unsafe content, invalid dates and missing image IDs', () => {
  const news = { title: 'News', date: '2026-06-09', summary: 'Copy', image: { id: 'existing' }, image_alt: 'Cover' };
  assert.deepEqual(validateCmsContent('news', { ...news, section_label: null }), []);
  for (const patch of [
    { date: '2026-02-30' },
    { date: 0 },
    { image: { src: 'https://foreign.invalid/image.jpg' } },
    { image: { id: 'existing', secret: true } },
    { image_alt: ' ' },
    { body: [{ _type: 'htmlBlock', _key: 'unsafe', html: '<script>alert(1)</script>' }] },
    {
      body: [
        {
          _type: 'block',
          _key: 'text',
          children: [],
          markDefs: [{ _type: 'link', _key: 'link', href: 'javascript:alert(1)' }],
        },
      ],
    },
  ])
    assert.ok(validateCmsContent('news', { ...news, ...patch }).length, JSON.stringify(patch));
  assert.ok(
    validateCmsContent('distro_page', { hero: { title: 'Distro', intro: 'Copy', price: 10 }, group_intros: {} }).length,
  );
  assert.deepEqual(contentMediaIds({ hero: { image: { id: 'one' } }, body: [{ asset: { _ref: 'two' } }] }), [
    'one',
    'two',
  ]);
});

test('unsupported native editor blocks give a recoverable error without rejecting ordinary text', () => {
  const paragraph = { _type: 'block', _key: 'text', children: [{ _type: 'span', _key: 'span', text: 'Music' }] };
  for (const unsupported of [
    { _type: 'htmlBlock', _key: 'html', html: '<b>Music</b>' },
    { _type: 'table', _key: 'table', rows: [] },
    { ...paragraph, textAlign: 'center' },
  ]) {
    const result = cmsBodySchema.safeParse([paragraph, unsupported]);
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /Undo or remove/);
  }
  assert.equal(cmsBodySchema.safeParse([paragraph]).success, true);
});
