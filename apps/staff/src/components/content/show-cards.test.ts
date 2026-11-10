import { expect, test } from 'vitest';
import { showCardSummaries } from './show-cards';

const show = {
  title: 'BlackBox Showcase Vol. I',
  date: '2026-12-05',
  doors: '20:00',
  venue: 'AN Club, Athens',
  prices: [1000, 1200, 1500],
  ticket_url: 'https://www.more.com/gr-el/tickets/music/offer/sidus/',
  facebook_url: 'https://www.facebook.com/events/1446071347664122/',
  poster: { id: 'poster-1' },
  poster_alt: 'Show poster',
  lineup: [
    { role: 'headliner', artist: 'sidus' },
    { role: 'headliner', artist: 'afterwise' },
    { role: 'opening', name: 'Hylas' },
  ],
};
const names = new Map([
  ['sidus', 'Sidus'],
  ['afterwise', 'Afterwise'],
]);

test('summaries read back stored Show values in plain words', () => {
  expect(showCardSummaries(show, names)).toEqual({
    title: 'BlackBox Showcase Vol. I',
    when: 'Sat 05 Dec 2026 · doors 20:00',
    where: 'AN Club, Athens',
    tickets: '€10 / €12 / €15 · More.com',
    lineup: 'Sidus, Afterwise + Hylas',
    poster: 'Poster with description',
    links: 'Facebook event',
  });
});

test('empty and partial Shows say what is missing', () => {
  expect(showCardSummaries({ poster: { id: 'p' }, lineup: [] })).toMatchObject({
    title: 'Title missing',
    when: 'Date missing',
    where: 'Venue missing',
    tickets: 'Ticket link missing',
    lineup: 'No acts yet',
    poster: 'Description missing',
    links: 'No Facebook event',
  });
  expect(showCardSummaries({ date: '2026-12-05', ticket_url: 'https://tickets.example.org/x' })).toMatchObject({
    when: 'Sat 05 Dec 2026 · doors time missing',
    tickets: 'tickets.example.org',
  });
});
