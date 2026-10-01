import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('../styles/global.css', import.meta.url));
const artistsPagePath = fileURLToPath(new URL('./artists/index.astro', import.meta.url));
const artistCardPath = fileURLToPath(new URL('../components/artists/ArtistCard.astro', import.meta.url));
const artistDetailPath = fileURLToPath(new URL('../components/artists/ArtistDetailContent.astro', import.meta.url));

// The markup from a photo frame's opening tag to its first closing div; frames hold only self-closing images.
function readPhotoFrame(source: string, frameClass: string) {
  const start = source.indexOf(`<div class="${frameClass}`);
  expect(start).toBeGreaterThanOrEqual(0);
  return source.slice(start, source.indexOf('</div>', start));
}

describe('Artists roster layout', () => {
  it('reserves the filter panel height before its portal mounts', () => {
    const css = readFileSync(globalCssPath, 'utf8');

    expect(css).toMatch(/\[data-artists-roster-filters\]\s*{[^}]*min-block-size:\s*7rem/s);
  });

  it('exposes search only when the roster contains more than five artists', () => {
    const page = readFileSync(artistsPagePath, 'utf8');

    expect(page).toMatch(/artistProfiles\.length\s*>\s*5\s*&&\s*\(?\s*<div data-artists-roster-filters\s*\/?\s*>/s);
  });

  it('keeps artist card photos whole in uniform frames with the name below and no scrim', () => {
    const card = readFileSync(artistCardPath, 'utf8');
    const frame = readPhotoFrame(card, 'artist-photo-frame aspect-[3/4]');

    expect(card).not.toMatch(/bg-gradient/);
    expect(frame).toMatch(/class="artist-photo-fill"/);
    expect(frame).toMatch(/alt=""\s+aria-hidden="true"/);
    expect(frame).toMatch(/artist-roster-card__image[^"]*\bobject-contain\b/);
    expect(frame).not.toMatch(/<h3|brand-card-title/);
    expect(card.indexOf('<h3')).toBeGreaterThan(card.indexOf('</div>', card.indexOf('artist-photo-frame')));
  });

  it('fills the artist detail frame with a blurred copy of the photo', () => {
    const frame = readPhotoFrame(readFileSync(artistDetailPath, 'utf8'), 'artist-detail-hero__image-frame');
    const css = readFileSync(globalCssPath, 'utf8');

    expect(frame).toMatch(/class="artist-photo-fill"/);
    expect(frame).toMatch(/artist-detail-hero__image[^"]*\bobject-contain\b/);
    expect(css).toMatch(/\.artist-photo-fill\s*{[^}]*object-fit:\s*cover[^}]*filter:\s*blur\(/s);
  });
});
