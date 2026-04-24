import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

import { createProjectRelativeUrl } from '../config/site';
export { groupDistroEntries } from './distro-data';

export type ArtistProfileEntry = CollectionEntry<'artists'>;
export type ReleaseCatalogEntry = CollectionEntry<'releases'>;
export type NewsArticleEntry = CollectionEntry<'news'>;
export type DistroCatalogEntry = CollectionEntry<'distro'>;
export type StoreItemSourceKind = 'release' | 'distro';
export type StoreItem = {
  slug: string;
  sourceKind: StoreItemSourceKind;
  sourceId: string;
  title: string;
  subtitle: string;
  summary: string | null;
  image: ReleaseCatalogEntry['data']['cover_image'] | DistroCatalogEntry['data']['image'];
  imageAlt: string;
  eyebrow: string | null;
  metadata: string[];
  storePath: string;
  checkoutPath: string;
};
export type ArtistRosterReleaseContext = {
  latestReleaseTitle: string | null;
  latestReleaseYear: number | null;
  releaseCount: number;
};

const releaseStoreItemSlugByReleaseId: Record<string, string> = {
  'barren-point': 'disintegration-black-vinyl-lp',
};

function isNativeStoreMerchUrl(path: string | undefined) {
  return path === '/store/';
}

function sortArtistProfilesByName(left: ArtistProfileEntry, right: ArtistProfileEntry) {
  return left.data.title.localeCompare(right.data.title);
}

function sortReleaseCatalogByDate(left: ReleaseCatalogEntry, right: ReleaseCatalogEntry) {
  return right.data.release_date.getTime() - left.data.release_date.getTime();
}

function sortNewsArticlesByDate(left: NewsArticleEntry, right: NewsArticleEntry) {
  return right.data.date.getTime() - left.data.date.getTime();
}

function sortDistroEntries(left: DistroCatalogEntry, right: DistroCatalogEntry) {
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

function createStoreItemPaths(slug: string) {
  const storePath = createProjectRelativeUrl(`/store/${slug}/`);

  return {
    storePath,
    checkoutPath: createProjectRelativeUrl(`/store/${slug}/checkout/`),
  };
}

function normalizeStoreItemImageAlt(imageAlt: string | undefined, fallback: string) {
  return imageAlt || fallback;
}

export async function createStoreItemFromRelease(releaseEntry: ReleaseCatalogEntry): Promise<StoreItem> {
  const artistProfile = await resolveArtistProfileForRelease(releaseEntry);
  const artistDisplayName = resolveReleaseArtistDisplayName(releaseEntry, artistProfile || undefined);
  const slug = releaseStoreItemSlugByReleaseId[releaseEntry.id] || releaseEntry.id;
  const metadata = [
    String(releaseEntry.data.release_date.getFullYear()),
    ...(releaseEntry.data.formats || []),
  ];

  return {
    slug,
    sourceKind: 'release',
    sourceId: releaseEntry.id,
    title: releaseEntry.data.title,
    subtitle: artistDisplayName,
    summary: releaseEntry.data.summary || null,
    image: releaseEntry.data.cover_image,
    imageAlt: normalizeStoreItemImageAlt(releaseEntry.data.cover_image_alt, releaseEntry.data.title),
    eyebrow: 'Release',
    metadata,
    ...createStoreItemPaths(slug),
  };
}

export function createStoreItemFromDistroEntry(distroEntry: DistroCatalogEntry): StoreItem {
  const slug = distroEntry.id;
  const metadata = [distroEntry.data.group, distroEntry.data.format].filter(Boolean) as string[];

  return {
    slug,
    sourceKind: 'distro',
    sourceId: distroEntry.id,
    title: distroEntry.data.title,
    subtitle: distroEntry.data.artist_or_label,
    summary: distroEntry.data.summary || null,
    image: distroEntry.data.image,
    imageAlt: normalizeStoreItemImageAlt(distroEntry.data.image_alt, distroEntry.data.title),
    eyebrow: distroEntry.data.eyebrow || null,
    metadata,
    ...createStoreItemPaths(slug),
  };
}

export function hasNativeStoreItemForRelease(releaseEntry: ReleaseCatalogEntry) {
  return isNativeStoreMerchUrl(releaseEntry.data.merch_url);
}

export async function getStoreItemForRelease(releaseEntry: ReleaseCatalogEntry) {
  if (!hasNativeStoreItemForRelease(releaseEntry)) {
    return null;
  }

  return createStoreItemFromRelease(releaseEntry);
}

export async function listStoreItems(): Promise<StoreItem[]> {
  const [releaseCatalog, distroEntries] = await Promise.all([
    listReleaseCatalog(),
    listDistroEntries(),
  ]);

  const releaseStoreItems = await Promise.all(
    releaseCatalog
      .filter(hasNativeStoreItemForRelease)
      .map((releaseEntry) => createStoreItemFromRelease(releaseEntry)),
  );

  const distroStoreItems = distroEntries.map((distroEntry) => createStoreItemFromDistroEntry(distroEntry));

  return [...releaseStoreItems, ...distroStoreItems];
}

export function mapStoreItemsBySlug(storeItems: StoreItem[]) {
  return new Map(storeItems.map((storeItem) => [storeItem.slug, storeItem]));
}

export async function getStoreItemBySlug(slug: string) {
  return mapStoreItemsBySlug(await listStoreItems()).get(slug) || null;
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
