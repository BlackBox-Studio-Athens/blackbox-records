import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  parseArtistCountries,
  formatArtistCountries,
  validArtistLink,
  publishedCollection,
  parseContentSnapshot,
  replacePublishedRecord,
  normalizeEditorialBody,
  normalizeVideoUrl,
  proseSchema,
  getProductSafetyIssues,
  productSafetyContentSchema,
  productSafetyOfferInformation,
  productSafetyOfferSchema,
  validateCmsRevisionContent,
} from '@blackbox/content-model';

test('editorial images retain presentation without native delivery metadata and reject unsafe links', () => {
  const image = {
    _type: 'image',
    _key: 'image',
    asset: {
      _type: 'reference',
      _ref: 'media',
      provider: 'local',
      url: '/_emdash/private/image',
      meta: { storageKey: 'image.png' },
    },
    alt: 'Artwork',
    caption: 'Caption',
    title: 'Image title',
    displayWidth: 480,
    displayHeight: 320,
    alignment: 'right',
    link: { href: '/releases/', blank: true },
    blurhash: 'transient',
  };
  const body = normalizeEditorialBody([image]);
  assert.deepEqual(body[0].asset, { _ref: 'media' });
  assert.equal(body[0].blurhash, undefined);
  assert.deepEqual(cmsBodySchema.parse(body), body);
  assert.equal(body[0].caption, 'Caption');
  assert.equal(image.asset.url, '/_emdash/private/image');
  assert.equal(proseSchema.safeParse(body).success, false);
  assert.equal(cmsBodySchema.safeParse([{ ...body[0], link: 'javascript:alert(1)' }]).success, false);
  assert.equal(
    cmsBodySchema.safeParse(normalizeEditorialBody([{ ...image, asset: { ...image.asset, provider: 'external' } }]))
      .success,
    false,
  );
});

