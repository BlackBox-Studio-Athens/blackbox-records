import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PAGE_MAX_WIDTH } from '@/platform/lib/editorial-image';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const globalCss = read('./global.css');

// Page-scale widths other than the shared frame: Store's documented catalog frame and Home's full-bleed bands.
const sanctionedWideSelectors = [
  '.store-collection-page',
  '.page-content-width-constrained-container',
  '.home-preorders__still-grid',
  '.home-preorders__buy',
];

function pageScaleWidths(css: string) {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{};]+)\{([^{}]*)\}/g)];
  return rules.flatMap(([, selector = '', body = '']) =>
    [...body.matchAll(/(?<![-\w])(max-width|--page-max-width):\s*([\d.]+)(rem|px)/g)]
      .filter(([, , value, unit]) => Number(value) / (unit === 'px' ? 16 : 1) >= 60)
      .map(([, property, value, unit]) => ({ selector: selector.trim(), declaration: `${property}: ${value}${unit}` })),
  );
}

describe('page frame', () => {
  it('owns one frame width shared by CSS and image sizes', () => {
    expect(globalCss).toMatch(new RegExp(`:root\\s*{[^}]*--page-max-width:\\s*${PAGE_MAX_WIDTH};`));
    expect(globalCss).toMatch(/\.layout-container\s*{[^}]*max-width:\s*var\(--page-max-width\)/);
    expect(globalCss).toMatch(
      /\.layout-container\s*{[^}]*padding-left:\s*max\(var\(--page-gutter\), env\(safe-area-inset-left\)\)/,
    );
  });

  it('rejects page-specific frame widths outside the sanctioned exceptions', () => {
    const strays = pageScaleWidths(globalCss).filter(
      ({ selector, declaration }) =>
        !(selector === ':root' && declaration.startsWith('--page-max-width')) &&
        !sanctionedWideSelectors.includes(selector),
    );
    expect(strays).toEqual([]);
  });

  it('keeps the header, footer and route heroes on the shared frame', () => {
    for (const path of [
      '../components/header/HeaderShell.astro',
      '../components/Footer.astro',
      '../components/InternalPageHero.astro',
    ]) {
      const source = read(path);
      expect(source).toContain('layout-container');
      expect(source).not.toMatch(/\bmax-w-(?:\[|[5-7]xl|screen)/);
    }
  });

  it('gives each zero-stock state one tone: dashed for not here yet, Store Blood for Sold Out', () => {
    const css = globalCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const rule = (selector: string) =>
      [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)]
        .filter(([, head = '']) => head.includes(selector))
        .map(([, , body]) => body);
    expect(rule("[data-store-listing-availability-state='coming_soon']").join()).toMatch(/border-style:\s*dashed/);
    expect(rule("[data-availability-state='repressing']").join()).toMatch(/border-style:\s*dashed/);
    expect(rule("[data-store-listing-availability-state='sold_out']").join()).toContain('var(--store-accent)');
    expect(rule("[data-availability-state='sold_out']").join()).toContain('var(--store-accent)');
    expect(css).not.toContain(':has(.preorder-action:disabled)');
  });
});
