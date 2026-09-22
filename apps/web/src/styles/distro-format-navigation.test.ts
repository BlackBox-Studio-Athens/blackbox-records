import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const cssSource = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

const browse = readFileSync(
  fileURLToPath(new URL('../components/store/StoreBrowsePane.astro', import.meta.url)),
  'utf8',
);
describe('Distro format navigation', () => {
  it('renders one ordinary link per format in a shared native Browse disclosure', () => {
    expect(source.match(/data-distro-format-navigation/g)).toHaveLength(1);
    expect(source.match(/formats.map/g)).toHaveLength(1);
    expect(source).toContain('aria-label="Browse Distro formats"');
    expect(source).toContain("label: 'All formats'");
    expect(source).toContain("href={'#' + format.target}");
    expect(source).toContain('data-distro-format-key={format.key}');
    expect(source).toContain('{format.count}');
    expect(browse).toContain('data-store-browse-disclosure');
    expect(browse).toContain('data-store-artists');
    expect(browse.indexOf('</details>')).toBeLessThan(browse.indexOf('href="#store-page-top"'));
  });
  it('keeps the desktop pane sticky and the mobile disclosure in normal flow', () => {
    expect(cssSource).toMatch(/@media \(min-width: 64rem\)[\s\S]*?\.store-browse-pane\s*\{\s*position: sticky/);
    expect(cssSource).toContain('.store-browse-disclosure::details-content');
    expect(cssSource).not.toContain('[data-distro-search-root][data-distro-selected-format]');
  });
});
