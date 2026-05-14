export type ReleaseDateEntry = {
  data: {
    release_date: Date;
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
    const dateDifference = right.data.release_date.getTime() - left.data.release_date.getTime();
    return dateDifference || compareReleaseTitle(left, right);
  });
}

function sortUpcomingSoonestFirst<T extends ReleaseDateEntry>(releaseEntries: T[]) {
  return releaseEntries.slice().sort((left, right) => {
    const dateDifference = left.data.release_date.getTime() - right.data.release_date.getTime();
    return dateDifference || compareReleaseTitle(left, right);
  });
}

export function isReleaseOutNow(releaseDate: Date, referenceDate = new Date()) {
  return getUtcDayTimestamp(releaseDate) <= getUtcDayTimestamp(referenceDate);
}

export function splitReleaseCatalogByAvailability<T extends ReleaseDateEntry>(
  releaseEntries: T[],
  referenceDate = new Date(),
) {
  const outNowReleases: T[] = [];
  const upcomingReleases: T[] = [];

  releaseEntries.forEach((releaseEntry) => {
    if (isReleaseOutNow(releaseEntry.data.release_date, referenceDate)) {
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

export function getLatestOutNowRelease<T extends ReleaseDateEntry>(releaseEntries: T[], referenceDate = new Date()) {
  return splitReleaseCatalogByAvailability(releaseEntries, referenceDate).outNowReleases[0] || null;
}
