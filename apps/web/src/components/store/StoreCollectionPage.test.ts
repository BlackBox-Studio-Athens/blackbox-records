import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const categoryNavigationSource = source('./StoreCategoryNavigation.astro');
const collectionPageSource = source('./StoreCollectionPage.astro');
const cssSource = source('../../styles/global.css');
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
    expect(categoryNavigationSource).toContain('style={`--store-category-count: ${discoverableCategories.length}`}');
    expect(categoryNavigationSource).toContain('data-store-category-active');
    expect(cssSource).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(cssSource).toContain('grid-template-columns: repeat(var(--store-category-count), minmax(0, 1fr))');
    expect(cssSource).toContain('.store-category-signal__item:last-child:nth-child(odd)');
    expect(cssSource).toContain('border-bottom: 3px solid transparent');
    expect(cssSource).toContain('border-bottom-color: var(--store-accent-active)');
    expect(cssSource).toContain('background: var(--store-accent-surface)');
    expect(cssSource).toContain('min-height: 3.5rem');
    expect(cssSource).toContain('outline: 2px solid var(--foreground)');
  });

  it('uses one category-aware page for canonical metadata, listings, counts, and Distro discovery', () => {
    expect(collectionPageSource).toContain(
      '<SiteLayout pageTitle={category.title} pageDescription={category.description}>',
    );
    expect(collectionPageSource).toContain('<InternalPageHero sectionLabel="Store" title={category.heading} />');
    expect(collectionPageSource).toContain('const itemCountLabel');
    expect(collectionPageSource).toContain('<StoreItemCard');
    expect(collectionPageSource).toContain('aria-label="Browse Distro formats"');
    expect(collectionPageSource).toContain('createStoreDistroGroupHeadingId(group.groupName)');
    expect(collectionPageSource).toContain("selectStoreCollectionEntries(entries, 'distro')");
    expect(collectionPageSource.indexOf('<StoreCategoryNavigation')).toBeLessThan(
      collectionPageSource.indexOf('<slot name="distro"'),
    );
    expect(collectionPageSource.match(/aria-labelledby="store-(?:distro-discovery|collection)-heading"/g)).toHaveLength(
      1,
    );
    expect(collectionPageSource).toContain('data-store-orientation="all"');
    expect(collectionPageSource).toContain('data-store-orientation="blackbox-releases"');
    expect(collectionPageSource).toContain('data-store-orientation="generic"');
    expect(collectionPageSource).toContain('{itemCountLabel} total');
    expect(collectionPageSource).toContain('<span>{group.entries.length}</span>');
    expect(collectionPageSource).toContain("category.id === 'blackbox-releases'");
    expect(collectionPageSource).not.toContain('getDistroPageContent');
    expect(collectionPageSource).not.toContain('distroPageContent.hero.intro');
    expect(collectionPageSource).not.toContain('{distroEntries.length} items');
    expect(collectionPageSource).not.toMatch(/\b(?:81|53|47|03)\b/);
    expect(cssSource).toContain('.store-orientation-panel--all');
    expect(cssSource).toContain('.store-orientation-panel--blackbox');
    expect(cssSource).toContain('min-height: 2.75rem');
    expect(cssSource).toMatch(/\.store-catalog-chunks\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s);
    expect(cssSource).toMatch(/\.store-item-card--listing\s*\{[^}]*min-width: 0/s);
    expect(collectionPageSource).toContain("const coverflowEligible = category.id !== 'distro'");
    expect(collectionPageSource).toContain(
      'data-store-coverflow-total={coverflowEligible ? entries.length : undefined}',
    );
    expect(collectionPageSource).toContain('const coverflowCatalogId = `${category.id}-store-catalog`');
    expect(collectionPageSource).toContain('aria-controls={coverflowCatalogId}');
    expect(collectionPageSource.match(/<StoreItemCard/g)).toHaveLength(1);
    expect(collectionPageSource).toContain('coverflowPreview={coverflowEligible}');
    expect(collectionPageSource).not.toContain("category.id === 'blackbox-releases' && coverflowEligible");
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
    expect(storeItemCardSource).toContain('data-store-coverflow-availability');
    expect(distroCardSource).toContain('data-store-coverflow-availability');
  });
});
