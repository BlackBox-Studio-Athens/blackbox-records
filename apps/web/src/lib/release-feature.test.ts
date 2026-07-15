import { describe, expect, it } from 'vitest';

import {
  getLatestOutNowRelease,
  isReleaseOutNow,
  selectReleasePageEntries,
  splitReleaseCatalogByAvailability,
} from './release-feature';

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
  it('assigns highlighted releases once and preserves the remaining catalog order', () => {
    const releases = [
      release('Anarchotribal', '2026-12-01'),
      release('Disintegration', '2026-09-01'),
      release('Caregivers', '2026-03-13'),
      release('Older Tape', '2024-07-02'),
    ];

    const selection = selectReleasePageEntries(releases, new Date('2026-05-14T12:00:00.000Z'));

    expect(selection.featuredReleaseEntry?.data.title).toBe('Caregivers');
    expect(selection.upcomingReleaseEntry?.data.title).toBe('Disintegration');
    expect(selection.remainingReleaseEntries.map((entry) => entry.data.title)).toEqual(['Anarchotribal', 'Older Tape']);
  });

  it('omits the upcoming role without removing another catalog entry', () => {
    const releases = [release('Caregivers', '2026-03-13'), release('Older Tape', '2024-07-02')];

    const selection = selectReleasePageEntries(releases, new Date('2026-05-14T12:00:00.000Z'));

    expect(selection.featuredReleaseEntry?.data.title).toBe('Caregivers');
    expect(selection.upcomingReleaseEntry).toBeNull();
    expect(selection.remainingReleaseEntries.map((entry) => entry.data.title)).toEqual(['Older Tape']);
  });

  it('keeps the featured fallback distinct from the nearest upcoming release', () => {
    const releases = [
      release('Far Future', '2026-12-01'),
      release('Near Future', '2026-06-01'),
      release('Middle Future', '2026-09-01'),
    ];

    const selection = selectReleasePageEntries(releases, new Date('2026-05-14T12:00:00.000Z'));

    expect(selection.featuredReleaseEntry?.data.title).toBe('Far Future');
    expect(selection.upcomingReleaseEntry?.data.title).toBe('Near Future');
    expect(selection.remainingReleaseEntries.map((entry) => entry.data.title)).toEqual(['Middle Future']);
  });

  it('returns an empty remainder when every release has a highlighted role', () => {
    const releases = [release('Disintegration', '2026-09-01'), release('Caregivers', '2026-03-13')];

    const selection = selectReleasePageEntries(releases, new Date('2026-05-14T12:00:00.000Z'));

    expect(selection.featuredReleaseEntry?.data.title).toBe('Caregivers');
    expect(selection.upcomingReleaseEntry?.data.title).toBe('Disintegration');
    expect(selection.remainingReleaseEntries).toEqual([]);
  });

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
