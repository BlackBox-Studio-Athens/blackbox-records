import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');
const HEADER_LAYER = 1000;

describe('fixed header clearance', () => {
  it('scrolls focused and anchored content clear of the fixed header', () => {
    expect(css).toMatch(/html\s*{[^}]*scroll-padding-top:\s*calc\(var\(--header-height\) \+ 0\.5rem\)/);
  });

  it('paints the focused skip link above the fixed header', () => {
    const layer = /\.accessibility-skip-to-content-link:focus-visible\s*{[^}]*z-\[(\d+)\]/.exec(css)?.[1];
    expect(Number(layer)).toBeGreaterThan(HEADER_LAYER);
  });

  it('paints the route loading indicator above the fixed header and below the sheets', () => {
    const layer = /\.app-shell-route-loading-indicator\s*{[^}]*z-index:\s*(\d+)/.exec(css)?.[1];
    expect(Number(layer)).toBeGreaterThan(HEADER_LAYER);
    expect(Number(layer)).toBeLessThan(1100);
  });
});
