import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('catalog containment', () => {
  it('keeps Distro server HTML in eager bounded chunks without fixed per-card containment', () => {
    const css = source('./global.css');
    const distroPage = source('../pages/distro/index.astro');

    expect(css).not.toMatch(/\.distro-card--page\s*{[^}]*(?:block-size:\s*40rem|contain:\s*strict)/s);
    expect(css).not.toMatch(/\.distro-(?:card--page|group-chunk)\s*{[^}]*content-visibility/s);
    expect(css).not.toMatch(/\.distro-group-chunk\s*{[^}]*contain-intrinsic-block-size/s);
    expect(distroPage).toContain('groupedDistroEntries.map');
    expect(distroPage).toContain('group.entries.reduce');
    expect(distroPage).toContain('chunk.map');
    expect(distroPage).not.toContain('data-distro-render-chunk');
  });

  it('keeps Store listing containment independent from Distro rendering', () => {
    const css = source('./global.css');
    const storePage = source('../pages/store/index.astro');

    expect(css).toMatch(/\.store-item-card--listing\s*{[^}]*content-visibility:\s*auto/s);
    expect(storePage).toContain('collectionEntries.map');
  });
});
