import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseArtistCountries,
  formatArtistCountries,
  validArtistLink,
  publishedCollection,
  parseContentSnapshot,
  replacePublishedRecord,
} from '@blackbox/content-model';

test('Artist activity retains legacy defaults and native false through draft and publication', () => {
  const data = { title: 'Artist', genre: 'Hardcore', bio: 'Biography', image: { id: 'image' }, image_alt: 'Portrait' };
  const record = { collection: 'artists', id: 'artist', slug: 'artist', revisionId: 'accepted', data };
  const snapshot = {
    schemaVersion: 1,
    environment: 'local',
    records: [record],
    media: [
      {
        id: 'image',
        sha256: 'a'.repeat(64),
        filename: 'image.png',
        mimeType: 'image/png',
        size: 1,
        width: 1,
        height: 1,
      },
    ],
  };
  for (const [is_active, expected] of [
    [undefined, true],
    [null, true],
    [true, true],
    [1, true],
    [false, false],
    [0, false],
  ]) {
    const stored = { ...data, is_active };
    assert.deepEqual(validateCmsDraft('artists', stored), []);
    assert.deepEqual(validateCmsContent('artists', stored), []);
    const accepted = parseContentSnapshot(
      JSON.stringify({ ...snapshot, records: [{ ...record, data: stored }] }),
      'local',
    );
    assert.equal(publishedCollection(accepted, 'artists', '/media')[0].data.is_active, expected);
    assert.equal(stored.is_active, is_active);
  }
  for (const is_active of ['false', 'true', '0', '1', 2, -1, {}, []]) {
    assert.ok(validateCmsDraft('artists', { ...data, is_active }).length);
    assert.ok(validateCmsContent('artists', { ...data, is_active }).length);
  }
  const accepted = parseContentSnapshot(JSON.stringify(snapshot), 'local');
  const draft = { ...record, revisionId: 'inactive-revision', data: { ...data, is_active: false } };
  assert.equal(publishedCollection(accepted, 'artists', '/media')[0].data.is_active, true);
  const published = replacePublishedRecord(accepted, draft, snapshot.media);
  assert.equal(publishedCollection(published, 'artists', '/media')[0].data.is_active, false);
  assert.equal(publishedCollection(accepted, 'artists', '/media')[0].data.is_active, true);
});

test('artist countries and service links preserve valid identities', () => {
  assert.deepEqual(parseArtistCountries('Greece / Germany'), ['GR', 'DE']);
  assert.equal(formatArtistCountries(['GR', 'DE', 'GR']), 'Greece / Germany');
  assert.equal(parseArtistCountries('Greece / Atlantis'), null);
  assert.equal(parseArtistCountries('Greece / GR'), null);
  assert.equal(validArtistLink('Bandcamp', 'https://sidus-gr.bandcamp.com/'), true);
  assert.equal(validArtistLink('Tidal', 'https://bandcamp.com/'), false);
  assert.equal(validArtistLink('Website', 'https://open.spotify.com/artist/example'), false);
  assert.equal(validArtistLink('Bandcamp', 'https://bandcamp.com.evil.example/'), false);
});

test('News Artist is optional and published snapshots preserve its identity without draft genre copies', () => {
  const news = { title: 'News', date: '2026-06-09', summary: 'Copy', image: { id: 'image' }, image_alt: 'Cover' };
  for (const artist of [undefined, null, '', 'native-artist']) {
    assert.deepEqual(validateCmsContent('news', { ...news, artist }), []);
    assert.deepEqual(validateCmsDraft('news', { ...news, artist }), []);
  }
  for (const artist of [42, true, {}, 'x'.repeat(129)])
    assert.ok(validateCmsContent('news', { ...news, artist }).length);
  const snapshot = {
    schemaVersion: 1,
    environment: 'local',
    records: [
      {
        collection: 'artists',
        id: 'native-artist',
        slug: 'public-artist',
        revisionId: 'accepted-artist',
        data: { title: 'Artist', genre: 'Hardcore', bio: 'Biography', image: { id: 'image' }, image_alt: 'Portrait' },
      },
      {
        collection: 'news',
        id: 'news',
        slug: 'news',
        revisionId: 'accepted-news',
        data: { ...news, artist: 'native-artist' },
      },
    ],
    media: [
      {
        id: 'image',
        sha256: 'a'.repeat(64),
        filename: 'image.png',
        mimeType: 'image/png',
        size: 1,
        width: 1,
        height: 1,
      },
    ],
  };
  const accepted = parseContentSnapshot(JSON.stringify(snapshot), 'local');
  const [article] = publishedCollection(accepted, 'news', '/media');
  assert.deepEqual(article.data.artist, { collection: 'artists', id: 'public-artist' });
  assert.equal(article.data.genre, undefined);
  const [artist] = publishedCollection(accepted, 'artists', '/media');
  assert.equal(artist.id, article.data.artist.id);
  assert.equal(artist.data.genre, 'Hardcore');
  const privateDraft = { ...snapshot.records[0].data, genre: 'Private draft genre' };
  assert.equal(publishedCollection(accepted, 'artists', '/media')[0].data.genre, 'Hardcore');
  const updated = { ...snapshot, records: [{ ...snapshot.records[0], data: privateDraft }, snapshot.records[1]] };
  assert.equal(
    publishedCollection(parseContentSnapshot(JSON.stringify(updated), 'local'), 'artists', '/media')[0].data.genre,
    privateDraft.genre,
  );
  assert.throws(
    () => parseContentSnapshot(JSON.stringify({ ...snapshot, records: [snapshot.records[1]] }), 'local'),
    /Missing published Artist/,
  );
  for (const artist of [undefined, null, '']) {
    const unlinked = { ...snapshot, records: [{ ...snapshot.records[1], data: { ...news, artist } }] };
    assert.ok(
      !publishedCollection(parseContentSnapshot(JSON.stringify(unlinked), 'local'), 'news', '/media')[0].data.artist,
    );
  }
});

