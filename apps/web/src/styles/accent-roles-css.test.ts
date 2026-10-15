import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const globalCss = read('./global.css');
const publicCss = [
  globalCss,
  read('../components/store/crate/crate.css'),
  read('../components/store/cart/international-order-notice.css'),
];

function rule(selector: string) {
  const start = globalCss.indexOf(`${selector} {`);
  expect(start, `Missing ${selector} rule`).toBeGreaterThan(-1);
  return globalCss.slice(start, globalCss.indexOf('}', start));
}

// openspec/changes/accent-and-button-system: Sea means pre-order, Flint means buy and labels, Slate means Listen.
describe('accent roles', () => {
  it('defines the three accent scales', () => {
    for (const token of [
      '--sea-800: #256258',
      '--sea-700: #2d766a',
      '--sea-500: #4ca999',
      '--flint-800: #4d595c',
      '--flint-700: #626e72',
      '--flint-500: #889396',
      '--flint-300: #c1cbce',
      '--slate-700: #366e99',
      '--slate-500: #66a2d2',
      '--slate-300: #91c4ee',
    ]) {
      expect(globalCss).toContain(token);
    }
  });

  it('retires Store Blood, Services Rose and the Listen amber', () => {
    for (const css of publicCss) {
      expect(css).not.toMatch(/--store-accent|--services-accent|#922f3f|#cf6b80|#b4465a|#8a495a|#e3b56c/i);
    }
  });

  it('fills Buy in Flint and Pre-order in Sea, with white labels', () => {
    expect(rule('.purchase-action')).toMatch(/background-color: var\(--flint-700\);[\s\S]*color: var\(--foreground\);/);
    expect(rule('.preorder-action')).toMatch(/background-color: var\(--sea-700\);[\s\S]*color: var\(--foreground\);/);
    expect(globalCss).not.toMatch(/\.preorder-action \{[^}]*inset 0 -3px/);
  });

  it('keeps error red on the international notices only, never a face', () => {
    expect(globalCss).toContain('--error-700: #bc4945');
    expect(globalCss).toContain('--error-500: #e4706a');
    expect(globalCss).not.toContain('var(--error-');
    expect(publicCss[2]).toContain('border: 1px solid var(--error-700);');
    expect(publicCss[2]).not.toMatch(/background[^;]*var\(--error-/);
  });

  it('makes Listen the Slate control', () => {
    const listen = rule('.music-listen-trigger');
    expect(listen).toContain('--music-listen-border-color: var(--slate-700);');
    expect(listen).toContain('color: var(--foreground);');
    expect(rule('.music-equalizer')).toContain('color: var(--slate-500);');
  });

  it('shows status as plain lines, with pre-order in Sea', () => {
    const status = rule('.store-item-card__preorder,\n.store-item-card__release-status,\n.preorder-badge');
    expect(status).toContain('border: 0;');
    expect(status).toContain('color: var(--sea-500);');
  });
});
