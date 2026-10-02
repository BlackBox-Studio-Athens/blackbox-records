import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const cssSource = readFileSync(fileURLToPath(new URL('../styles/global.css', import.meta.url)), 'utf8');

const browse = readFileSync(
  fileURLToPath(new URL('../components/store/StoreBrowsePane.astro', import.meta.url)),
  'utf8',
);
describe('Distro format navigation', () => {
  it('renders one ordinary link per format before the Artist picker', () => {
    expect(source).toContain('<nav slot="formats"');
    expect(browse.indexOf('<slot name="formats" />')).toBeLessThan(browse.indexOf('data-store-artists'));
    expect(source.match(/data-distro-format-navigation/g)).toHaveLength(1);
    expect(source.match(/formats.map/g)).toHaveLength(1);
    expect(source).toContain('aria-label="Browse Distro formats"');
    expect(source).toContain("label: 'All formats'");
    expect(source).toContain("href={'#' + format.target}");
    expect(source).toContain('data-distro-format-key={format.key}');
    expect(source).toContain('{format.count}');
    expect(browse).not.toContain('<details');
    expect(browse.indexOf('data-store-artists')).toBeLessThan(browse.indexOf('href="#store-page-top"'));
  });
  it('keeps the desktop pane sticky with radios and gives phones the Artist select', () => {
    expect(cssSource).toMatch(/@media \(min-width: 64rem\)[\s\S]*?\.store-browse-pane\s*\{\s*position: sticky/);
    expect(cssSource).toMatch(/@media \(min-width: 64rem\)[\s\S]*?\.store-artists-picker\s*\{\s*display: none/);
    expect(cssSource).toMatch(
      /@media \(max-width: 63\.99rem\)\s*\{\s*\.store-artists\s*\{\s*display: none;\s*\}\s*\.store-format-links\s*\{\s*display: flex;\s*flex-wrap: wrap;/,
    );
    expect(cssSource).not.toContain('[data-distro-search-root][data-distro-selected-format]');
  });
});