test('upcoming releases may omit dates; released records must provide one', () => {
  const release = {
    title: 'LOTUS',
    artist: 'sidus',
    cover_image: { id: 'artwork' },
    cover_image_alt: 'Lotus',
    release_stage: 'upcoming',
  };
  assert.deepEqual(validateCmsContent('releases', release), []);
  for (const release_date of ['', null]) {
    assert.deepEqual(validateCmsContent('releases', { ...release, release_date }), []);
    const [rendered] = publishedCollection(
      {
        media: [],
        records: [
          { collection: 'artists', id: 'sidus', slug: 'sidus', data: {} },
          { collection: 'releases', id: 'lotus', slug: 'lotus', data: { ...release, release_date } },
        ],
      },
      'releases',
      '/media',
      { artwork: { src: '/lotus.png', width: 1024, height: 1024, format: 'png' } },
    );
    assert.equal(rendered.data.release_date, undefined);
    assert.ok(validateCmsContent('releases', { ...release, release_date, release_stage: 'released' }).length);
  }
  assert.ok(
    validateCmsContent('releases', { ...release, release_stage: 'released' }).some((issue) =>
      issue.startsWith('release_date:'),
    ),
  );
  assert.deepEqual(
    validateCmsContent('releases', { ...release, release_stage: 'released', release_date: '2026-10-10' }),
    [],
  );
  assert.ok(validateCmsContent('releases', { ...release, release_stage: 'preorder' }).length);
});
import { formattedProse } from './fixtures/prose.ts';
import {
  cmsLinkSchema,
  isSafeCmsLink,
  projectProseFields,
  proseText,
  proseBlocks,
  resolveProse,
  validateCmsDraft,
  changedPublicationFields,
} from '@blackbox/content-model';

test('formatted prose stays authored data while native legacy fields remain read-only fallbacks', () => {
  const legacy = { title: 'Artist', genre: 'Rock', image: { id: 'existing' }, image_alt: 'Band', bio: 'Old biography' };
  const data = { ...legacy, bio_rich: structuredClone(formattedProse) };
  assert.deepEqual(validateCmsContent('artists', data), []);
  const withoutLegacy = { ...data, bio: undefined };
  assert.deepEqual(validateCmsContent('artists', withoutLegacy), []);
  assert.equal(projectProseFields('artists', data).bio, proseText(formattedProse));
  assert.equal(data.bio, 'Old biography');
  assert.deepEqual(data.bio_rich, formattedProse);
  const formattingOnly = structuredClone(data);
  formattingOnly.bio_rich[0].children[0].marks = ['em'];
  assert.equal(proseText(formattingOnly.bio_rich), proseText(data.bio_rich));
  assert.deepEqual(changedPublicationFields({ before: data, after: formattingOnly }), ['bio_rich']);
  assert.equal(resolveProse('Old biography', null), 'Old biography');
  assert.deepEqual(resolveProse('Old biography', []), []);
  assert.ok(validateCmsContent('artists', { ...data, bio_rich: [] }).length);
  assert.deepEqual(validateCmsDraft('artists', { bio_rich: [] }), []);
  assert.equal(proseText(proseBlocks('First\nline\n\nSecond')), 'First\nline\n\nSecond');
  const unsafe = structuredClone(formattedProse);
  unsafe[0].markDefs[0].href = 'javascript:alert(1)';
  assert.ok(validateCmsDraft('artists', { bio_rich: unsafe }).length);
  assert.ok(validateCmsDraft('artists', { bio_rich: [{ _type: 'html', html: '<script>bad()</script>' }] }).length);
});

