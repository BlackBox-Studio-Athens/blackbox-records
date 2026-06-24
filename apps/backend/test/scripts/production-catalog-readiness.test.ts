import { describe, expect, it } from 'vitest';

import {
  evaluateProductionCatalogReadiness,
  formatProductionCatalogReadinessReport,
  parseProductionCatalogReadinessArgs,
  type ProductionCatalogReadinessRow,
} from '../../../../scripts/check-production-catalog-readiness';
import type { DesiredCatalogEntry } from '../../src/application/commerce/catalog-sync';

const prdEntry: DesiredCatalogEntry = {
  availability: 'published',
  desiredPrice: {
    amountMinor: 2800,
    currencyCode: 'EUR',
    revision: 'disintegration-black-vinyl-lp-2800-eur',
  },
  productProjection: {
    description: 'Black vinyl LP',
    imageUrls: ['https://blackbox-records-web.pages.dev/assets/store/disintegration.jpg'],
    metadata: {},
    name: 'Disintegration - Black Vinyl LP',
    taxCode: 'txcd_99999999',
  },
  sourceId: 'disintegration',
  sourceKind: 'release',
  stockInitialization: {
    initialOnlineQuantity: 2,
  },
  storeItemSlug: 'disintegration-black-vinyl-lp',
  targetEnvironments: ['uat', 'prd'],
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

const readyRow: ProductionCatalogReadinessRow = {
  amountMinor: 2800,
  canBuy: 1,
  currencyCode: 'EUR',
  mappingStripePriceId: 'price_live_disintegration_2800',
  onlineQuantity: 2,
  priceActive: 1,
  productActive: 1,
  snapshotStripePriceId: 'price_live_disintegration_2800',
  sourceId: 'disintegration',
  sourceKind: 'release',
  status: 'available',
  storeItemSlug: 'disintegration-black-vinyl-lp',
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('PRD catalog readiness check', () => {
  it('parses the dry-run phase default and explicit post-apply phase', () => {
    expect(parseProductionCatalogReadinessArgs([])).toEqual({ phase: 'pre-apply' });
    expect(parseProductionCatalogReadinessArgs(['--phase', 'post-apply'])).toEqual({ phase: 'post-apply' });
  });

  it('blocks PRD readiness when published PRD items have no Stock row', () => {
    const result = evaluateProductionCatalogReadiness({
      entries: [prdEntry],
      phase: 'pre-apply',
      rows: [
        {
          ...readyRow,
          mappingStripePriceId: null,
          onlineQuantity: null,
          snapshotStripePriceId: null,
        },
      ],
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing_stock',
          severity: 'blocking',
        }),
        expect.objectContaining({
          code: 'missing_mapping',
          severity: 'pending',
        }),
        expect.objectContaining({
          code: 'missing_snapshot',
          severity: 'pending',
        }),
      ]),
    );
    expect(formatProductionCatalogReadinessReport(result)).toContain('Blocking issues: 1');
  });

  it('promotes mapping and snapshot expectations to blockers after catalog apply', () => {
    const result = evaluateProductionCatalogReadiness({
      entries: [prdEntry],
      phase: 'post-apply',
      rows: [
        {
          ...readyRow,
          mappingStripePriceId: null,
          snapshotStripePriceId: null,
        },
      ],
    });

    expect(result.issues.map((issue) => [issue.code, issue.severity])).toEqual([
      ['missing_mapping', 'blocking'],
      ['missing_snapshot', 'blocking'],
    ]);
  });

  it('accepts a PRD item with stock, mapping, and Store Offer snapshot', () => {
    const result = evaluateProductionCatalogReadiness({
      entries: [prdEntry],
      phase: 'post-apply',
      rows: [readyRow],
    });

    expect(result.issues).toEqual([]);
  });

  it('keeps retired PRD items non-buyable without requiring stock', () => {
    const retiredEntry = {
      ...prdEntry,
      availability: 'retired',
    } satisfies DesiredCatalogEntry;
    const result = evaluateProductionCatalogReadiness({
      entries: [retiredEntry],
      phase: 'pre-apply',
      rows: [
        {
          ...readyRow,
          canBuy: 0,
          mappingStripePriceId: null,
          onlineQuantity: null,
          snapshotStripePriceId: null,
          status: 'sold_out',
        },
      ],
    });

    expect(result.issues).toEqual([]);
  });
});
