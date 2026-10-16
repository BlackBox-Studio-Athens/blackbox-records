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
    expect(page).not.toContain('Featured records');
  });

  it('names the remaining catalog only for assistive technology', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    expect(page).toMatch(/<h2 id="releases-catalog-heading" class="sr-only">\s*More releases\s*<\/h2>/);
    expect(page).toContain('aria-labelledby="releases-catalog-heading"');
    expect(page).not.toContain('Our Releases');
    expect(page.match(/<h2\b/g)).toHaveLength(1);
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
  });

  it('pairs the purchase action with Listen directly after the cover, with nothing over Releases artwork', () => {
    const card = readFileSync(releaseCardPath, 'utf8');
    const css = readFileSync(globalCssPath, 'utf8');
    // Releases artwork carries no scrim or Listen overlay; the other variants keep theirs.
    expect(card).not.toContain('data-release-artwork-scrim');
    expect(card).not.toMatch(/isReleaseShowcase && !isPrincipal && \(\s*<div class="release-card-meta-row/s);
    expect(card).toMatch(/\{!isReleaseShowcase && \(\s*<div class="release-card-meta-row/s);
    // Phones read the pair first in the copy (12px under the cover); from 40rem the copy grid moves it after the artist.
    expect(card).toMatch(
      /<div class="release-card-actions" data-release-actions>[\s\S]*?data-release-purchase[\s\S]*?<MusicStreamingServiceListenTrigger[\s\S]*?context=\{`\$\{release\.data\.title\} by \$\{artistName\}`\}[\s\S]*?<p class="release-card-year-text/,
    );
    expect(css).toMatch(
      /#releases-merchandising \.release-card-actions\s*{\s*display:\s*grid;\s*grid-auto-columns:\s*minmax\(0, 1fr\);\s*grid-auto-flow:\s*column;/,
    );
    expect(css).toMatch(
      /@media \(width >= 40rem\)[\s\S]*?#releases-merchandising :is\(\.release-card-actions > \*, \.release-card-price\)\s*{\s*grid-row:\s*4;/,
    );
  });

  it('stacks the featured records as twin rows whose covers match at every width', () => {
    const page = readFileSync(releasesPagePath, 'utf8');
    const card = readFileSync(releaseCardPath, 'utf8');
    const css = readFileSync(globalCssPath, 'utf8');

    expect(page).toContain('class="layout-container releases-page-showcase-container"');
    expect(page).toContain('<div class="releases-page-layout" data-release-layout>');
    expect(page).not.toContain('singleColumn');
    expect(css).not.toMatch(/\.releases-page-showcase-container[^{]*{[^}]*(?:max-width|padding-inline)\s*:/s);
    // Lead and supporting share one block; only the lead image keeps first-viewport priority.
    expect(card).toMatch(/isPrincipal\s*\?\s*'releases-feature'\s*:/);
    expect(card).not.toMatch(/featureClass|featurePartPrefix|releases-latest-feature|singleColumn/);
    expect(css).not.toMatch(
      /releases-latest-feature|releases-page-layout--single-column|repeat\(12, minmax\(0, 1fr\)\)/,
    );
    expect(css).toMatch(
      /#releases-merchandising \.releases-feature\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*border-top:\s*1px solid var\(--flint-850\)/s,
    );
    expect(css).toMatch(
      /@media \(width >= 40rem\)\s*{\s*#releases-merchandising \.releases-feature\s*{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[^}]*column-gap:\s*1\.5rem/s,
    );
    expect(css).toMatch(
      /@media \(width >= 64rem\)\s*{\s*#releases-merchandising \.releases-feature\s*{[^}]*grid-template-columns:\s*29rem minmax\(0, 1fr\)/s,
    );
    // The catalog shares the featured gap, so from 40rem its tiles equal the featured halves.
    expect(page).toContain('class="releases-catalog-grid grid sm:grid-cols-2 lg:grid-cols-3"');
    expect(css).toMatch(/#releases-merchandising \.releases-catalog-grid\s*{[^}]*gap:\s*1\.5rem;/s);
    expect(css).toMatch(
      /#releases-merchandising \.releases-cover__image\s*{[^}]*object-fit:\s*contain;[^}]*transform:\s*none/s,
    );
  });

  it('renders the price, pre-order terms and action from the open pre-order projection, else hides them', () => {
    const card = readFileSync(releaseCardPath, 'utf8');
    expect(card).toMatch(/releasePresentation\(presentationEntry, projected && projectedListing\(projected\)\)/);
    expect(card).toContain('data-release-projected={projected ? JSON.stringify(projected) : undefined}');
    // One price, beside the formats on phones and beside the action from 40rem.
    expect(card).toMatch(
      /<div class="release-card-format-row">[\s\S]*?<p class="release-card-price" data-release-price hidden=\{!presentation\.price\}>/,
    );
    expect(card.match(/data-release-price /g)).toHaveLength(1);
    expect(card).toMatch(
      /\{editionHref && \(\s*<a\s+class="releases-feature__terms"[^>]*data-release-terms\s+inert=\{presentation\.state !== 'preorder'\}/s,
    );
    expect(card).toContain('<span data-release-purchase-label>{presentation.action}</span>');
    expect(card).toContain('aria-label={`${presentation.action}, ${release.data.title}`}');
    // Featured Buy vinyl carries the format mark too; CSS hides it on Pre-order and edition links.
    expect(card).toContain('<StoreBuyIcon formatGroup={buyIconFormatGroup} />');
    expect(card).not.toContain('!isPrincipal && <StoreBuyIcon');
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

    expect(page).toMatch(/class="releases-catalog-grid grid sm:grid-cols-2 lg:grid-cols-3"/);
    expect(css).toMatch(/\.releases-page-layout\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*gap:\s*0/s);
    expect(css).toMatch(/\.releases-page-layout > \*\s*{[^}]*min-width:\s*0/s);
    expect(css).not.toMatch(/\.releases-(?:page-layout|latest-feature|catalog-section)[^{]*{[^}]*\border\s*:/s);
  });
});
