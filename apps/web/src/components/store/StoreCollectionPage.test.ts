import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const categoryNavigationSource = source('./StoreCategoryNavigation.astro');
const collectionPageSource = source('./StoreCollectionPage.astro');
const distroCatalogSource = source('./StoreDistroCatalog.astro');
const cssSource = source('../../styles/global.css');
const storeCollectionSource = source('../../lib/store-collection.ts');
const allRouteSource = source('../../pages/store/index.astro');
const releasesRouteSource = source('../../pages/store/blackbox-releases/index.astro');
const distroRouteSource = source('../../pages/store/distro/index.astro');
const merchRouteSource = source('../../pages/store/merch/index.astro');
const storeItemCardSource = source('../cards/StoreItemCard.astro');

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

  it('shares category metadata, discovery, search and a complete Grid', () => {
    expect(collectionPageSource).toContain('pageTitle={category.title}');
    expect(collectionPageSource).toContain('<InternalPageHero sectionLabel="Store" title={category.heading} />');
    expect(collectionPageSource).toContain('data-store-result-total');
    expect(collectionPageSource).toContain('aria-label="Browse Distro formats"');
    expect(collectionPageSource).toContain('createStoreDistroGroupHeadingId(group.groupName)');
    expect(collectionPageSource).toContain("selectStoreCollectionEntries(entries, 'distro')");
    expect(collectionPageSource).toContain('data-store-search');
    expect(collectionPageSource).toContain('<StoreBrowsePane>');
    expect(collectionPageSource.match(/<StoreItemCard/g)).toHaveLength(1);
    expect(collectionPageSource).toContain('coverflowEnrolled={coverflowEligible}');
    expect(collectionPageSource).not.toContain('getDistroPageContent');
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
    expect(storeItemCardSource).toContain('data-store-listing-price');
    expect(storeItemCardSource).toContain('data-store-item-slug={storeItem.slug}');
    expect(storeItemCardSource).not.toContain('StoreOfferPriceDisplay');
    expect(storeItemCardSource).not.toContain('View Item');
    expect(storeItemCardSource).toContain('data-store-coverflow-availability');
  });

  it('uses compact Grid image slots and switches sizes only for explicit Coverflow', () => {
    expect(storeItemCardSource).toContain('(min-width: 1280px) calc((100vw - 356px) / 4)');
    expect(storeItemCardSource.match(/data-store-grid-sizes={sizes}/g)).toHaveLength(2);
    expect(source('./StoreCoverflowController.ts')).toContain('(min-width: 40rem) 16rem, 56vw');
    expect(storeCollectionSource).toContain('createStoreDistroGroupHeadingId');
  });

  it('loads at most four leading grid covers eagerly with one high priority image', () => {
    expect(collectionPageSource).toContain(
      "imageLoadingMode={index === 0 ? 'priority' : index < 4 ? 'eager' : 'lazy'}",
    );
    expect(distroCatalogSource).toContain('groupIndex === 0 && index === 0');
    expect(distroCatalogSource).toContain('groupIndex === 0 && index < 4');
    expect(storeItemCardSource).toContain("fetchpriority={priority ? 'high' : 'auto'}");
    expect(storeItemCardSource).toContain('loading="lazy"');
    expect(storeItemCardSource).toContain('fetchpriority="low"');
  });
});
