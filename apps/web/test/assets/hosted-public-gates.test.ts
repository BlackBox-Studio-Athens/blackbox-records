import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const artifactRoot = resolve(workspaceRoot, '.codex-artifacts/performance-resume');
const temporaryRoots: string[] = [];
function fixture() {
  mkdirSync(artifactRoot, { recursive: true });
  const root = mkdtempSync(join(artifactRoot, 'gate-test-'));
  temporaryRoots.push(root);
  const documents = join(root, 'documents');
  const assets = join(root, 'client');
  function write(relativePath: string, bytes: string) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
  }
  write('client/_astro/AppShellRoot.fixture.js', 'export const shell = true;');
  const html = '<html><script type="module" src="/_astro/AppShellRoot.fixture.js"></script></html>';
  for (const route of [
    'index.html',
    'artists/index.html',
    'services/index.html',
    'store/index.html',
    'store/distro/index.html',
    'news/index.html',
    'releases/index.html',
    'artists/band/index.html',
    'news/story/index.html',
    'releases/album/index.html',
  ])
    write(`documents/${route}`, html);
  write('documents/store/single/index.html', html.replace('<html>', '<html><main class="store-item-page">'));
  write(
    'documents/store/gallery/index.html',
    html.replace('<html>', '<html><main class="store-item-page" data-store-image-gallery>'),
  );
  return { root, documents, assets, write };
}
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    expect(root.startsWith(`${artifactRoot}${sep}gate-test-`)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  }
});
function check(f: ReturnType<typeof fixture>, documents = f.documents) {
  return spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      'scripts/check-runtime-bundle-graphs.ts',
      `--documents=${documents}`,
      `--dist=${f.assets}`,
      `--output=${f.root}/bundles.json`,
    ],
    { cwd: workspaceRoot, encoding: 'utf8', windowsHide: true, timeout: 30000 },
  );
}

describe('hosted document bundle gate', { timeout: 60000 }, () => {
  it('uses separate client assets and checks category, details and both item variants with the public budgets', () => {
    const f = fixture();
    const result = check(f);
    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(readFileSync(join(f.root, 'bundles.json'), 'utf8'));
    expect(report.eagerGraphBudgetBytes).toBe(104448);
    expect(report.documentsRoot).toBe(f.documents);
    expect(report.distRoot).toBe(f.assets);
    expect(Object.keys(report.routes)).toEqual(
      expect.arrayContaining([
        'home',
        'services',
        'storeCategory',
        'news/story',
        'artists/band',
        'releases/album',
        'storeItem',
        'storeGalleryItem',
      ]),
    );
    expect(report.routes.storeGalleryItem.graph.fileCount).toBe(1);
  });
  it('fails closed when documents, gallery coverage or a referenced asset are missing', () => {
    const f = fixture();
    expect(check(f, join(f.root, 'absent')).status).not.toBe(0);
    rmSync(join(f.documents, 'store/gallery/index.html'));
    expect(check(f).stderr).toContain('gallery-route budget coverage is incomplete');
    rmSync(join(f.assets, '_astro/AppShellRoot.fixture.js'));
    expect(check(f).status).not.toBe(0);
  });
  it('rejects execution-order wrappers in lazy client islands', () => {
    const f = fixture();
    f.write('client/_astro/dormant-island.js', 'var __esm = (fn) => fn;');
    expect(check(f).stderr).toContain('SSR execution-order wrapper');
  });
  it('rejects item eager bytes above the public budget', () => {
    const f = fixture();
    f.write('client/_astro/item.js', `export const data="${randomBytes(180000).toString('base64')}";`);
    f.write(
      'documents/store/gallery/index.html',
      '<html><main class="store-item-page" data-store-image-gallery></main>' +
        '<script type="module" src="/_astro/item.js"></script></html>',
    );
    const result = check(f);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('storeGalleryItem eager graph');
    expect(result.stderr).toContain('budget 104448');
  });
});
