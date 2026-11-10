import { formatDayDate, formatEuro, parseIsoDate, parseTimeOfDay, recognizeService } from '@blackbox/content-model';
import type { ContentData } from '../../lib/content-sections';
import type { LineupEntry } from './LineupFields';

export type ShowCardId = 'title' | 'when' | 'where' | 'tickets' | 'lineup' | 'poster' | 'links';

/** The Show editor's cards, in order, with the stored paths each one edits. */
export const showCards: readonly { id: ShowCardId; title: string; paths: readonly string[] }[] = [
  { id: 'title', title: 'Title', paths: ['title', 'billing'] },
  { id: 'when', title: 'When', paths: ['date', 'doors'] },
  { id: 'where', title: 'Where', paths: ['venue'] },
  { id: 'tickets', title: 'Tickets', paths: ['prices', 'ticket_url'] },
  { id: 'lineup', title: 'Lineup', paths: ['lineup'] },
  { id: 'poster', title: 'Poster', paths: ['poster', 'poster_alt'] },
  { id: 'links', title: 'Links', paths: ['facebook_url'] },
];

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function sellerName(url: string): string {
  const known = recognizeService(url);
  if (known) return known.label;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Ticket link';
  }
}

/** One plain-language line per Show card, read from the stored values. */
export function showCardSummaries(
  data: ContentData,
  artistNames: ReadonlyMap<string, string> = new Map(),
): Record<ShowCardId, string> {
  const date = parseIsoDate(data.date);
  const doors = parseTimeOfDay(data.doors);
  const prices = Array.isArray(data.prices) ? data.prices.filter((price) => typeof price === 'number') : [];
  const ticketUrl = text(data.ticket_url);
  const lineup = (Array.isArray(data.lineup) ? data.lineup : []) as LineupEntry[];
  const act = (entry: LineupEntry) =>
    entry.artist !== undefined
      ? (artistNames.get(entry.artist) ?? (entry.artist ? 'Label artist' : 'Artist not chosen'))
      : text(entry.name) || 'Unnamed act';
  const headliners = lineup.filter((entry) => entry.role === 'headliner').map(act);
  const openers = lineup.filter((entry) => entry.role === 'opening').map(act);
  const billing = text(data.billing);
  return {
    title: text(data.title) ? [text(data.title), billing].filter(Boolean).join(' · ') : 'Title missing',
    when: date ? `${formatDayDate(date)} · ${doors ? `doors ${doors}` : 'doors time missing'}` : 'Date missing',
    where: text(data.venue) || 'Venue missing',
    tickets: ticketUrl
      ? [prices.map(formatEuro).join(' / '), sellerName(ticketUrl)].filter(Boolean).join(' · ')
      : 'Ticket link missing',
    lineup: lineup.length ? [headliners.join(', '), openers.join(', ')].filter(Boolean).join(' + ') : 'No acts yet',
    poster: !(data.poster as { id?: string } | undefined)?.id
      ? 'No poster'
      : text(data.poster_alt)
        ? 'Poster with description'
        : 'Description missing',
    links: text(data.facebook_url) ? 'Facebook event' : 'No Facebook event',
  };
}
