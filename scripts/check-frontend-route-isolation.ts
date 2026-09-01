import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type FrontendRouteIsolationMode = 'web' | 'staff';

const staffFiles = new Set([
  '_headers',
  'favicon-96x96.png',
  'favicon.ico',
  'favicon.svg',
  'index.html',
  'robots.txt',
  'stock/index.html',
]);

export function assertFrontendRouteIsolation(mode: FrontendRouteIsolationMode, distDir: string): void {
  const files = listFiles(distDir);

  if (mode === 'web') {
    const stockFiles = files.filter((file) => file === 'stock' || file.startsWith('stock/'));
    if (stockFiles.length > 0) {
      throw new Error(`Public web artifact contains stock files: ${stockFiles.join(', ')}`);
    }
    return;
  }

  const missing = [...staffFiles].filter((file) => !files.includes(file));
  const unexpected = files.filter((file) => !staffFiles.has(file) && !file.startsWith('_astro/'));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      [
        missing.length > 0 ? `missing: ${missing.join(', ')}` : '',
        unexpected.length > 0 ? `unexpected: ${unexpected.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  }
}

function listFiles(root: string, relativeDir = ''): string[] {
  const directory = path.join(root, relativeDir);
  if (!existsSync(directory)) {
    throw new Error(`Build output does not exist: ${root}`);
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(relativeDir.replaceAll('\\', '/'), entry.name);
    return entry.isDirectory() ? listFiles(root, relativePath) : relativePath;
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode !== 'web' && mode !== 'staff') {
    throw new Error('Usage: check-frontend-route-isolation.ts <web|staff>');
  }

  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const distDir = path.join(repoRoot, 'apps', mode === 'web' ? 'web' : 'staff', 'dist');
  assertFrontendRouteIsolation(mode, distDir);
}
