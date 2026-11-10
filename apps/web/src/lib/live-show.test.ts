import { describe, expect, it, vi } from 'vitest';

const volOne = {
  collection: 'shows',
  id: 'blackbox-showcase-vol-i',
  data: {
    title: 'BlackBox Showcase Vol. I',
    date: '2026-12-05',
    doors: '20:00',
    venue: 'AN Club, Athens',
    prices: [1000, 1200, 1500],
    ticketUrl: 'https://www.more.com/gr-el/tickets/music/offer/sidus-afterwise-double-release-live-show-hylas/',
    facebookUrl: 'https://www.facebook.com/events/1446071347664122/',
    billing: 'Double album release show',
    poster: { src: '/poster.png', width: 1080, height: 1350, format: 'png' },
    posterAlt: 'Showcase poster',
    lineup: [
      { role: 'headliner', artist: 'sidus', release: 'lotus' },
      { role: 'headliner', artist: 'afterwise', release: 'disintegration' },
      { role: 'opening', name: 'Hylas' },
    ],
  },
};

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (name: string) => (name === 'shows' ? [volOne] : [])),
}));

vi.mock('@/lib/catalog-data', () => ({
  listArtistProfiles: async () => [
    { id: 'sidus', data: { slug: 'sidus', title: 'Sidus' } },
    { id: 'afterwise', data: { slug: 'afterwise', title: 'Afterwise' } },
  ],
  listReleaseCatalog: async () => [
    { id: 'lotus', data: { title: 'LOTUS' } },
    { id: 'disintegration', data: { title: 'Disintegration' } },
  ],
  createArtistDetailPath: (artist: { data: { slug: string } }) => `/blackbox-records/artists/${artist.data.slug}/`,
}));

const { formatPriceText, getUpcomingLiveShow } = await import('./live-show');

describe('getUpcomingLiveShow', () => {
  it('resolves the Vol. I placements before the show', async () => {
    const show = await getUpcomingLiveShow(new Date('2026-11-10T12:00:00Z'));
    expect(show).toMatchObject({
      dayLabel: 'Sat 05 Dec',
      fullDayLabel: 'Sat 05 Dec 2026',
      weekday: 'Sat',
      day: '05',
      month: 'Dec',
      venueShort: 'AN Club',
      priceText: '€10 / €12 / €15',
      lowestPrice: 1000,
      ticketSeller: 'More.com',
    });
    expect(formatPriceText([show!.lowestPrice!])).toBe('€10');
    expect(show?.headliners).toEqual([
      expect.objectContaining({ name: 'Sidus', href: '/blackbox-records/artists/sidus/', releaseTitle: 'LOTUS' }),
      expect.objectContaining({ name: 'Afterwise', releaseId: 'disintegration' }),
    ]);
    expect(show?.openers).toEqual([{ name: 'Hylas', role: 'opening' }]);
  });

  it('still shows on the show night in Athens', async () => {
    expect(await getUpcomingLiveShow(new Date('2026-12-05T21:30:00Z'))).not.toBeNull();
  });

  it('renders no placement once the date has passed in Athens', async () => {
    // 22:30 UTC on 5 December is 00:30 on 6 December in Athens.
    expect(await getUpcomingLiveShow(new Date('2026-12-05T22:30:00Z'))).toBeNull();
  });
});

describe('formatPriceText', () => {
  it('joins euro amounts and keeps cents only when present', () => {
    expect(formatPriceText([1000, 1250])).toBe('€10 / €12.50');
    expect(formatPriceText([])).toBe('');
  });
});
