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
