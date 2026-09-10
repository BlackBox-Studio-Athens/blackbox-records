import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('catalog containment', () => {
  it('keeps Distro server HTML in eager bounded chunks without fixed per-card containment', () => {
    const css = source('./global.css');
    const distroCatalog = source('../components/store/StoreDistroCatalog.astro');

    expect(css).not.toMatch(/\.distro-card--page\s*{[^}]*(?:block-size:\s*40rem|contain:\s*strict)/s);
    expect(css).not.toMatch(/\.distro-(?:card--page|group-chunk)\s*{[^}]*content-visibility/s);
    expect(css).not.toMatch(/\.distro-group-chunk\s*{[^}]*contain-intrinsic-block-size/s);
    expect(distroCatalog).toContain('groupedDistroEntries.map');
    expect(distroCatalog).toContain('group.entries.reduce');
    expect(distroCatalog).toContain('chunk.map');
    expect(distroCatalog).not.toContain('data-distro-render-chunk');
  });

  it('retains invisible preview layout and eagerly renders complete Store catalogs', () => {
    const css = source('./global.css');
    expect(css).not.toMatch(/\.distro-group-chunk[^{}]*\{[^}]*(?:content-visibility|contain-intrinsic)/s);
    expect(css).toMatch(
      /prefers-reduced-motion:\s*no-preference[^]*?\.distro-group-chunk,[^{]+\{\s*display:\s*grid;\s*visibility:\s*hidden;/,
    );
    expect(css).toMatch(/\[data-store-coverflow-card\]\[data-store-coverflow-position\]\s*\{\s*visibility:\s*visible;/);
    expect(css).toMatch(/\.distro-card__title\s*\{\s*font-family:\s*var\(--font-display-ui\)/);
    expect(css).toMatch(/\.distro-card--page,\s*\.store-item-card--listing\s*\{\s*contain: layout inline-size;/);
    expect(source('../layouts/SiteLayout.astro')).not.toContain('display=swap');
  });

  it('keeps the eager Store listing server-rendered with its listing-price projection', () => {
    const css = source('./global.css');
    const storePage = source('../components/store/StoreCollectionPage.astro');
    const storeCard = source('../components/cards/StoreItemCard.astro');

    expect(css).not.toMatch(/\.store-item-card--listing\s*{[^}]*(?:content-visibility|contain-intrinsic)/s);
    expect(css).toMatch(
      /\.store-item-card--listing \.brand-card-title\s*{[^}]*font-family:\s*var\(--font-display-ui\)/s,
    );
    expect(storePage).toContain('entries.map');
    expect(storeCard).toContain('data-store-listing-price');
    expect(storeCard).not.toMatch(/client:(?:visible|load|idle|only)/);
    expect(storePage).not.toContain('data-store-render-chunk');
  });
});
