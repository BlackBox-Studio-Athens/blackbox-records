import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
}

// Section tone is declared once per surface, inside the shell-swapped main content (attributes on <main>
// itself do not survive shell navigation); outlined buttons inside inherit it from global.css.
describe('section tone declarations', () => {
  it.each([
    '../layouts/StoreCollectionPage.astro',
    './store/[slug]/index.astro',
    './store/checkout/index.astro',
    './store/checkout/return/index.astro',
    './store/[slug]/checkout/index.astro',
    './store/[slug]/checkout/return/index.astro',
    '../components/store/cart/StoreCartDrawer.tsx',
  ])('%s declares the store tone once', (path) => {
    expect(read(path).match(/data-tone="store"/g)).toHaveLength(1);
  });

  it('declares the services tone once on the services page', () => {
    expect(read('./services/index.astro').match(/data-tone="services"/g)).toHaveLength(1);
  });

  it('keeps accent colours out of individual public buttons', () => {
    for (const path of ['./services/index.astro', '../components/services/ServicesInquiryForm.tsx']) {
      expect(read(path)).not.toMatch(/rgba\(199, ?137, ?151/);
    }
  });
});
