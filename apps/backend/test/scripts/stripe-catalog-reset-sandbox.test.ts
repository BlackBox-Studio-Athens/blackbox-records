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
    sourceId: 'disintegration',
    sourceKind: 'release',
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'disintegration-black-vinyl-lp',
    targetEnvironments: ['uat'],
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
    expect(parseStripeCatalogResetSandboxArgs(['--env', 'uat'])).toEqual({
      environment: 'uat',
      mode: 'dry-run',
    });
    expect(parseStripeCatalogResetSandboxArgs(['--env=uat', '--confirm'])).toEqual({
      environment: 'uat',
      mode: 'confirm',
    });
    expect(() => parseStripeCatalogResetSandboxArgs(['--env', 'prd', '--confirm'])).toThrow(
      'Stripe sandbox catalog reset is allowed only with --env uat.',
    );
  });

  it('plans only repo-owned sandbox Products and Prices', async () => {
    const stripe = createFakeStripeClient();

    await expect(
      createResetPlan('uat', stripe as unknown as Parameters<typeof createResetPlan>[1], [contract]),
    ).resolves.toEqual({
      pricesToDeactivate: [
        'price_blackboxOwned1111',
        'price_legacyMetadata5555',
        'price_legacyOwned4444',
        'price_lookupOwned2222',
      ],
      productsToDeactivate: [
        'prod_blackboxOwned1111',
        'prod_legacyMetadata6666',
        'prod_legacyOwned4444',
        'prod_lookupOwned2222',
      ],
    });
  });

  it('keeps dry-run mutation-free and confirm deactivates planned objects', async () => {
    const stripe = createFakeStripeClient();

    const dryRunPlan = await resetStripeSandboxCatalog(
      { environment: 'uat', mode: 'dry-run' },
      stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
      [contract],
    );
    expect(dryRunPlan.pricesToDeactivate).toHaveLength(4);
    expect(stripe.prices.update).not.toHaveBeenCalled();
    expect(stripe.products.update).not.toHaveBeenCalled();

    await resetStripeSandboxCatalog(
      { environment: 'uat', mode: 'confirm' },
      stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
      [contract],
    );

    expect(stripe.prices.update).toHaveBeenCalledWith(
      'price_blackboxOwned1111',
      { active: false },
      {
        idempotencyKey: expect.stringMatching(
          /^blackbox:catalog:uat:catalog-reset:reset_price:price:shape_v[a-f0-9]{32}$/,
        ),
      },
    );
    expect(stripe.products.update).toHaveBeenCalledWith(
      'prod_blackboxOwned1111',
      { active: false },
      {
        idempotencyKey: expect.stringMatching(
          /^blackbox:catalog:uat:catalog-reset:reset_product:product:shape_v[a-f0-9]{32}$/,
        ),
      },
    );
  });

  it('redacts provider IDs in reports', () => {
    const report = formatStripeCatalogResetSandboxReport(
      {
        pricesToDeactivate: ['price_blackboxOwned1111'],
        productsToDeactivate: ['prod_blackboxOwned1111'],
      },
      { environment: 'uat', mode: 'dry-run' },
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
              appEnv: 'uat',
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
          {
            active: true,
            id: 'price_legacyMetadata5555',
            lookup_key: null,
            metadata: {
              appEnv: 'sandbox',
              sourceId: 'afterglow-tape',
              sourceKind: 'distro',
              storeItemSlug: 'afterglow-tape',
              variantId: 'variant_afterglow-tape_standard',
            },
            product: {
              deleted: false,
              id: 'prod_legacyMetadata5555',
              metadata: {},
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
          {
            active: true,
            id: 'prod_legacyMetadata6666',
            metadata: {
              appEnv: 'sandbox',
              sourceId: 'primal-ephemeral',
              sourceKind: 'distro',
              storeItemSlug: 'primal-ephemeral',
              variantId: 'variant_primal-ephemeral_standard',
            },
            name: 'Legacy Metadata Product',
          },
        ],
      })),
      update: vi.fn(async () => ({})),
    },
  } as const;
}
