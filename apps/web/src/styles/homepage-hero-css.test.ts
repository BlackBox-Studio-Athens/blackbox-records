import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));
const globalCss = readFileSync(globalCssPath, 'utf8');

function readCssBlock(marker: string, css = globalCss, fromEnd = false) {
  const markerIndex = fromEnd ? css.lastIndexOf(marker) : css.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Unable to find CSS marker: ${marker}`);
  }

  const blockStart = css.indexOf('{', markerIndex);
  if (blockStart === -1) {
    throw new Error(`Unable to find CSS block for marker: ${marker}`);
  }

  const blockEnd = css.indexOf('}', blockStart);
  if (blockEnd === -1) {
    throw new Error(`Unable to close CSS block for marker: ${marker}`);
  }

  return css.slice(blockStart + 1, blockEnd);
}

describe('Homepage hero CSS', () => {
  it('crossfades one persistent ghost behind static Home surfaces', () => {
    const mediaRule = readCssBlock('.homepage-hero-section__media-layer {');
    const mediaBlackVeilRule = readCssBlock('.homepage-hero-section__media-layer::after {');
    const scrolledMediaRule = readCssBlock('.homepage-hero-section--scrolled .homepage-hero-section__media-layer {');
    const scrolledMediaBlackVeilRule = readCssBlock(
      '.homepage-hero-section--scrolled .homepage-hero-section__media-layer::after {',
    );
    const shadeRule = readCssBlock('.homepage-hero-section__shade-layer {');
    const scrollIndicatorRule = readCssBlock('.homepage-hero-section__scroll-indicator {');
    const scrolledIndicatorRule = readCssBlock(
      '.homepage-hero-section--scrolled .homepage-hero-section__scroll-indicator {',
    );
    const homeNewsVeilRule = readCssBlock('.home-news-section::before {');
    const artistsSurfaceRule = readCssBlock('.artists-surface-section {');
    const newsletterVeilRule = readCssBlock('#newsletter-signup-area::before {', globalCss, true);
    const cardRule = readCssBlock('.catalog-tile-card {');
    const footerRule = readCssBlock('.site-footer-shell {', globalCss, true);
    const reducedMotionRule = globalCss.slice(globalCss.indexOf('@media (prefers-reduced-motion: reduce)'));

    expect(mediaRule).toMatch(/position:\s*fixed/i);
    expect(mediaRule).toMatch(/opacity:\s*1/i);
    // A transition would outrank the fade animation whenever the coarse class flips.
    expect(mediaRule).toMatch(
      /animation-name:\s*homepage-hero-ghost;\s*animation-timing-function:\s*linear;\s*animation-fill-mode:\s*both;/,
    );
    expect(mediaRule).not.toMatch(/transition|visibility|transform|filter|mix-blend-mode/i);
    expect(mediaBlackVeilRule).toMatch(/position:\s*absolute/i);
    expect(mediaBlackVeilRule).toMatch(/background:\s*#050505/i);
    expect(mediaBlackVeilRule).toMatch(/opacity:\s*0/i);
    expect(mediaBlackVeilRule).toMatch(
      /animation-name:\s*homepage-hero-ghost-veil;\s*animation-timing-function:\s*linear;\s*animation-fill-mode:\s*both;/,
    );
    expect(mediaBlackVeilRule).not.toMatch(/transition|filter|mix-blend-mode/i);
    expect(scrolledMediaRule).toMatch(/opacity:\s*0\.12/i);
    expect(scrolledMediaRule).not.toMatch(/visibility|transform|filter|mix-blend-mode/i);
    expect(scrolledMediaBlackVeilRule).toMatch(/opacity:\s*0\.5/i);
    expect(shadeRule).toMatch(/position:\s*absolute/i);
    expect(shadeRule).not.toMatch(/opacity|visibility|transition|transform|filter|mix-blend-mode/i);
    expect(globalCss).not.toContain('.homepage-hero-section--scrolled .homepage-hero-section__shade-layer');
    expect(reducedMotionRule).toMatch(/\.homepage-hero-section__media-layer[\s\S]*?transition:\s*none/i);
    expect(reducedMotionRule).toMatch(/\.homepage-hero-section__media-layer::after[\s\S]*?transition:\s*none/i);

    expect(homeNewsVeilRule).toMatch(/background:\s*rgb\(13 13 13 \/ 76%\)/i);
    const homeSurfacesRule = readCssBlock('.home-news-section,\n  .home-preorders,\n  .artists-surface-section,');
    expect(homeSurfacesRule).toMatch(/position:\s*relative/i);
    expect(homeSurfacesRule).toMatch(/z-index:\s*1/i);
    expect(artistsSurfaceRule).toMatch(/background-color:\s*rgb\(20 20 20 \/ 78%\)/i);
    expect(newsletterVeilRule).toMatch(/background:\s*rgb\(13 13 13 \/ 74%\)/i);
    expect(cardRule).toMatch(/background-color:\s*#141414/i);
    expect(footerRule).toMatch(/background-color:\s*#141414/i);

    expect(scrollIndicatorRule).not.toMatch(/transition/i);
    expect(scrolledIndicatorRule).toMatch(/opacity:\s*0/i);

    // Scroll-linked ghost: the root scroll timeline drives it where supported; elsewhere it is paused for the shell to
    // seek (1s = full progress, see shell-hero-scroll-progress.ts). Reduced motion overrides both.
    const supportsStart = globalCss.indexOf('@supports (animation-timeline: scroll())');
    const supportsNotStart = globalCss.indexOf('@supports not (animation-timeline: scroll())');
    const fadeDriverCss = globalCss.slice(supportsStart, globalCss.indexOf('@keyframes homepage-hero-ghost {'));
    expect(supportsStart).toBeGreaterThan(-1);
    expect(supportsNotStart).toBeGreaterThan(supportsStart);
    // The reduced-motion `animation: none` override must come later in the cascade.
    expect(supportsNotStart).toBeLessThan(
      globalCss.search(/\.homepage-hero-section__media-layer::after,\s*\.homepage-hero-section__shade-layer/),
    );
    expect(fadeDriverCss).toMatch(
      /@supports \(animation-timeline: scroll\(\)\) \{\s*\.homepage-hero-section__media-layer,\s*\.homepage-hero-section__media-layer::after \{\s*animation-timeline:\s*scroll\(root block\);\s*animation-range:\s*0 42vh;\s*\}\s*\}/,
    );
    expect(fadeDriverCss).toMatch(
      /@supports not \(animation-timeline: scroll\(\)\) \{\s*\.homepage-hero-section__media-layer,\s*\.homepage-hero-section__media-layer::after \{\s*animation-duration:\s*1s;\s*animation-play-state:\s*paused;\s*\}\s*\}/,
    );
    expect(reducedMotionRule).toMatch(/\.homepage-hero-section__media-layer::after[\s\S]*?animation:\s*none/i);
    expect(globalCss.slice(globalCss.indexOf('@keyframes homepage-hero-ghost {'))).toMatch(
      /^@keyframes homepage-hero-ghost \{\s*from \{\s*opacity:\s*1;\s*\}\s*to \{\s*opacity:\s*0\.12;/,
    );
    expect(globalCss.slice(globalCss.indexOf('@keyframes homepage-hero-ghost-veil {'))).toMatch(
      /^@keyframes homepage-hero-ghost-veil \{\s*from \{\s*opacity:\s*0;\s*\}\s*to \{\s*opacity:\s*0\.5;/,
    );

    expect(globalCss).not.toContain('--homepage-hero-scroll-progress');
    expect(globalCss).not.toContain('hero-ken-burns');
    expect(globalCss).not.toContain('hero-grain-drift');
    expect(globalCss).not.toContain('.homepage-hero-section__grain-layer');
    expect(globalCss).not.toMatch(/homepage-hero-section__media-image[^}]*filter:/s);
  });
});
