import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('../pages/sitemap.xml.ts', import.meta.url)), 'utf8');

describe('sitemap Store category coverage', () => {
  it('derives Store collection paths from the category registry without a standalone Distro URL', () => {
    expect(source).toContain("import { storeCatalogCategories } from '@/lib/store-categories';");
    expect(source).toContain('...storeCatalogCategories.map((category) => category.path)');
    expect(source).not.toContain("'/distro/'");
  });
});
