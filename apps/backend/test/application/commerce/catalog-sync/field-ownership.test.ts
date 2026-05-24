import { describe, expect, it } from 'vitest';

import {
  assertCompleteCatalogFieldOwnership,
  catalogFieldOwnershipMatrix,
  catalogProjectionFieldGroups,
  classifyCatalogSyncIssue,
  findCatalogFieldOwnership,
} from '../../../../src/application/commerce/catalog-sync';

describe('Catalog Field Ownership', () => {
  it('declares one complete owner and direction for every projected catalog field group', () => {
    expect(() => assertCompleteCatalogFieldOwnership()).not.toThrow();

    for (const fieldGroup of catalogProjectionFieldGroups) {
      expect(findCatalogFieldOwnership(fieldGroup)).toEqual(
        expect.objectContaining({
          fieldGroup,
          mutationPolicy: expect.any(String),
          owner: expect.any(String),
          syncDirection: expect.any(String),
          verificationPolicy: expect.any(String),
        }),
      );
    }
  });

  it('keeps Product Projection drift separate from Price Authority drift', () => {
    expect(findCatalogFieldOwnership('stripe_product_projection')).toMatchObject({
      driftCategory: 'product_projection',
      owner: 'repo_product_projection',
      syncDirection: 'repo_to_stripe_product',
    });

    expect(findCatalogFieldOwnership('stripe_price_authority')).toMatchObject({
      driftCategory: 'price_authority',
      owner: 'stripe_price_authority',
      syncDirection: 'stripe_price_to_d1_store_offer',
    });
  });

  it('does not declare duplicate field groups', () => {
    const fieldGroups = catalogFieldOwnershipMatrix.map((entry) => entry.fieldGroup);

    expect(new Set(fieldGroups).size).toBe(fieldGroups.length);
  });

  it('classifies existing diagnostics by ownership boundary', () => {
    expect(classifyCatalogSyncIssue('inactive_product')).toBe('product_projection');
    expect(classifyCatalogSyncIssue('wrong_amount')).toBe('price_authority');
    expect(classifyCatalogSyncIssue('snapshot_stale')).toBe('store_offer_snapshot');
  });
});
