import * as React from 'react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button, buttonVariants } from './button';

const globalCss = readFileSync(fileURLToPath(new URL('../../styles/global.css', import.meta.url)), 'utf8');
// Prettier wraps long selectors, so selector checks compare the stylesheet with whitespace flattened.
const flatCss = globalCss.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');

function classesOf(html: string) {
  return /class="([^"]*)"/.exec(html)?.[1]?.split(' ') ?? [];
}

describe('Button', () => {
  it('draws a 44px control whose shared family rules live in the site-button CSS', () => {
    const html = renderToStaticMarkup(<Button>Checkout</Button>);
    const classes = classesOf(html);

    expect(html).toContain('data-variant="default"');
    expect(html).toContain('data-size="default"');
    expect(classes).toEqual(
      expect.arrayContaining(['site-button', 'site-button--primary', 'min-h-11', 'min-w-28', 'text-base']),
    );
    // The base rules ship once in CSS rather than in every island bundle.
    expect(classes).not.toContain('rounded-none');
    for (const rule of [
      'border-radius: 0;',
      'text-transform: uppercase;',
      'outline: 2px solid var(--foreground);',
      'inset: -5px;',
      'opacity: 0.45;',
    ]) {
      expect(globalCss).toContain(rule);
    }
  });

  it('has one 44px size plus the 48px hero exception', () => {
    const hero = buttonVariants({ size: 'hero' }).split(' ');

    expect(hero).toEqual(expect.arrayContaining(['site-button--hero', 'min-h-12', 'text-lg']));
    expect(hero).not.toContain('min-h-11');
    expect(buttonVariants({ variant: 'outline' }).split(' ')).toContain('min-h-11');
  });

  it('selects chips in Flint and edges browse actions in Flint', () => {
    const chip = buttonVariants({ variant: 'chip' }).split(' ');
    const inverse = buttonVariants({ variant: 'inverse' }).split(' ');

    expect(chip).toEqual(expect.arrayContaining(['site-button--chip', 'min-h-11', 'aria-pressed:border-flint-500']));
    expect(chip).not.toContain('min-w-28');
    expect(inverse).toEqual(
      expect.arrayContaining(['site-button--inverse', 'border-flint-700', 'text-foreground', 'min-w-28']),
    );
  });

  it('keeps text actions in the reading face in a 44px row without the caps nudge', () => {
    const classes = buttonVariants({ variant: 'link' }).split(' ');

    expect(classes).toEqual(
      expect.arrayContaining(['site-button--link', 'font-sans', 'normal-case', 'pt-0', 'underline', 'min-h-11']),
    );
    expect(classes).not.toContain('font-display');
    expect(classes).not.toContain('pt-px');
  });

  it('sizes icons at zero specificity without matching on the class attribute', () => {
    expect(flatCss).toContain(':where(.site-button) svg { width: 18px; height: 18px; }');
  });

  it('draws icon controls at 44px on a quiet neutral edge', () => {
    const classes = buttonVariants({ variant: 'outline', size: 'icon' }).split(' ');

    expect(classes).toEqual(expect.arrayContaining(['site-button--icon', 'size-11', 'border-control-edge-quiet']));
    expect(classes).not.toContain('border-control-edge');
  });
});

describe('Button family CSS', () => {
  it('gives outlined buttons no section tone', () => {
    expect(globalCss).not.toContain('[data-tone=');
  });

  it('reserves the header cart slot so navigation does not shift', () => {
    expect(globalCss).toMatch(/\[data-store-cart-header-root\] \{[^}]*min-width: 2\.75rem;[^}]*min-height: 2\.75rem;/);
  });

  it('keeps Bebas on buttons, Listen, purchase status and copies-left notices inside store item pages', () => {
    expect(flatCss).toContain(
      '.store-item-purchase .font-display:not([data-store-offer-price], [data-store-item-purchase-status], .site-button) {',
    );
    expect(flatCss).toContain(
      '.store-item-page :is(p, button, a, [data-store-purchase-group] > span):not(.site-button, .music-listen-trigger, [data-store-item-purchase-status], .store-low-stock) {',
    );
  });
});
