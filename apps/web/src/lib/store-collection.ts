import { listDistroEntries, listStoreItems, type StoreItem } from './catalog-data';
import { groupDistroEntries, type DistroGroupName } from './distro-data';
import { getPrimaryAvailabilityForStoreItem, type ItemAvailability } from './item-availability';
import { type StoreCatalogCategoryId } from './store-categories';
import { releaseToDistroStoreItemRelations } from './store-item-ownership';

export type StoreCatalogMembership = Exclude<StoreCatalogCategoryId, 'all'>;

type StoreDistroFacets = {
  format: string | null;
  group: DistroGroupName;
  order: number;
  searchText: string;
};

export type StoreCollectionEntry = {
  categoryIds: readonly StoreCatalogMembership[];
  distro: StoreDistroFacets | null;
  primaryAvailability: ItemAvailability | null;
  storeItem: StoreItem;
};

export type StoreDistroCollectionGroup = {
  entries: StoreCollectionEntry[];
  groupName: string;
  introGroupName: DistroGroupName;
};

type StoreCatalogMembershipInput = {
  distroGroup?: DistroGroupName | undefined;
  sourceId: string;
  sourceKind: string;
};

const releaseRelatedDistroIds = new Set<string>(releaseToDistroStoreItemRelations.map((relation) => relation.distroId));

export function classifyStoreCatalogMembership(input: StoreCatalogMembershipInput): StoreCatalogMembership[] {
  if (input.sourceKind === 'release') return ['blackbox-releases'];

  if (input.sourceKind !== 'distro') {
    throw new Error(`Unsupported Store Item source kind: ${input.sourceKind}.`);
  }

  if (!input.distroGroup) {
    throw new Error(`Distro Store Item ${input.sourceId} is missing its Distro group.`);
  }

  const categoryIds: StoreCatalogMembership[] = [];
  if (releaseRelatedDistroIds.has(input.sourceId)) categoryIds.push('blackbox-releases');
  categoryIds.push('distro');
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

export function groupStoreDistroCollectionEntries(
  entries: readonly StoreCollectionEntry[],
): StoreDistroCollectionGroup[] {
  const groupedEntries = groupDistroEntries(
    entries.map((entry) => {
      if (!entry.distro) {
        throw new Error(
          `Store Item ${entry.storeItem.slug} cannot appear in the Distro collection without Distro facets.`,
        );
      }

      return {
        data: {
          group: entry.distro.group,
          order: entry.distro.order,
          title: entry.storeItem.title,
        },
        entry,
      };
    }),
  );

  return groupedEntries.map((group) => ({
    entries: group.entries.map(({ entry }) => entry),
    groupName: group.groupName,
    introGroupName: group.introGroupName,
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
  const entries = await Promise.all(
    storeItems.map(async (storeItem): Promise<StoreCollectionEntry> => {
      const distroEntry = storeItem.sourceKind === 'distro' ? distroEntriesById.get(storeItem.sourceId) : undefined;
      if (storeItem.sourceKind === 'distro' && !distroEntry) {
        throw new Error(`Distro Store Item ${storeItem.slug} has no matching Distro source entry.`);
      }

      const distro = distroEntry
        ? {
            format: distroEntry.data.format || null,
            group: distroEntry.data.group,
            order: distroEntry.data.order,
            searchText: [storeItem.title, storeItem.subtitle, distroEntry.data.group, distroEntry.data.format]
              .filter(Boolean)
              .join(' '),
          }
        : null;

      return {
        categoryIds: classifyStoreCatalogMembership({
          distroGroup: distro?.group,
          sourceId: storeItem.sourceId,
          sourceKind: storeItem.sourceKind,
        }),
        distro,
        primaryAvailability: await getPrimaryAvailabilityForStoreItem(storeItem.slug),
        storeItem,
      };
    }),
  );

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
