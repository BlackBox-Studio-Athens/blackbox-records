export type ReleaseDateEntry = {
  data: {
    release_date?: Date | undefined;
    release_stage?: 'upcoming' | 'released' | undefined;
    title?: string;
  };
};

function getUtcDayTimestamp(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function compareReleaseTitle(left: ReleaseDateEntry, right: ReleaseDateEntry) {
  return (left.data.title || '').localeCompare(right.data.title || '');
}

function sortReleasedNewestFirst<T extends ReleaseDateEntry>(releaseEntries: T[]) {
  return releaseEntries.slice().sort((left, right) => {
    const dateDifference = (right.data.release_date?.getTime() ?? 0) - (left.data.release_date?.getTime() ?? 0);
    return dateDifference || compareReleaseTitle(left, right);
  });
}

function sortUpcomingSoonestFirst<T extends ReleaseDateEntry>(releaseEntries: T[]) {
  return releaseEntries.slice().sort((left, right) => {
    const dateDifference =
      (left.data.release_date?.getTime() ?? Infinity) - (right.data.release_date?.getTime() ?? Infinity);
    return dateDifference || compareReleaseTitle(left, right);
  });
}

export function isReleaseOutNow(releaseDate: Date | undefined, referenceDate = new Date()) {
  return !!releaseDate && getUtcDayTimestamp(releaseDate) <= getUtcDayTimestamp(referenceDate);
}

export function splitReleaseCatalogByAvailability<T extends ReleaseDateEntry>(
  releaseEntries: T[],
  referenceDate = new Date(),
) {
  const outNowReleases: T[] = [];
  const upcomingReleases: T[] = [];

  releaseEntries.forEach((releaseEntry) => {
    if (
      releaseEntry.data.release_stage !== 'upcoming' &&
      isReleaseOutNow(releaseEntry.data.release_date, referenceDate)
    ) {
      outNowReleases.push(releaseEntry);
      return;
    }

    upcomingReleases.push(releaseEntry);
  });

  return {
    outNowReleases: sortReleasedNewestFirst(outNowReleases),
    upcomingReleases: sortUpcomingSoonestFirst(upcomingReleases),
  };
}

export function selectReleasePageEntries<T extends ReleaseDateEntry>(releaseEntries: T[], referenceDate = new Date()) {
  const { outNowReleases, upcomingReleases } = splitReleaseCatalogByAvailability(releaseEntries, referenceDate);
  const featuredReleaseEntry = outNowReleases[0] || releaseEntries[0] || null;
  const upcomingReleaseEntry = upcomingReleases.find((releaseEntry) => releaseEntry !== featuredReleaseEntry) || null;

  return {
    featuredReleaseEntry,
    upcomingReleaseEntry,
    remainingReleaseEntries: releaseEntries.filter(
      (releaseEntry) => releaseEntry !== featuredReleaseEntry && releaseEntry !== upcomingReleaseEntry,
    ),
  };
}

export function getLatestOutNowRelease<T extends ReleaseDateEntry>(releaseEntries: T[], referenceDate = new Date()) {
  return splitReleaseCatalogByAvailability(releaseEntries, referenceDate).outNowReleases[0] || null;
}
