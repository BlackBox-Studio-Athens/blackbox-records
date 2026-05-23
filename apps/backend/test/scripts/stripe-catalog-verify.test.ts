import { describe, expect, it } from 'vitest';

import type { CatalogSyncRunResult } from '../../src/application/commerce/catalog-sync';
import { storeItemSlug, stripePriceId, variantId } from '../support/commerce-value-objects';
import {
  formatStripeCatalogVerifyReport,
  parseD1Rows,
  parseStripeCatalogVerifyArgs,
} from '../../../../scripts/stripe-catalog-verify';

const storeItem = {
  sourceId: 'barren-point',
  sourceKind: 'release' as const,
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_barren-point_standard'),
};

describe('stripe catalog verify script helpers', () => {
  it('parses sandbox dry-run and apply flags while rejecting production apply', () => {
    expect(parseStripeCatalogVerifyArgs(['--env', 'sandbox'])).toEqual({
      apply: false,
      environment: 'sandbox',
    });
    expect(parseStripeCatalogVerifyArgs(['--env=sandbox', '--apply'])).toEqual({
      apply: true,
      environment: 'sandbox',
    });
    expect(() => parseStripeCatalogVerifyArgs(['--env', 'production', '--apply'])).toThrow(
      'Stripe catalog apply is allowed only with --env sandbox.',
    );
  });

  it('formats redacted diagnostics without printing full Stripe object IDs', () => {
    const result: CatalogSyncRunResult = {
      dryRun: false,
      environment: 'sandbox',
      issues: [
        {
          code: 'wrong_amount',
          detail: 'Expected 2800; Stripe has 1000.',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ],
      results: [
        {
          actions: [
            {
              kind: 'archive_price',
              stripePriceId: stripePriceId('price_1234567890abcdef'),
            },
            {
              kind: 'update_mapping',
              stripePriceId: stripePriceId('price_abcdef1234567890'),
            },
          ],
          issueCount: 1,
          issues: [
            {
              code: 'wrong_amount',
              detail: 'Expected 2800; Stripe has 1000.',
              storeItemSlug: storeItem.storeItemSlug,
              variantId: storeItem.variantId,
            },
          ],
          lookupKey: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_barren-point_standard',
          mapping: null,
          resolvedPrice: {
            active: true,
            amountMinor: 1000,
            currencyCode: 'EUR',
            lookupKey: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_barren-point_standard',
            metadata: {},
            priceId: stripePriceId('price_1234567890abcdef'),
            productActive: true,
            productId: 'prod_1234567890abcdef',
            productMetadata: {},
          },
          snapshot: null,
          storeItem,
        },
      ],
    };

    const report = formatStripeCatalogVerifyReport(result);

    expect(report).toContain('Stripe catalog verification failed.');
    expect(report).toContain('price_...cdef');
    expect(report).toContain('price_...7890');
    expect(report).not.toContain('price_1234567890abcdef');
    expect(report).not.toContain('price_abcdef1234567890');
    expect(report).not.toContain('sk_test');
  });

  it('parses remote Wrangler D1 JSON even when upload progress precedes it', () => {
    expect(
      parseD1Rows<{ ok: number }>(
        [
          '├ Checking if file needs uploading',
          '│',
          '├ 🌀 Uploading catalog.sql',
          '│ 🌀 Uploading complete.',
          '│',
          '[{"results":[{"ok":1}],"success":true}]',
        ].join('\n'),
      ),
    ).toEqual([{ ok: 1 }]);
  });
});
