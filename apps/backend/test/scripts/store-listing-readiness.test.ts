import { describe, expect, it } from 'vitest';

import { findNonReadyStoreItemSlugs } from '../../../../scripts/verify-store-listing-readiness';

describe('hosted Store listing readiness', () => {
  it('accepts exactly one ready fixed or pay-what-you-want record per Store Item', () => {
    expect(
      findNonReadyStoreItemSlugs(
        ['fixed-item', 'pay-item'],
        [
          { displayPrice: '€28.00', presentationState: 'ready', storeItemSlug: 'fixed-item' },
          { displayPrice: 'Pay what you want', presentationState: 'ready', storeItemSlug: 'pay-item' },
        ],
      ),
    ).toEqual([]);
  });

  it('reports only missing, duplicate, malformed, or unavailable app-owned slugs', () => {
    expect(
      findNonReadyStoreItemSlugs(
        ['missing', 'duplicate', 'unavailable', 'ready'],
        [
          { displayPrice: '€1.00', presentationState: 'ready', storeItemSlug: 'duplicate' },
          { displayPrice: '€2.00', presentationState: 'ready', storeItemSlug: 'duplicate' },
          { presentationState: 'unavailable', storeItemSlug: 'unavailable' },
          { displayPrice: '€3.00', presentationState: 'ready', storeItemSlug: 'ready' },
          { presentationState: 'unavailable', storeItemSlug: 'not-app-owned' },
        ],
      ),
    ).toEqual(['missing', 'duplicate', 'unavailable']);
  });
});
