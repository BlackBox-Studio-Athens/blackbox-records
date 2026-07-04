import { describe, expect, it, vi } from 'vitest';

import { createStripeCatalogMutationContext } from '../../../src/application/commerce/catalog-sync';
import { StripeCatalogGatewayClient } from '../../../src/infrastructure/stripe/stripe-catalog-gateway';

describe('StripeCatalogGatewayClient', () => {
  it('discovers active owned objects with partial catalog metadata', async () => {
    const gateway = new StripeCatalogGatewayClient({
      prices: {
        list: vi.fn(async () => ({
          data: [
            {
              active: true,
              currency: 'eur',
              id: 'price_partial_metadata_12345678',
              lookup_key: null,
              metadata: {
                appEnv: 'uat',
              },
              product: 'prod_partial_metadata_12345678',
              unit_amount: 2800,
            },
            {
              active: true,
              currency: 'eur',
              id: 'price_unowned_12345678',
              lookup_key: null,
              metadata: {},
              product: 'prod_unowned_12345678',
              unit_amount: 2800,
            },
          ],
          has_more: false,
        })),
      },
      products: {
        list: vi.fn(async () => ({
          data: [
            {
              active: true,
              id: 'prod_partial_metadata_12345678',
              metadata: {
                appEnv: 'uat',
              },
              name: 'Partial Product',
            },
            {
              active: true,
              id: 'prod_unowned_12345678',
              metadata: {},
              name: 'Unowned Product',
            },
          ],
          has_more: false,
        })),
      },
    } as never);

    await expect(gateway.listOwnedPrices('uat')).resolves.toEqual([
      expect.objectContaining({
        priceId: 'price_partial_metadata_12345678',
      }),
    ]);
    await expect(gateway.listOwnedProducts('uat')).resolves.toEqual([
      expect.objectContaining({
        productId: 'prod_partial_metadata_12345678',
      }),
    ]);
  });

  it('creates a Price against the resolved Product without combined-create shortcuts', async () => {
    const metadata = {
      appEnv: 'uat' as const,
      sourceId: 'disintegration',
      sourceKind: 'release' as const,
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    };
    const product = {
      active: true,
      description: 'Disintegration by Afterwise.',
      id: 'prod_1234567890abcdef',
      images: [],
      metadata,
      name: 'BlackBox Records - Disintegration - Black Vinyl LP',
      tax_code: null,
    };
    const productsCreate = vi.fn(async () => product);
    const pricesCreate = vi.fn(async () => ({
      active: true,
      currency: 'eur',
      id: 'price_1234567890abcdef',
      lastResponse: {
        headers: {
          'idempotent-replayed': 'true',
        },
        requestId: 'req_catalog_create',
      },
      lookup_key: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
      metadata: product.metadata,
      product,
      unit_amount: 2800,
    }));
    const pricesList = vi.fn(async () => ({
      data: [],
      has_more: false,
    }));
    const gateway = new StripeCatalogGatewayClient({
      prices: {
        create: pricesCreate,
        list: pricesList,
        update: vi.fn(),
      },
      products: {
        create: productsCreate,
        list: vi.fn(),
        update: vi.fn(),
      },
    } as never);

    const result = await gateway.createCatalogPrice(
      {
        amountMinor: 2800,
        currencyCode: 'EUR',
        lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
        metadata,
        productName: 'BlackBox Records - Disintegration - Black Vinyl LP',
        productProjection: {
          description: 'Disintegration by Afterwise.',
          imageUrls: [],
          metadata: {},
          name: 'BlackBox Records - Disintegration - Black Vinyl LP',
          taxCode: null,
        },
      },
      createStripeCatalogMutationContext({
        action: 'create_catalog_price',
        environment: 'uat',
        identity: 'revision_disintegration-black-vinyl-lp-2800-eur',
        requestShape: {
          amountMinor: 2800,
          currencyCode: 'EUR',
        },
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    );

    const productCreateCalls = productsCreate.mock.calls as unknown as Array<[Record<string, unknown>]>;
    const priceCreateCalls = pricesCreate.mock.calls as unknown as Array<
      [Record<string, unknown>, Record<string, unknown>]
    >;

    expect(productCreateCalls[0]?.[0]).not.toHaveProperty('default_price_data');
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_1234567890abcdef',
        transfer_lookup_key: true,
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining(':price'),
      }),
    );
    expect(priceCreateCalls[0]?.[0]).not.toHaveProperty('product_data');
    expect(result).toMatchObject({
      idempotentReplayed: true,
      priceId: 'price_1234567890abcdef',
      productId: 'prod_1234567890abcdef',
      requestId: 'req_catalog_create',
    });
  });

  it('returns Product update request evidence when Stripe exposes it', async () => {
    const productsUpdate = vi.fn(async () => ({
      active: true,
      id: 'prod_1234567890abcdef',
      lastResponse: {
        headers: {
          'idempotent-replayed': 'true',
        },
        requestId: 'req_product_projection_update',
      },
      metadata: {
        appEnv: 'uat',
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      name: 'BlackBox Records - Disintegration - Black Vinyl LP',
    }));
    const gateway = new StripeCatalogGatewayClient({
      products: {
        update: productsUpdate,
      },
    } as never);

    const result = await gateway.updateProductProjection(
      'prod_1234567890abcdef',
      {
        projection: {
          description: 'Disintegration by Afterwise.',
          imageUrls: [],
          metadata: {},
          name: 'BlackBox Records - Disintegration - Black Vinyl LP',
          taxCode: null,
        },
        stripeMetadata: {
          appEnv: 'uat',
          sourceId: 'disintegration',
          sourceKind: 'release',
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        },
      },
      createStripeCatalogMutationContext({
        action: 'update_product_projection',
        environment: 'uat',
        identity: 'prod_1234567890abcdef',
        requestShape: {
          description: 'Disintegration by Afterwise.',
        },
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      }),
    );

    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_1234567890abcdef',
      expect.objectContaining({
        name: 'BlackBox Records - Disintegration - Black Vinyl LP',
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('update_product_projection'),
      }),
    );
    expect(result).toMatchObject({
      idempotentReplayed: true,
      productId: 'prod_1234567890abcdef',
      requestId: 'req_product_projection_update',
    });
  });
});
