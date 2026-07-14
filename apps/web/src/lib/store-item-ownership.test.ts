import { describe, expect, it } from 'vitest';

import {
  createPhysicalEditionKey,
  createValidatedStoreItemProjection,
  type ReleaseToDistroStoreItemRelation,
  type StoreItemProjectionCandidate,
} from './store-item-ownership';

const caregiversKey = createPhysicalEditionKey({
  artist: 'Chronoboros',
  itemType: 'Vinyl',
  title: 'Caregivers',
});

function createCandidates(): StoreItemProjectionCandidate[] {
  return [
    {
      physicalEditionKeys: [caregiversKey],
      sourceId: 'caregivers',
      sourceKind: 'release',
      storeItemSlug: 'caregivers-vinyl',
    },
    {
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
    },
  ];
}

describe('canonical Store Item ownership', () => {
  it('projects the shared Caregivers edition once from its Distro owner', () => {
    expect(createValidatedStoreItemProjection(createCandidates())).toEqual([
      {
        sourceId: 'chronoboros-caregivers-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'caregivers-vinyl',
        variantId: 'variant_caregivers-vinyl_standard',
      },
    ]);
  });

  it('rejects unresolved cross-source physical duplicates', () => {
    expect(() => createValidatedStoreItemProjection(createCandidates(), [])).toThrow(
      'Unresolved cross-source physical duplicate',
    );
  });

  it('rejects missing and repeated relation endpoints', () => {
    const missingRelation: ReleaseToDistroStoreItemRelation = {
      distroId: 'missing-distro',
      releaseId: 'caregivers',
      storeItemSlug: 'caregivers-vinyl',
    };
    expect(() => createValidatedStoreItemProjection(createCandidates(), [missingRelation])).toThrow(
      'Distro Store Item relation endpoint does not exist: missing-distro',
    );

    const relation = {
      distroId: 'chronoboros-caregivers-vinyl',
      releaseId: 'caregivers',
      storeItemSlug: 'caregivers-vinyl',
    } satisfies ReleaseToDistroStoreItemRelation;
    expect(() => createValidatedStoreItemProjection(createCandidates(), [relation, relation])).toThrow(
      'Release Store Item relation endpoint is repeated: caregivers',
    );
  });

  it('rejects duplicate source tuples and canonical slugs', () => {
    const candidates = createCandidates();
    expect(() => createValidatedStoreItemProjection([...candidates, candidates[0]!])).toThrow(
      'Duplicate Store Item source tuple: release:caregivers',
    );

    expect(() =>
      createValidatedStoreItemProjection(
        [
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
        ],
        [],
      ),
    ).toThrow('Duplicate storeItemSlug same-slug: release:first, release:second');
  });
});
