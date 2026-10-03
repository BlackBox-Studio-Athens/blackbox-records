import { listDistroEntries, listStoreItems, type DistroCatalogEntry, type StoreItem } from './catalog-data';
import { groupDistroEntries } from './distro-data';
import type { DistroGroupName, DistroIntroKey } from '@blackbox/content-model';
import { createStoreItemAvailability, type ItemAvailability } from './item-availability';
import { type StoreCatalogCategoryId } from './store-categories';
import { isReleaseOutNow } from './release-feature';

const bandCollator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export type StoreCatalogMembership = Exclude<StoreCatalogCategoryId, 'all'>;
export type StoreCardImageLoadingMode = 'priority' | 'eager' | 'lazy';

type StoreDistroFacets = {
  format: string | null;
  group: DistroGroupName;
  order: number;
};

export type StoreCollectionEntry = {
  categoryIds: readonly StoreCatalogMembership[];
  distro: StoreDistroFacets | null;
  previewImage: NonNullable<DistroCatalogEntry['data']['gallery']>[number] | null;
  primaryAvailability: ItemAvailability | null;
  storeItem: StoreItem;
};

export type StoreDistroCollectionGroup = {
  entries: StoreCollectionEntry[];
  groupName: string;
  introKey: DistroIntroKey;
};

type StoreCatalogMembershipInput = {
  distroGroup?: DistroGroupName | undefined;
  sourceId: string;
  sourceKind: string;
};

export function classifyStoreCatalogMembership(input: StoreCatalogMembershipInput): StoreCatalogMembership[] {
  if (input.sourceKind === 'release') return ['blackbox-releases', 'distro'];

  if (input.sourceKind !== 'distro') {
    throw new Error(`Unsupported Store Item source kind: ${input.sourceKind}.`);
  }

  if (!input.distroGroup) {
    throw new Error(`Distro Store Item ${input.sourceId} is missing its Distro group.`);
  }

  const categoryIds: StoreCatalogMembership[] = ['distro'];
  if (input.distroGroup === 'Clothes') categoryIds.push('merch');

  return categoryIds;
}

export function selectStoreCollectionEntries(
  entries: readonly StoreCollectionEntry[],
  categoryId: StoreCatalogCategoryId,
): StoreCollectionEntry[] {
  const selectedEntries =
    categoryId === 'all' ? [...entries] : entries.filter((entry) => entry.categoryIds.includes(categoryId));
  assertStoreCollectionInvariants(selectedEntries, categoryId);

  return selectedEntries;
}

export function isRecentBlackboxRelease(storeItem: StoreItem, referenceDate = new Date()): boolean {
  if (
    storeItem.sourceKind !== 'release' ||
    storeItem.releaseStage === 'upcoming' ||
    !isReleaseOutNow(storeItem.releaseDate, referenceDate)
  ) {
    return false;
  }

  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month - 5, 0)).getUTCDate();
  const cutoff = Date.UTC(year, month - 6, Math.min(referenceDate.getUTCDate(), lastDay));
  return storeItem.releaseDate!.getTime() >= cutoff;
}

export function sortStoreDistroCollectionEntries(
  entries: readonly StoreCollectionEntry[],
  referenceDate = new Date(),
): StoreCollectionEntry[] {
  assertStoreCollectionInvariants(entries, 'distro');
  const recent = new Set(entries.filter((entry) => isRecentBlackboxRelease(entry.storeItem, referenceDate)));
  const credit = (value: string) => value.normalize('NFC').trim().replace(/\s+/gu, ' ');

  return [...entries].sort(
    (left, right) =>
      Number(recent.has(right)) - Number(recent.has(left)) ||
      (recent.has(left) && recent.has(right)
        ? right.storeItem.releaseDate!.getTime() - left.storeItem.releaseDate!.getTime()
        : 0) ||
      bandCollator.compare(credit(left.storeItem.subtitle), credit(right.storeItem.subtitle)) ||
      bandCollator.compare(left.storeItem.title, right.storeItem.title) ||
      left.storeItem.slug.localeCompare(right.storeItem.slug, 'en'),
  );
}

