import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

describe('Holding legal route isolation', () => {
  it('prepares only temporary legal redirects and rejects forwarding the shop or copying its HTML', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'blackbox-holding-'));
    const web = path.join(root, 'apps/web');
    const output = path.join(web, 'dist-holding');
    const html = `<link rel="canonical" href="https://blackboxrecordsathens.com/">
<meta property="og:url" content="https://blackboxrecordsathens.com/">
<meta name="robots" content="noindex, nofollow">
<h1>UNDER CONSTRUCTION.</h1><p>BLACKBOX RECORDS IS ACTIVE.</p>
<a href="https://www.instagram.com/blackboxrecordsath/">FOLLOW ON INSTAGRAM</a>
<a href="mailto:info@blackboxrecordsathens.com">EMAIL THE LABEL</a>
<nav aria-label="Legal"><a href="/privacy/">PRIVACY</a></nav>`;
    const run = (script: string) =>
      execFileSync(process.execPath, [path.join(web, 'scripts', script)], {
        encoding: 'utf8',
        windowsHide: true,
        stdio: 'pipe',
      });
    try {
      mkdirSync(path.join(web, 'scripts'), { recursive: true });
      mkdirSync(path.join(web, 'dist/prd-holding'), { recursive: true });
      mkdirSync(path.join(root, '.github/workflows'), { recursive: true });
      for (const script of ['prepare-prd-holding.ts', 'check-prd-holding.ts']) {
        cpSync(path.join(repoRoot, 'apps/web/scripts', script), path.join(web, 'scripts', script));
      }
      cpSync(
        path.join(repoRoot, '.github/workflows/prd-holding-page.yml'),
        path.join(root, '.github/workflows/prd-holding-page.yml'),
      );
      writeFileSync(path.join(web, 'dist/prd-holding/index.html'), html);
      for (const file of [
        'assets/fonts/brand/veneer.css',
        'assets/fonts/brand/veneer_regular.woff2',
        'assets/images/brand/share-card.jpg',
        'assets/images/brand/logo-240.webp',
        'favicon.svg',
        'favicon-96x96.png',
        'favicon.ico',
      ]) {
        const target = path.join(web, 'dist', file);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, 'fixture');
      }
      run('prepare-prd-holding.ts');
      expect(run('check-prd-holding.ts')).toContain('isolation checks passed');
      expect(readFileSync(path.join(output, 'index.html'), 'utf8')).toBe(html);
      const redirects = readFileSync(path.join(output, '_redirects'), 'utf8');
      expect(redirects.trim().split('\n')).toHaveLength(4);
      for (const line of redirects.trim().split('\n')) {
        const [from, to, status] = line.split(' ');
        expect(['/privacy', '/privacy/', '/terms', '/terms/']).toContain(from);
        expect(new URL(to!).pathname).toBe(`${from!.replace(/\/$/, '')}/`);
        expect(new URL(to!).origin).toBe('https://blackbox-records-web.pages.dev');
        expect(status).toBe('302');
      }
      for (const extra of [
        '/* https://blackbox-records-web.pages.dev/:splat 302\n',
        '/store/ https://blackbox-records-web.pages.dev/store/ 302\n',
      ]) {
        writeFileSync(path.join(output, '_redirects'), redirects + extra);
        expect(() => run('check-prd-holding.ts')).toThrow(/Holding redirects/);
      }
      writeFileSync(path.join(output, '_redirects'), redirects);
      // Only the redirected privacy link may be relative; a shop path is refused.
      const writeDocument = (document: string) => {
        for (const file of ['index.html', '404.html']) writeFileSync(path.join(output, file), document);
      };
      writeDocument(html.replace('</nav>', '<a href="/store/">STORE</a></nav>'));
      expect(() => run('check-prd-holding.ts')).toThrow(/Invalid PRD Holding Page action: \/store\//);
      writeDocument(html.replace('<a href="/privacy/">PRIVACY</a>', ''));
      expect(() => run('check-prd-holding.ts')).toThrow(/Missing required PRD Holding Page markup: href="\/privacy\/"/);
      writeDocument(html);
      mkdirSync(path.join(output, 'store'));
      writeFileSync(path.join(output, 'store/index.html'), 'shop');
      expect(() => run('check-prd-holding.ts')).toThrow(/Unexpected HTML/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);
});
