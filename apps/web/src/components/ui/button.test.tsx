import * as React from 'react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button, buttonVariants } from './button';

const globalCss = readFileSync(fileURLToPath(new URL('../../styles/global.css', import.meta.url)), 'utf8');

function classesOf(html: string) {
  return /class="([^"]*)"/.exec(html)?.[1].split(' ') ?? [];
}

describe('Button', () => {
  it('draws a square 36px Bebas control with a 44px coarse-pointer halo by default', () => {
    const html = renderToStaticMarkup(<Button>Checkout</Button>);
    const classes = classesOf(html);

    expect(html).toContain('data-variant="default"');
    expect(html).toContain('data-size="default"');
    expect(classes).toEqual(
      expect.arrayContaining([
        'site-button',
        'site-button--primary',
        'rounded-none',
        'font-display',
        'uppercase',
        'min-h-9',
        'min-w-24',
        'pointer-coarse:before:absolute',
        'pointer-coarse:before:-inset-1',
        'focus-visible:outline-2',
      ]),
    );
  });

  it('keeps the large size at 44px with the commerce minimum width', () => {
    const classes = classesOf(renderToStaticMarkup(<Button size="lg">Add to cart</Button>));

    expect(classes).toEqual(expect.arrayContaining(['min-h-11', 'min-w-28', 'text-base']));
    expect(classes).not.toContain('min-h-9');
  });

  it('widens the halo for 32px chips and exposes pressed state styling', () => {
    const classes = buttonVariants({ variant: 'chip', size: 'sm' }).split(' ');

    expect(classes).toEqual(
      expect.arrayContaining(['site-button--chip', 'min-h-8', 'pointer-coarse:before:-inset-1.5', 'aria-pressed:border-foreground']),
    );
    expect(classes).not.toContain('pointer-coarse:before:-inset-1');
    expect(classes).not.toContain('min-w-24');
  });

  it('keeps text actions in the reading face without the caps nudge', () => {
    const classes = buttonVariants({ variant: 'link' }).split(' ');

    expect(classes).toEqual(expect.arrayContaining(['site-button--link', 'font-sans', 'normal-case', 'pt-0', 'underline']));
    expect(classes).not.toContain('font-display');
    expect(classes).not.toContain('pt-px');
  });

  it('marks icon controls so section tone never reaches them', () => {
    const classes = buttonVariants({ variant: 'outline', size: 'icon' }).split(' ');

    expect(classes).toEqual(expect.arrayContaining(['site-button--icon', 'size-9', 'border-control-edge-quiet']));
    expect(classes).not.toContain('border-control-edge');
  });
});

describe('Button family CSS', () => {
  it('lets outlined buttons inherit the store and services tone, but not icon controls', () => {
    expect(globalCss).toContain("[data-tone='store'] .site-button--outline:not(.site-button--icon) {");
    expect(globalCss).toContain("[data-tone='services'] .site-button--outline:not(.site-button--icon) {");
  });

  it('reserves the header cart slot so navigation does not shift', () => {
    expect(globalCss).toMatch(/\[data-store-cart-header-root\] \{[^}]*min-width: 2\.25rem;[^}]*min-height: 2\.25rem;/);
  });

  it('keeps Bebas on buttons inside the store purchase area', () => {
    expect(globalCss).toContain('.store-item-purchase .font-display:not([data-store-offer-price], .site-button) {');
  });
});
