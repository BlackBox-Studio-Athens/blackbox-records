import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));
const artistsPagePath = fileURLToPath(new URL('../pages/artists/index.astro', import.meta.url));

describe('Artists roster layout', () => {
  it('reserves the filter panel height before its portal mounts', () => {
    const css = readFileSync(globalCssPath, 'utf8');

    expect(css).toMatch(/\[data-artists-roster-filters\]\s*{[^}]*min-block-size:\s*7rem/s);
  });

  it('exposes search only when the roster contains more than five artists', () => {
    const page = readFileSync(artistsPagePath, 'utf8');

    expect(page).toMatch(/artistProfiles\.length\s*>\s*5\s*&&\s*<div data-artists-roster-filters\s*\/>/s);
  });
});
