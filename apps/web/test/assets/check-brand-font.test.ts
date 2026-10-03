import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { checkBrandFontBuild, checkBrandFontSources } from '../../scripts/check-brand-font';

const artifactRoot = fileURLToPath(new URL('../../../../.codex-artifacts/performance-resume/', import.meta.url));
const fixtures: string[] = [];

function buildFixture() {
  mkdirSync(artifactRoot, { recursive: true });
  const root = mkdtempSync(path.join(artifactRoot, 'font-check-'));
  fixtures.push(root);
  const assets = path.join(root, 'dist', '_astro');
  mkdirSync(assets, { recursive: true });
  const brand = 'veneer_regular.fixture.woff2';
  const inter = 'inter-latin.fixture.woff2';
  const geist = 'geist-mono-latin.fixture.woff2';
  const bebas = 'bebas-neue-latin.fixture.woff2';
  copyFileSync(new URL('../../src/assets/fonts/brand/veneer_regular.woff2', import.meta.url), path.join(assets, brand));
  for (const font of [inter, geist, bebas]) writeFileSync(path.join(assets, font), 'wOF2');
  writeFileSync(path.join(assets, 'fonts.css'), `font-display:swap;${[brand, inter, geist, bebas].join(';')}`);
  const html = (fonts: string[], shell = true) =>
    `<!doctype html><html><head>${fonts
      .map((font) => `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" href="/_astro/${font}">`)
      .join('')}</head><body${shell ? ' data-app-shell-main' : ''}></body></html>`;
  writeFileSync(path.join(root, 'dist', 'index.html'), html([brand, inter]));
  writeFileSync(path.join(root, 'dist', '404.html'), html([inter, bebas], false));
  mkdirSync(path.join(root, 'dist', 'releases'));
  writeFileSync(path.join(root, 'dist', 'releases', 'index.html'), html([brand, inter, geist]));
  return { root, html, brand, inter };
}

afterEach(() => {
  for (const root of fixtures.splice(0)) {
    if (path.dirname(root) !== path.resolve(artifactRoot))
      throw new Error('Font fixture escaped its artifact directory.');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('Veneer delivery', () => {
  it('keeps the bundled and stable font bytes identical with swap display ownership', () => {
    expect(() => checkBrandFontSources()).not.toThrow();
  });

  it('requires route-specific CORS preloads matching the generated font assets', () => {
    const { root, html, brand } = buildFixture();
    expect(() => checkBrandFontBuild(root)).not.toThrow();
    writeFileSync(path.join(root, 'dist', 'index.html'), html([brand, 'inter-latin.wrong.woff2']));
    expect(() => checkBrandFontBuild(root)).toThrow('Missing CORS font preload matching bundled CSS');
  });

  it('rejects third-party font origins and unused view-transition output', () => {
    const { root, html, brand, inter } = buildFixture();
    const page = path.join(root, 'dist', 'index.html');
    writeFileSync(page, html([brand, inter]) + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2">');
    expect(() => checkBrandFontBuild(root)).toThrow('Third-party font request');
    writeFileSync(page, html([brand, inter]) + '<style>.title { view-transition-name: title }</style>');
    expect(() => checkBrandFontBuild(root)).toThrow('Unused view-transition output');
  });
});
