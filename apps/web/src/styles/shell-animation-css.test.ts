import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('settled shell animations', () => {
  it('runs the loading sweep only while loading is open', () => {
    expect(css).toMatch(/\.app-shell-route-loading-indicator__bar\s*{[^}]*animation:\s*none/s);
    expect(css).toMatch(
      /\.app-shell-route-loading-indicator\[data-state='open'\] \.app-shell-route-loading-indicator__bar\s*{[^}]*animation:\s*route-loading-sweep/s,
    );
  });

  it('stops the hidden Home cue and retains reduced-motion shutdown', () => {
    expect(css).toMatch(
      /\.homepage-hero-section--scrolled \.homepage-hero-section__scroll-indicator-line span\s*{[^}]*animation:\s*none/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.homepage-hero-section__scroll-indicator-line span\s*{[^}]*animation:\s*none/s,
    );
  });
});
