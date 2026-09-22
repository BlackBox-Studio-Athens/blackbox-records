import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('catalog containment', () => {
  it('keeps continuous Distro grids server rendered without fixed per-card containment', () => {
    const css = source('./global.css');
    const distroCatalog = source('../components/store/StoreDistroCatalog.astro');

    expect(css).not.toMatch(/\.store-item-card--listing\s*{[^}]*(?:block-size:\s*40rem|contain:\s*strict)/s);
    expect(css).not.toMatch(/\.store-item-card--listing\s*{[^}]*content-visibility/s);
    expect(css).not.toMatch(/\.distro-group-grid\s*{[^}]*contain-intrinsic-block-size/s);
    expect(distroCatalog).toContain('class="distro-group-grid"');
    expect(distroCatalog).toContain('group.entries.map');
    expect(distroCatalog).not.toContain('data-distro-search-chunk');
  });

  it('retains invisible preview layout and eagerly renders complete Store catalogs', () => {
    const css = source('./global.css');
    expect(css).not.toMatch(/\.distro-group-grid[^{}]*\{[^}]*(?:content-visibility|contain-intrinsic)/s);
    expect(css).toMatch(
      /prefers-reduced-motion:\s*no-preference[^]*?\[data-store-coverflow-stage\]\s*\{\s*display:\s*grid;\s*visibility:\s*hidden;/,
    );
    expect(css).toMatch(/\[data-store-coverflow-card\]\[data-store-coverflow-position\]\s*\{\s*visibility:\s*visible;/);
    expect(css).toMatch(
      /\.store-item-card--listing \.brand-card-title\s*\{\s*font-family:\s*var\(--font-display-brand\)/,
    );
    expect(css).toMatch(/\.store-item-card--listing\s*\{\s*contain: layout inline-size;/);
    expect(source('../layouts/SiteLayout.astro')).not.toContain('display=swap');
  });

  it('keeps the eager Store listing server-rendered with its listing-price projection', () => {
    const css = source('./global.css');
    const storePage = source('../components/store/StoreCollectionPage.astro');
    const storeCard = source('../components/cards/StoreItemCard.astro');

    expect(css).not.toMatch(/\.store-item-card--listing\s*{[^}]*(?:content-visibility|contain-intrinsic)/s);
    expect(css).toMatch(
      /\.store-item-card--listing \.brand-card-title\s*{[^}]*font-family:\s*var\(--font-display-brand\)/s,
    );
    expect(storePage).toContain('entries.map');
    expect(storeCard).toContain('data-store-listing-price');
    expect(storeCard).not.toMatch(/client:(?:visible|load|idle|only)/);
    expect(storePage).not.toContain('data-store-render-chunk');
  });
});
