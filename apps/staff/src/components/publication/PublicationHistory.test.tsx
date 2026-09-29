import { expect, it } from 'vitest';
import { publicationHistoryTitle } from './PublicationHistory';

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
