import { expect, it } from 'vitest';
import { planRuntimeCatalogBackfill } from '../../../../scripts/plan-runtime-catalog-backfill';
import { parseStoreItemSlug, parseVariantId, parseStripePriceId } from '../../src/domain/commerce';

function fixture(): Parameters<typeof planRuntimeCatalogBackfill>[0] {
  const identity = {
    storeItemSlug: parseStoreItemSlug('existing-item'),
    sourceKind: 'release' as const,
    sourceId: 'existing-source',
    variantId: parseVariantId('variant_existing'),
  };
  return {
    environment: 'uat',
    sources: [
      {
        cmsSourceId: 'cms-existing',
        itemType: 'Vinyl 12-inch',
        catalog: {
          ...identity,
          availability: 'published',
          targetEnvironments: ['uat'],
          desiredPrice: { kind: 'fixed', amountMinor: 1000, currencyCode: 'EUR', revision: 'old' },
          stockInitialization: { initialQuantity: 99, initialOnlineQuantity: 99 },
          productProjection: {
            name: 'Existing item',
            description: 'Copy',
            imageUrls: [],
            metadata: {},
            taxCode: 'txcd_99999999',
          },
        },
      },
    ],
    rows: [
      {
        ...identity,
        id: 'existing',
        createdAt: new Date(0),
        updatedAt: new Date(0),
        cmsSourceId: null,
        itemType: null,
        priceKind: null,
        productProjection: null,
        catalogAvailability: 'withheld',
        catalogRevision: 0,
      },
    ],
    reconciliation: {
      dryRun: true,
      environment: 'uat',
      issues: [],
      results: [
        {
          storeItem: identity,
          actions: [],
          issueCount: 0,
          issues: [],
          lookupKey: 'existing',
          snapshot: null,
          mapping: {
            variantId: identity.variantId,
            stripePriceId: parseStripePriceId('price_old'),
            stripeProductId: 'prod_existing',
          },
          resolvedPrice: {
            active: true,
            productActive: true,
            priceId: parseStripePriceId('price_current'),
            productId: 'prod_existing',
            amountMinor: null,
            currencyCode: 'EUR',
            priceKind: 'pay_what_you_want',
            taxBehavior: 'inclusive',
            customUnitAmount: { minimumAmountMinor: 500, presetAmountMinor: 1500, maximumAmountMinor: 10000 },
            lookupKey: 'existing',
            metadata: {},
            productMetadata: {},
            productDescription: 'Copy',
            productImages: [],
            productName: 'Existing item',
            productTaxCode: 'txcd_99999999',
          },
        },
      ],
    },
  };
}

it('plans only missing catalog fields using the current default Price policy, and reruns without changes', () => {
  const input = fixture();
  const before = structuredClone(input);
  const plan = planRuntimeCatalogBackfill(input);
  expect(input).toEqual(before);
  expect(plan.updates).toEqual([
    {
      before: input.rows[0],
      data: {
        cmsSourceId: 'cms-existing',
        itemType: 'Vinyl 12-inch',
        priceKind: 'pay_what_you_want',
        productProjection: input.sources[0].catalog.productProjection,
        catalogAvailability: 'published',
        catalogRevision: 1,
      },
    },
  ]);
  input.rows[0] = { ...input.rows[0], ...plan.updates[0].data };
  expect(planRuntimeCatalogBackfill(input)).toEqual({ environment: 'uat', updates: [], unchanged: ['existing-item'] });
  input.rows[0].catalogAvailability = 'withheld';
  expect(() => planRuntimeCatalogBackfill(input)).toThrow('cannot overwrite staff changes');
});

it('stops before returning a plan on environment, identity, linkage, or provider conflicts', () => {
  const changes: ((input: ReturnType<typeof fixture>) => void)[] = [
    (input) => {
      input.reconciliation.dryRun = false;
    },
    (input) => {
      input.reconciliation.environment = 'prd';
    },
    (input) => {
      input.sources[0].catalog.targetEnvironments = ['prd'];
    },
    (input) => {
      input.rows = [];
    },
    (input) => {
      input.rows[0].sourceId = 'foreign';
    },
    (input) => {
      input.sources.push(structuredClone(input.sources[0]));
    },
    (input) => {
      input.sources[0].cmsSourceId = ' ';
    },
    (input) => {
      input.reconciliation.results = [];
    },
    (input) => {
      input.reconciliation.results[0].mapping = null;
    },
    (input) => {
      input.reconciliation.results[0].resolvedPrice!.productId = 'prod_foreign';
    },
    (input) => {
      input.reconciliation.results[0].resolvedPrice!.active = false;
    },
    (input) => {
      input.reconciliation.results[0].resolvedPrice!.currencyCode = 'USD';
    },
    (input) => {
      input.reconciliation.results[0].resolvedPrice!.customUnitAmount!.minimumAmountMinor = -1;
    },
    (input) => {
      input.rows[0].cmsSourceId = 'already-edited';
    },
  ];
  for (const change of changes) {
    const input = fixture();
    change(input);
    const before = structuredClone(input);
    expect(() => planRuntimeCatalogBackfill(input)).toThrow();
    expect(input).toEqual(before);
  }
});