test('browser and CMS prose link validation share the same type-aware URL policy', () => {
  const accepted = [
    'https://example.com/band',
    'http://example.com/',
    'mailto:press@example.com',
    '/store/distribution/',
    '#returns',
    '../privacy/',
    '//example.com/path',
  ];
  const rejected = [
    'javascript:alert(1)',
    'data:text/html,hello',
    'ftp://example.com/',
    'https://example.com/a b',
    ' /store/',
    'https://example.com/a\\b',
    'https://[',
    null,
    undefined,
    42,
    {},
  ];

  for (const value of accepted) {
    assert.equal(isSafeCmsLink(value), true, String(value));
    assert.equal(cmsLinkSchema.safeParse(value).success, true, String(value));
  }
  for (const value of rejected) {
    assert.equal(isSafeCmsLink(value), false, String(value));
    assert.equal(cmsLinkSchema.safeParse(value).success, false, String(value));
  }
});

import { inventory, parseMarkdown } from './inventory-cms-content.mjs';
import { markdownTreeToPortableText } from './cms-markdown.mjs';
import {
  sourceCollectionNames,
  validateCmsContent,
  getCmsContentIssues,
  contentMediaIds,
  cmsBodySchema,
} from '@blackbox/content-model';
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
    { ...paragraph, textAlign: 'unsafe' },
  ]) {
    const result = cmsBodySchema.safeParse([paragraph, unsupported]);
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /Undo or remove/);
  }
  assert.equal(cmsBodySchema.safeParse([paragraph]).success, true);
  for (const textAlign of ['left', 'center', 'right', 'justify'])
    assert.equal(cmsBodySchema.safeParse([{ ...paragraph, textAlign }]).success, true);
});

test('structured CMS issues preserve nested paths while optional blanks remain valid', () => {
  const news = { title: 'News', date: '2026-06-09', summary: 'Copy', image: { id: 'existing' }, image_alt: 'Cover' };
  const result = getCmsContentIssues('news', { ...news, title: ' ', summary: '', section_label: null });
  assert.deepEqual(
    result.map((issue) => issue.path),
    [['title'], ['summary']],
  );
  assert.deepEqual(validateCmsContent('news', { ...news, section_label: null }), []);
  assert.deepEqual(getCmsContentIssues('news', { ...news, extra: true })[0].path, ['extra']);
});

test('structured issues cover URLs, email, dates, enums, arrays, media, and relationships', () => {
  const news = { title: 'News', date: '2026-06-09', summary: 'Copy', image: { id: 'image-1' }, image_alt: 'Cover' };
  const releases = {
    title: 'Release',
    artist: 'artist-1',
    release_date: '2026-06-09',
    cover_image: { id: 'image-1' },
    cover_image_alt: 'Cover',
  };
  const artists = {
    title: 'Artist',
    genre: 'Rock',
    image: { id: 'image-1' },
    image_alt: 'Portrait',
    bio: 'Biography',
  };
  const newsletter = {
    section_label: 'News',
    title: 'Newsletter',
    description: 'Updates',
    placeholder: 'invalid',
    button_label: 'Subscribe',
    note: 'Occasional updates',
  };
  const distro = {
    title: 'Item',
    group: 'Unknown',
    artist_or_label: 'Label',
    image: { id: 'image-1' },
    image_alt: 'Cover',
    summary: 'Copy',
    order: 0,
  };
  const paths = (collection, data) => getCmsContentIssues(collection, data).map((issue) => issue.path.join('.'));

  assert.ok(
    paths('artists', { ...artists, profile_links: [{ label: 'Site', url: 'unsafe' }] }).includes('profile_links.0.url'),
  );
  assert.ok(paths('newsletter', newsletter).includes('placeholder'));
  assert.ok(paths('news', { ...news, date: '2026-02-30' }).includes('date'));
  assert.ok(paths('distro', distro).includes('group'));
  assert.ok(paths('releases', { ...releases, formats: [''] }).includes('formats.0'));
  assert.ok(paths('news', { ...news, image: null }).includes('image'));
  assert.ok(paths('releases', { ...releases, artist: '' }).includes('artist'));
});
