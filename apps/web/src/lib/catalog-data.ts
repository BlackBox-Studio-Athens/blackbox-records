import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

import { createProjectRelativeUrl } from '../config/site';
import { assertNoSlugCollisions, createSlugSuggestion } from './slugs';
import type { StoreItemTaxCategory } from './store-tax-category';
export { groupDistroEntries } from './distro-data';

export type ArtistProfileEntry = CollectionEntry<'artists'>;
export type ReleaseCatalogEntry = CollectionEntry<'releases'>;
export type NewsArticleEntry = CollectionEntry<'news'>;
export type DistroCatalogEntry = CollectionEntry<'distro'>;
export type StoreItemSourceKind = 'release' | 'distro';
export type StoreItem = {
  slug: string;
  taxCategory: StoreItemTaxCategory;
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
type StoreItemImageOverride = {
  src: string;
  width: number;
  height: number;
  format: 'webp';
};
export type ArtistRosterReleaseContext = {
  latestReleaseTitle: string | null;
  latestReleaseYear: number | null;
  releaseCount: number;
};

const nonPhysicalReleaseFormats = new Set(['digital']);

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

export function getReleaseDetailSlug(releaseEntry: ReleaseCatalogEntry) {
  return releaseEntry.id;
}

export function createReleaseDetailPath(releaseEntry: ReleaseCatalogEntry) {
  return createProjectRelativeUrl(`/releases/${getReleaseDetailSlug(releaseEntry)}/`);
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

const RELEASE_STORE_ITEM_IMAGE_OVERRIDES: Record<string, StoreItemImageOverride> = {
  caregivers: {
    src: '/blackbox-records/admin/media/releases/chronoboros-album-cover-distro-mockup.webp',
    width: 3544,
    height: 3543,
    format: 'webp',
  },
  disintegration: {
    src: '/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
    width: 3544,
    height: 3543,
    format: 'webp',
  },
};

function resolveStoreItemImageForRelease(releaseEntry: ReleaseCatalogEntry): StoreItem['image'] {
  return (RELEASE_STORE_ITEM_IMAGE_OVERRIDES[releaseEntry.id] || releaseEntry.data.cover_image) as StoreItem['image'];
}

function normalizeStoreItemImageAlt(imageAlt: string | undefined, fallback: string) {
  return imageAlt || fallback;
}

export function getPrimaryReleaseStoreFormat(formats: readonly string[] | undefined): string | null {
  return (
    formats?.find((format) => {
      const normalized = format.trim().toLowerCase();
      return normalized && !nonPhysicalReleaseFormats.has(normalized);
    }) ?? null
  );
}

export function createReleaseStoreItemSlug(releaseEntry: ReleaseCatalogEntry): string {
  const primaryFormat = getPrimaryReleaseStoreFormat(releaseEntry.data.formats);
  return createSlugSuggestion([releaseEntry.data.title, primaryFormat].filter(Boolean).join(' '));
}

export async function createStoreItemFromRelease(releaseEntry: ReleaseCatalogEntry): Promise<StoreItem> {
  const artistProfile = await resolveArtistProfileForRelease(releaseEntry);
  const artistDisplayName = resolveReleaseArtistDisplayName(releaseEntry, artistProfile || undefined);
  const slug = createReleaseStoreItemSlug(releaseEntry);
  const metadata = [String(releaseEntry.data.release_date.getFullYear()), ...(releaseEntry.data.formats || [])];

  return {
    slug,
    taxCategory: 'physical_goods',
    sourceKind: 'release',
    sourceId: releaseEntry.id,
    title: releaseEntry.data.title,
    subtitle: artistDisplayName,
    summary: releaseEntry.data.summary || null,
    image: resolveStoreItemImageForRelease(releaseEntry),
    imageAlt: normalizeStoreItemImageAlt(releaseEntry.data.cover_image_alt, releaseEntry.data.title),
    eyebrow: 'Release',
    metadata,
    ...createStoreItemPaths(slug),
  };
}

export function createStoreItemFromDistroEntry(distroEntry: DistroCatalogEntry): StoreItem {
  const slug = distroEntry.id;
  const releaseYear = distroEntry.data.release_date ? String(distroEntry.data.release_date.getFullYear()) : null;
  const metadata = [distroEntry.data.group, releaseYear, distroEntry.data.format].filter(Boolean) as string[];

  return {
    slug,
    taxCategory: 'physical_goods',
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

export async function getStoreItemForRelease(releaseEntry: ReleaseCatalogEntry) {
  return createStoreItemFromRelease(releaseEntry);
}

export async function listStoreItems(): Promise<StoreItem[]> {
  const [releaseCatalog, distroEntries] = await Promise.all([listReleaseCatalog(), listDistroEntries()]);

  const releaseStoreItems = await Promise.all(
    releaseCatalog.map((releaseEntry) => createStoreItemFromRelease(releaseEntry)),
  );

  const distroStoreItems = distroEntries.map((distroEntry) => createStoreItemFromDistroEntry(distroEntry));

  return [...releaseStoreItems, ...distroStoreItems];
}

export function mapStoreItemsBySlug(storeItems: StoreItem[]) {
  assertNoSlugCollisions(
    storeItems.map((storeItem) => ({
      owner: `${storeItem.sourceKind}:${storeItem.sourceId}`,
      slug: storeItem.slug,
    })),
  );

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
    params: { slug: getReleaseDetailSlug(releaseEntry) },
    props: { release: releaseEntry },
  }));
}

export async function createNewsDetailStaticPaths() {
  return (await listNewsArticles()).map((newsArticle) => ({
    params: { slug: newsArticle.id },
    props: { item: newsArticle },
  }));
}
