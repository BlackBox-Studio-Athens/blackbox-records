import { describe, expect, it } from 'vitest';

import {
  createPaidSmokePolicyEvidence,
  parseCheckoutSessionId,
  parsePromotionSmokeArgs,
  selectPromotionSmokeEntry,
} from '../../../../scripts/smoke-stripe-promotion';
import type { DesiredCatalogEntry } from '../../src/application/commerce/catalog-sync';

const productionEntry: DesiredCatalogEntry = {
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
  smokeCandidate: true,
  sourceId: 'disintegration',
  sourceKind: 'release',
  stockInitialization: {
    initialOnlineQuantity: 2,
  },
  storeItemSlug: 'disintegration-black-vinyl-lp',
  targetEnvironments: ['sandbox', 'production'],
  variantId: 'variant_disintegration-black-vinyl-lp_standard',
};

describe('Stripe promotion smoke runner', () => {
  it('parses production checkout surface defaults and evidence path overrides', () => {
    expect(
      parsePromotionSmokeArgs([
        '--env',
        'production',
        '--scenario',
        'all',
        '--evidence-dir',
        '.codex-artifacts/catalog-promotion',
      ]),
    ).toMatchObject({
      environment: 'production',
      evidenceDir: '.codex-artifacts/catalog-promotion',
      scenario: 'all',
    });
  });

  it('selects a published smoke candidate for the target environment', () => {
    expect(selectPromotionSmokeEntry([productionEntry], 'production')).toEqual(productionEntry);
  });

  it('reports production paid smoke as not_configured when no live paid policy exists', () => {
    const evidence = createPaidSmokePolicyEvidence(
      {
        environment: 'production',
        evidenceDir: '.codex-artifacts/catalog-promotion',
        scenario: 'paid',
        siteUrl: 'https://blackbox-records-web.pages.dev',
        workerUrl: 'https://blackbox-records-backend.blackboxrecordsathens.workers.dev',
      },
      productionEntry,
    );

    expect(evidence.status).toBe('not_configured');
    expect(evidence.summary).toContain('no live payment was attempted');
    expect(evidence.sessionId).toBeNull();
  });

  it('parses Checkout Session IDs without retaining the surrounding hosted URL', () => {
    expect(parseCheckoutSessionId('https://checkout.stripe.com/c/pay/cs_live_1234567890abcdef#fidkdWx')).toBe(
      'cs_live_1234567890abcdef',
    );
  });
});
