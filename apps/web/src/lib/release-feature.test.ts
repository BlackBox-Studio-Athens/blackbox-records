import { describe, expect, it } from 'vitest';

import { getLatestOutNowRelease, isReleaseOutNow, splitReleaseCatalogByAvailability } from './release-feature';

function release(title: string, releaseDate: string) {
  return {
    id: title.toLowerCase().replace(/\s+/g, '-'),
    data: {
      title,
      release_date: new Date(`${releaseDate}T00:00:00.000Z`),
    },
  };
}

describe('release feature availability', () => {
  it('treats release dates at UTC day granularity', () => {
    const referenceDate = new Date('2026-05-14T23:59:59.000Z');

    expect(isReleaseOutNow(new Date('2026-05-14T00:00:00.000Z'), referenceDate)).toBe(true);
    expect(isReleaseOutNow(new Date('2026-05-15T00:00:00.000Z'), referenceDate)).toBe(false);
  });

  it('selects the newest out-now release instead of a future-dated announcement', () => {
    const releases = [
      release('Disintegration', '2026-09-01'),
      release('Caregivers', '2026-03-13'),
      release('Older Tape', '2024-07-02'),
    ];

    expect(getLatestOutNowRelease(releases, new Date('2026-05-14T12:00:00.000Z'))?.data.title).toBe('Caregivers');
  });

  it('splits out-now and upcoming releases into presentation order', () => {
    const releases = [
      release('Far Future', '2026-12-01'),
      release('Older Tape', '2024-07-02'),
      release('Caregivers', '2026-03-13'),
      release('Near Future', '2026-06-01'),
    ];

    const { outNowReleases, upcomingReleases } = splitReleaseCatalogByAvailability(
      releases,
      new Date('2026-05-14T12:00:00.000Z'),
    );

    expect(outNowReleases.map((entry) => entry.data.title)).toEqual(['Caregivers', 'Older Tape']);
    expect(upcomingReleases.map((entry) => entry.data.title)).toEqual(['Near Future', 'Far Future']);
  });
});
