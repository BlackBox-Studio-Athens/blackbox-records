import { expect, it } from 'vitest';
import { publicationHistoryTitle } from './PublicationHistory';
import { publicationDay } from './PublicationCalendar';

it('groups publication days in Athens across midnight and the daylight-saving boundary', () => {
  expect(publicationDay(Date.parse('2026-10-24T21:30:00Z'))).toBe('2026-10-25');
  expect(publicationDay(Date.parse('2026-10-25T00:30:00Z'))).toBe('2026-10-25');
  expect(publicationDay(Date.parse('2026-10-25T01:30:00Z'))).toBe('2026-10-25');
  expect(publicationDay(Date.parse('2026-10-25T22:30:00Z'))).toBe('2026-10-26');
});

it('keeps history titles compact while preserving legacy entries', () => {
  expect(publicationHistoryTitle({ id: 'legacy', status: 'live', requestedAt: 1 })).toBe('Website update');
  expect(
    publicationHistoryTitle({
      id: 'one',
      status: 'live',
      requestedAt: 1,
      entries: [{ collection: 'artists', recordId: 'artist', title: 'Artist' }],
    }),
  ).toBe('Artist');
  expect(
    publicationHistoryTitle({
      id: 'many',
      status: 'live',
      requestedAt: 1,
      entries: [
        { collection: 'artists', recordId: 'artist', title: 'Artist' },
        { collection: 'releases', recordId: 'release', title: 'Release' },
      ],
    }),
  ).toBe('Artist + 1 more');
});
