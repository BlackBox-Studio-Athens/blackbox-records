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
    expect(source).toMatch(/<nav\s+slot="formats"/);
    // The links sit in a native popover (the desktop Formats menu), reachable without JavaScript; the Filter sheet
    // borrows them on phones.
    expect(source).toContain('data-store-filter-part="formats"');
    expect(browse).toMatch(/id="store-formats-menu"[\s\S]*?popover="auto"[\s\S]*?<slot name="formats" \/>/);
    expect(browse.indexOf('<slot name="formats" />')).toBeLessThan(browse.indexOf('id="store-artists-menu"'));
    expect(source.match(/data-distro-format-navigation/g)).toHaveLength(1);
    expect(source.match(/formats.map/g)).toHaveLength(1);
    expect(source).toContain('aria-label="Browse Distro formats"');
    expect(source).toContain("label: 'All formats'");
    expect(source).toContain("href={'#' + format.target}");
    expect(source).toContain('data-distro-format-key={format.key}');
    expect(source).toContain('{format.count}');
    expect(source).toContain('id={createStoreDistroGroupHeadingId(group.groupName)}');
    // Every card files itself under its format, so any Store collection can filter or open a bin from it.
    expect(source).not.toContain('formatKey=');
    expect(
      readFileSync(fileURLToPath(new URL('../components/store/StoreItemCard.astro', import.meta.url)), 'utf8'),
    ).toContain('data-distro-format-key={createStoreDistroGroupHeadingId(formatGroup)}');
    expect(source).not.toContain('group.entries.map');
    expect(source).not.toContain('content.group_intros');
    expect(browse).not.toContain('<details');
  });
  it('drops the side pane: desktop menus in the toolbar, one Filter sheet on phones', () => {
    expect(cssSource).not.toContain('.store-browse-pane');
    expect(cssSource).toMatch(/@media \(min-width: 64rem\)[\s\S]*?\.store-filter-trigger\s*\{\s*display: none/);
    expect(cssSource).toMatch(
      /@media \(max-width: 63\.99rem\)\s*\{\s*\.store-search-toolbar :is\(\.store-menu-trigger, \.store-filter-home\)/,
    );
    expect(cssSource).toMatch(
      /@media \(max-width: 63\.99rem\)\s*\{\s*\.store-format-links\s*\{\s*display: flex;\s*flex-wrap: wrap;/,
    );
    expect(cssSource).not.toContain('[data-distro-search-root][data-distro-selected-format]');
  });
});
