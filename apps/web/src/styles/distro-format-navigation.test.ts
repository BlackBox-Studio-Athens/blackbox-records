import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const cssSource = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('Distro format navigation', () => {
  it('derives one native link and matching heading target from each populated group', () => {
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
    expect(navigationSource.match(/groupedDistroChunks\.map/g)).toHaveLength(1);
    expect(source).toContain('headingId: createStoreDistroGroupHeadingId(group.groupName)');
    expect(navigationSource).toContain('href={`#${group.headingId}`}');
    expect(navigationSource).toContain('data-scroll-to-target={group.headingId}');
    expect(navigationSource).toContain('{group.groupName}');
    expect(navigationSource).toContain('({group.entries.length})');
    expect(source).toContain('aria-labelledby={group.headingId}');
    expect(source).toContain('id={group.headingId}');
  });

  it('keeps format choices and a native top return reachable deep in the catalog', () => {
    expect(source).toContain('id="distro-page-top"');
    expect(source).toContain('href="#distro-page-top"');
    expect(source).toContain('data-scroll-to-target="distro-page-top"');
    expect(source).toContain('aria-label="Back to Distro page top"');
    expect(cssSource).toMatch(/\.distro-format-navigation\s*{[\s\S]*?position: sticky/);
    expect(cssSource).toContain('top: var(--header-height)');
    expect(cssSource).toMatch(/\.distro-format-navigation__links\s*{[\s\S]*?overflow-x: auto/);
    expect(cssSource).toMatch(/\.distro-format-navigation__link,[\s\S]*?min-height: 2\.75rem/);
    expect(cssSource).toMatch(/\.distro-group-section__title\s*{[\s\S]*?scroll-margin-top:/);
  });
});
