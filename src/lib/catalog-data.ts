import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
export { groupDistroEntries } from '@/lib/distro-data';

export type ArtistProfileEntry = CollectionEntry<'artists'>;
export type ReleaseCatalogEntry = CollectionEntry<'releases'>;
export type NewsArticleEntry = CollectionEntry<'news'>;
export type DistroEntry = CollectionEntry<'distro'>;
export type ArtistRosterReleaseContext = {
  latestReleaseTitle: string | null;
  latestReleaseYear: number | null;
  releaseCount: number;
};

function sortArtistProfilesByName(left: ArtistProfileEntry, right: ArtistProfileEntry) {
  return left.data.title.localeCompare(right.data.title);
}

function sortReleaseCatalogByDate(left: ReleaseCatalogEntry, right: ReleaseCatalogEntry) {
  return right.data.release_date.getTime() - left.data.release_date.getTime();
}

function sortNewsArticlesByDate(left: NewsArticleEntry, right: NewsArticleEntry) {
  return right.data.date.getTime() - left.data.date.getTime();
}

function sortDistroEntries(left: DistroEntry, right: DistroEntry) {
  if (left.data.order !== right.data.order) {
    return left.data.order - right.data.order;
  }

  return left.data.title.localeCompare(right.data.title);
}

export async function listArtistProfiles() {
  return (await getCollection('artists')).slice().sort(sortArtistProfilesByName);
}

export async function listReleaseCatalog() {
  return (await getCollection('releases')).slice().sort(sortReleaseCatalogByDate);
}

export async function mapArtistRosterReleaseContextById() {
  const releaseCatalog = await listReleaseCatalog();
  const releaseContextByArtistId = new Map<string, ArtistRosterReleaseContext>();

  releaseCatalog.forEach((releaseEntry) => {
    const artistId = releaseEntry.data.artist.id;
    const existingContext = releaseContextByArtistId.get(artistId);

    if (!existingContext) {
      releaseContextByArtistId.set(artistId, {
        latestReleaseTitle: releaseEntry.data.title,
        latestReleaseYear: releaseEntry.data.release_date.getFullYear(),
        releaseCount: 1,
      });
      return;
    }

    existingContext.releaseCount += 1;
  });

  return releaseContextByArtistId;
}

export async function listNewsArticles() {
  return (await getCollection('news')).slice().sort(sortNewsArticlesByDate);
}

export async function listDistroEntries() {
  return (await getCollection('distro')).slice().sort(sortDistroEntries);
}

export function mapArtistProfilesById(artistProfiles: ArtistProfileEntry[]) {
  return new Map(artistProfiles.map((artistProfile) => [artistProfile.id, artistProfile]));
}

export async function listReleaseCatalogByArtistId(artistId: string) {
  return (await listReleaseCatalog()).filter((releaseEntry) => releaseEntry.data.artist.id === artistId);
}

export async function resolveArtistProfileForRelease(releaseEntry: ReleaseCatalogEntry) {
  return getEntry(releaseEntry.data.artist);
}

export function resolveReleaseArtistDisplayName(
  releaseEntry: ReleaseCatalogEntry,
  artistProfile: ArtistProfileEntry | undefined,
) {
  const artistSlugFallbackName = releaseEntry.data.artist.id || 'Artist';
  return artistProfile?.data.title || artistSlugFallbackName.replace(/-/g, ' ');
}

export async function createArtistDetailStaticPaths() {
  return (await listArtistProfiles()).map((artistProfile) => ({
    params: { slug: artistProfile.data.slug },
    props: { artist: artistProfile },
  }));
}

export async function createReleaseDetailStaticPaths() {
  return (await listReleaseCatalog()).map((releaseEntry) => ({
    params: { slug: releaseEntry.id },
    props: { release: releaseEntry },
  }));
}

export async function createNewsDetailStaticPaths() {
  return (await listNewsArticles()).map((newsArticle) => ({
    params: { slug: newsArticle.id },
    props: { item: newsArticle },
  }));
}
