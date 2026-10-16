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

// openspec/changes/accent-and-button-system: Sea means pre-order, Flint means buy and labels, amber means Listen.
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
      '--amber-500: #e3b56c',
      '--amber-300: #f0d7b0',
      '--amber-surface: rgba(227, 181, 108, 0.16)',
    ]) {
      expect(globalCss).toContain(token);
    }
  });

  it('retires Store Blood, Services Rose and Slate', () => {
    for (const css of publicCss) {
      expect(css).not.toMatch(
        /--store-accent|--services-accent|#922f3f|#cf6b80|#b4465a|#8a495a|#366e99|#66a2d2|#91c4ee/i,
      );
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

  it('makes Listen the amber control', () => {
    expect(globalCss).toContain('--listen-bars: var(--amber-500);');
    expect(globalCss).toContain('--listen-edge: var(--amber-500);');
    expect(globalCss).toContain('--listen-text: var(--amber-300);');
    expect(globalCss).not.toContain('--listen-accent');
    const listen = rule('.music-listen-trigger');
    expect(listen).toContain('--music-listen-border-color: var(--listen-edge);');
    expect(listen).toContain('color: var(--foreground);');
    expect(rule('.music-equalizer')).toContain('color: var(--listen-bars);');
  });

  it('tints the informational neutrals with Flint at their former lightness', () => {
    for (const token of [
      '--flint-400: #abb5b8',
      '--flint-850: #262c2e',
      '--flint-900: #212729',
      '--flint-950: #1a2022',
      '--muted-foreground: var(--flint-400)',
      '--border: var(--flint-900)',
      '--control-edge: var(--flint-850)',
      '--control-edge-quiet: var(--flint-950)',
    ]) {
      expect(globalCss).toContain(token);
    }
    for (const css of publicCss) expect(css).not.toMatch(/#2b2b2b|#b3b3b3/i);
  });

  it('shows status as plain lines, with pre-order in Sea', () => {
    const status = rule('.store-item-card__preorder,\n.store-item-card__release-status,\n.preorder-badge');
    expect(status).toContain('border: 0;');
    expect(status).toContain('color: var(--sea-500);');
  });
});
