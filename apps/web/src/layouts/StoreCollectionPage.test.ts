import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const categoryNavigationSource = source('../components/store/StoreCategoryNavigation.astro');
const collectionPageSource = source('./StoreCollectionPage.astro');
const distroCatalogSource = source('../components/store/StoreDistroCatalog.astro');
const cssSource = source('../styles/global.css');
const storeCollectionSource = source('../lib/store-collection.ts');
const allRouteSource = source('../pages/store/index.astro');
const releasesRouteSource = source('../pages/store/blackbox-releases/index.astro');
const distroRouteSource = source('../pages/store/distro/index.astro');
const merchRouteSource = source('../pages/store/merch/index.astro');
const storeItemCardSource = source('../components/store/StoreItemCard.astro');
const storeBuyIconSource = source('../components/store/StoreBuyIcon.tsx');
const proseCssSource = source('../styles/prose.css');

describe('Store collection category surfaces', () => {
  it('renders semantic category navigation with an active ordinary link', () => {
    expect(categoryNavigationSource).toContain('<nav aria-label="Store categories"');
    expect(categoryNavigationSource).toContain('discoverableCategories.map');
    expect(categoryNavigationSource).toContain('categories: discoverableCategories');
    expect(collectionPageSource).toContain('categories={discoverableCategories}');
    expect(categoryNavigationSource).toContain("aria-current={category.id === activeCategoryId ? 'page' : undefined}");
    expect(categoryNavigationSource).toContain('href={createProjectRelativeUrl(category.path)}');
    expect(categoryNavigationSource).toContain('style={`--store-category-count: ${discoverableCategories.length}`}');
    expect(categoryNavigationSource).toContain('data-store-category-active');
    // Store-format browser coverage checks responsive category layout and target sizes.
    expect(cssSource).toContain('border-bottom: 3px solid transparent');
    expect(cssSource).toContain('border-bottom-color: var(--store-accent-active)');
    expect(cssSource).toContain('background: var(--store-accent-surface)');
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
    expect(collectionPageSource).toContain('<StoreBrowsePane entries={entries} resultsId={catalogId}>');
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
    expect(storeItemCardSource).toContain('data-store-listing-availability');
    expect(storeItemCardSource).toContain('Checking availability');
    expect(storeItemCardSource).toContain('data-store-item-slug={storeItem.slug}');
    expect(storeItemCardSource).not.toContain('StoreOfferPriceDisplay');
    expect(storeItemCardSource).not.toContain('View Item');
    expect(storeItemCardSource).not.toContain('primaryAvailability?.availability.label');
    expect(storeItemCardSource).toContain('storeItem.embeddedPlayerData && (');
    expect(storeItemCardSource).toContain('<MusicStreamingServiceListenTrigger');
    expect(storeItemCardSource).not.toContain('iframe');
  });

  it('keeps separate pre-order hooks hidden until fresh listing data is applied', () => {
    const availabilityPlaceholder = /<span\b[^>]*\sdata-store-listing-availability\s[^>]*>[\s\S]*?<\/span>/.exec(
      storeItemCardSource,
    )?.[0];
    expect(availabilityPlaceholder).toContain('class="store-item-card__availability"');
    expect(availabilityPlaceholder).toContain('data-store-listing-availability-state="pending"');
    expect(availabilityPlaceholder).toContain(
      'data-store-release-date={storeItem.releaseDate?.toISOString().slice(0, 10)}',
    );
    expect(availabilityPlaceholder).toContain('Checking availability');
    expect(availabilityPlaceholder).not.toContain('data-store-listing-preorder');
    expect(storeItemCardSource).toMatch(
      /<span\s+class="store-item-card__release-status"\s+data-store-listing-release-status\s+hidden\s*>\s*\{DIGITAL_RELEASE_BADGE\}\s*<\/span>/,
    );
    expect(storeItemCardSource).toMatch(
      /<span\s+class="store-item-card__preorder"\s+data-store-listing-preorder\s+hidden\s*>\s*<\/span>/,
    );
    const buyButton = /<button\b[^>]*\sdata-store-card-buy=[^>]*>[\s\S]*?<\/button>/.exec(storeItemCardSource)?.[0];
    expect(buyButton).toContain('data-store-card-buy-label="Buy"');
    expect(buyButton).toMatch(
      /\shidden\s*>\s*<StoreBuyIcon\s*\/>\s*<span data-store-card-buy-label>Buy<\/span>\s*<\/button>/,
    );
    expect(storeBuyIconSource).toMatch(/<svg className="store-buy-icon"[^>]*aria-hidden="true"/);
  });

  it('links a Release item artist above the card link', () => {
    expect(storeItemCardSource).toMatch(
      /storeItem\.artistPath \? \(\s*<a class="store-item-card__artist-link" href=\{storeItem\.artistPath\}/,
    );
    expect(proseCssSource).toMatch(
      /\.prose-link-card :is\([^)]*\.store-item-card__artist-link[^)]*\)\s*{[^}]*z-index:\s*3/,
    );
  });

  it('makes the card a single native link while keeping Listen separate and availability visible in Coverflow', () => {
    expect(storeItemCardSource.match(/class="prose-card-link"/g)).toHaveLength(1);
    expect(storeItemCardSource).toMatch(
      /<div class="store-item-card__image-frame">[\s\S]*?<\/div>\s*<a\s+class="prose-card-link"[\s\S]*?href=\{storeItem\.storePath\}/,
    );
    expect(storeItemCardSource).toMatch(
      /<a\s+class="prose-card-link"[\s\S]*?<\/a>\s*\{storeItem\.embeddedPlayerData && \(\s*<div class="store-item-card__listen">/,
    );
    expect(proseCssSource).toContain(
      '.store-item-card--listing .prose-card-link {\n  position: absolute;\n  inset: 0;',
    );
    expect(proseCssSource).not.toContain('.store-item-card--listing .prose-card-link::after');
    expect(cssSource).toContain('.store-item-card--listing:has(.prose-card-link:hover) .store-item-card__preview');
    expect(cssSource).toContain(
      '.store-item-card__listen .music-listen-trigger {\n  position: relative;\n  z-index: 3;',
    );
    expect(cssSource).toContain('height: calc(var(--store-cover-size) + 9.25rem)');
    expect(cssSource).toContain('> :is(.brand-card-title, .store-item-card__artist, .store-item-card__option)');
    expect(cssSource).toContain(
      "[data-store-coverflow-position='active']\n  .store-item-card__content {\n  display: flex;",
    );
    expect(cssSource).toContain("data-store-listing-availability-state='sold_out'");
  });

  it('uses compact Grid image slots and switches sizes only for explicit Coverflow', () => {
    expect(storeItemCardSource).toContain('(min-width: 1280px) calc((100vw - 356px) / 4)');
    expect(storeItemCardSource.match(/data-store-grid-sizes={sizes}/g)).toHaveLength(2);
    expect(source('../components/store/StoreCoverflowController.ts')).toContain('(min-width: 40rem) 16rem, 56vw');
    expect(storeCollectionSource).toContain('createStoreDistroGroupHeadingId');
  });

  it('loads at most four leading grid covers eagerly with one high priority image', () => {
    expect(collectionPageSource).toContain(
      "imageLoadingMode={index === 0 ? 'priority' : index < 4 ? 'eager' : 'lazy'}",
    );
    expect(distroCatalogSource).toContain("index === 0 ? 'priority'");
    expect(distroCatalogSource).toContain("index < 4 ? 'eager'");
    expect(storeItemCardSource).toContain("fetchpriority={priority ? 'high' : 'auto'}");
    expect(storeItemCardSource).toContain('loading="lazy"');
    expect(storeItemCardSource).toContain('fetchpriority="low"');
  });
});
