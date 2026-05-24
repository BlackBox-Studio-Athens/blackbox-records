import { describe, expect, it } from 'vitest';

import type { CatalogSyncRunResult } from '../../src/application/commerce/catalog-sync';
import { storeItemSlug, stripePriceId, variantId } from '../support/commerce-value-objects';
import {
  formatStripeCatalogVerifyReport,
  parseD1Rows,
  parseStripeCatalogVerifyArgs,
  redactStripeCatalogDiagnostic,
} from '../../../../scripts/stripe-catalog-verify';

const storeItem = {
  sourceId: 'disintegration',
  sourceKind: 'release' as const,
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
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
          driftCategory: 'price_authority',
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
            {
              kind: 'update_product_projection',
              productId: 'prod_1234567890abcdef',
            },
          ],
          issueCount: 1,
          issues: [
            {
              code: 'wrong_amount',
              detail: 'Expected 2800; Stripe has 1000.',
              driftCategory: 'price_authority',
              storeItemSlug: storeItem.storeItemSlug,
              variantId: storeItem.variantId,
            },
          ],
          lookupKey: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
          mapping: null,
          resolvedPrice: {
            active: true,
            amountMinor: 1000,
            currencyCode: 'EUR',
            lookupKey: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
            metadata: {},
            priceId: stripePriceId('price_1234567890abcdef'),
            productActive: true,
            productDescription: 'Disintegration by Afterwise.',
            productId: 'prod_1234567890abcdef',
            productImages: ['https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg'],
            productMetadata: {},
            productName: 'BlackBox Records - Disintegration - Black Vinyl LP',
            productTaxCode: null,
          },
          snapshot: null,
          storeItem,
        },
      ],
    };

    const report = formatStripeCatalogVerifyReport(result);

    expect(report).toContain('Stripe catalog verification failed.');
    expect(report).toContain('Catalog Field Ownership');
    expect(report).toContain('Product Projection: 0 issues.');
    expect(report).toContain('Price Authority: 1 issue.');
    expect(report).toContain('D1 readiness: 0 issues.');
    expect(report).toContain('Store Offer snapshots: 0 issues.');
    expect(report).toContain('Webhook readiness: run pnpm stripe:webhooks:verify --env sandbox');
    expect(report).toContain(
      'Dry-run immutability: Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, repo files, and evidence files are not mutated unless --apply is set.',
    );
    expect(report).toContain('price_authority:wrong_amount');
    expect(report).toContain('price_...cdef');
    expect(report).toContain('price_...7890');
    expect(report).toContain('prod_...cdef');
    expect(report).not.toContain('price_1234567890abcdef');
    expect(report).not.toContain('price_abcdef1234567890');
    expect(report).not.toContain('prod_1234567890abcdef');
    expect(report).not.toContain('sk_test');
  });

  it('formats completed apply actions separately from the post-apply dry-run state', () => {
    const result: CatalogSyncRunResult = {
      appliedActions: [
        {
          actions: [
            {
              kind: 'update_product_projection',
              productId: 'prod_1234567890abcdef',
            },
          ],
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ],
      dryRun: false,
      environment: 'sandbox',
      issues: [],
      results: [
        {
          actions: [],
          issueCount: 0,
          issues: [],
          lookupKey: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
          mapping: null,
          resolvedPrice: null,
          snapshot: null,
          storeItem,
        },
      ],
    };

    const report = formatStripeCatalogVerifyReport(result);

    expect(report).toContain('Stripe catalog verification OK.');
    expect(report).toContain('Mode: apply');
    expect(report).toContain('Apply actions: completed 1 action.');
    expect(report).toContain('update_product_projection:prod_...cdef');
    expect(report).not.toContain('prod_1234567890abcdef');
  });

  it('redacts Stripe secrets, webhook endpoint IDs, and object IDs in diagnostics', () => {
    expect(
      redactStripeCatalogDiagnostic(
        'failed for sk_test_abc123 price_1234567890abcdef prod_1234567890abcdef we_1234567890abcdef whsec_secret123',
      ),
    ).toBe(
      'failed for [redacted_stripe_secret_key] price_...cdef prod_...cdef we_...cdef [redacted_stripe_webhook_secret]',
    );
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
