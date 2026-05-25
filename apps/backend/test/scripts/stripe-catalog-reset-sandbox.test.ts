import { describe, expect, it, vi } from 'vitest';

import {
  createResetPlan,
  formatStripeCatalogResetSandboxReport,
  parseStripeCatalogResetSandboxArgs,
  resetStripeSandboxCatalog,
} from '../../scripts/stripe-catalog-reset-sandbox';
import type { StripeCatalogStoreItemContract } from '../../../../scripts/stripe-catalog-contract';

const contract: StripeCatalogStoreItemContract = {
  alignmentStatus: 'checkout_eligible',
  desiredCatalogEntry: {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'disintegration-black-vinyl-lp-2800-eur',
    },
    productProjection: {
      description: 'Projected product.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/product.jpg'],
      metadata: {
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      name: 'BlackBox Records - Disintegration - Black Vinyl LP',
      taxCode: null,
    },
    smokeCandidate: false,
    sourceId: 'disintegration',
    sourceKind: 'release',
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'disintegration-black-vinyl-lp',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  },
  expectedSandboxPrice: {
    amountMinor: 2800,
    currencyCode: 'EUR',
  },
  productProjection: {
    description: 'Projected product.',
    imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/product.jpg'],
    metadata: {
      sourceId: 'disintegration',
      sourceKind: 'release',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    },
    name: 'BlackBox Records - Disintegration - Black Vinyl LP',
    taxCode: null,
  },
  sourceId: 'disintegration',
  sourceKind: 'release',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('stripe sandbox catalog reset', () => {
  it('defaults to sandbox dry-run and rejects production resets', () => {
    expect(parseStripeCatalogResetSandboxArgs(['--env', 'sandbox'])).toEqual({
      environment: 'sandbox',
      mode: 'dry-run',
    });
    expect(parseStripeCatalogResetSandboxArgs(['--env=sandbox', '--confirm'])).toEqual({
      environment: 'sandbox',
      mode: 'confirm',
    });
    expect(() => parseStripeCatalogResetSandboxArgs(['--env', 'production', '--confirm'])).toThrow(
      'Stripe sandbox catalog reset is allowed only with --env sandbox.',
    );
  });

  it('plans only repo-owned sandbox Products and Prices', async () => {
    const stripe = createFakeStripeClient();

    await expect(
      createResetPlan('sandbox', stripe as unknown as Parameters<typeof createResetPlan>[1], [contract]),
    ).resolves.toEqual({
      pricesToDeactivate: ['price_blackboxOwned1111', 'price_legacyOwned4444', 'price_lookupOwned2222'],
      productsToDeactivate: ['prod_blackboxOwned1111', 'prod_legacyOwned4444', 'prod_lookupOwned2222'],
    });
  });

  it('keeps dry-run mutation-free and confirm deactivates planned objects', async () => {
    const stripe = createFakeStripeClient();

    const dryRunPlan = await resetStripeSandboxCatalog(
      { environment: 'sandbox', mode: 'dry-run' },
      stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
      [contract],
    );
    expect(dryRunPlan.pricesToDeactivate).toHaveLength(3);
    expect(stripe.prices.update).not.toHaveBeenCalled();
    expect(stripe.products.update).not.toHaveBeenCalled();

    await resetStripeSandboxCatalog(
      { environment: 'sandbox', mode: 'confirm' },
      stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
      [contract],
    );

    expect(stripe.prices.update).toHaveBeenCalledWith(
      'price_blackboxOwned1111',
      { active: false },
      { idempotencyKey: 'blackbox-sandbox-catalog-reset-price-price_blackboxOwned1111' },
    );
    expect(stripe.products.update).toHaveBeenCalledWith(
      'prod_blackboxOwned1111',
      { active: false },
      { idempotencyKey: 'blackbox-sandbox-catalog-reset-product-prod_blackboxOwned1111' },
    );
  });

  it('redacts provider IDs in reports', () => {
    const report = formatStripeCatalogResetSandboxReport(
      {
        pricesToDeactivate: ['price_blackboxOwned1111'],
        productsToDeactivate: ['prod_blackboxOwned1111'],
      },
      { environment: 'sandbox', mode: 'dry-run' },
    );

    expect(report).toContain('price_...1111');
    expect(report).toContain('prod_...1111');
    expect(report).not.toContain('price_blackboxOwned1111');
    expect(report).not.toContain('prod_blackboxOwned1111');
  });
});

function createFakeStripeClient() {
  return {
    prices: {
      list: vi.fn(async () => ({
        data: [
          {
            active: true,
            id: 'price_blackboxOwned1111',
            lookup_key: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
            metadata: {},
            product: {
              deleted: false,
              id: 'prod_blackboxOwned1111',
              metadata: {},
            },
          },
          {
            active: true,
            id: 'price_lookupOwned2222',
            lookup_key: null,
            metadata: {
              appEnv: 'sandbox',
              sourceId: 'disintegration',
              sourceKind: 'release',
              storeItemSlug: 'disintegration-black-vinyl-lp',
              variantId: 'variant_disintegration-black-vinyl-lp_standard',
            },
            product: {
              deleted: false,
              id: 'prod_lookupOwned2222',
              metadata: {},
            },
          },
          {
            active: true,
            id: 'price_unrelated3333',
            lookup_key: null,
            metadata: {},
            product: {
              deleted: false,
              id: 'prod_unrelated3333',
              metadata: {},
            },
          },
          {
            active: true,
            id: 'price_legacyOwned4444',
            lookup_key: null,
            metadata: {},
            product: {
              deleted: false,
              id: 'prod_legacyOwned4444',
              metadata: {},
              name: 'BlackBox UAT - Disintegration',
            },
          },
        ],
      })),
      update: vi.fn(async () => ({})),
    },
    products: {
      list: vi.fn(async () => ({
        data: [
          {
            active: true,
            id: 'prod_blackboxOwned1111',
            metadata: {},
            name: 'BlackBox Records - Disintegration - Black Vinyl LP',
          },
          {
            active: true,
            id: 'prod_lookupOwned2222',
            metadata: {},
            name: 'BlackBox Records - Disintegration - Black Vinyl LP',
          },
          {
            active: true,
            id: 'prod_legacyOwned4444',
            metadata: {},
            name: 'BlackBox UAT - Disintegration',
          },
          {
            active: true,
            id: 'prod_unrelated3333',
            metadata: {},
            name: 'Unrelated Product',
          },
        ],
      })),
      update: vi.fn(async () => ({})),
    },
  } as const;
}
