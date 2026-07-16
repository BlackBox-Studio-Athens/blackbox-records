import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const categoryNavigationSource = source('./StoreCategoryNavigation.astro');
const collectionPageSource = source('./StoreCollectionPage.astro');
const allRouteSource = source('../../pages/store/index.astro');
const releasesRouteSource = source('../../pages/store/blackbox-releases/index.astro');
const distroRouteSource = source('../../pages/store/distro/index.astro');
const merchRouteSource = source('../../pages/store/merch/index.astro');
const storeItemCardSource = source('../cards/StoreItemCard.astro');
const distroCardSource = source('../cards/DistroCard.astro');

describe('Store collection category surfaces', () => {
  it('renders semantic category navigation with an active ordinary link', () => {
    expect(categoryNavigationSource).toContain('<nav aria-label="Store categories"');
    expect(categoryNavigationSource).toContain('discoverableCategories.map');
    expect(categoryNavigationSource).toContain('getDiscoverableStoreCatalogCategories');
    expect(categoryNavigationSource).toContain("aria-current={category.id === activeCategoryId ? 'page' : undefined}");
    expect(categoryNavigationSource).toContain('href={createProjectRelativeUrl(category.path)}');
  });

  it('uses one category-aware page for canonical metadata, listings, counts, and Distro discovery', () => {
    expect(collectionPageSource).toContain(
      '<SiteLayout pageTitle={category.title} pageDescription={category.description}>',
    );
    expect(collectionPageSource).toContain('<InternalPageHero sectionLabel="Store" title={category.heading} />');
    expect(collectionPageSource).toContain('const itemCountLabel');
    expect(collectionPageSource).toContain('<StoreItemCard entry={entry}');
    expect(collectionPageSource).toContain('aria-label="Browse Distro formats"');
    expect(collectionPageSource).toContain('createStoreDistroGroupHeadingId(group.groupName)');
    expect(collectionPageSource).toContain("selectStoreCollectionEntries(entries, 'distro')");
    expect(collectionPageSource.indexOf('<StoreCategoryNavigation')).toBeLessThan(
      collectionPageSource.indexOf('<slot name="distro"'),
    );
    expect(collectionPageSource.match(/aria-labelledby="store-(?:distro-discovery|collection)-heading"/g)).toHaveLength(
      1,
    );
  });

  it('keeps route files thin and selects each of the four category presentations', () => {
    expect(allRouteSource).toContain("getStoreCatalogCategory('all')");
    expect(releasesRouteSource).toContain("getStoreCatalogCategory('blackbox-releases')");
    expect(distroRouteSource).toContain("getStoreCatalogCategory('distro')");
    expect(distroRouteSource).toContain('<StoreDistroCatalog slot="distro"');
    expect(merchRouteSource).toContain("getStoreCatalogCategory('merch')");
    expect(merchRouteSource).toContain('<RedirectLayout');
    expect(merchRouteSource).toContain("createProjectRelativeUrl('/store/')");
  });

  it('renders plain listing-price placeholders without per-card Store Offer islands or redundant CTAs', () => {
    for (const cardSource of [storeItemCardSource, distroCardSource]) {
      expect(cardSource).toContain('data-store-listing-price');
      expect(cardSource).toContain('data-store-item-slug={storeItem.slug}');
      expect(cardSource).not.toContain('StoreOfferPriceDisplay');
    }
    expect(storeItemCardSource).not.toContain('View Item');
    expect(distroCardSource).not.toContain('View in Store');
  });
});