export function getStoreDistroFormatGroup(entry: StoreCollectionEntry): DistroGroupName {
  if (entry.distro) return entry.distro.group;
  const option = entry.primaryAvailability?.optionLabel?.toLowerCase() ?? '';
  if (/\bvinyl\b|\blp\b/.test(option)) {
    if (/\b7\b/.test(option)) return 'Vinyl 7-inch';
    if (/\b10\b/.test(option)) return 'Vinyl 10-inch';
    return 'Vinyl 12-inch';
  }
  if (/\bcds?\b/.test(option)) return 'CDs';
  if (/\bcassette\b|\btapes?\b/.test(option)) return 'Tapes';
  if (/\bshirt\b|\btee\b|\bclothes\b/.test(option)) return 'Clothes';
  return 'Other';
}

export function groupStoreDistroCollectionEntries(
  entries: readonly StoreCollectionEntry[],
): StoreDistroCollectionGroup[] {
  const groupedEntries = groupDistroEntries(
    entries.map((entry) => {
      if (entry.storeItem.sourceKind === 'distro' && !entry.distro) {
        throw new Error(
          `Store Item ${entry.storeItem.slug} cannot appear in the Distro collection without Distro facets.`,
        );
      }

      return {
        data: {
          group: getStoreDistroFormatGroup(entry),
          order: entry.distro?.order ?? 0,
          title: entry.storeItem.title,
        },
        entry,
      };
    }),
  );

  return groupedEntries.map((group) => ({
    entries: group.entries.map(({ entry }) => entry),
    groupName: group.groupName,
    introKey: group.introKey,
  }));
}

export function createStoreDistroGroupHeadingId(groupName: string): string {
  return `distro-group-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export async function listStoreCollectionEntries(
  categoryId: StoreCatalogCategoryId = 'all',
): Promise<StoreCollectionEntry[]> {
  const [storeItems, distroEntries] = await Promise.all([listStoreItems(), listDistroEntries()]);
  const distroEntriesById = new Map(distroEntries.map((entry) => [entry.id, entry]));
  const entries = storeItems.map((storeItem): StoreCollectionEntry => {
    const distroEntry = storeItem.sourceKind === 'distro' ? distroEntriesById.get(storeItem.sourceId) : undefined;
    if (storeItem.sourceKind === 'distro' && !distroEntry) {
      throw new Error(`Distro Store Item ${storeItem.slug} has no matching Distro source entry.`);
    }

    const distro = distroEntry
      ? {
          format: distroEntry.data.format || null,
          group: distroEntry.data.group,
          order: distroEntry.data.order,
        }
      : null;

    return {
      categoryIds: classifyStoreCatalogMembership({
        distroGroup: distro?.group,
        sourceId: storeItem.sourceId,
        sourceKind: storeItem.sourceKind,
      }),
      distro,
      previewImage: distroEntry?.data.gallery?.find(({ image }) => image.src !== storeItem.image.src) ?? null,
      primaryAvailability: createStoreItemAvailability(storeItem),
      storeItem,
    };
  });

  assertStoreCollectionInvariants(entries, 'all');

  return selectStoreCollectionEntries(entries, categoryId);
}

function assertStoreCollectionInvariants(
  entries: readonly StoreCollectionEntry[],
  categoryId: StoreCatalogCategoryId,
): void {
  const seenStoreItemSlugs = new Set<string>();

  for (const entry of entries) {
    if (seenStoreItemSlugs.has(entry.storeItem.slug)) {
      throw new Error(`Store collection ${categoryId} contains Store Item ${entry.storeItem.slug} more than once.`);
    }
    seenStoreItemSlugs.add(entry.storeItem.slug);

    if (entry.categoryIds.length === 0) {
      throw new Error(`Store Item ${entry.storeItem.slug} has no deterministic Store category membership.`);
    }
  }
}
