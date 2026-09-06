import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const cssSource = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('Distro format navigation', () => {
  it('derives shared responsive links for All formats and each populated group', () => {
    const navigationHookIndex = source.indexOf('data-distro-format-navigation');
    const navigationIndex = source.lastIndexOf('<nav', navigationHookIndex);
    const groupsIndex = source.indexOf('class="layout-container distro-page-groups"');
    const navigationSource = source.slice(navigationIndex, groupsIndex);

    expect(source.match(/data-distro-format-navigation/g)).toHaveLength(1);
    expect(navigationIndex).toBeGreaterThan(source.indexOf('data-distro-search'));
    expect(navigationIndex).toBeLessThan(groupsIndex);
    expect(navigationSource).toContain('aria-labelledby="distro-format-navigation-heading"');
    expect(navigationSource).toContain('id="distro-format-navigation-heading"');
    expect(navigationSource).toContain('Browse formats');
    expect(source).toContain(
      "{ count: entries.length, formatKey: 'all', label: 'All formats', targetId: 'distro-search-results' }",
    );
    expect(navigationSource.match(/distroFormatNavigationEntries\.map/g)).toHaveLength(2);
    expect(navigationSource).toContain('data-distro-format-disclosure');
    expect(navigationSource).toContain('data-distro-format-summary-current');
    expect(navigationSource).toContain('data-distro-format-summary-initial-label="All formats"');
    expect(navigationSource).toContain('href={`#${format.targetId}`}');
    expect(navigationSource).toContain('data-scroll-to-target={format.targetId}');
    expect(navigationSource).toContain('data-distro-format-key={format.formatKey}');
    expect(navigationSource).toContain("data-distro-format-current={format.formatKey === 'all' ? '' : undefined}");
    expect(navigationSource).toContain("aria-current={format.formatKey === 'all' ? 'true' : undefined}");
    expect(navigationSource).toContain('{format.label}');
    expect(navigationSource).toContain('({format.count})');
    expect(source).toContain('aria-labelledby={group.headingId}');
    expect(source).toContain('data-distro-format-key={group.formatKey}');
    expect(source).toContain('id={group.headingId} data-distro-format-target tabindex="-1"');
    expect(source).toMatch(/id="distro-search-results"[\s\S]*?data-distro-format-target[\s\S]*?tabindex="-1"/);
  });

  it('keeps format choices and a native top return reachable deep in the catalog', () => {
    expect(source).toContain('id="distro-page-top"');
    expect(source).toContain('href="#distro-page-top"');
    expect(source).toContain('data-scroll-to-target="distro-page-top"');
    expect(source).toContain('aria-label="Back to Distro page top"');
    expect(cssSource).toMatch(/\.distro-format-navigation\s*{[\s\S]*?position: sticky/);
    expect(cssSource).toContain('top: var(--header-height)');
    expect(cssSource).toMatch(/\.distro-format-navigation__panel\s*{[\s\S]*?grid-template-columns:/);
    expect(cssSource).toContain('.distro-format-navigation__mobile[open]');
    expect(cssSource).toMatch(
      /@media \(min-width: 48rem\)[\s\S]*?\.distro-format-navigation__mobile[\s\S]*?display: none/,
    );
    expect(cssSource).not.toContain('scrollbar-width: none');
    expect(cssSource).toMatch(/\.distro-format-navigation__link,[\s\S]*?min-height: 2\.75rem/);
    expect(cssSource).toContain('[data-distro-search-root][data-distro-selected-format]');
    expect(cssSource).toContain('[data-distro-search-group]:not([data-distro-format-current])');
    expect(cssSource).toContain('.distro-format-navigation__link[data-distro-format-current]');
    expect(cssSource).toContain('overflow-x: clip');
    expect(cssSource).toMatch(/\.distro-group-section__title\s*{[\s\S]*?scroll-margin-top:/);
  });
});
