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
  createSandboxUatCatalogStock,
  createSandboxUatCommerceSql,
} from '../../../../scripts/generate-stripe-uat-catalog-artifacts';

describe('stripe catalog contract projection', () => {
  it('derives Product Projection contracts for all current Store Items without Astro runtime imports', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({
      basePath: '/',
      siteUrl: 'https://blackbox-records-web.pages.dev',
    });
    const contractsBySlug = new Map(contracts.map((contract) => [contract.storeItemSlug, contract]));

    expect(contracts.length).toBeGreaterThan(20);
    expect(contracts).toHaveLength(28);
    expect(new Set(contracts.map((contract) => contract.alignmentStatus))).toEqual(new Set(['checkout_eligible']));
    expect(contractsBySlug.get('disintegration-black-vinyl-lp')).toMatchObject({
      alignmentStatus: 'checkout_eligible',
      expectedSandboxPrice: {
        amountMinor: 2800,
        currencyCode: 'EUR',
      },
      productProjection: {
        imageUrls: [
          'https://blackbox-records-web.pages.dev/admin/media/releases/656856327_18427527979186423_8617747121554203403_n.jpg',
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
    const contracts = await loadStripeCatalogStoreItemContracts();

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
    const contracts = await loadStripeCatalogStoreItemContracts();
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
    expect(sql).toContain("'barren-point', 'distro', 'barren-point', 'variant_barren-point_standard'");
    expect(sql).toContain('DELETE FROM "StoreItemOption"\nWHERE "storeItemSlug" = \'mass-culture-lp\'');
    expect(sql).not.toContain("'mass-culture-lp', 'distro'");
    expect(sql).not.toContain('price_');
    expect(sql).not.toContain('sk_');
  });
});
