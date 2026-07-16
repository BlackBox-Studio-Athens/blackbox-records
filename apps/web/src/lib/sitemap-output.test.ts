import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('../pages/sitemap.xml.ts', import.meta.url)), 'utf8');

describe('sitemap Store category coverage', () => {
  it('derives discoverable Store collection paths without a standalone Distro URL', () => {
    expect(source).toContain('getDiscoverableStoreCatalogCategories');
    expect(source).toContain('...storeCategories.map((category) => category.path)');
    expect(source).toContain('...storeEntries.flatMap((entry) => entry.categoryIds)');
    expect(source).not.toContain("'/distro/'");
  });
});
