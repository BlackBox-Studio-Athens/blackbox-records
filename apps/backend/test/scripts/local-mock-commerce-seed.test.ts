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
          sourceId: 'barren-point',
          sourceKind: 'release',
          storeItemSlug: 'disintegration-black-vinyl-lp',
          variantId: 'variant_barren-point_standard',
        }),
        expect.objectContaining({
          sourceId: 'caregivers',
          sourceKind: 'release',
          storeItemSlug: 'caregivers-vinyl',
          variantId: 'variant_caregivers-vinyl_standard',
        }),
        expect.objectContaining({
          sourceId: 'afterglow-tape',
          sourceKind: 'distro',
          storeItemSlug: 'afterglow-tape',
          variantId: 'variant_afterglow-tape_standard',
        }),
      ]),
    );
    expect(storeItems.length).toBeGreaterThan(20);
  });

  it('keeps release aliases and fallback release slugs deterministic', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'blackbox-release-seed-test-'));

    try {
      await writeFile(
        path.join(tempDir, 'caregivers.md'),
        ['---', 'title: Caregivers', 'merch_url: https://example.com/legacy', '---', 'Body'].join('\n'),
      );
      await writeFile(path.join(tempDir, 'future-release.md'), ['---', 'title: Future Release', '---'].join('\n'));

      await expect(readReleaseStoreItems(tempDir)).resolves.toEqual([
        expect.objectContaining({
          sourceId: 'caregivers',
          sourceKind: 'release',
          storeItemSlug: 'caregivers-vinyl',
          variantId: 'variant_caregivers-vinyl_standard',
        }),
        expect.objectContaining({
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
      await writeFile(path.join(tempDir, '___.json'), JSON.stringify({ title: 'The Chemical Bath' }));

      await expect(readDistroStoreItems(tempDir)).resolves.toEqual([
        expect.objectContaining({
          sourceId: '___',
          sourceKind: 'distro',
          storeItemSlug: '___',
          variantId: 'variant_____standard',
        }),
        expect.objectContaining({
          sourceId: 'afterglow-tape',
          sourceKind: 'distro',
          storeItemSlug: 'afterglow-tape',
          variantId: 'variant_afterglow-tape_standard',
        }),
      ]);
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });

  it('generates idempotent local-only mock commerce SQL for all required D1 tables', () => {
    const sql = createLocalMockCommerceSql([
      {
        sourceId: 'caregivers',
        sourceKind: 'release',
        storeItemSlug: 'caregivers-vinyl',
        title: 'Caregivers',
        variantId: 'variant_caregivers-vinyl_standard',
      },
      {
        sourceId: 'afterglow-tape',
        sourceKind: 'distro',
        storeItemSlug: 'afterglow-tape',
        title: 'Afterglow Cassette',
        variantId: 'variant_afterglow-tape_standard',
      },
    ]);

    expect(sql).toContain('INSERT INTO "StoreItemOption"');
    expect(sql).toContain('INSERT INTO "ItemAvailability"');
    expect(sql).toContain('INSERT INTO "Stock"');
    expect(sql).toContain('INSERT INTO "VariantStripeMapping"');
    expect(sql.match(/ON CONFLICT/g)).toHaveLength(4);
    expect(sql).toContain("'caregivers-vinyl'");
    expect(sql).toContain("'variant_caregivers-vinyl_standard'");
    expect(sql).toContain("'available'");
    expect(sql).toContain('TRUE');
    expect(sql).toContain('99');
    expect(sql).toContain("'price_mock_caregivers_vinyl'");
    expect(sql).toContain('not real inventory evidence');
    expect(sql).not.toContain('price_replace_with_real_stripe_test_price');
    expect(sql).not.toContain('sk_test');
  });

  it('uses mock Stripe price IDs only', () => {
    expect(createMockStripePriceId('caregivers-vinyl')).toBe('price_mock_caregivers_vinyl');
    expect(createMockStripePriceId('___')).toBe('price_mock_item');
  });
});
