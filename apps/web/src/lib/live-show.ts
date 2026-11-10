import { getCollection, type CollectionEntry } from 'astro:content';
import { formatEuro } from '@blackbox/content-model';
import { createArtistDetailPath, listArtistProfiles, listReleaseCatalog } from '@/lib/catalog-data';
import { selectUpcomingShow } from '@/lib/upcoming-show';

export type LiveShowAct = {
  name: string;
  role: 'headliner' | 'opening';
  href?: string | undefined;
  artistId?: string | undefined;
  releaseId?: string | undefined;
  releaseTitle?: string | undefined;
};

export type LiveShow = {
  entry: CollectionEntry<'shows'>;
  title: string;
  /** ISO calendar date, for <time datetime>. */
  date: string;
  /** "Sat 05 Dec" */
  dayLabel: string;
  /** "Sat 05 Dec 2026" */
  fullDayLabel: string;
  weekday: string;
  day: string;
  month: string;
  venue: string;
  /** First segment of the venue, e.g. "AN Club" from "AN Club, Athens". */
  venueShort: string;
  doors: string;
  prices: number[];
  /** "€10 / €12 / €15", or empty without prices. */
  priceText: string;
  lowestPrice: number | null;
  ticketUrl: string;
  ticketSeller: string;
  facebookUrl?: string | undefined;
  billing?: string | undefined;
  acts: LiveShowAct[];
  headliners: LiveShowAct[];
  openers: LiveShowAct[];
};

// The ISO date is a calendar date; formatting in UTC keeps it on the same day everywhere.
const dateParts = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export function formatPriceText(prices: readonly number[]) {
  return prices.map(formatEuro).join(' / ');
}

function sellerName(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return 'the ticket seller';
  }
}

/** The soonest upcoming published Show, resolved for the public placements, or null. */
export async function getUpcomingLiveShow(now = new Date()): Promise<LiveShow | null> {
  const entry = selectUpcomingShow(await getCollection('shows'), now);
  if (!entry) return null;
  const [artists, releases] = await Promise.all([listArtistProfiles(), listReleaseCatalog()]);
  const { data } = entry;
  const acts: LiveShowAct[] = data.lineup.map((item) => {
    const artist = item.artist
      ? artists.find((profile) => profile.id === item.artist || profile.data.slug === item.artist)
      : undefined;
    const release = item.release ? releases.find((candidate) => candidate.id === item.release) : undefined;
    return {
      name: artist?.data.title ?? item.name ?? '',
      role: item.role,
      href: artist ? createArtistDetailPath(artist) : undefined,
      artistId: artist?.id,
      releaseId: release?.id,
      releaseTitle: release?.data.title,
    };
  });
  const prices = data.prices ?? [];
  return {
    entry,
    title: data.title,
    date: data.date,
    dayLabel: dateParts(data.date, { weekday: 'short', day: '2-digit', month: 'short' }).replace(',', ''),
    fullDayLabel: dateParts(data.date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).replace(
      ',',
      '',
    ),
    weekday: dateParts(data.date, { weekday: 'short' }),
    day: dateParts(data.date, { day: '2-digit' }),
    month: dateParts(data.date, { month: 'short' }),
    venue: data.venue,
    venueShort: data.venue.split(',')[0]!.trim(),
    doors: data.doors,
    prices,
    priceText: formatPriceText(prices),
    lowestPrice: prices.length ? Math.min(...prices) : null,
    ticketUrl: data.ticketUrl,
    ticketSeller: sellerName(data.ticketUrl),
    facebookUrl: data.facebookUrl || undefined,
    billing: data.billing || undefined,
    acts,
    headliners: acts.filter((act) => act.role === 'headliner'),
    openers: acts.filter((act) => act.role === 'opening'),
  };
}
