import { describe, expect, it, vi } from 'vitest';

import { createStripeCatalogMutationContext } from '../../../src/application/commerce/catalog-sync';
import { StripeCatalogGatewayClient } from '../../../src/infrastructure/stripe/stripe-catalog-gateway';

describe('StripeCatalogGatewayClient', () => {
  it('resumes an interrupted bootstrap without creating another Product or Price', async () => {
    const metadata = {
      appEnv: 'uat' as const,
      sourceKind: 'distro' as const,
      sourceId: 'record',
      storeItemSlug: 'record',
      variantId: 'variant_record_standard',
    };
    const product = {
      id: 'prod_blackbox_uat_variant_record_standard',
      active: true,
      metadata,
      default_price: null,
    };
    const price = {
      id: 'price_existing',
      product,
      active: true,
      unit_amount: 2800,
      currency: 'eur',
      tax_behavior: 'inclusive',
      metadata,
      lookup_key: 'blackbox:uat:record:variant_record_standard',
    };
    const create = vi.fn();
    const update = vi.fn();
    const gateway = new StripeCatalogGatewayClient({
      products: { list: () => [product], create, update },
      prices: { list: async () => ({ data: [price], has_more: false }), create },
    } as never);
    await expect(
      gateway.createCatalogPrice({
        kind: 'fixed',
        amountMinor: 2800,
        currencyCode: 'EUR',
        lookupKey: price.lookup_key,
        metadata,
        productName: 'Record',
      }),
    ).resolves.toMatchObject({ priceId: 'price_existing', productId: product.id });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(product.id, { default_price: price.id }, undefined);
  });

  it('retrieves only the bound Product default Price and rejects unsupported defaults', async () => {
    const product = {
      id: 'prod_bound',
      active: true,
      livemode: false,
      metadata: { appEnv: 'uat' },
      default_price: {
        id: 'price_default',
        product: 'prod_bound',
        active: true,
        type: 'one_time',
        livemode: false,
        unit_amount: 2800,
        currency: 'eur',
        metadata: {},
        lookup_key: null,
        tax_behavior: 'inclusive',
        custom_unit_amount: null,
      },
    };
    const retrieve = vi.fn(async () => product);
    const gateway = new StripeCatalogGatewayClient({ products: { retrieve } } as never);
    await expect(gateway.retrieveDefaultPrice('prod_bound')).resolves.toMatchObject({
      priceId: 'price_default',
      productId: 'prod_bound',
      amountMinor: 2800,
    });
    expect(retrieve).toHaveBeenCalledWith('prod_bound', { expand: ['default_price'] });
    product.default_price.product = 'prod_foreign';
    await expect(gateway.retrieveDefaultPrice('prod_bound')).resolves.toBeNull();
    product.default_price.product = 'prod_bound';
    product.default_price.type = 'recurring';
    await expect(gateway.retrieveDefaultPrice('prod_bound')).resolves.toBeNull();
  });

  it.each(['fixed', 'pay_what_you_want'] as const)(
    'creates an inclusive %s Price against the resolved Product',
    async (kind) => {
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
          list: vi.fn(() => []),
          update: vi.fn(),
        },
      } as never);

      const result = await gateway.createCatalogPrice(
        {
          ...(kind === 'fixed'
            ? { kind, amountMinor: 2800 }
            : { kind, minimumAmountMinor: 1000, presetAmountMinor: 2800, maximumAmountMinor: 5000 }),
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
          tax_behavior: 'inclusive',
          transfer_lookup_key: true,
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringContaining(':price'),
        }),
      );
      expect(priceCreateCalls[0]?.[0]).not.toHaveProperty('product_data');
      expect(priceCreateCalls[0]?.[0]).toMatchObject(
        kind === 'fixed'
          ? { unit_amount: 2800 }
          : {
              custom_unit_amount: { enabled: true, minimum: 1000, preset: 2800, maximum: 5000 },
            },
      );
      expect(result).toMatchObject({
        idempotentReplayed: true,
        priceId: 'price_1234567890abcdef',
        productId: 'prod_1234567890abcdef',
        requestId: 'req_catalog_create',
      });
    },
  );

  it('creates pay-what-you-want Prices with Stripe custom unit amount fields', async () => {
    const metadata = {
      appEnv: 'uat' as const,
      sourceId: 'random-tapes',
      sourceKind: 'distro' as const,
      storeItemSlug: 'random-tapes',
      variantId: 'variant_random-tapes_standard',
    };
    const product = {
      active: true,
      id: 'prod_pay_what_you_want',
      metadata,
      name: 'BlackBox Records - Random Tapes - Tape',
    };
    const productsCreate = vi.fn(async () => product);
    const pricesCreate = vi.fn(async () => ({
      active: true,
      currency: 'eur',
      custom_unit_amount: {
        enabled: true,
        maximum: 10000,
        minimum: 100,
        preset: 500,
      },
      id: 'price_pay_what_you_want',
      lookup_key: 'blackbox:uat:random-tapes:variant_random-tapes_standard',
      metadata: product.metadata,
      product,
      unit_amount: null,
    }));
    const gateway = new StripeCatalogGatewayClient({
      prices: {
        create: pricesCreate,
        list: vi.fn(async () => ({
          data: [],
          has_more: false,
        })),
        update: vi.fn(),
      },
      products: {
        create: productsCreate,
        list: vi.fn(() => []),
        update: vi.fn(),
      },
    } as never);

    const result = await gateway.createCatalogPrice({
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      lookupKey: 'blackbox:uat:random-tapes:variant_random-tapes_standard',
      maximumAmountMinor: 10000,
      metadata,
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      productName: 'BlackBox Records - Random Tapes - Tape',
    });

    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_unit_amount: {
          enabled: true,
          maximum: 10000,
          minimum: 100,
          preset: 500,
        },
        product: 'prod_pay_what_you_want',
      }),
      undefined,
    );
    const priceCreateCalls = pricesCreate.mock.calls as unknown as Array<[Record<string, unknown>, unknown]>;
    expect(priceCreateCalls[0]?.[0]).not.toHaveProperty('unit_amount');
    expect(result).toMatchObject({
      amountMinor: null,
      customUnitAmount: {
        maximumAmountMinor: 10000,
        minimumAmountMinor: 100,
        presetAmountMinor: 500,
      },
      priceKind: 'pay_what_you_want',
      priceId: 'price_pay_what_you_want',
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
