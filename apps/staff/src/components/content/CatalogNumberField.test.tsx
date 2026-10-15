import { expect, test } from 'vitest';
import type { ReleaseCatalogNumbers } from '@blackbox/content-model';
import { catalogNumberStatus } from './CatalogNumberField';

const numbers = {
  items: [
    {
      catalogNumber: 'BBR#001',
      releaseId: 'caregivers-id',
      slug: 'caregivers',
      title: 'Caregivers',
      status: 'published',
    },
    {
      catalogNumber: 'BBR#002',
      releaseId: 'disintegration-id',
      slug: 'disintegration',
      title: 'Disintegration',
      status: 'published',
    },
    { catalogNumber: 'BBR#005', releaseId: 'draft-id', slug: 'unfinished', title: 'Unfinished', status: 'draft' },
  ],
  nextFreeNumber: 'BBR#006',
} as ReleaseCatalogNumbers;

test('an empty number offers the next free one once the numbers in use are known', () => {
  expect(catalogNumberStatus('', numbers)).toEqual({ kind: 'empty', next: 'BBR#006' });
  expect(catalogNumberStatus(undefined, undefined)).toEqual({ kind: 'empty', next: null });
  expect(catalogNumberStatus(null, null)).toEqual({ kind: 'empty', next: null });
});

test('a typed number is free, this release’s own, or taken by another release', () => {
  expect(catalogNumberStatus('BBR#003', numbers, 'new-id')).toEqual({ kind: 'free', number: 'BBR#003' });
  expect(catalogNumberStatus('BBR#002', numbers, 'disintegration-id')).toEqual({ kind: 'current' });
  expect(catalogNumberStatus('BBR#002', numbers, 'new-id')).toEqual({
    kind: 'taken',
    title: 'Disintegration',
    draft: false,
  });
  // A number only another release's draft holds is still taken: saving would clash.
  expect(catalogNumberStatus('BBR#005', numbers)).toEqual({ kind: 'taken', title: 'Unfinished', draft: true });
});

test('malformed numbers are invalid and availability waits for the list', () => {
  for (const value of ['BBR#0', 'BBR#000', 'BBR#1', 'bbr#001', 7])
    expect(catalogNumberStatus(value, numbers).kind).toBe('invalid');
  expect(catalogNumberStatus('BBR#003', undefined)).toEqual({ kind: 'checking' });
  expect(catalogNumberStatus('BBR#003', null)).toEqual({ kind: 'unchecked' });
});
