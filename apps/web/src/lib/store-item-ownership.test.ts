import { describe, expect, it } from 'vitest';

import {
  createPhysicalEditionKey,
  createValidatedStoreItemProjection,
  type StoreItemProjectionCandidate,
} from './store-item-ownership';

const caregiversKey = createPhysicalEditionKey({
  artist: 'Chronoboros',
  itemType: 'Vinyl',
  title: 'Caregivers',
});

const caregiversRelease: StoreItemProjectionCandidate = {
  physicalEditionKeys: [caregiversKey],
  sourceId: 'caregivers',
  sourceKind: 'release',
  storeItemSlug: 'caregivers-vinyl',
};

const caregiversDistroDuplicate: StoreItemProjectionCandidate = {
  physicalEditionKeys: [
    createPhysicalEditionKey({
      artist: 'Chronoboros',
      itemType: 'Vinyl 12-inch',
      title: 'Caregivers',
    }),
  ],
  sourceId: 'chronoboros-caregivers-vinyl',
  sourceKind: 'distro',
  storeItemSlug: 'chronoboros-caregivers-vinyl',
};

describe('canonical Store Item ownership', () => {
  it('projects Caregivers from its Release owner', () => {
    expect(createValidatedStoreItemProjection([caregiversRelease])).toEqual([
      {
        sourceId: 'caregivers',
        sourceKind: 'release',
        storeItemSlug: 'caregivers-vinyl',
        variantId: 'variant_caregivers-vinyl_standard',
      },
    ]);
  });

  it('rejects unresolved cross-source physical duplicates', () => {
    expect(() => createValidatedStoreItemProjection([caregiversRelease, caregiversDistroDuplicate])).toThrow(
      'Unresolved cross-source physical duplicate',
    );
  });

  it('rejects duplicate source tuples and canonical slugs', () => {
    expect(() => createValidatedStoreItemProjection([caregiversRelease, caregiversRelease])).toThrow(
      'Duplicate Store Item source tuple: release:caregivers',
    );

    expect(() =>
      createValidatedStoreItemProjection([
        {
          physicalEditionKeys: ['first'],
          sourceId: 'first',
          sourceKind: 'release',
          storeItemSlug: 'same-slug',
        },
        {
          physicalEditionKeys: ['second'],
          sourceId: 'second',
          sourceKind: 'release',
          storeItemSlug: 'same-slug',
        },
      ]),
    ).toThrow('Duplicate storeItemSlug same-slug: release:first, release:second');
  });

  it('rejects every reserved Store route segment before static Store paths are created', () => {
    for (const slug of ['checkout', 'blackbox-releases', 'distro', 'merch']) {
      expect(() =>
        createValidatedStoreItemProjection([
          {
            physicalEditionKeys: ['reserved'],
            sourceId: slug,
            sourceKind: 'release',
            storeItemSlug: slug,
          },
        ]),
      ).toThrow(`Reserved Store Item slug detected for release:${slug}: ${slug}.`);
    }
  });
});
