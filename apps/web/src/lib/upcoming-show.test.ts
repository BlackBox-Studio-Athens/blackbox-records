import { expect, test } from 'vitest';
import { athensToday, selectUpcomingShow } from './upcoming-show';

test('uses the Athens calendar at UTC midnight edges', () => {
  expect(athensToday(new Date('2026-12-04T21:59:00Z'))).toBe('2026-12-04');
  expect(athensToday(new Date('2026-12-04T22:00:00Z'))).toBe('2026-12-05');
  expect(athensToday(new Date('2026-12-05T22:30:00Z'))).toBe('2026-12-06');
});

test('selects the earliest upcoming date, then title, without changing its input', () => {
  const shows = [
    { data: { date: '2026-12-06', title: 'Later' } },
    { data: { date: '2026-12-05', title: 'Zebra' } },
    { data: { date: '2026-12-05', title: 'Alpha' } },
    { data: { date: '2026-12-03', title: 'Past' } },
  ];
  expect(selectUpcomingShow(shows, new Date('2026-12-04T12:00:00Z'))).toBe(shows[2]);
  expect(selectUpcomingShow(shows, new Date('2026-12-05T12:00:00Z'))).toBe(shows[2]);
  expect(selectUpcomingShow(shows, new Date('2026-12-05T22:30:00Z'))).toBe(shows[0]);
  expect(selectUpcomingShow(shows, new Date('2026-12-06T22:00:00Z'))).toBeNull();
  expect(selectUpcomingShow([], new Date('2026-12-04T12:00:00Z'))).toBeNull();
  expect(shows[0]?.data.title).toBe('Later');
});
