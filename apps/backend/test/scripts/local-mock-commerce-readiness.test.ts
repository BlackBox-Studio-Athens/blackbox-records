import { describe, expect, it } from 'vitest';

import {
  checkLocalMockCommerceReadiness,
  formatLocalMockReadinessReport,
  parseLocalMockReadinessRows,
  type LocalMockReadinessRow,
} from '../../scripts/check-local-mock-commerce-readiness';
import { type LocalMockStoreItem } from '../../scripts/seed-local-mock-commerce-state';

const storeItems: LocalMockStoreItem[] = [
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
];

describe('local mock commerce readiness check', () => {
  it('passes when every current store item has local mock checkout rows', () => {
    const result = checkLocalMockCommerceReadiness(storeItems, [
      createReadyRow(storeItems[0]),
      createReadyRow(storeItems[1]),
    ]);

    expect(result).toEqual({
      issues: [],
      readyItems: 2,
      totalItems: 2,
    });
    expect(formatLocalMockReadinessReport(result)).toBe('Local mock checkout readiness OK: 2/2 store item(s) ready.');
  });

  it('reports missing store item options by slug and source', () => {
    const result = checkLocalMockCommerceReadiness(storeItems, [createReadyRow(storeItems[1])]);

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: 'missing_store_item_option',
        sourceId: 'caregivers',
        sourceKind: 'release',
        storeItemSlug: 'caregivers-vinyl',
      }),
    ]);
    expect(formatLocalMockReadinessReport(result)).toContain(
      '- caregivers-vinyl (release/caregivers): missing_store_item_option',
    );
  });

  it('reports mismatched D1 identity and variant rows', () => {
    const result = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        sourceId: 'legacy-caregivers',
        sourceKind: 'distro',
        variantId: 'variant_wrong_standard',
      },
    ]);

    expect(result.issues.map((issue) => issue.code)).toEqual([
      'source_kind_mismatch',
      'source_id_mismatch',
      'variant_mismatch',
    ]);
  });

  it('reports missing and non-buyable availability rows', () => {
    const missingAvailability = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        availabilityStatus: null,
        canBuy: null,
      },
    ]);

    expect(missingAvailability.issues.map((issue) => issue.code)).toEqual(['missing_item_availability', 'cannot_buy']);

    const notAvailable = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        availabilityStatus: 'sold_out',
        canBuy: 0,
      },
    ]);

    expect(notAvailable.issues.map((issue) => issue.code)).toEqual(['not_available', 'cannot_buy']);
  });

  it('reports missing or non-positive stock rows', () => {
    const missingStock = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        onlineQuantity: null,
        quantity: null,
      },
    ]);

    expect(missingStock.issues.map((issue) => issue.code)).toEqual(['missing_stock']);

    const nonPositiveStock = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        onlineQuantity: 0,
        quantity: 99,
      },
    ]);

    expect(nonPositiveStock.issues.map((issue) => issue.code)).toEqual(['non_positive_stock']);
  });

  it('reports missing or non-mock Stripe mappings', () => {
    const missingMapping = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        stripePriceId: null,
      },
    ]);

    expect(missingMapping.issues.map((issue) => issue.code)).toEqual(['missing_variant_stripe_mapping']);

    const realMapping = checkLocalMockCommerceReadiness(storeItems.slice(0, 1), [
      {
        ...createReadyRow(storeItems[0]),
        stripePriceId: 'price_123',
      },
    ]);

    expect(realMapping.issues.map((issue) => issue.code)).toEqual(['non_mock_stripe_price']);
  });

  it('includes local preparation instructions in failure output', () => {
    const result = checkLocalMockCommerceReadiness(storeItems, []);
    const report = formatLocalMockReadinessReport(result);

    expect(report).toContain('Local mock checkout readiness failed: 2 issue(s) across 2 store item(s).');
    expect(report).toContain('pnpm --filter @blackbox/backend d1:prepare:local');
    expect(report).toContain('pnpm --filter @blackbox/backend d1:seed:stripe-mock:local');
  });

  it('parses Wrangler D1 JSON result rows', () => {
    expect(
      parseLocalMockReadinessRows(
        JSON.stringify([
          {
            results: [createReadyRow(storeItems[0])],
            success: true,
          },
        ]),
      ),
    ).toEqual([createReadyRow(storeItems[0])]);
  });
});

function createReadyRow(storeItem: LocalMockStoreItem): LocalMockReadinessRow {
  return {
    availabilityStatus: 'available',
    canBuy: 1,
    onlineQuantity: 99,
    quantity: 99,
    sourceId: storeItem.sourceId,
    sourceKind: storeItem.sourceKind,
    storeItemSlug: storeItem.storeItemSlug,
    stripePriceId: `price_mock_${storeItem.storeItemSlug.replaceAll('-', '_')}`,
    variantId: storeItem.variantId,
  };
}
