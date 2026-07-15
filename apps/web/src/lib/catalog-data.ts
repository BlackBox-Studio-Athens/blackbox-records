import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

import { createProjectRelativeUrl } from '../config/site';
import { assertNoSlugCollisions, createSlugSuggestion } from './slugs';
import type { StoreItemTaxCategory } from './store-tax-category';
import { sortDistroEntries } from './distro-data';
import {
  createPhysicalEditionKey,
  createValidatedStoreItemProjection,
  findStoreItemRelationForRelease,
  resolveStoreItemSlugForDistro,
} from './store-item-ownership';
import { reservedStoreRouteSegments } from './store-categories';

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
};
type StoreItemImageOverride = {
  src: string;
  width: number;
  height: number;
  format: 'webp';
};
export type ArtistRosterReleaseContext = {
  latestReleaseTitle: string | null;
  latestReleaseDate: string | null;
  releaseCount: number;
};

const nonPhysicalReleaseFormats = new Set(['digital']);

function formatMonthYear(value: Date) {
  return value.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
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
        latestReleaseDate: formatMonthYear(releaseEntry.data.release_date),
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

function createStoreItemPath(slug: string) {
  return createProjectRelativeUrl(`/store/${slug}/`);
}

const RELEASE_STORE_ITEM_IMAGE_OVERRIDES: Record<string, StoreItemImageOverride> = {
  anarchotribal: {
    src: createProjectRelativeUrl('/admin/media/releases/ouranopithecus-album-cover-distro-mockup.webp'),
    width: 3544,
    height: 3543,
    format: 'webp',
  },
  disintegration: {
    src: createProjectRelativeUrl('/admin/media/releases/afterwise-album-cover-distro-mockup.webp'),
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

function getPrimaryReleaseStoreFormat(formats: readonly string[] | undefined): string | null {
  return (
    formats?.find((format) => {
      const normalized = format.trim().toLowerCase();
      return normalized && !nonPhysicalReleaseFormats.has(normalized);
    }) ?? null
  );
}

function createReleaseStoreItemSlug(releaseEntry: ReleaseCatalogEntry): string {
  const primaryFormat = getPrimaryReleaseStoreFormat(releaseEntry.data.formats);
  return createSlugSuggestion([releaseEntry.data.title, primaryFormat].filter(Boolean).join(' '));
}

export async function createStoreItemFromRelease(releaseEntry: ReleaseCatalogEntry): Promise<StoreItem> {
  const artistProfile = await resolveArtistProfileForRelease(releaseEntry);
  const artistDisplayName = resolveReleaseArtistDisplayName(releaseEntry, artistProfile || undefined);
  const slug = createReleaseStoreItemSlug(releaseEntry);
  const metadata = [formatMonthYear(releaseEntry.data.release_date), ...(releaseEntry.data.formats || [])];

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
    storePath: createStoreItemPath(slug),
  };
}

export function createStoreItemFromDistroEntry(distroEntry: DistroCatalogEntry): StoreItem {
  const slug = resolveStoreItemSlugForDistro(distroEntry.id);
  const releaseDate = distroEntry.data.release_date ? formatMonthYear(distroEntry.data.release_date) : null;
  const metadata = [distroEntry.data.group, releaseDate, distroEntry.data.format].filter(Boolean) as string[];

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
    storePath: createStoreItemPath(slug),
  };
}

export async function getStoreItemForRelease(releaseEntry: ReleaseCatalogEntry) {
  const relation = findStoreItemRelationForRelease(releaseEntry.id);
  if (!relation) return createStoreItemFromRelease(releaseEntry);

  return (
    (await listStoreItems()).find(
      (storeItem) => storeItem.sourceKind === 'distro' && storeItem.sourceId === relation.distroId,
    ) ?? null
  );
}

export async function listStoreItems(): Promise<StoreItem[]> {
  const [releaseCatalog, distroEntries] = await Promise.all([listReleaseCatalog(), listDistroEntries()]);

  const releaseStoreItems = await Promise.all(
    releaseCatalog.map((releaseEntry) => createStoreItemFromRelease(releaseEntry)),
  );

  const distroStoreItems = distroEntries.map((distroEntry) => createStoreItemFromDistroEntry(distroEntry));
  const storeItems = [...releaseStoreItems, ...distroStoreItems];
  const projection = createValidatedStoreItemProjection([
    ...releaseStoreItems.map((storeItem, index) => ({
      physicalEditionKeys: [
        createPhysicalEditionKey({
          artist: storeItem.subtitle,
          itemType: getPrimaryReleaseStoreFormat(releaseCatalog[index]?.data.formats) ?? '',
          title: storeItem.title,
        }),
      ],
      sourceId: storeItem.sourceId,
      sourceKind: storeItem.sourceKind,
      storeItemSlug: storeItem.slug,
    })),
    ...distroStoreItems.map((storeItem, index) => ({
      physicalEditionKeys: [
        createPhysicalEditionKey({
          artist: storeItem.subtitle,
          itemType: distroEntries[index]?.data.format ?? distroEntries[index]?.data.group ?? '',
          title: storeItem.title,
        }),
      ],
      sourceId: storeItem.sourceId,
      sourceKind: storeItem.sourceKind,
      storeItemSlug: storeItem.slug,
    })),
  ]);
  const storeItemsBySource = new Map(storeItems.map((item) => [`${item.sourceKind}:${item.sourceId}`, item]));

  return projection.map((entry) => {
    const storeItem = storeItemsBySource.get(`${entry.sourceKind}:${entry.sourceId}`)!;
    return {
      ...storeItem,
      slug: entry.storeItemSlug,
      storePath: createStoreItemPath(entry.storeItemSlug),
    };
  });
}

export function mapStoreItemsBySlug(storeItems: StoreItem[]) {
  const reservedSlug = storeItems.find((storeItem) => reservedStoreRouteSegments.has(storeItem.slug));
  if (reservedSlug) {
    throw new Error(
      `Reserved Store Item slug detected for ${reservedSlug.sourceKind}:${reservedSlug.sourceId}: ${reservedSlug.slug}`,
    );
  }

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
