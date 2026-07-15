import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const authorityRoots = [
  'apps/backend/prisma/schema.prisma',
  'apps/backend/prisma/migrations',
  'apps/backend/src',
  'apps/web/src/lib/catalog-data.ts',
  'apps/web/src/lib/store-cart.ts',
  'apps/web/src/lib/store-item-ownership.ts',
  'apps/web/src/pages/store',
  'packages/api-client/src',
  'scripts/generate-stripe-uat-catalog-artifacts.ts',
];
const sourceExtensions = new Set(['.prisma', '.sql', '.ts', '.tsx']);

function sourceFiles(absoluteRoot: string): string[] {
  if (statSync(absoluteRoot).isFile()) {
    return sourceExtensions.has(absoluteRoot.slice(absoluteRoot.lastIndexOf('.'))) ? [absoluteRoot] : [];
  }
  const entries = readdirSync(absoluteRoot, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = resolve(absoluteRoot, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [path] : [];
  });
}

describe('Store category presentation boundary', () => {
  it('does not make Store Category or merch a commerce authority', () => {
    const source = authorityRoots
      .flatMap((root) => sourceFiles(resolve(projectRoot, root)))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/\b(?:storeCategory|store_category|store-category)\b/);
    expect(source).not.toMatch(/\bsourceKind\s*[:=]\s*['"]merch['"]/);
    expect(source).not.toMatch(/\bStoreItemSourceKind\b[^\n;]*['"]merch['"]/);
  });
});
