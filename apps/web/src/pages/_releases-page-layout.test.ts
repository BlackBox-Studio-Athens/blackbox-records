import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('../styles/global.css', import.meta.url));
const releasesPagePath = fileURLToPath(new URL('./releases/index.astro', import.meta.url));
const releaseCardPath = fileURLToPath(new URL('../components/editorial/ReleaseCard.astro', import.meta.url));
const proseCssPath = fileURLToPath(new URL('../styles/prose.css', import.meta.url));
const releaseDetailPath = fileURLToPath(new URL('../components/editorial/ReleaseDetailContent.astro', import.meta.url));

describe('Releases page layout', () => {
  it('loads Releases availability together while retaining idle detail links and external merch anchors', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const detail = readFileSync(releaseDetailPath, 'utf8');
    expect(page).toMatch(/<ReleaseCatalogPresentation[^>]*client:load/);
    expect(detail).toMatch(/\.isNativeStoreLink \? \(\s*<ReleaseStoreLink\s+client:idle/s);
    expect(detail).toMatch(/<ReleaseStoreLink[\s\S]*?href=\{commerceLink\.href\}/);
    expect(detail).toMatch(/<ReleaseStoreLink[\s\S]*?releaseDate=\{releaseDateMachineValue\}/);
    expect(detail).toContain('site-button-external-mark');
    for (const markup of [readFileSync(releaseCardPath, 'utf8'), detail]) {
      expect(markup).toContain('target={commerceLink.target}');
      expect(markup).toContain('rel={commerceLink.rel}');
    }
  });

  it('retains an accessible page heading without a visible catalog introduction', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const css = readFileSync(globalCssPath, 'utf8');

    expect(page).not.toContain('InternalPageHero');
    expect(page).toContain('<h1 class="sr-only">Releases</h1>');
    expect(page.match(/<h1\b/g)).toHaveLength(1);
    expect(page).not.toContain('releases-page-intro');
    expect(css).not.toContain('.releases-page-intro');
  });

  it('renders the whole catalog once through shared cards with one availability connector', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    expect(page.match(/<ReleaseCard\b/g)).toHaveLength(2);
    expect(page).toContain('selectReleaseMerchandisingEntries(');
    expect(page).toContain("role={index === 0 ? 'lead' : 'supporting'}");
    expect(page.match(/<ReleaseCatalogPresentation\b/g)).toHaveLength(1);
    expect(page).toContain('variant="releases"');
    expect(page).toContain('data-release-grid');
    expect(page).toContain('Our Releases');
    expect(page).not.toContain('Featured records');
  });

  it('uses native artwork and title links without stretching over metadata or repeating the detail action', () => {
    const card = readFileSync(releaseCardPath, 'utf8');
    expect(card).toMatch(
      /isReleaseShowcase\s*\?\s*'block h-full'\s*:\s*'release-card-link prose-link-card group block h-full'/,
    );
    expect(card).toContain("const ArtworkTag = isReleaseShowcase ? 'a' : 'div'");
    expect(card).toContain('tabindex={isReleaseShowcase ? -1 : undefined}');
    expect(card).toMatch(
      /<a class="release-card-title-link" href=\{detailPath\} data-release-detail data-astro-prefetch>/,
    );
    expect(card.match(/data-release-detail\b/g)).toHaveLength(1);
    expect(card).toMatch(
      /<\/ArtworkTag>\s*\{isReleaseShowcase && !isPrincipal && \(\s*<div class="release-card-meta-row pointer-events-none/s,
    );
    expect(card).toContain('class="pointer-events-auto"');
  });

  it('shares the page frame and sets lead and supporting side by side with top-aligned copy', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const css = readFileSync(globalCssPath, 'utf8');

    expect(page).toContain('class="layout-container releases-page-showcase-container"');
    expect(css).not.toMatch(/\.releases-page-showcase-container[^{]*{[^}]*(?:max-width|padding-inline)\s*:/s);
    expect(css).toMatch(
      /@media \(min-width: 64rem\)[\s\S]*?\.releases-page-layout\s*{[^}]*grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/,
    );
    expect(css).toMatch(/\.releases-latest-feature\s*{[^}]*grid-column:\s*1 \/ span 8/s);
    expect(css).toMatch(/\.releases-latest-feature__upcoming\s*{[^}]*grid-column:\s*9 \/ span 4/s);
    expect(css).toMatch(/\.releases-catalog-section\s*{[^}]*grid-column:\s*1 \/ -1/s);
    expect(css).toMatch(/\.releases-page-layout--single-column > \*\s*{[^}]*grid-column:\s*1 \/ -1/s);
    expect(css).not.toMatch(/\.releases-latest-feature__copy\s*{[^}]*justify-content:\s*center/s);
  });

  it('links each release artist name to the artist page', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const card = readFileSync(releaseCardPath, 'utf8');
    const proseCss = readFileSync(proseCssPath, 'utf8');

    expect(page).toContain('artist={artistProfileById.get(release.data.artist.id)}');
    expect(card).toMatch(/class="release-card-artist-link" href=\{createArtistDetailPath\(artist\)\}/);
    // The card's stretched release link sits at z-index 2; the artist link must stay clickable above it.
    expect(proseCss).toMatch(/\.prose-link-card :is\([^)]*\.release-card-artist-link[^)]*\)\s*{[^}]*z-index:\s*3/);
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
