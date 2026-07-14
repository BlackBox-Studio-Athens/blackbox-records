import { readFile } from 'node:fs/promises';
import path from 'node:path';

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
import {
  findDistroInventoryRowForContent,
  loadDistroInventorySource,
  reconcileDistroContentWithInventorySource,
} from '../../../../scripts/distro-inventory-source';

describe('stripe catalog contract projection', () => {
  it('loads the Distro Inventory Source with approved duplicate and price policy decisions', async () => {
    const source = await loadDistroInventorySource();
    const rowsById = new Map(source.rows.map((row) => [row.id, row]));
    const rejectedDuplicate = source.rejectedDuplicateRows[0];

    expect(source.rows).toHaveLength(79);
    expect(source.rejectedDuplicateRows).toEqual([
      expect.objectContaining({
        duplicateOf: 'living-under-drones-knot-on-knot-vinyl-12-inch',
        sourceTitle: 'Knot On Knot?',
      }),
    ]);
    expect(rowsById.get('mass-culture-barren-point-vinyl-12-inch')?.pricePolicy).toEqual({
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    });
    expect(rowsById.get('broken-fingers-ego-tape')?.pricePolicy).toEqual({
      amountMinor: 500,
      currencyCode: 'EUR',
      kind: 'fixed',
    });
    expect(rowsById.get('the-vagina-lips-random-tapes-tape')?.pricePolicy).toEqual({
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      maximumAmountMinor: 10000,
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
    });
    expect(rejectedDuplicate?.id).toBe(rejectedDuplicate?.duplicateOf);
  });

  it('matches current distro content aliases back to the Distro Inventory Source', async () => {
    const source = await loadDistroInventorySource();

    expect(
      findDistroInventoryRowForContent(source, {
        artist_or_label: 'Skinny Peachfuzz',
        group: 'Vinyl 7-inch',
        title: 'Magic Sleazeball Corrida',
      })?.id,
    ).toBe('skinny-peachfuzz-magic-sleazball-corrida-vinyl-7-inch');
    expect(
      findDistroInventoryRowForContent(source, {
        artist_or_label: 'Zebu / Dead Elephant',
        group: 'Vinyl 7-inch',
        title: 'Crawl / Eat Them Dead Or Alive, Split 7"',
      })?.pricePolicy,
    ).toEqual({
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      maximumAmountMinor: 10000,
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
    });
  });

  it('keeps all three small-vinyl records on exact physical types', async () => {
    const contentRoot = path.join(path.resolve(process.cwd(), '..', '..'), 'apps', 'web', 'src', 'content', 'distro');
    const records = await Promise.all(
      ['magic-sleazeball-corrida', 'crawl-eat-them-dead-or-alive-split-7', 'calf-vinyl-10-inch'].map(
        async (sourceId) =>
          JSON.parse(await readFile(path.join(contentRoot, `${sourceId}.json`), 'utf8')) as {
            format?: string;
            group: string;
          },
      ),
    );

    expect(records.map(({ format, group }) => ({ format, group }))).toEqual([
      { format: 'Vinyl 7-inch', group: 'Vinyl 7-inch' },
      { format: 'Vinyl 7-inch', group: 'Vinyl 7-inch' },
      { format: 'Vinyl 10-inch', group: 'Vinyl 10-inch' },
    ]);
  });

  it('rejects non-bijective source matches before catalog projection', async () => {
    const source = await loadDistroInventorySource();
    const row = source.rows.find(
      (candidate) => candidate.id === 'skinny-peachfuzz-magic-sleazball-corrida-vinyl-7-inch',
    );
    if (!row) throw new Error('Expected Magic Sleazeball Corrida inventory row.');

    expect(() =>
      reconcileDistroContentWithInventorySource(
        {
          ...source,
          rows: [row, { ...row, id: 'duplicate-magic-sleazeball-corrida' }],
        },
        [
          {
            artist_or_label: 'Skinny Peachfuzz',
            group: 'Vinyl 7-inch',
            sourceId: 'magic-sleazeball-corrida',
            title: 'Magic Sleazeball Corrida',
          },
        ],
      ),
    ).toThrow('does not resolve bijectively');
  });

  it('rejects inventory source rows without content counterparts', async () => {
    const source = await loadDistroInventorySource();
    const row = source.rows[0]!;

    expect(() =>
      reconcileDistroContentWithInventorySource(
        {
          ...source,
          rows: [
            row,
            {
              ...row,
              id: 'unmatched-inventory-row',
              sourceArtist: 'Unmatched Artist',
              sourceTitle: 'Unmatched Item',
            },
          ],
        },
        [
          {
            artist_or_label: row.sourceArtist,
            group: row.itemType === 'CD' ? 'CDs' : row.itemType === 'Tape' ? 'Tapes' : row.itemType,
            sourceId: row.id,
            title: row.sourceTitle,
          },
        ],
      ),
    ).toThrow('unmatched rows: unmatched-inventory-row');
  });

  it('rejects duplicate inventory source row IDs', async () => {
    const source = await loadDistroInventorySource();
    const row = source.rows[0]!;

    expect(() =>
      reconcileDistroContentWithInventorySource(
        {
          ...source,
          rows: [row, { ...row, sourceTitle: 'Duplicate Source Row' }],
        },
        [],
      ),
    ).toThrow('duplicates: ' + row.id);
  });

  it('rejects physical-type drift before catalog projection', async () => {
    const source = await loadDistroInventorySource();

    expect(() =>
      reconcileDistroContentWithInventorySource(source, [
        {
          artist_or_label: 'Skinny Peachfuzz',
          group: 'Vinyl 12-inch',
          sourceId: 'magic-sleazeball-corrida',
          title: 'Magic Sleazeball Corrida',
        },
      ]),
    ).toThrow('physical type mismatch');
  });

  it('derives Product Projection contracts for all current Store Items without Astro runtime imports', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({
      productEnvironment: 'PRD',
    });
    const contractsBySlug = new Map(contracts.map((contract) => [contract.storeItemSlug, contract]));

    expect(contracts.length).toBeGreaterThan(20);
    expect(new Set(contracts.map((contract) => contract.alignmentStatus))).toEqual(new Set(['checkout_eligible']));
    expect(contractsBySlug.get('anarchotribal-vinyl')).toMatchObject({
      alignmentStatus: 'checkout_eligible',
      desiredCatalogEntry: {
        availability: 'published',
        desiredPrice: {
          amountMinor: 2800,
          currencyCode: 'EUR',
        },
        targetEnvironments: ['uat'],
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
        targetEnvironments: ['uat'],
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
    expect(contractsBySlug.has('afterglow-tape')).toBe(false);
    expect(contractsBySlug.has('rehearsal-room-tee')).toBe(false);
    expect(contracts.every((contract) => contract.productProjection.taxCode === STRIPE_PHYSICAL_GOODS_TAX_CODE)).toBe(
      true,
    );
  });

  it('generates Desired Catalog State from the same content contract without production targets by default', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({
      productEnvironment: 'PRD',
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
      stockInitialization: {
        initialOnlineQuantity: null,
      },
      targetEnvironments: ['uat'],
    });
    expect(contracts.flatMap((contract) => contract.desiredCatalogEntry.targetEnvironments)).not.toContain('prd');
    expect(source).toContain('export const currentDesiredCatalogState');
    expect(source).toContain('createCurrentDesiredCatalogEntriesForEnvironment');
    expect(source).not.toContain('smokeCandidate');
  });

  it('uses format-based sandbox test prices without making the browser price authority', () => {
    expect(createExpectedSandboxPrice('Cassette')).toEqual({
      amountMinor: 1200,
      currencyCode: 'EUR',
      kind: 'fixed',
    });
    expect(createExpectedSandboxPrice('T-Shirt')).toEqual({
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    });
    expect(createExpectedSandboxPrice('Vinyl LP')).toEqual({
      amountMinor: 2800,
      currencyCode: 'EUR',
      kind: 'fixed',
    });
    expect(createExpectedSandboxPrice(null)).toEqual({
      amountMinor: 2800,
      currencyCode: 'EUR',
      kind: 'fixed',
    });
  });

  it('keeps the Worker-safe Product Projection manifest in sync with generated catalog contracts', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({ productEnvironment: 'UAT' });

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
        sourceId: 'afterglow-tape',
        sourceKind: 'distro',
        stockInitialization: {
          initialOnlineQuantity: null,
        },
        storeItemSlug: 'afterglow-tape',
        targetEnvironments: ['uat'],
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

  it('generates sandbox UAT D1 readiness rows with default stock for current Store Items', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({ productEnvironment: 'UAT' });
    const stockBySlug = new Map(
      contracts.map((contract) => [contract.storeItemSlug, createSandboxUatCatalogStock(contract)]),
    );
    const sql = createSandboxUatCommerceSql(contracts);

    expect(
      contracts.every((contract) => {
        const stock = stockBySlug.get(contract.storeItemSlug);
        return stock?.quantity === 99 && stock.onlineQuantity === 99;
      }),
    ).toBe(true);
    expect(sql.match(/INSERT INTO "StoreItemOption"/g)).toHaveLength(1);
    expect(sql.match(/INSERT INTO "ItemAvailability"/g)).toHaveLength(1);
    expect(sql.match(/INSERT INTO "Stock"/g)).toHaveLength(1);
    expect(sql).toContain(
      "'disintegration-black-vinyl-lp', 'release', 'disintegration', 'variant_disintegration-black-vinyl-lp_standard'",
    );
    expect(sql).toContain("'anarchotribal-vinyl', 'release', 'anarchotribal', 'variant_anarchotribal-vinyl_standard'");
    expect(sql).toContain("'barren-point', 'distro', 'barren-point', 'variant_barren-point_standard'");
    expect(sql).toContain('DELETE FROM "StoreItemOption"\nWHERE "storeItemSlug" = \'mass-culture-lp\'');
    expect(sql).toContain(
      'DELETE FROM "VariantStripeMapping"\nWHERE "variantId" = \'variant_mass-culture-lp_standard\'',
    );
    expect(sql).toContain(
      '"variantId" = \'variant_barren-point_standard\'\n       AND NOT EXISTS (\n           SELECT 1\n           FROM "StoreItemOption" current_store_item',
    );
    expect(sql).not.toContain("\"variantId\" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard'");
    expect(sql).not.toContain("'mass-culture-lp', 'distro'");
    expect(sql).not.toContain('price_');
    expect(sql).not.toContain('sk_');
  });

  it('generates PRD D1 readiness without sandbox stock defaults or stock overwrites', async () => {
    const contracts = await loadStripeCatalogStoreItemContracts({ productEnvironment: 'PRD' });
    const sql = createProductionCommerceReadinessSql(contracts);

    expect(sql).toContain('Production catalog readiness seed generated from Desired Catalog State.');
    expect(sql).toContain('No production-targeted StoreItemOption rows.');
    expect(sql).toContain('No production-targeted ItemAvailability rows.');
    expect(sql).toContain('No first-publication production stock initialization rows.');
    expect(sql).not.toContain('99, 99');
    expect(sql).not.toContain('DO UPDATE SET\n    "quantity" = excluded."quantity"');
  });
});