test('editorial videos normalize approved providers and discard autoplay', () => {
  const youtube = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
  assert.equal(normalizeVideoUrl('https://youtu.be/dQw4w9WgXcQ?autoplay=1'), youtube);
  assert.equal(normalizeVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30'), youtube + '?start=30');
  assert.equal(normalizeVideoUrl('https://vimeo.com/123456?autoplay=1'), 'https://player.vimeo.com/video/123456');
  for (const url of [
    'javascript:alert(1)',
    'http://youtu.be/dQw4w9WgXcQ',
    'https://youtube.com.evil.example/embed/dQw4w9WgXcQ',
    'https://user@youtube.com/embed/dQw4w9WgXcQ',
    'https://youtube.com:444/embed/dQw4w9WgXcQ',
    'https://example.com/video',
  ])
    assert.equal(normalizeVideoUrl(url), null);
  const body = normalizeEditorialBody([
    {
      _type: 'iframe',
      _key: 'video',
      src: 'https://youtu.be/dQw4w9WgXcQ?autoplay=1',
      title: 'Video',
      allow: 'autoplay',
    },
  ]);
  assert.equal(body[0].src, youtube);
  assert.deepEqual(cmsBodySchema.parse(body), body);
  assert.equal(proseSchema.safeParse(body).success, false);
  assert.equal(cmsBodySchema.safeParse([{ ...body[0], src: 'https://example.com/video' }]).success, false);
});

test('native revision images accept captions without widening editorial writes', () => {
  const image = { id: 'image', provider: 'local', meta: { storageKey: 'image.png' } };
  const data = { title: 'Artist', genre: 'Hardcore', bio: 'Biography', image_alt: 'Portrait' };
  for (const value of [
    image,
    { ...image, caption: 'Photo credit' },
    { ...image, caption: '' },
    { ...image, meta: { ...image.meta, caption: 'Legacy caption' } },
    { ...image, caption: '', meta: { ...image.meta, caption: '' } },
  ]) {
    const stored = { ...data, image: value };
    const before = structuredClone(stored);
    assert.deepEqual(validateCmsRevisionContent('artists', stored), []);
    assert.deepEqual(stored, before, 'Revision validation preserves stored captions');
    assert.ok(validateCmsContent('artists', stored).length, 'Native metadata is not an editorial write shape');
    assert.ok(validateCmsDraft('artists', stored).length, 'Draft writes retain their strict image contract');
  }
  for (const value of [
    { ...image, caption: null },
    { ...image, caption: 42 },
    { ...image, caption: 'Credit', unknown: 'not allowed' },
    { ...image, meta: { ...image.meta, unknown: 'not allowed' } },
  ])
    assert.ok(validateCmsRevisionContent('artists', { ...data, image: value }).length);
  assert.deepEqual(validateCmsContent('artists', { ...data, image: { id: 'image' } }), []);
});

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
    catalog_number: 'BBR#001',
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

test('Releases order accepts only positive whole numbers and reaches the public catalog through publication', () => {
  const data = {
    title: 'LOTUS',
    artist: 'sidus',
    cover_image: { id: 'image' },
    cover_image_alt: 'Lotus',
    catalog_number: 'BBR#001',
    release_stage: 'upcoming',
  };
  for (const releases_priority of [undefined, null, '', 1, 2]) {
    assert.deepEqual(validateCmsDraft('releases', { ...data, releases_priority }), []);
    assert.deepEqual(validateCmsContent('releases', { ...data, releases_priority }), []);
  }
  for (const releases_priority of [0, -1, 1.5, '2', true]) {
    assert.ok(validateCmsDraft('releases', { ...data, releases_priority }).length);
    assert.ok(validateCmsContent('releases', { ...data, releases_priority }).length);
  }
  const release = { collection: 'releases', id: 'lotus', slug: 'lotus', revisionId: 'accepted-release', data };
  const media = [
    { id: 'image', sha256: 'a'.repeat(64), filename: 'image.png', mimeType: 'image/png', size: 1, width: 1, height: 1 },
  ];
  const accepted = parseContentSnapshot(
    JSON.stringify({
      schemaVersion: 1,
      environment: 'local',
      media,
      records: [
        {
          collection: 'artists',
          id: 'sidus',
          slug: 'sidus',
          revisionId: 'accepted-artist',
          data: { title: 'Sidus', genre: 'Rock', bio: 'Biography', image: { id: 'image' }, image_alt: 'Portrait' },
        },
        release,
      ],
    }),
    'local',
  );
  const privateDraft = { ...release, revisionId: 'ranked-draft', data: { ...data, releases_priority: 1 } };
  assert.equal(publishedCollection(accepted, 'releases', '/media')[0].data.releases_priority, undefined);
  const published = replacePublishedRecord(accepted, privateDraft, media);
  assert.equal(publishedCollection(published, 'releases', '/media')[0].data.releases_priority, 1);
  assert.equal(publishedCollection(accepted, 'releases', '/media')[0].data.releases_priority, undefined);
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
    catalog_number: 'BBR#001',
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
  assert.deepEqual(paths('releases', releases), []);
  const partnerLink = { label: 'Bandcamp', url: 'https://sidus.bandcamp.com/album/lotus' };
  assert.deepEqual(paths('releases', { ...releases, partner_links: [partnerLink] }), []);
  assert.ok(
    paths('releases', { ...releases, partner_links: [{ ...partnerLink, label: '' }] }).includes(
      'partner_links.0.label',
    ),
  );
  assert.ok(
    paths('releases', { ...releases, partner_links: [{ ...partnerLink, url: 'http://sidus.bandcamp.com/' }] }).includes(
      'partner_links.0.url',
    ),
  );
  assert.ok(paths('news', { ...news, image: null }).includes('image'));
  assert.ok(paths('releases', { ...releases, artist: '' }).includes('artist'));
});

describe('GPSR product safety', () => {
  const verified = () => ({
    review_status: 'verified',
    operator_role: 'distributor',
    product_type: '12-inch vinyl record',
    product_identifier: 'TEST-001 / first edition',
    manufacturer: {
      name: 'Fixture manufacturer',
      postal_address: 'Fixture address, Athens, Greece',
      electronic_address: 'manufacturer@example.com',
      establishment: 'eu',
    },
    safety_information: { status: 'provided', text_el: 'Δοκιμαστικές οδηγίες χρήσης.' },
    evidence: {
      reference: 'fixture-evidence-001',
      checked_on: '2026-10-14',
      notes: 'Fixture role, contact and safety evidence.',
    },
  });
  const source = {
    title: 'Fixture album',
    group: 'Vinyl 12-inch',
    artist_or_label: 'Fixture artist',
    image: { id: 'cover' },
    image_alt: 'Fixture cover',
    summary: 'Fixture description',
    order: 0,
  };
  const release = {
    title: 'Fixture album',
    artist: 'artist',
    cover_image: { id: 'cover' },
    cover_image_alt: 'Fixture cover',
    catalog_number: 'BBR#001',
    release_stage: 'upcoming',
  };

  test('GPSR is additive for legacy records and incomplete private work never claims readiness', () => {
    for (const [collection, data] of [
      ['distro', source],
      ['releases', release],
    ]) {
      for (const product_safety of [
        undefined,
        null,
        { review_status: 'incomplete', manufacturer: { name: 'Unverified supplier' } },
      ]) {
        assert.deepEqual(validateCmsContent(collection, { ...data, product_safety }), []);
        assert.deepEqual(validateCmsDraft(collection, { ...data, product_safety }), []);
        assert.ok(getProductSafetyIssues(product_safety).length);
        assert.equal(productSafetyOfferInformation(product_safety), undefined);
      }
      assert.deepEqual(validateCmsDraft(collection, { product_safety: { review_status: 'verified' } }), []);
      assert.ok(validateCmsContent(collection, { ...data, product_safety: { review_status: 'verified' } }).length);
      assert.deepEqual(validateCmsContent(collection, { ...data, product_safety: verified() }), []);
    }
  });

  test('verification requires product identity, economic-operator contacts, role and evidence', () => {
    const data = verified();
    assert.deepEqual(getProductSafetyIssues(data), []);
    for (const key of ['product_type', 'product_identifier', 'manufacturer', 'operator_role', 'evidence']) {
      const incomplete = { ...data };
      delete incomplete[key];
      assert.ok(
        getProductSafetyIssues(incomplete).some((issue) => issue.path.includes(key)),
        key,
      );
      assert.equal(productSafetyContentSchema.safeParse(incomplete).success, false);
    }
    for (const key of ['name', 'postal_address', 'electronic_address', 'establishment']) {
      const incomplete = { ...data, manufacturer: { ...data.manufacturer } };
      delete incomplete.manufacturer[key];
      assert.ok(
        getProductSafetyIssues(incomplete).some((issue) => issue.path.includes(key)),
        key,
      );
    }
    for (const key of ['reference', 'checked_on', 'notes']) {
      const incomplete = { ...data, evidence: { ...data.evidence } };
      delete incomplete.evidence[key];
      assert.ok(
        getProductSafetyIssues(incomplete).some((issue) => issue.path.includes(key)),
        key,
      );
    }
  });

  test('non-EU manufacturers require a verified EU responsible person without replacing the manufacturer', () => {
    const data = verified();
    data.manufacturer.establishment = 'non_eu';
    assert.ok(getProductSafetyIssues(data).some((issue) => issue.path.includes('responsible_person')));
    data.responsible_person = {
      name: 'Fixture responsible person',
      postal_address: 'Fixture EU address',
      electronic_address: 'https://responsible.example/contact',
      eu_country: 'GR',
    };
    assert.deepEqual(getProductSafetyIssues(data), []);
    assert.equal(productSafetyOfferInformation(data).manufacturer.name, 'Fixture manufacturer');
    for (const eu_country of ['GB', 'US', 'ZZ', ''])
      assert.ok(
        getProductSafetyIssues({ ...data, responsible_person: { ...data.responsible_person, eu_country } }).length,
      );
    for (const key of ['name', 'postal_address', 'electronic_address', 'eu_country']) {
      const responsible_person = { ...data.responsible_person };
      delete responsible_person[key];
      assert.ok(getProductSafetyIssues({ ...data, responsible_person }).length);
    }
  });

  test('an empty safety assessment cannot become an evidenced no-warning decision', () => {
    const data = verified();
    for (const safety_information of [
      undefined,
      {},
      { status: 'provided' },
      { status: 'provided', text_el: '  ' },
      { status: 'none' },
    ])
      assert.ok(getProductSafetyIssues({ ...data, safety_information }).length);
    assert.deepEqual(getProductSafetyIssues({ ...data, safety_information: { status: 'not_required' } }), []);
    assert.ok(
      getProductSafetyIssues({ ...data, safety_information: { status: 'not_required', text_el: 'Warning' } }).length,
    );
    assert.ok(getProductSafetyIssues({ ...data, evidence: { ...data.evidence, checked_on: '2026-02-30' } }).length);
    assert.ok(getProductSafetyIssues({ ...data, first_placed_on_eu_market: '2024-02-30' }).length);
  });

  test('contacts reject unsafe values and neither pressing context nor age provides an exemption', () => {
    const data = verified();
    for (const electronic_address of ['javascript:alert(1)', 'http://example.com/contact', 'not an address']) {
      const unsafe = { manufacturer: { electronic_address } };
      assert.ok(validateCmsDraft('distro', { product_safety: unsafe }).length);
      assert.ok(getProductSafetyIssues({ ...data, manufacturer: { ...data.manufacturer, electronic_address } }).length);
    }
    assert.ok(validateCmsDraft('distro', { product_safety: { pressing_plant: 'dunk' } }).length);
    const incomplete = { review_status: 'incomplete', first_placed_on_eu_market: '2020-01-01' };
    assert.ok(getProductSafetyIssues(incomplete).length);
    assert.equal(productSafetyOfferInformation(incomplete), undefined);
    assert.equal(productSafetyContentSchema.parse({}).manufacturer, undefined);
  });

  test('accepted snapshot projection preserves private evidence but exposes only verified offer data', () => {
    const snapshot = parseContentSnapshot(
      JSON.stringify({
        schemaVersion: 1,
        environment: 'local',
        records: [{ collection: 'distro', id: 'album', slug: 'album', revisionId: 'baseline', data: source }],
        media: [
          {
            id: 'cover',
            sha256: 'a'.repeat(64),
            filename: 'cover.jpg',
            mimeType: 'image/jpeg',
            size: 12,
            width: 100,
            height: 100,
          },
        ],
      }),
      'local',
    );
    const data = { ...source, product_safety: { ...verified(), first_placed_on_eu_market: '2020-01-01' } };
    const candidate = replacePublishedRecord(
      snapshot,
      { ...snapshot.records[0], revisionId: 'new', data },
      snapshot.media,
    );
    assert.equal(publishedCollection(snapshot, 'distro', '/media')[0].data.product_safety, undefined);
    assert.deepEqual(candidate.records[0].data.product_safety.evidence, data.product_safety.evidence);
    const projected = publishedCollection(candidate, 'distro', '/media')[0].data.product_safety;
    assert.equal(productSafetyOfferSchema.safeParse(projected).success, true);
    assert.deepEqual(Object.keys(projected).sort(), [
      'manufacturer',
      'product_identifier',
      'product_type',
      'safety_information',
    ]);
    assert.equal(JSON.stringify(projected).includes('fixture-evidence-001'), false);
    const partial = replacePublishedRecord(
      snapshot,
      {
        ...snapshot.records[0],
        revisionId: 'partial',
        data: { ...source, product_safety: { review_status: 'incomplete' } },
      },
      snapshot.media,
    );
    assert.equal(publishedCollection(partial, 'distro', '/media')[0].data.product_safety, undefined);
    assert.throws(
      () =>
        replacePublishedRecord(
          snapshot,
          {
            ...snapshot.records[0],
            revisionId: 'invalid',
            data: { ...source, product_safety: { review_status: 'verified' } },
          },
          snapshot.media,
        ),
      /Invalid snapshot content/,
    );
  });
});
