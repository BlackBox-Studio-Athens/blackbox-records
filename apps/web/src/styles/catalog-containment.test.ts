import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('catalog containment', () => {
  it('keeps only the first Distro chunk eager and contains every below-fold chunk', () => {
    const css = source('./global.css');
    const distroCatalog = source('../components/store/StoreDistroCatalog.astro');

    expect(css).toMatch(
      /\.distro-group-chunk:not\(:first-child\),\s*\.distro-group-section:not\(:first-child\) \.distro-group-chunk:first-child\s*{\s*content-visibility:\s*auto;\s*contain-intrinsic-block-size:\s*auto 192rem;/s,
    );
    expect(css).not.toMatch(/\.distro-group-section:first-child \.distro-group-chunk:first-child/);
    expect(css).not.toMatch(/\.distro-card--page\s*{[^}]*(?:block-size:\s*40rem|contain:\s*strict)/s);
    expect(css).not.toMatch(/\.distro-(?:card--page|group-chunk)\s*{[^}]*content-visibility/s);
    expect(css).not.toMatch(/\.distro-group-chunk\s*{[^}]*contain-intrinsic-block-size/s);
    expect(css).not.toMatch(/\.distro-group-section(?:__title|__overview)?\s*{[^}]*content-visibility/s);
    expect(distroCatalog).toContain('const STORE_COVERFLOW_PREVIEW_SIZE = 6');
    expect(distroCatalog).toContain('groupedDistroEntries.map');
    expect(distroCatalog).toContain('group.entries.reduce');
    expect(distroCatalog).toContain('index % STORE_COVERFLOW_PREVIEW_SIZE === 0');
    expect(distroCatalog).toContain('group.chunks.map');
    expect(distroCatalog).toContain('chunk.map');
    expect(distroCatalog).toContain('data-distro-search-chunk');
    expect(distroCatalog).toContain('data-store-coverflow-stage');
    expect(distroCatalog).not.toMatch(/client:(?:visible|load|idle|only)/);
    expect(distroCatalog).not.toContain('data-distro-render-chunk');
  });

  it('keeps Store listing containment independent from Distro rendering', () => {
    const css = source('./global.css');
    const storePage = source('../components/store/StoreCollectionPage.astro');
    const storeCard = source('../components/cards/StoreItemCard.astro');

    expect(css).toMatch(/\.store-item-card--listing\s*{[^}]*content-visibility:\s*auto/s);
    expect(storePage).toContain('entries.map');
    expect(storeCard).toContain('data-store-listing-price');
    expect(storeCard).not.toMatch(/client:(?:visible|load|idle|only)/);
    expect(storePage).not.toContain('data-store-render-chunk');
  });
});
