import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const cardSource = readFileSync(
  fileURLToPath(new URL('../components/cards/StoreItemCard.astro', import.meta.url)),
  'utf8',
);
const appShellSource = readFileSync(
  fileURLToPath(new URL('../components/app-shell/AppShellRoot.tsx', import.meta.url)),
  'utf8',
);
const shellOutletsSource = readFileSync(
  fileURLToPath(new URL('../components/app-shell/view/ShellPortalOutlets.tsx', import.meta.url)),
  'utf8',
);
const searchSource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroSearch.tsx', import.meta.url)),
  'utf8',
);
const controllerSource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreCoverflowController.ts', import.meta.url)),
  'utf8',
);
const layoutSource = readFileSync(fileURLToPath(new URL('../layouts/SiteLayout.astro', import.meta.url)), 'utf8');
const cssSource = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

const controls = readFileSync(
  fileURLToPath(new URL('../components/store/StoreCoverflowControls.astro', import.meta.url)),
  'utf8',
);
describe('Distro Coverflow progressive enhancement', () => {
  it('starts complete groups in Grid and offers explicit views only after readiness', () => {
    expect(pageSource).toContain('const enrolled = group.entries.length >= 2');
    expect(pageSource).toContain("data-store-coverflow-mode={enrolled ? 'catalog' : undefined}");
    expect(pageSource).toContain('group.entries.map');
    expect(pageSource).not.toContain('getStoreCoverflowPosition');
    expect(controls.indexOf('>Grid</button>')).toBeLessThan(controls.indexOf('>Coverflow</button>'));
    expect(controls).toContain('data-store-coverflow-controls hidden');
    for (const hook of [
      'data-store-coverflow-current-value',
      'data-store-coverflow-remaining-value',
      'data-store-coverflow-summary',
      'data-store-coverflow-disclosure-rail',
    ])
      expect(controls).toContain(hook);
    expect(cardSource).toContain('data-store-coverflow-availability');
    expect(cardSource).toContain('href={storeItem.storePath}');
  });
  it('owns one route-lazy controller in the browse component without pre-ready intent capture', () => {
    expect(appShellSource).not.toContain("import('@/components/store/StoreCoverflowController')");
    expect(searchSource).toContain('ensureStoreCoverflowCapability()');
    expect(shellOutletsSource).toContain('StoreDistroSearch');
    for (const source of [layoutSource, controllerSource, appShellSource])
      expect(source).not.toContain('data-store-coverflow-pending-disclosure');
  });
  it('retains filter controls and one accessible result count', () => {
    expect(pageSource).toContain('data-distro-search');
    expect(searchSource).toContain('role="status"');
    expect(searchSource).toContain('Clear filters');
    expect(searchSource).toContain('Clear search');
    expect(searchSource).not.toContain('dom.navigation.hidden =');
  });
  it('uses one responsive six-position stage across every card with a flat reduced-motion fallback', () => {
    expect(controllerSource).toContain('totalCount < 2');
    expect(controllerSource).toContain('getStoreCoverflowPosition(cardIndex, activeIndex, group.cards.length)');
    expect(pageSource).not.toContain('aria-roledescription');
    expect(controllerSource).toContain("group.element.setAttribute('aria-roledescription', 'carousel')");
    expect(controllerSource).toContain("group.element.removeAttribute('aria-roledescription')");
    expect(cssSource).toContain('perspective: 52rem');
    expect(cssSource).toContain('@media (min-width: 40rem)');
    expect(cssSource).toContain('perspective: 64rem');
    expect(cssSource).toContain('--store-cover-size: clamp(13.5rem, 20vw, 16rem)');
    expect(cssSource).toContain('--store-cover-near-shift: clamp(7.5rem, 16vw, 11rem)');
    expect(cssSource).toContain('transform-style: preserve-3d');
    expect(
      new Set([...cssSource.matchAll(/data-store-coverflow-position='([^']+)'/g)].map((match) => match[1])),
    ).toEqual(new Set(['active', 'right-near', 'right-far', 'back', 'left-far', 'left-near']));
    expect(pageSource).toContain('class="distro-group-grid"');
    expect(pageSource).not.toContain('data-distro-search-chunk');
    expect(cssSource).not.toMatch(
      /data-store-coverflow-mode='preview'[^{}]*data-store-coverflow-card\]:not\(\[data-store-coverflow-position\]\)[^{}]*\{[^}]*display: none/,
    );
    expect(cssSource).toMatch(
      /\[data-store-coverflow-card\]:where\(\[data-store-coverflow-position\]\)\s*\{\s*position: absolute/,
    );
    expect(cssSource).toMatch(/\.store-item-card__content[\s\S]*?display: none/);
    expect(cssSource).toContain('animation: store-catalog-reveal 180ms');
    expect(cssSource).toContain('animation: store-coverflow-preview-rail-in 360ms');
    expect(cssSource).not.toContain('animation: store-coverflow-disclosure-fill');
    expect(cssSource).toContain('transform: scaleX(var(--store-coverflow-position-ratio))');
    expect(cssSource).toContain('transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1)');
    expect(cssSource).toMatch(/\.store-coverflow-stat[\s\S]*?justify-content: flex-end/);
    expect(cssSource).not.toContain("data-store-coverflow-reveal='catalog-pending'");
    expect(cssSource).toContain('grid-template-columns: repeat(auto-fit, minmax(min(5rem, 100%), 1fr))');
    expect(cssSource).toContain('background: #0d0d0d');
    expect(cssSource).not.toContain('view-transition-name');
    expect(cssSource).toContain('touch-action: pan-y pinch-zoom');
    expect(cssSource).toContain('[data-store-coverflow-availability]');
    expect(cssSource).toContain('[data-store-coverflow-position]:is(:hover, :focus-visible)');
    expect(cssSource).toContain('.store-item-card__image');
    expect(cssSource).not.toMatch(/\.distro-group-grid[^{}]*\{[^}]*content-visibility/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?transform-style: flat/);
    const reducedMotionCss = cssSource.slice(cssSource.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reducedMotionCss).not.toMatch(/\.store-coverflow-controls[^{}]*\{[^}]*display:\s*none/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?position: static/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?\.store-item-card__content[\s\S]*?display: grid/);
    expect(cssSource).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*?store-coverflow-rail__fill[\s\S]*?animation: none/,
    );
    expect(cssSource).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*?store-coverflow-rail__fill[\s\S]*?transition: none/,
    );
    expect(cssSource).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*?data-store-coverflow-position[\s\S]*?store-item-card__image[\s\S]*?transform: none/,
    );
  });
});
