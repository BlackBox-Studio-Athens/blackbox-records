import Stripe from 'stripe';
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
      kind: 'fixed',
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
    kind: 'fixed',
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
      pricesToReset: [
        'price_blackboxOwned1111',
        'price_legacyMetadata5555',
        'price_legacyOwned4444',
        'price_lookupOwned2222',
      ],
      productsToDeactivate: [
        'prod_blackboxOwned1111',
        'prod_legacyMetadata5555',
        'prod_legacyMetadata6666',
        'prod_legacyOwned4444',
        'prod_lookupOwned2222',
      ],
    });
    expect(stripe.prices.list).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
  });

  it('plans repo-owned objects across every Stripe list page', async () => {
    const firstPrice = {
      active: true,
      id: 'price_pageOne1111',
      lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
      metadata: {},
      product: 'prod_pageOne1111',
    };
    const secondPrice = {
      ...firstPrice,
      id: 'price_pageTwo2222',
      product: 'prod_pageTwo2222',
    };
    const stripe = {
      prices: {
        list: vi.fn(async (params: { starting_after?: string }) =>
          params.starting_after ? { data: [secondPrice], has_more: false } : { data: [firstPrice], has_more: true },
        ),
        update: vi.fn(),
      },
      products: {
        list: vi.fn(async (params: { starting_after?: string }) =>
          params.starting_after
            ? { data: [{ active: true, id: 'prod_pageTwo2222', metadata: {} }], has_more: false }
            : { data: [{ active: true, id: 'prod_pageOne1111', metadata: {} }], has_more: true },
        ),
        update: vi.fn(),
      },
    };

    await expect(
      createResetPlan('uat', stripe as unknown as Parameters<typeof createResetPlan>[1], [contract]),
    ).resolves.toEqual({
      pricesToReset: ['price_pageOne1111', 'price_pageTwo2222'],
      productsToDeactivate: ['prod_pageOne1111', 'prod_pageTwo2222'],
    });
    expect(stripe.prices.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ starting_after: 'price_pageOne1111' }),
    );
    expect(stripe.products.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ starting_after: 'prod_pageOne1111' }),
    );
  });

  it('plans an inactive renamed repo-owned Price behind an inactive Product', async () => {
    const orphanMetadata = {
      appEnv: 'uat',
      sourceId: 'chronoboros',
      sourceKind: 'release',
      storeItemSlug: 'chronoboros-caregivers-vinyl',
      variantId: 'variant_chronoboros-caregivers-vinyl_standard',
    };
    const stripe = {
      prices: {
        list: vi.fn(async (params: { active?: boolean }) => ({
          data:
            params.active === false
              ? [
                  {
                    active: false,
                    id: 'price_orphan1111',
                    lookup_key:
                      'blackbox:uat:chronoboros-caregivers-vinyl:variant_chronoboros-caregivers-vinyl_standard',
                    metadata: orphanMetadata,
                    product: {
                      active: false,
                      deleted: false,
                      id: 'prod_orphan1111',
                      metadata: orphanMetadata,
                    },
                  },
                ]
              : [],
          has_more: false,
        })),
        update: vi.fn(),
      },
      products: {
        list: vi.fn(async (_params: { active?: boolean }) => ({
          data: [
            {
              active: false,
              default_price: 'price_orphan1111',
              id: 'prod_orphan1111',
              metadata: orphanMetadata,
            },
          ],
          has_more: false,
        })),
        update: vi.fn(),
      },
    };

    await expect(
      createResetPlan('uat', stripe as unknown as Parameters<typeof createResetPlan>[1], [contract]),
    ).resolves.toEqual({
      pricesToReset: ['price_orphan1111'],
      productsToDeactivate: ['prod_orphan1111'],
    });
    expect(stripe.prices.list).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    expect(stripe.products.list.mock.calls[0]?.[0]).not.toHaveProperty('active');
  });

  it('keeps dry-run mutation-free and confirm resets planned objects', async () => {
    const stripe = createFakeStripeClient();

    const dryRunPlan = await resetStripeSandboxCatalog(
      { environment: 'uat', mode: 'dry-run' },
      stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
      [contract],
    );
    expect(dryRunPlan.pricesToReset).toHaveLength(4);
    expect(stripe.prices.update).not.toHaveBeenCalled();
    expect(stripe.products.update).not.toHaveBeenCalled();

    await resetStripeSandboxCatalog(
      { environment: 'uat', mode: 'confirm' },
      stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
      [contract],
    );

    expect(stripe.prices.update).toHaveBeenCalledWith(
      'price_blackboxOwned1111',
      {
        lookup_key: 'blackbox-reset:uat:price_blackboxOwned1111',
        metadata: '',
      },
      {
        idempotencyKey: expect.stringMatching(
          /^blackbox:catalog:uat:catalog-reset:detach_default_price:price:shape_v[a-f0-9]{32}$/,
        ),
      },
    );
    expect(stripe.prices.update).toHaveBeenCalledWith(
      'price_lookupOwned2222',
      {
        active: false,
        lookup_key: 'blackbox-reset:uat:price_lookupOwned2222',
        metadata: '',
      },
      {
        idempotencyKey: expect.stringMatching(
          /^blackbox:catalog:uat:catalog-reset:reset_price:price:shape_v[a-f0-9]{32}$/,
        ),
      },
    );
    expect(stripe.products.update.mock.invocationCallOrder[0]).toBeLessThan(
      stripe.prices.update.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(stripe.products.update).toHaveBeenCalledWith(
      'prod_blackboxOwned1111',
      { active: false, metadata: '' },
      {
        idempotencyKey: expect.stringMatching(
          /^blackbox:catalog:uat:catalog-reset:reset_product:product:shape_v[a-f0-9]{32}$/,
        ),
      },
    );
  });

  it('fails closed when Price archival fails for another reason', async () => {
    const stripe = createFakeStripeClient();
    stripe.prices.update.mockImplementation(async (priceId, params) => {
      if (priceId === 'price_lookupOwned2222' && params.active === false) {
        throw new Error('Stripe request failed.');
      }

      return {};
    });

    await expect(
      resetStripeSandboxCatalog(
        { environment: 'uat', mode: 'confirm' },
        stripe as unknown as Parameters<typeof resetStripeSandboxCatalog>[1],
        [contract],
      ),
    ).rejects.toThrow('Stripe request failed.');
    expect(stripe.prices.update).not.toHaveBeenCalledWith(
      'price_lookupOwned2222',
      {
        lookup_key: 'blackbox-reset:uat:price_lookupOwned2222',
        metadata: '',
      },
      expect.anything(),
    );
  });

  it('serializes metadata clear-all values onto Stripe requests', async () => {
    const requestBodies: string[] = [];
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      requestBodies.push(String(init?.body ?? ''));

      return new Response(JSON.stringify({ id: 'stripe_test_object', object: 'product' }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    });
    const stripe = new Stripe('sk_test_catalog_reset', {
      httpClient: Stripe.createFetchHttpClient(fetchMock as typeof fetch),
      maxNetworkRetries: 0,
    });

    await stripe.products.update('prod_test', { active: false, metadata: '' });
    await stripe.prices.update('price_test', {
      lookup_key: 'blackbox-reset:uat:price_test',
      metadata: '',
    });

    expect(requestBodies).toHaveLength(2);
    for (const requestBody of requestBodies) {
      const formData = new URLSearchParams(requestBody);
      expect(formData.has('metadata')).toBe(true);
      expect(formData.get('metadata')).toBe('');
    }
  });

  it('redacts provider IDs in reports', () => {
    const report = formatStripeCatalogResetSandboxReport(
      {
        pricesToReset: ['price_blackboxOwned1111'],
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
      update: vi.fn(async (id: string, params: Stripe.PriceUpdateParams, _options?: Stripe.RequestOptions) => {
        if (id === 'price_blackboxOwned1111' && params.active === false) {
          throw new Error('This price cannot be archived because it is the default price of its product.');
        }

        return {};
      }),
    },
    products: {
      list: vi.fn(async () => ({
        data: [
          {
            active: true,
            default_price: 'price_blackboxOwned1111',
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
      update: vi.fn(async (_id: string, _params: Stripe.ProductUpdateParams, _options?: Stripe.RequestOptions) => ({})),
    },
  } as const;
}
