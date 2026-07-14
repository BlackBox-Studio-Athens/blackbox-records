import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createLocalMockCommerceSql,
  createMockStripePriceId,
  readDistroStoreItems,
  readLocalMockStoreItems,
  readReleaseStoreItems,
} from '../../scripts/seed-local-mock-commerce-state';

describe('local mock commerce seed generator', () => {
  it('derives current release and distro store items from storefront content', async () => {
    const storeItems = await readLocalMockStoreItems();

    expect(storeItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mockCheckoutEnabled: true,
          taxCategory: 'physical_goods',
          sourceId: 'anarchotribal',
          sourceKind: 'release',
          storeItemSlug: 'anarchotribal-vinyl',
          variantId: 'variant_anarchotribal-vinyl_standard',
        }),
        expect.objectContaining({
          mockCheckoutEnabled: true,
          taxCategory: 'physical_goods',
          sourceId: 'disintegration',
          sourceKind: 'release',
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_disintegration-black-vinyl-lp_standard',
        }),
        expect.objectContaining({
          mockCheckoutEnabled: false,
          taxCategory: 'physical_goods',
          sourceId: 'chronoboros-caregivers-vinyl',
          sourceKind: 'distro',
          storeItemSlug: 'caregivers-vinyl',
          variantId: 'variant_caregivers-vinyl_standard',
        }),
      ]),
    );
    expect(storeItems).toHaveLength(81);
    expect(storeItems.filter((item) => item.variantId === 'variant_caregivers-vinyl_standard')).toHaveLength(1);
    expect(storeItems.some((item) => item.storeItemSlug === 'chronoboros-caregivers-vinyl')).toBe(false);
  });

  it('keeps release aliases and fallback release slugs deterministic', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'blackbox-release-seed-test-'));

    try {
      await writeFile(
        path.join(tempDir, 'caregivers.md'),
        [
          '---',
          'title: Caregivers',
          'merch_url: https://example.com/legacy',
          'formats:',
          '  - Vinyl',
          '  - Digital',
          '---',
          'Body',
        ].join('\n'),
      );
      await writeFile(path.join(tempDir, 'future-release.md'), ['---', 'title: Future Release', '---'].join('\n'));

      await expect(readReleaseStoreItems(tempDir)).resolves.toEqual([
        expect.objectContaining({
          mockCheckoutEnabled: false,
          taxCategory: 'physical_goods',
          sourceId: 'caregivers',
          sourceKind: 'release',
          storeItemSlug: 'caregivers-vinyl',
          variantId: 'variant_caregivers-vinyl_standard',
        }),
        expect.objectContaining({
          mockCheckoutEnabled: false,
          taxCategory: 'physical_goods',
          sourceId: 'future-release',
          sourceKind: 'release',
          storeItemSlug: 'future-release',
          variantId: 'variant_future-release_standard',
        }),
      ]);
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });

  it('derives one distro store item per current distro JSON file', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'blackbox-distro-seed-test-'));

    try {
      await writeFile(path.join(tempDir, 'afterglow-tape.json'), JSON.stringify({ title: 'Afterglow Cassette' }));
      await writeFile(path.join(tempDir, 'blank-title-slug.json'), JSON.stringify({ title: '___' }));
      await writeFile(path.join(tempDir, '___.json'), JSON.stringify({ title: 'The Chemical Bath' }));

      await expect(readDistroStoreItems(tempDir)).resolves.toEqual([
        expect.objectContaining({
          mockCheckoutEnabled: false,
          taxCategory: 'physical_goods',
          sourceId: '___',
          sourceKind: 'distro',
          storeItemSlug: 'the-chemical-bath',
          variantId: 'variant_the-chemical-bath_standard',
        }),
        expect.objectContaining({
          mockCheckoutEnabled: false,
          taxCategory: 'physical_goods',
          sourceId: 'afterglow-tape',
          sourceKind: 'distro',
          storeItemSlug: 'afterglow-tape',
          variantId: 'variant_afterglow-tape_standard',
        }),
        expect.objectContaining({
          mockCheckoutEnabled: false,
          taxCategory: 'physical_goods',
          sourceId: 'blank-title-slug',
          sourceKind: 'distro',
          storeItemSlug: 'blank-title-slug',
          variantId: 'variant_blank-title-slug_standard',
        }),
      ]);
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });

  it('generates idempotent local-only mock commerce SQL for all required D1 tables', () => {
    const sql = createLocalMockCommerceSql([
      {
        mockCheckoutEnabled: false,
        taxCategory: 'physical_goods',
        sourceId: 'caregivers',
        sourceKind: 'release',
        storeItemSlug: 'caregivers-vinyl',
        title: 'Caregivers',
        variantId: 'variant_caregivers-vinyl_standard',
      },
      {
        mockCheckoutEnabled: true,
        taxCategory: 'physical_goods',
        sourceId: 'anarchotribal',
        sourceKind: 'release',
        storeItemSlug: 'anarchotribal-vinyl',
        title: 'Anarchotribal',
        variantId: 'variant_anarchotribal-vinyl_standard',
      },
      {
        mockCheckoutEnabled: true,
        taxCategory: 'physical_goods',
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        title: 'Disintegration',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);

    expect(sql).toContain('INSERT INTO "StoreItemOption"');
    expect(sql).toContain('INSERT INTO "ItemAvailability"');
    expect(sql).toContain('INSERT INTO "Stock"');
    expect(sql).toContain('INSERT INTO "VariantStripeMapping"');
    expect(sql).toContain('INSERT INTO "StoreOfferSnapshot"');
    expect(sql.match(/ON CONFLICT/g)).toHaveLength(5);
    expect(sql).toContain("'caregivers-vinyl'");
    expect(sql).toContain("'variant_caregivers-vinyl_standard'");
    expect(sql).toContain("'available'");
    expect(sql).toContain("'sold_out'");
    expect(sql).toContain('TRUE');
    expect(sql).toContain('FALSE');
    expect(sql).toContain('99');
    expect(sql).toContain("'price_mock_disintegration_black_vinyl_lp'");
    expect(sql).toContain("'price_mock_anarchotribal_vinyl'");
    expect(sql).toContain(
      "'blackbox:local:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard'",
    );
    expect(sql).toContain("datetime('now', '+1 day')");
    expect(sql).not.toContain("'price_mock_caregivers_vinyl'");
    expect(sql).toContain('not real inventory evidence');
    expect(sql).not.toContain('price_replace_with_real_stripe_test_price');
    expect(sql).not.toContain('sk_test');
  });

  it('uses mock Stripe price IDs only', () => {
    expect(createMockStripePriceId('anarchotribal-vinyl')).toBe('price_mock_anarchotribal_vinyl');
    expect(createMockStripePriceId('caregivers-vinyl')).toBe('price_mock_caregivers_vinyl');
    expect(createMockStripePriceId('___')).toBe('price_mock_item');
  });
});
