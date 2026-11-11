import { expect, test } from 'vitest';
import { newsCardSummaries, releaseCardSummaries, safetySummary } from './collection-cards';

test('release summaries read the stored values in plain language', () => {
  const summaries = releaseCardSummaries(
    {
      title: 'Lotus',
      artist: 'artist-1',
      catalog_number: 'BBR#014',
      release_date: '2026-12-05',
      cover_image: { id: 'img' },
      cover_image_alt: 'Cover',
      gallery: [{}, {}],
      formats: ['Vinyl', 'CD'],
      product_condition: 'new',
      bandcamp_embed_url: 'https://x.bandcamp.com/album/lotus',
      singles: [{}],
      tracklist: { format: 'vinyl', sides: [{ label: 'A', tracks: [{ title: 'One' }, { title: 'Two' }] }] },
      credits: [{}],
      summary: 'Short',
      show_on_home: 1,
      releases_priority: 2,
      product_safety: { review_status: 'verified' },
    },
    new Map([['artist-1', 'Sidus']]),
  );
  expect(summaries).toEqual({
    basics: 'Lotus · Sidus · BBR#014 · Sat 05 Dec 2026',
    artwork: 'Cover with description · 2 photos',
    formats: 'Vinyl, CD · new',
    listening: 'Bandcamp, 1 single',
    tracklist: 'Vinyl · 2 tracks',
    credits: '1 credit',
    text: 'Short description',
    home: 'On Home · order 2',
    safety: 'Verified',
  });
});

test('an empty release names what is missing', () => {
  expect(releaseCardSummaries({ release_stage: 'upcoming' })).toMatchObject({
    basics: 'Title missing',
    artwork: 'Cover missing',
    formats: 'No formats yet',
    listening: 'No listening links',
    tracklist: 'No tracklist',
    home: 'Not on Home · automatic order',
    safety: 'Not started',
  });
  expect(releaseCardSummaries({ title: 'Next', release_stage: 'upcoming' }).basics).toBe('Next · Upcoming');
  expect(safetySummary({ product_type: 'Cassette' })).toBe('Not verified yet');
});

test('news summaries read date, artist and section label', () => {
  expect(
    newsCardSummaries(
      { title: 'Tour', date: '2026-11-10', artist: 'a', section_label: 'Live', image: { id: 'i' }, body: [{}] },
      new Map([['a', 'Afterwise']]),
    ),
  ).toEqual({
    basics: 'Tour · Tue 10 Nov 2026 · Afterwise · Live',
    image: 'Description missing',
    text: 'full text',
  });
});
