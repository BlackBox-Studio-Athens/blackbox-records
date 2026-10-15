import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
}

// Accent roles are fixed (openspec/changes/accent-and-button-system): Sea for pre-order, Flint for buying and labels,
// Slate for Listen and small marks. No surface declares a section tone that recolours the controls inside it.
describe('section tone declarations', () => {
  it.each([
    '../layouts/StoreCollectionPage.astro',
    './store/[slug]/index.astro',
    './store/checkout/index.astro',
    './store/checkout/return/index.astro',
    './store/[slug]/checkout/index.astro',
    './store/[slug]/checkout/return/index.astro',
    '../components/store/cart/StoreCartDrawer.tsx',
    '../components/store/checkout/WithdrawalForm.tsx',
    './services/index.astro',
  ])('%s declares no section tone', (path) => {
    expect(read(path)).not.toMatch(/data-tone=/);
  });

  it('keeps accent colours out of individual public buttons', () => {
    for (const path of ['./services/index.astro', '../components/services/ServicesInquiryForm.tsx']) {
      expect(read(path)).not.toMatch(/rgba\(199, ?137, ?151/);
    }
  });
});
