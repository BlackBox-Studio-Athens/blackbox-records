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

describe('Store collection category surfaces', () => {
  it('renders semantic category navigation with an active ordinary link', () => {
    expect(categoryNavigationSource).toContain('<nav aria-label="Store categories"');
    expect(categoryNavigationSource).toContain('storeCatalogCategories.map');
    expect(categoryNavigationSource).toContain("aria-current={category.id === activeCategoryId ? 'page' : undefined}");
    expect(categoryNavigationSource).toContain('href={createProjectRelativeUrl(category.path)}');
  });

  it('uses one category-aware page for canonical metadata, listings, counts, and empty Merch', () => {
    expect(collectionPageSource).toContain(
      '<SiteLayout pageTitle={category.title} pageDescription={category.description}>',
    );
    expect(collectionPageSource).toContain('<InternalPageHero sectionLabel="Store" title={category.heading} />');
    expect(collectionPageSource).toContain('const itemCountLabel');
    expect(collectionPageSource).toContain('<StoreItemCard entry={entry}');
    expect(collectionPageSource).toContain('No merch currently available.');
    expect(collectionPageSource).toContain('role="status"');
    expect(collectionPageSource.indexOf('<StoreCategoryNavigation')).toBeLessThan(
      collectionPageSource.indexOf('<slot name="distro"'),
    );
  });

  it('keeps route files thin and selects each of the four category presentations', () => {
    expect(allRouteSource).toContain("getStoreCatalogCategory('all')");
    expect(releasesRouteSource).toContain("getStoreCatalogCategory('blackbox-releases')");
    expect(distroRouteSource).toContain("getStoreCatalogCategory('distro')");
    expect(distroRouteSource).toContain('<StoreDistroCatalog slot="distro"');
    expect(merchRouteSource).toContain("getStoreCatalogCategory('merch')");
  });
});
