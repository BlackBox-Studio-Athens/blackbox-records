import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  parseContentSnapshot,
  publishedCollection,
  validateCmsContent,
  validateCmsDraft,
} from '@blackbox/content-model';
import { snapshotCollection } from './content-snapshot';

test('the Local Show retains its LOTUS Release source and link', () => {
  const release = readFileSync(new URL('../../content/releases/lotus.md', import.meta.url), 'utf8');
  const fixture = JSON.parse(
    readFileSync(new URL('../../content/shows/blackbox-showcase-vol-i.json', import.meta.url), 'utf8'),
  );
  expect(release).toMatch(/^title: LOTUS$/m);
  expect(release).toMatch(/^artist: sidus$/m);
  expect(fixture.lineup).toContainEqual({ role: 'headliner', artist: 'sidus', release: 'lotus' });
});

const show = {
  title: 'BlackBox Showcase Vol. I',
  date: '2026-12-05',
  doors: '20:00',
  venue: 'AN Club, Athens',
  prices: [1000, 1200, 1500],
  ticket_url: 'https://example.com/tickets',
  facebook_url: 'https://facebook.com/events/1',
  billing: 'Double Album Release Show',
  poster: { id: 'poster' },
  poster_alt: 'Show poster',
  lineup: [
    { role: 'headliner', artist: 'artist', release: 'release' },
    { role: 'headliner', artist: 'afterwise-id', release: 'disintegration-id' },
    { role: 'opening', name: 'Hylas' },
  ],
};

test('Show drafts save incomplete data but reject invalid facts and lineup rows', () => {
  expect(validateCmsDraft('shows', { title: 'Vol. II' })).toEqual([]);
  const missing = validateCmsContent('shows', { title: 'Vol. II' }).join('\n');
  for (const field of ['date', 'doors', 'venue', 'ticket_url', 'poster', 'poster_alt', 'lineup'])
    expect(missing).toContain(field);
  expect(validateCmsContent('shows', show)).toEqual([]);
  for (const field of ['date', 'doors', 'venue', 'ticket_url', 'poster', 'poster_alt', 'lineup'] as const) {
    const incomplete = { ...show, [field]: undefined };
    expect(validateCmsDraft('shows', incomplete)).toEqual([]);
    expect(validateCmsContent('shows', incomplete).join()).toContain(field);
  }
  for (const field of ['ticket_url', 'facebook_url']) {
    for (const invalid of ['http://example.com', '/tickets']) {
      expect(validateCmsDraft('shows', { [field]: invalid }).join()).toContain(field);
      expect(validateCmsContent('shows', { ...show, [field]: invalid }).join()).toContain(field);
    }
  }
  for (const lineup of [
    [{ role: 'headliner', artist: 'artist', name: 'Both' }],
    [{ role: 'headliner' }],
    [{ role: 'opening', artist: 'artist', release: 'release' }],
    [{ role: 'headliner', name: 'Name', release: 'release' }],
  ])
    expect(validateCmsDraft('shows', { lineup }).join()).toContain('lineup.0');
  expect(validateCmsContent('shows', { ...show, lineup: [{ role: 'opening', name: 'Hylas' }] }).join()).toContain(
    'lineup',
  );
  expect(validateCmsDraft('shows', { lineup: [{ role: 'opening', name: 'Hylas' }] })).toEqual([]);
  for (const value of [[0], [-1], [12.5], [1, 2, 3, 4, 5]]) {
    expect(validateCmsDraft('shows', { prices: value }).join()).toContain('prices');
    expect(validateCmsContent('shows', { ...show, prices: value }).join()).toContain('prices');
  }
  expect(validateCmsDraft('shows', { doors: '24:00' }).join()).toContain('doors');
  expect(validateCmsDraft('shows', { date: '2026-02-30' }).join()).toContain('date');
});

test('snapshot validates Show references and projects slugs and poster in both readers', () => {
  const media = {
    id: 'poster',
    sha256: 'a'.repeat(64),
    filename: 'poster.png',
    mimeType: 'image/png' as const,
    size: 1,
    width: 4,
    height: 5,
  };
  const artist = {
    collection: 'artists',
    id: 'artist',
    revisionId: 'a',
    slug: 'sidus',
    data: { title: 'Sidus', genre: 'Rock', bio: 'Bio', image: { id: 'poster' }, image_alt: 'Artist' },
  };
  const release = {
    collection: 'releases',
    id: 'release',
    revisionId: 'r',
    slug: 'lotus',
    data: {
      title: 'LOTUS',
      artist: 'artist',
      catalog_number: 'BBR#001',
      release_date: '2026-01-01',
      cover_image: { id: 'poster' },
      cover_image_alt: 'Cover',
    },
  };
  const record = { collection: 'shows', id: 'show', revisionId: 's', slug: 'vol-i', data: show };
  const afterwise = {
    ...artist,
    id: 'afterwise-id',
    revisionId: 'a2',
    slug: 'afterwise',
    data: { ...artist.data, title: 'Afterwise' },
  };
  const disintegration = {
    ...release,
    id: 'disintegration-id',
    revisionId: 'r2',
    slug: 'disintegration',
    data: { ...release.data, title: 'Disintegration', artist: 'afterwise-id', catalog_number: 'BBR#002' },
  };
  const input = {
    schemaVersion: 1,
    environment: 'local',
    records: [artist, afterwise, release, disintegration, record],
    media: [media],
  };
  const parse = (value: unknown) => parseContentSnapshot(JSON.stringify(value), 'local');
  const snapshot = parse(input);
  const expected = {
    ticketUrl: show.ticket_url,
    facebookUrl: show.facebook_url,
    posterAlt: show.poster_alt,
    date: show.date,
    prices: [1000, 1200, 1500],
    lineup: [
      { role: 'headliner', artist: 'sidus', release: 'lotus' },
      { role: 'headliner', artist: 'afterwise', release: 'disintegration' },
      { role: 'opening', name: 'Hylas' },
    ],
  };
  expect(publishedCollection(snapshot, 'shows', '/media')[0]).toMatchObject({
    id: 'vol-i',
    data: { ...expected, poster: { src: `/media/${media.sha256}`, width: 4, height: 5, format: 'png' } },
  });
  const loaded = {
    snapshot,
    media: new Map([['poster', { path: '', relativePath: './poster.png', item: media }]]),
    path: '',
  };
  expect(snapshotCollection(loaded, 'shows')[0]).toMatchObject({
    id: 'vol-i',
    data: { ...expected, poster: './poster.png' },
  });
  expect(() => parse({ ...input, records: [afterwise, disintegration, record] })).toThrow('Missing published Artist.');
  expect(() => parse({ ...input, records: [artist, afterwise, disintegration, record] })).toThrow(
    'Missing published Release.',
  );
  expect(() => parse({ ...input, media: [] })).toThrow('media references');
  expect(() =>
    parse({
      ...input,
      records: [
        artist,
        afterwise,
        { ...release, data: { ...release.data, artist: 'afterwise-id' } },
        disintegration,
        record,
      ],
    }),
  ).toThrow('The linked Release belongs to another Artist.');
});
