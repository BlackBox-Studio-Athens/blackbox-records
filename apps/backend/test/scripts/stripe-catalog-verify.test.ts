import { spawnSync } from 'node:child_process';

import { describe, expect, it, vi } from 'vitest';

import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  type CatalogSyncRunResult,
  type StripeCatalogGateway,
  type StripeCatalogPrice,
} from '../../src/application/commerce/catalog-sync';
import { createStripeCatalogGateway } from '../../src/infrastructure/stripe';
import { storeItemSlug, stripePriceId, variantId } from '../support/commerce-value-objects';
import {
  formatStripeCatalogVerifyReport,
  isCatalogApplyPlanReady,
  parseD1Rows,
  parseStripeCatalogVerifyArgs,
  redactStripeCatalogDiagnostic,
  verifyStripeCatalog,
} from '../../../../scripts/stripe-catalog-verify';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('../../src/infrastructure/stripe', () => ({
  createStripeCatalogGateway: vi.fn(),
}));

const createStripeCatalogGatewayMock = vi.mocked(createStripeCatalogGateway);
const spawnSyncMock = vi.mocked(spawnSync);

const storeItem = {
  sourceId: 'disintegration',
  sourceKind: 'release' as const,
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
};

describe('stripe catalog verify script helpers', () => {
  it('parses UAT dry-run and apply flags while requiring promotion context for PRD apply', () => {
    expect(parseStripeCatalogVerifyArgs(['--env', 'uat'])).toEqual({
      apply: false,
      environment: 'uat',
      planApply: false,
      promotionContext: null,
    });
    expect(parseStripeCatalogVerifyArgs(['--env', 'sandbox'])).toMatchObject({
      environment: 'uat',
    });
    expect(parseStripeCatalogVerifyArgs(['--env=uat', '--apply'])).toEqual({
      apply: true,
      environment: 'uat',
      planApply: false,
      promotionContext: null,
    });
    expect(parseStripeCatalogVerifyArgs(['--env', 'uat', '--promotion-run-id', 'run-123'])).toEqual({
      apply: false,
      environment: 'uat',
      planApply: false,
      promotionContext: {
        artifactCommitSha: '',
        ci: false,
        runId: 'run-123',
      },
    });
    expect(() => parseStripeCatalogVerifyArgs(['--env', 'prd', '--apply'])).toThrow(
      'PRD Stripe catalog apply requires promotion context.',
    );
    expect(
      parseStripeCatalogVerifyArgs([
        '--env=prd',
        '--apply',
        '--artifact-commit-sha',
        'abc123',
        '--promotion-run-id=run-456',
        '--ci-promotion',
      ]),
    ).toEqual({
      apply: true,
      environment: 'prd',
      planApply: false,
      promotionContext: {
        artifactCommitSha: 'abc123',
        ci: true,
        runId: 'run-456',
      },
    });
    expect(parseStripeCatalogVerifyArgs(['--env', 'uat', '--plan-apply'])).toMatchObject({
      apply: false,
      planApply: true,
    });
    expect(() => parseStripeCatalogVerifyArgs(['--env', 'uat', '--apply', '--plan-apply'])).toThrow(
      '--apply and --plan-apply cannot be combined.',
    );
  });

  it('allows PRD dry-run without promotion context', () => {
    expect(parseStripeCatalogVerifyArgs(['--env', 'prd'])).toEqual({
      apply: false,
      environment: 'prd',
      planApply: false,
      promotionContext: null,
    });
    expect(parseStripeCatalogVerifyArgs(['--env', 'prd'])).toEqual({
      apply: false,
      environment: 'prd',
      planApply: false,
      promotionContext: null,
    });
    expect(() => parseStripeCatalogVerifyArgs(['--env', 'prd', '--apply', '--artifact-commit-sha', 'abc123'])).toThrow(
      'Run from CI with --ci-promotion, --artifact-commit-sha <sha>, and --promotion-run-id <id>.',
    );
  });

  it('blocks PRD apply while the open gate is absent', async () => {
    const previousPrdOpenGate = process.env.PRD_OPEN_GATE;
    delete process.env.PRD_OPEN_GATE;

    try {
      await expect(
        verifyStripeCatalog({
          apply: true,
          environment: 'prd',
          promotionContext: {
            artifactCommitSha: 'abc123',
            ci: true,
            runId: 'run-456',
          },
        }),
      ).rejects.toThrow('PRD Stripe catalog apply is disabled until PRD_OPEN_GATE=open.');
    } finally {
      if (previousPrdOpenGate === undefined) {
        delete process.env.PRD_OPEN_GATE;
      } else {
        process.env.PRD_OPEN_GATE = previousPrdOpenGate;
      }
    }
  });

  it('accepts current Stripe Price Authority during day-to-day dry-run verification', async () => {
    const previousStripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const lookupKey = createStripeCatalogLookupKey('uat', storeItem);
    const metadata = createStripeCatalogMetadata('uat', storeItem);
    const wrongAmountPrice: StripeCatalogPrice = {
      active: true,
      amountMinor: 1,
      currencyCode: 'EUR',
      customUnitAmount: null,
      lookupKey,
      metadata,
      priceKind: 'fixed',
      priceId: stripePriceId('price_wrongamount1234'),
      productActive: true,
      productDescription: null,
      productId: 'prod_wrongamount1234',
      productImages: [],
      productMetadata: metadata,
      productName: null,
      productTaxCode: null,
    };
    const stripeCatalog = {
      archivePrice: vi.fn(),
      createCatalogPrice: vi.fn(),
      listOwnedPrices: vi.fn().mockResolvedValue([]),
      listOwnedProducts: vi.fn().mockResolvedValue([]),
      listPricesByLookupKey: vi.fn().mockResolvedValue([wrongAmountPrice]),
      listPricesByMetadata: vi.fn().mockResolvedValue([wrongAmountPrice]),
      updatePriceLookupKey: vi.fn(),
      retrievePrice: vi.fn().mockResolvedValue(null),
      updatePriceMetadata: vi.fn(),
      updateProductProjection: vi.fn(),
    } satisfies StripeCatalogGateway;

    process.env.STRIPE_SECRET_KEY = 'sk_test_script_dry_run';
    createStripeCatalogGatewayMock.mockReturnValue(stripeCatalog);
    spawnSyncMock.mockReturnValue({
      error: undefined,
      output: [],
      pid: 0,
      signal: null,
      status: 0,
      stderr: '',
      stdout: JSON.stringify([
        {
          results: [
            {
              amountMinor: null,
              currencyCode: null,
              freshUntil: null,
              mappingStripePriceId: null,
              priceActive: null,
              productActive: null,
              snapshotStripePriceId: null,
              sourceId: storeItem.sourceId,
              sourceKind: storeItem.sourceKind,
              storeItemSlug: storeItem.storeItemSlug,
              stripeLookupKey: null,
              syncedAt: null,
              variantId: storeItem.variantId,
            },
          ],
          success: true,
        },
      ]),
    } as unknown as ReturnType<typeof spawnSync>);

    try {
      const result = await verifyStripeCatalog({
        apply: false,
        environment: 'uat',
        promotionContext: null,
      });

      expect(result.dryRun).toBe(true);
      expect(result.issues).not.toEqual(expect.arrayContaining([expect.objectContaining({ code: 'wrong_amount' })]));
      expect(
        result.results.find((item) => item.storeItem.variantId === storeItem.variantId)?.resolvedPrice?.priceId,
      ).toBe(wrongAmountPrice.priceId);
      expect(stripeCatalog.archivePrice).not.toHaveBeenCalled();
      expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
      expect(stripeCatalog.updatePriceMetadata).not.toHaveBeenCalled();
      expect(stripeCatalog.updateProductProjection).not.toHaveBeenCalled();

      const applyPlan = await verifyStripeCatalog({
        apply: false,
        environment: 'uat',
        planApply: true,
        promotionContext: null,
      });

      expect(applyPlan.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'wrong_amount' })]));
      expect(applyPlan.results[0]?.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: 'archive_price' }),
          expect.objectContaining({ kind: 'create_catalog_price' }),
        ]),
      );
      expect(isCatalogApplyPlanReady(applyPlan)).toBe(true);
      expect(stripeCatalog.archivePrice).not.toHaveBeenCalled();
      expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
    } finally {
      createStripeCatalogGatewayMock.mockReset();
      spawnSyncMock.mockReset();
      if (previousStripeSecretKey === undefined) {
        delete process.env.STRIPE_SECRET_KEY;
      } else {
        process.env.STRIPE_SECRET_KEY = previousStripeSecretKey;
      }
    }
  });

  it('formats redacted diagnostics without printing full Stripe object IDs', () => {
    const result: CatalogSyncRunResult = {
      dryRun: false,
      environment: 'uat',
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
              kind: 'repair_lookup_key',
              lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
              stripePriceId: stripePriceId('price_lookuprepair12345678'),
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
          lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
          mapping: null,
          resolvedPrice: {
            active: true,
            amountMinor: 1000,
            currencyCode: 'EUR',
            customUnitAmount: null,
            lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
            metadata: {},
            priceKind: 'fixed',
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
    expect(report).toContain('Catalog Identity: 0 issues.');
    expect(report).toContain('Product Projection: 0 issues.');
    expect(report).toContain('Price Authority: 1 issue.');
    expect(report).toContain('D1 readiness: 0 issues.');
    expect(report).toContain('Store Offer snapshots: 0 issues.');
    expect(report).toContain('Owned orphan drift: 0 issues.');
    expect(report).toContain('Webhook readiness: run pnpm stripe:webhooks:verify --env uat');
    expect(report).toContain(
      'Dry-run immutability: Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, repo files, and evidence files are not mutated unless --apply is set.',
    );
    expect(report).toContain('price_authority:wrong_amount');
    expect(report).toContain(
      'lookup=blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
    );
    expect(report).toContain('price_...cdef');
    expect(report).toContain('repair_lookup_key:price_...5678');
    expect(report).toContain('price_...7890');
    expect(report).toContain('prod_...cdef');
    expect(report).not.toContain('price_1234567890abcdef');
    expect(report).not.toContain('price_lookuprepair12345678');
    expect(report).not.toContain('price_abcdef1234567890');
    expect(report).not.toContain('prod_1234567890abcdef');
    expect(report).not.toContain('sk_test');

    expect(isCatalogApplyPlanReady(result)).toBe(false);
    result.results[0]!.actions.push({ kind: 'create_catalog_price' });
    expect(isCatalogApplyPlanReady(result)).toBe(true);
    expect(formatStripeCatalogVerifyReport(result, { planApply: true })).toContain('Stripe catalog apply plan ready.');
    expect(formatStripeCatalogVerifyReport(result, { planApply: true })).toContain('Mode: apply-plan');
  });

  it('formats completed apply actions separately from the post-apply dry-run state', () => {
    const result: CatalogSyncRunResult = {
      appliedActions: [
        {
          actions: [
            {
              kind: 'update_product_projection',
              idempotencyKey:
                'blackbox:catalog:uat:variant_disintegration-black-vinyl-lp_standard:update_product_projection:prod_1234567890abcdef:shape_abc',
              productId: 'prod_1234567890abcdef',
              replayed: true,
              requestId: 'req_product_projection_update',
              requestShapeFingerprint: 'shape_abc',
            },
          ],
          lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
      ],
      dryRun: false,
      environment: 'uat',
      issues: [],
      results: [
        {
          actions: [],
          issueCount: 0,
          issues: [],
          lookupKey: 'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
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
    expect(report).toContain('request_id=req_product_projection_update');
    expect(report).toContain('replayed=true');
    expect(report).toContain('request_shape=shape_abc');
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
    expect(redactStripeCatalogDiagnostic('evt_1234567890abcdef')).toBe('evt_...cdef');
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
