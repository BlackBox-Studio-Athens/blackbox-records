import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { checkSitemapOutput } from '../../scripts/check-sitemap';

const home = 'https://example.test/base/';
let root: string;

function page(path: string, head: string) {
  mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, path, 'index.html'), `<!doctype html><html><head>${head}</head><body></body></html>`);
}

function sitemap(...paths: string[]) {
  writeFileSync(
    join(root, 'sitemap.xml'),
    `<urlset>${paths.map((path) => `<url><loc>${home}${path}</loc></url>`).join('')}</urlset>`,
  );
}

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('check-sitemap', () => {
  it('accepts indexable pages canonical to themselves', () => {
    root = mkdtempSync(join(tmpdir(), 'sitemap-'));
    page('', `<link rel="canonical" href="${home}">`);
    page('store/item', `<meta name="robots" content="index"><link rel="canonical" href="${home}store/item/">`);
    sitemap('', 'store/item/');
    expect(checkSitemapOutput(root)).toEqual([]);
  });

  it('names missing, noindex and non-canonical URLs', () => {
    root = mkdtempSync(join(tmpdir(), 'sitemap-'));
    page('', `<link rel="canonical" href="${home}">`);
    page('hidden', `<meta name="robots" content="noindex"><link rel="canonical" href="${home}hidden/">`);
    page('moved', `<link rel="canonical" href="${home}elsewhere/">`);
    sitemap('', 'missing/', 'hidden/', 'moved/');
    expect(checkSitemapOutput(root)).toEqual([
      `${home}missing/ has no built page.`,
      `${home}hidden/ is marked noindex.`,
      `${home}moved/ is canonical to ${home}elsewhere/.`,
    ]);
  });
});
