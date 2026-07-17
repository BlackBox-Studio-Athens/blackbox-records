import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));
const releasesPagePath = fileURLToPath(new URL('../pages/releases/index.astro', import.meta.url));

describe('Releases page layout', () => {
  it('renders one compact route-local catalog identity', () => {
    const page = readFileSync(releasesPagePath, 'utf8');

    expect(page).not.toContain('InternalPageHero');
    expect(page).toMatch(/<header class="layout-container releases-page-intro">/);
    expect(page).toMatch(/<p class="releases-page-intro__eyebrow">Catalog<\/p>/);
    expect(page).toMatch(
      /<h1 class="releases-page-intro__title" transition:name="internal-page-hero-title">\s*Releases\s*<\/h1>/s,
    );
  });

  it('keeps latest, Upcoming, and Our Releases in source order', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const latestIndex = page.indexOf('<article class="releases-latest-feature">');
    const upcomingIndex = page.indexOf('<section class="releases-latest-feature__upcoming"');
    const catalogIndex = page.indexOf('<section class="releases-catalog-section"');

    expect(latestIndex).toBeGreaterThan(-1);
    expect(upcomingIndex).toBeGreaterThan(latestIndex);
    expect(catalogIndex).toBeGreaterThan(upcomingIndex);
  });

  it('uses the twelve-track wide showcase and full-width catalog row', () => {
    const css = readFileSync(globalCssPath, 'utf8');

    expect(css).toMatch(
      /@media \(min-width: 64rem\)[\s\S]*?\.releases-page-layout\s*{[^}]*grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/,
    );
    expect(css).toMatch(/\.releases-latest-feature\s*{[^}]*grid-column:\s*1 \/ span 8/s);
    expect(css).toMatch(/\.releases-latest-feature__upcoming\s*{[^}]*grid-column:\s*9 \/ span 4/s);
    expect(css).toMatch(/\.releases-catalog-section\s*{[^}]*grid-column:\s*1 \/ -1/s);
  });

  it('keeps sparse cards at catalog width and stacks intrinsically below the wide breakpoint', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const css = readFileSync(globalCssPath, 'utf8');

    expect(page).toMatch(/class="releases-catalog-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3"/);
    expect(css).toMatch(/\.releases-page-layout\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*gap:\s*0/s);
    expect(css).toMatch(/\.releases-page-layout > \*\s*{[^}]*min-width:\s*0/s);
    expect(css).not.toMatch(/\.releases-(?:page-layout|latest-feature|catalog-section)[^{]*{[^}]*\border\s*:/s);
  });
});
