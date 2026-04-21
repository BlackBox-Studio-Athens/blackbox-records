import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

import { createProjectRelativeUrl } from '../config/site';
export { groupDistroEntries } from './distro-data';

export type ArtistProfileEntry = CollectionEntry<'artists'>;
export type ReleaseCatalogEntry = CollectionEntry<'releases'>;
export type NewsArticleEntry = CollectionEntry<'news'>;
export type DistroCatalogEntry = CollectionEntry<'distro'>;
export type CatalogItemSourceKind = 'release' | 'distro';
export type CatalogItem = {
  slug: string;
  sourceKind: CatalogItemSourceKind;
  sourceId: string;
  title: string;
  subtitle: string;
  summary: string | null;
  image: ReleaseCatalogEntry['data']['cover_image'] | DistroCatalogEntry['data']['image'];
  imageAlt: string;
  eyebrow: string | null;
  metadata: string[];
  shopPath: string;
  checkoutPath: string;
};
export type ArtistRosterReleaseContext = {
  latestReleaseTitle: string | null;
  latestReleaseYear: number | null;
  releaseCount: number;
};

function isNativeShopMerchUrl(path: string | undefined) {
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

function createCatalogItemPaths(slug: string) {
  const shopPath = createProjectRelativeUrl(`/store/${slug}/`);

  return {
    shopPath,
    checkoutPath: createProjectRelativeUrl(`/store/${slug}/checkout/`),
  };
}

function normalizeCatalogItemImageAlt(imageAlt: string | undefined, fallback: string) {
  return imageAlt || fallback;
}

export async function createCatalogItemFromRelease(releaseEntry: ReleaseCatalogEntry): Promise<CatalogItem> {
  const artistProfile = await resolveArtistProfileForRelease(releaseEntry);
  const artistDisplayName = resolveReleaseArtistDisplayName(releaseEntry, artistProfile || undefined);
  const slug = releaseEntry.id;
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
    imageAlt: normalizeCatalogItemImageAlt(releaseEntry.data.cover_image_alt, releaseEntry.data.title),
    eyebrow: 'Release',
    metadata,
    ...createCatalogItemPaths(slug),
  };
}

export function createCatalogItemFromDistroEntry(distroEntry: DistroCatalogEntry): CatalogItem {
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
    imageAlt: normalizeCatalogItemImageAlt(distroEntry.data.image_alt, distroEntry.data.title),
    eyebrow: distroEntry.data.eyebrow || null,
    metadata,
    ...createCatalogItemPaths(slug),
  };
}

export function hasNativeCatalogItemForRelease(releaseEntry: ReleaseCatalogEntry) {
  return isNativeShopMerchUrl(releaseEntry.data.merch_url);
}

export async function getCatalogItemForRelease(releaseEntry: ReleaseCatalogEntry) {
  if (!hasNativeCatalogItemForRelease(releaseEntry)) {
    return null;
  }

  return createCatalogItemFromRelease(releaseEntry);
}

export async function listCatalogItems(): Promise<CatalogItem[]> {
  const [releaseCatalog, distroEntries] = await Promise.all([
    listReleaseCatalog(),
    listDistroEntries(),
  ]);

  const releaseCatalogItems = await Promise.all(
    releaseCatalog
      .filter(hasNativeCatalogItemForRelease)
      .map((releaseEntry) => createCatalogItemFromRelease(releaseEntry)),
  );

  const distroCatalogItems = distroEntries.map((distroEntry) => createCatalogItemFromDistroEntry(distroEntry));

  return [...releaseCatalogItems, ...distroCatalogItems];
}

export function mapCatalogItemsBySlug(catalogItems: CatalogItem[]) {
  return new Map(catalogItems.map((catalogItem) => [catalogItem.slug, catalogItem]));
}

export async function getCatalogItemBySlug(slug: string) {
  return mapCatalogItemsBySlug(await listCatalogItems()).get(slug) || null;
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
