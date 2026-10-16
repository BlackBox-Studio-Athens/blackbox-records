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
    expect(cssSource).toContain('border-bottom-color: var(--flint-500)');
    expect(cssSource).toContain('background: var(--flint-surface)');
    expect(cssSource).toContain('outline: 2px solid var(--foreground)');
  });

  it('shares category metadata, discovery, search and a complete Grid', () => {
    expect(collectionPageSource).toContain('pageTitle={category.title}');
    // One visually hidden H1 on every viewport, as on Releases; no visible Store / category introduction.
    expect(collectionPageSource).toContain('<h1 class="sr-only">{category.heading}</h1>');
    expect(collectionPageSource).not.toContain('InternalPageHero');
    expect(collectionPageSource).not.toContain('store-category-description');
    expect(collectionPageSource).toContain('data-store-result-total');
    // The purchase note and the international strip follow the grid (and the Distro slot) on every viewport.
    const note = collectionPageSource.indexOf('class="layout-container store-purchase-note"');
    expect(note).toBeGreaterThan(collectionPageSource.indexOf('<slot name="distro" />'));
    expect(note).toBeGreaterThan(collectionPageSource.indexOf('</StoreCrate>'));
    expect(collectionPageSource.indexOf('<InternationalOrderNotice variant="strip"')).toBeGreaterThan(note);
    expect(collectionPageSource).toContain('aria-label="Browse Distro formats"');
    expect(collectionPageSource).toContain('createStoreDistroGroupHeadingId(group.groupName)');
    expect(collectionPageSource).toContain("selectStoreCollectionEntries(entries, 'distro')");
    expect(collectionPageSource).toContain('data-store-search');
    expect(collectionPageSource).toContain('<StoreBrowsePane entries={entries} resultsId={catalogId}>');
    expect(collectionPageSource.match(/<StoreItemCard/g)).toHaveLength(1);
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
      /\shidden\s*>\s*<StoreBuyIcon formatGroup=\{formatGroup\} \/>\s*<span data-store-card-buy-label>Buy<\/span>\s*<\/button>/,
    );
    expect(storeBuyIconSource).toMatch(/<span className="store-buy-icon" aria-hidden="true">/);
    // Every layer is one shared file URL, never a data: URI repeated on each card.
    expect(storeBuyIconSource.match(/\.svg\?url&no-inline';/g)).toHaveLength(10);
  });

  it('links a Release item artist above the card link', () => {
    expect(storeItemCardSource).toMatch(
      /storeItem\.artistPath \? \(\s*<a class="store-item-card__artist-link" href=\{storeItem\.artistPath\}/,
    );
    expect(proseCssSource).toMatch(
      /\.prose-link-card :is\([^)]*\.store-item-card__artist-link[^)]*\)\s*{[^}]*z-index:\s*3/,
    );
  });

  it('makes the card a single native link while keeping Listen separate and availability visible in the Crate', () => {
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
    // In the Crate the sleeve is the artwork, so the item in hand's own card shows without its image frame.
    expect(source('../components/store/crate/crate.css')).toMatch(
      /\[data-store-crate-hand\] \.store-item-card__image-frame \{\s*display: none;/,
    );
    expect(cssSource).toContain("data-store-listing-availability-state='sold_out'");
  });

  it('uses compact Grid image slots that Crate sleeves reuse', () => {
    expect(storeItemCardSource).toContain('(min-width: 1280px) calc((100vw - 144px) / 5)');
    expect(storeItemCardSource).not.toContain('data-store-grid-sizes');
    // Two shared widths bound Images Free transformations per source (docs/cloudflare-free-tier.md).
    expect(storeItemCardSource).toContain('const widths = [360, 720];');
    expect(source('../components/store/crate/crate-view.ts')).toContain('img.srcset = source.srcset;');
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
