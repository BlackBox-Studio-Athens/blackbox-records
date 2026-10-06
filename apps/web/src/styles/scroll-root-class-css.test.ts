import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireLenisModalLock, connectLenisScrollRoots } from '@/platform/lib/lenis-scroll';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');
const prose = readFileSync(fileURLToPath(new URL('./prose.css', import.meta.url)), 'utf8');
const galleryCss = readFileSync(
  fileURLToPath(new URL('../components/store/store-image-gallery.css', import.meta.url)),
  'utf8',
);
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selectors: match[1]!.trim().split(/\s*,\s*/),
  declarations: new Map(
    match[2]!.split(';').flatMap((declaration) => {
      const colon = declaration.indexOf(':');
      return colon < 0 ? [] : [[declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()] as const];
    }),
  ),
}));
afterEach(() => vi.unstubAllGlobals());

// Lenis rewrites its classes on <html> at every scroll start and end. A selector that depends on an html class through
// a descendant combinator, or an attribute selector on class, makes each rewrite restyle the whole document.
describe('scroll root class changes stay cheap', () => {
  it('does not import the packaged Lenis stylesheet', () => {
    expect(css).not.toMatch(/@import\s+['"]lenis/);
  });

  it('never styles descendants through Lenis root-state classes', () => {
    const lenisSelectors = rules.flatMap((rule) => rule.selectors).filter((selector) => /\.lenis\b/.test(selector));
    expect(lenisSelectors).toEqual(['.lenis-stopped:not(.lenis-autoToggle)']);
    const stopped = rules.find((rule) => rule.selectors.includes(lenisSelectors[0]!));
    expect(stopped?.declarations.get('overflow')).toBe('clip');
    for (const attribute of ['prevent', 'prevent-wheel', 'prevent-touch', 'prevent-vertical', 'prevent-horizontal']) {
      const prevent = rules.find((rule) => rule.selectors.includes(`[data-lenis-${attribute}]`));
      expect(prevent?.declarations.get('overscroll-behavior')).toBe('contain');
    }
  });

  it('styles the runtime body lock independently of Lenis and retains it until every token closes', () => {
    const classes = new Set<string>();
    vi.stubGlobal('document', {
      body: {
        classList: { toggle: (name: string, enabled: boolean) => (enabled ? classes.add(name) : classes.delete(name)) },
      },
    });
    const unlockFirst = acquireLenisModalLock({} as HTMLElement);
    const unlockSecond = acquireLenisModalLock({} as HTMLElement);
    try {
      const lockClass = [...classes][0]!;
      expect(classes.size).toBe(1);
      const rule = rules.find((candidate) => candidate.selectors.includes(`body.${lockClass}`));
      expect(rule?.selectors).toContain('body.is-shell-modal-open');
      expect(rule?.declarations.get('overflow')).toBe('hidden');
      expect(rule?.declarations.get('overscroll-behavior')).toBe('contain');
      unlockFirst();
      expect(classes.has(lockClass)).toBe(true);
      unlockSecond();
      unlockSecond();
      expect(classes.size).toBe(0);
    } finally {
      unlockFirst();
      unlockSecond();
    }
  });

  it('constructs no runtime or idle frames for native pointer and reduced-motion modes', () => {
    for (const preferences of [
      { fine: false, reduced: false },
      { fine: true, reduced: true },
    ]) {
      const requestAnimationFrame = vi.fn();
      vi.stubGlobal('window', {
        matchMedia: (query: string) => ({
          matches: query.includes('prefers-reduced') ? preferences.reduced : preferences.fine,
        }),
        requestAnimationFrame,
      });
      const factory = vi.fn();
      const disconnect = connectLenisScrollRoots({} as HTMLElement, factory);
      expect(factory).not.toHaveBeenCalled();
      expect(requestAnimationFrame).not.toHaveBeenCalled();
      disconnect();
    }
  });

  it('keeps gallery vertical gestures native and disables crossfades under reduced motion', () => {
    const stage = rules.find((rule) => rule.selectors.includes('.store-image-gallery__stage'));
    expect(stage?.declarations.get('touch-action')).toBe('pan-y pinch-zoom');
    const image = rules.find((rule) => rule.selectors.includes('.store-image-gallery__image'));
    expect(image?.declarations.get('object-fit')).toBe('contain');
    const reducedMotion = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}/.exec(galleryCss)?.[1];
    expect(reducedMotion).toMatch(
      /\.store-image-gallery__image\[data-changing\]\s*,\s*\.store-image-gallery__previous\[data-changing\]\s*\{\s*animation:\s*none;/,
    );
    expect(reducedMotion).toMatch(/\.store-image-gallery__previous\[data-changing\]\s*\{\s*visibility:\s*hidden;/);
  });

  it('never matches on substrings of the class attribute', () => {
    expect(css).not.toContain('[class*=');
    expect(css).not.toContain('[class^=');
    expect(css).not.toContain('[class~=');
    expect(prose).not.toContain('[class*=');
  });
});
