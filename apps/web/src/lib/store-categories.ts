export type StoreCatalogCategoryId = 'all' | 'blackbox-releases' | 'distro' | 'merch';

export type StoreCatalogCategory = {
  description: string;
  heading: string;
  id: StoreCatalogCategoryId;
  label: string;
  path: string;
  routeSegment: string | null;
  title: string;
};

export const storeCatalogCategories = [
  {
    description: 'BlackBox releases, distro records, and merch in one native storefront.',
    heading: 'Store',
    id: 'all',
    label: 'All',
    path: '/store/',
    routeSegment: null,
    title: 'Store',
  },
  {
    description: 'Physical releases connected directly to the BlackBox catalogue.',
    heading: 'BlackBox Releases',
    id: 'blackbox-releases',
    label: 'BlackBox Releases',
    path: '/store/blackbox-releases/',
    routeSegment: 'blackbox-releases',
    title: 'BlackBox Releases | Store',
  },
  {
    description: 'Records, tapes, and other physical items distributed through BlackBox.',
    heading: 'Distro',
    id: 'distro',
    label: 'Distro',
    path: '/store/distro/',
    routeSegment: 'distro',
    title: 'Distro | Store',
  },
  {
    description: 'BlackBox merchandise currently available through the Store.',
    heading: 'Merch',
    id: 'merch',
    label: 'Merch',
    path: '/store/merch/',
    routeSegment: 'merch',
    title: 'Merch | Store',
  },
] as const satisfies readonly StoreCatalogCategory[];

export const reservedStoreRouteSegments = new Set([
  'checkout',
  ...storeCatalogCategories.flatMap((category) => (category.routeSegment ? [category.routeSegment] : [])),
]);

export function getStoreCatalogCategory(categoryId: StoreCatalogCategoryId): StoreCatalogCategory {
  const category = storeCatalogCategories.find((candidate) => candidate.id === categoryId);
  if (!category) throw new Error(`Unknown Store category: ${categoryId}.`);

  return category;
}

export function getDiscoverableStoreCatalogCategories(categoryIds: Iterable<StoreCatalogCategoryId>) {
  const populatedCategoryIds = new Set(categoryIds);
  return storeCatalogCategories.filter((category) => category.id !== 'merch' || populatedCategoryIds.has('merch'));
}
