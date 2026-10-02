import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');
const prose = readFileSync(fileURLToPath(new URL('./prose.css', import.meta.url)), 'utf8');

// Lenis rewrites its classes on <html> at every scroll start and end. A selector that depends on an html class through
// a descendant combinator, or an attribute selector on class, makes each rewrite restyle the whole document.
describe('scroll root class changes stay cheap', () => {
  it('does not import the packaged Lenis stylesheet', () => {
    expect(css).not.toMatch(/@import\s+['"]lenis/);
  });

  it('keeps the Lenis rules keyed on the root state class or the element itself', () => {
    expect(css).toMatch(/^\.lenis-stopped\s*{\s*overflow:\s*clip;\s*}/m);
    expect(css).toMatch(
      /^\[data-lenis-prevent\],[^{]*\[data-lenis-prevent-touch\][^{]*{\s*overscroll-behavior:\s*contain;/m,
    );
    expect(css).toMatch(/^\.lenis-smooth iframe\s*{\s*pointer-events:\s*none;\s*}/m);
    expect(css).not.toMatch(/\.lenis[\s.:]/);
    expect(css).not.toMatch(/html\.lenis/);
  });

  it('never matches on substrings of the class attribute', () => {
    expect(css).not.toContain('[class*=');
    expect(css).not.toContain('[class^=');
    expect(css).not.toContain('[class~=');
    expect(prose).not.toContain('[class*=');
  });
});
