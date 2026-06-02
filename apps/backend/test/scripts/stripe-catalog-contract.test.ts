import { describe, expect, it } from 'vitest';

import { currentCatalogProductProjectionEntries } from '../../src/application/commerce/catalog-sync';
import {
  assertValidStripeCatalogStoreItemContract,
  createExpectedSandboxPrice,
  isStableAbsoluteStripeImageUrl,
  loadStripeCatalogStoreItemContracts,
  STRIPE_PHYSICAL_GOODS_TAX_CODE,
  type StripeCatalogStoreItemContract,
} from '../../../../scripts/stripe-catalog-contract';
import {
  createDesiredCatalogStateSource,
  createProductionCommerceReadinessSql,
  createSandboxUatCatalogStock,
  createSandboxUatCommerceSql,
} from '../../../../scripts/generate-stripe-uat-catalog-artifacts';

describe('stripe catalog contract projection', () => {
  it('derives Product Projection contracts for all current Store Items without Astro runtime imports', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({
      productEnvironment: 'prd',
    });
    const contractsBySlug = new Map(contracts.map((contract) => [contract.storeItemSlug, contract]));

    expect(contracts.length).toBeGreaterThan(20);
    expect(contracts).toHaveLength(29);
    expect(new Set(contracts.map((contract) => contract.alignmentStatus))).toEqual(new Set(['checkout_eligible']));
    expect(contractsBySlug.get('anarchotribal-vinyl')).toMatchObject({
      alignmentStatus: 'checkout_eligible',
      desiredCatalogEntry: {
        availability: 'published',
        desiredPrice: {
          amountMinor: 2800,
          currencyCode: 'EUR',
        },
        targetEnvironments: ['sandbox'],
      },
      expectedSandboxPrice: {
        amountMinor: 2800,
        currencyCode: 'EUR',
      },
      productProjection: {
        imageUrls: [
          'https://blackbox-records-web.pages.dev/admin/media/releases/ouranopithecus-album-cover-distro-mockup.webp',
        ],
        name: 'BlackBox Records - Anarchotribal - Vinyl',
        taxCode: STRIPE_PHYSICAL_GOODS_TAX_CODE,
      },
      sourceId: 'anarchotribal',
      sourceKind: 'release',
      variantId: 'variant_anarchotribal-vinyl_standard',
    });
    expect(contractsBySlug.get('disintegration-black-vinyl-lp')).toMatchObject({
      alignmentStatus: 'checkout_eligible',
      desiredCatalogEntry: {
        availability: 'published',
        desiredPrice: {
          amountMinor: 2800,
          currencyCode: 'EUR',
        },
        targetEnvironments: ['sandbox'],
      },
      expectedSandboxPrice: {
        amountMinor: 2800,
        currencyCode: 'EUR',
      },
      productProjection: {
        imageUrls: [
          'https://blackbox-records-web.pages.dev/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
        ],
        name: 'BlackBox Records - Disintegration - Black Vinyl LP',
        taxCode: STRIPE_PHYSICAL_GOODS_TAX_CODE,
      },
      sourceId: 'disintegration',
      sourceKind: 'release',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(contractsBySlug.get('barren-point')).toMatchObject({
      productProjection: {
        imageUrls: ['https://blackbox-records-web.pages.dev/admin/media/distro/mass-culture-barren-point.jpg'],
        name: 'BlackBox Records - Barren Point - LP',
        taxCode: STRIPE_PHYSICAL_GOODS_TAX_CODE,
      },
      sourceId: 'barren-point',
      sourceKind: 'distro',
      variantId: 'variant_barren-point_standard',
    });
    expect(contractsBySlug.get('caregivers-vinyl')).toMatchObject({
      productProjection: {
        imageUrls: [
          'https://blackbox-records-web.pages.dev/admin/media/releases/chronoboros-album-cover-distro-mockup.webp',
        ],
        name: 'BlackBox Records - Caregivers - Vinyl',
      },
      sourceId: 'caregivers',
      sourceKind: 'release',
      variantId: 'variant_caregivers-vinyl_standard',
    });
    expect(contractsBySlug.get('afterglow-tape')).toMatchObject({
      alignmentStatus: 'checkout_eligible',
      expectedSandboxPrice: {
        amountMinor: 1200,
        currencyCode: 'EUR',
      },
      productProjection: {
        imageUrls: ['https://blackbox-records-web.pages.dev/admin/media/distro/cassette-tape.jpg'],
        name: 'BlackBox Records - Afterglow Cassette - Cassette',
        taxCode: STRIPE_PHYSICAL_GOODS_TAX_CODE,
      },
      sourceKind: 'distro',
      variantId: 'variant_afterglow-tape_standard',
    });
    expect(contractsBySlug.get('rehearsal-room-tee')).toMatchObject({
      expectedSandboxPrice: {
        amountMinor: 2000,
        currencyCode: 'EUR',
      },
    });
    expect(contracts.every((contract) => contract.productProjection.taxCode === STRIPE_PHYSICAL_GOODS_TAX_CODE)).toBe(
      true,
    );
  });

  it('generates Desired Catalog State from the same content contract without production targets by default', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({
      productEnvironment: 'prd',
    });
    const disintegration = contracts.find((contract) => contract.storeItemSlug === 'disintegration-black-vinyl-lp');
    const source = createDesiredCatalogStateSource(contracts);

    expect(disintegration?.desiredCatalogEntry).toMatchObject({
      availability: 'published',
      desiredPrice: {
        amountMinor: 2800,
        currencyCode: 'EUR',
      },
      productProjection: {
        name: 'BlackBox Records - Disintegration - Black Vinyl LP',
      },
      smokeCandidate: false,
      stockInitialization: {
        initialOnlineQuantity: null,
      },
      targetEnvironments: ['sandbox'],
    });
    expect(contracts.flatMap((contract) => contract.desiredCatalogEntry.targetEnvironments)).not.toContain(
      'production',
    );
    expect(source).toContain('export const currentDesiredCatalogState');
    expect(source).toContain('createCurrentDesiredCatalogEntriesForEnvironment');
  });

  it('uses format-based sandbox test prices without making the browser price authority', () => {
    expect(createExpectedSandboxPrice('Cassette')).toEqual({
      amountMinor: 1200,
      currencyCode: 'EUR',
    });
    expect(createExpectedSandboxPrice('T-Shirt')).toEqual({
      amountMinor: 2000,
      currencyCode: 'EUR',
    });
    expect(createExpectedSandboxPrice('Vinyl LP')).toEqual({
      amountMinor: 2800,
      currencyCode: 'EUR',
    });
    expect(createExpectedSandboxPrice(null)).toEqual({
      amountMinor: 2800,
      currencyCode: 'EUR',
    });
  });

  it('keeps the Worker-safe Product Projection manifest in sync with generated catalog contracts', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({ productEnvironment: 'uat' });

    expect(currentCatalogProductProjectionEntries).toEqual(
      contracts.map((contract) => ({
        alignmentStatus: contract.alignmentStatus,
        expectedSandboxPrice: contract.expectedSandboxPrice,
        productProjection: contract.productProjection,
        sourceId: contract.sourceId,
        sourceKind: contract.sourceKind,
        storeItemSlug: contract.storeItemSlug,
        variantId: contract.variantId,
      })),
    );
  });

  it('rejects Product Projection image URLs that are not stable absolute public URLs', () => {
    expect(
      isStableAbsoluteStripeImageUrl('https://blackbox-records-web.pages.dev/admin/media/distro/cassette-tape.jpg'),
    ).toBe(true);
    expect(isStableAbsoluteStripeImageUrl('/admin/media/distro/cassette-tape.jpg')).toBe(false);

    const invalidContract: StripeCatalogStoreItemContract = {
      alignmentStatus: 'checkout_eligible',
      desiredCatalogEntry: {
        availability: 'published',
        desiredPrice: null,
        productProjection: {
          description: 'Invalid test contract.',
          imageUrls: ['/admin/media/distro/cassette-tape.jpg'],
          metadata: {
            sourceId: 'afterglow-tape',
            sourceKind: 'distro',
            storeItemSlug: 'afterglow-tape',
            variantId: 'variant_afterglow-tape_standard',
          },
          name: 'Invalid test contract',
          taxCode: null,
        },
        smokeCandidate: false,
        sourceId: 'afterglow-tape',
        sourceKind: 'distro',
        stockInitialization: {
          initialOnlineQuantity: null,
        },
        storeItemSlug: 'afterglow-tape',
        targetEnvironments: ['sandbox'],
        variantId: 'variant_afterglow-tape_standard',
      },
      expectedSandboxPrice: null,
      productProjection: {
        description: 'Invalid test contract.',
        imageUrls: ['/admin/media/distro/cassette-tape.jpg'],
        metadata: {
          sourceId: 'afterglow-tape',
          sourceKind: 'distro',
          storeItemSlug: 'afterglow-tape',
          variantId: 'variant_afterglow-tape_standard',
        },
        name: 'Invalid test contract',
        taxCode: null,
      },
      sourceId: 'afterglow-tape',
      sourceKind: 'distro',
      storeItemSlug: 'afterglow-tape',
      variantId: 'variant_afterglow-tape_standard',
    };

    expect(() => assertValidStripeCatalogStoreItemContract(invalidContract)).toThrow(
      'Product Projection image URL is not stable and absolute for afterglow-tape',
    );
  });

  it('generates sandbox UAT D1 readiness rows with only afterglow as low stock', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({ productEnvironment: 'uat' });
    const stockBySlug = new Map(
      contracts.map((contract) => [contract.storeItemSlug, createSandboxUatCatalogStock(contract)]),
    );
    const sql = createSandboxUatCommerceSql(contracts);

    expect(stockBySlug.get('afterglow-tape')).toEqual({
      onlineQuantity: 1,
      quantity: 1,
    });
    expect(
      contracts
        .filter((contract) => contract.storeItemSlug !== 'afterglow-tape')
        .every((contract) => {
          const stock = stockBySlug.get(contract.storeItemSlug);
          return stock?.quantity === 99 && stock.onlineQuantity === 99;
        }),
    ).toBe(true);
    expect(sql.match(/INSERT INTO "StoreItemOption"/g)).toHaveLength(1);
    expect(sql.match(/INSERT INTO "ItemAvailability"/g)).toHaveLength(1);
    expect(sql.match(/INSERT INTO "Stock"/g)).toHaveLength(1);
    expect(sql).toContain("'stock_afterglow_tape', 'variant_afterglow-tape_standard', 1, 1");
    expect(sql).toContain(
      "'disintegration-black-vinyl-lp', 'release', 'disintegration', 'variant_disintegration-black-vinyl-lp_standard'",
    );
    expect(sql).toContain("'anarchotribal-vinyl', 'release', 'anarchotribal', 'variant_anarchotribal-vinyl_standard'");
    expect(sql).toContain("'barren-point', 'distro', 'barren-point', 'variant_barren-point_standard'");
    expect(sql).toContain('DELETE FROM "StoreItemOption"\nWHERE "storeItemSlug" = \'mass-culture-lp\'');
    expect(sql).not.toContain("'mass-culture-lp', 'distro'");
    expect(sql).not.toContain('price_');
    expect(sql).not.toContain('sk_');
  });

  it('generates production D1 readiness without sandbox stock defaults or stock overwrites', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({ productEnvironment: 'prd' });
    const sql = createProductionCommerceReadinessSql(contracts);

    expect(sql).toContain('Production catalog readiness seed generated from Desired Catalog State.');
    expect(sql).toContain('No production-targeted StoreItemOption rows.');
    expect(sql).toContain('No production-targeted ItemAvailability rows.');
    expect(sql).toContain('No first-publication production stock initialization rows.');
    expect(sql).not.toContain('99, 99');
    expect(sql).not.toContain('DO UPDATE SET\n    "quantity" = excluded."quantity"');
  });
});
