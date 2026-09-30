import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
const globalCssPath = '../styles/global.css';
const artistsPagePath = './artists/index.astro';
const rosterIndexPath = '../components/artists/ArtistRosterIndex.astro';

describe('Artists roster layout', () => {
  it('reserves the filter panel height before its portal mounts', () => {
    const css = read(globalCssPath);

    expect(css).toMatch(/\[data-artists-roster-filters\]\s*{[^}]*min-block-size:\s*7rem/s);
  });

  it('exposes search only when the roster contains more than five artists', () => {
    const page = read(artistsPagePath);

    expect(page).toMatch(/artistProfiles\.length\s*>\s*5\s*&&\s*\(?\s*<div data-artists-roster-filters\s*\/?\s*>/s);
  });

  it('renders the roster through the crate index under the shared hero', () => {
    const page = read(artistsPagePath);

    expect(page).toContain('<InternalPageHero sectionLabel="Roster" title="Artists" />');
    expect(page).toContain('<ArtistRosterIndex');
    expect(page).not.toContain('ArtistCard');
    expect(page).not.toContain('artists-roster-grid');
  });

  it('gives each roster item both presentations and the sort and filter data attributes', () => {
    const index = read(rosterIndexPath);
    const item = /<li\b[\s\S]*?>\s*\{row\.groupStart/.exec(index)?.[0] ?? '';

    for (const attribute of [
      'data-artist-roster-item',
      'data-artist-id',
      'data-artist-title',
      'data-artist-genre',
      'data-artist-country',
      'data-artist-bio',
      'data-artist-latest-release-title',
      'data-artist-latest-release-date',
      'data-artist-sort-name',
      'data-artist-latest-release-sort',
    ]) {
      expect(item).toContain(attribute);
    }
    expect(index).toMatch(/<a\s[^>]*class="artist-roster-index__row"[^>]*data-artist-roster-row/s);
    expect(index).toMatch(/<details\s[^>]*data-artist-roster-disclosure/s);
    expect(index).toMatch(/<summary\b/);
  });

  it('server-renders the first artist as the default preview and leaves a mount for the island', () => {
    const index = read(rosterIndexPath);

    expect(index).toContain('<div data-artist-roster-preview></div>');
    expect(index).toContain('data-artist-preview-print');
    expect(index).toContain('data-artist-preview-details');
    expect(index).toMatch(/hidden=\{row\.index > 0\}/);
    expect(index).toMatch(/data-print-depth=\{row\.index === 0 \? '0' : undefined\}/);
    expect(index).toMatch(/fetchPriority=\{row\.index === 0 \? 'high' : undefined\}/);
  });

  it('hides each presentation with display none and switches at lg', () => {
    const css = read(globalCssPath);

    expect(css).toMatch(/\.artist-roster-index__row\s*{\s*display:\s*none/);
    expect(css).toMatch(/\.artist-roster-preview\s*{\s*display:\s*none/);
    expect(css).toMatch(
      /@media \(min-width: 64rem\)\s*{[\s\S]*?\.artist-roster-index__disclosure\s*{\s*display:\s*none/,
    );
  });

  it('removes print and disclosure transitions under reduced motion', () => {
    const css = read(globalCssPath);

    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{\s*\.artist-print,[^{]*{\s*transition:\s*none/);
  });
});
