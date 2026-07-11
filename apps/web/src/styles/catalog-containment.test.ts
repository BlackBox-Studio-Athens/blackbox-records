import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('catalog containment', () => {
  it('keeps full server-rendered catalogs inside bounded native containment groups', () => {
    const css = source('./global.css');
    const storePage = source('../pages/store/index.astro');
    const distroPage = source('../pages/distro/index.astro');

    expect(css).toMatch(/\.store-item-card--listing\s*{[^}]*content-visibility:\s*auto/s);
    expect(css).toMatch(/\.distro-card--page\s*{[^}]*content-visibility:\s*auto/s);
    expect(css).toContain('contain-intrinsic-block-size');
    expect(storePage).toContain('collectionEntries.map');
    expect(distroPage).toContain('groupedDistroEntries.map');
    expect(distroPage).toContain('group.entries.map');
  });
});
