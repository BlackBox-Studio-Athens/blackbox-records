import { expect, it } from 'vitest';
import type { PublicationReview } from '@blackbox/content-model';
import { publicationPreviewDestination } from './PublicationReviewFlow';

const review: PublicationReview = {
  baseline: 'a'.repeat(64),
  environment: 'local',
  publicUrl: 'http://localhost',
  entries: [
    {
      collection: 'releases',
      recordId: 'release',
      expectedRevision: 'release-revision',
      title: 'Release',
      slug: 'release',
      before: {},
      after: {},
      issues: [],
    },
    {
      collection: 'navigation',
      recordId: 'navigation',
      expectedRevision: 'navigation-revision',
      title: 'Navigation',
      slug: 'navigation',
      before: {},
      after: {},
      issues: [],
    },
  ],
  destinations: [
    { collection: 'releases', recordId: 'release', slug: 'release', title: 'Release' },
    { collection: 'navigation', recordId: 'navigation', slug: 'navigation', title: 'Navigation' },
    { collection: 'home', recordId: 'home', slug: '', title: 'Homepage' },
  ],
  dependencies: [],
  media: {},
  referenceTitles: {},
  baselineReferenceTitles: {},
};

it('follows the active entry and sends shared website changes to the homepage', () => {
  expect(publicationPreviewDestination(review, 'releases/release')).toMatchObject({ title: 'Release' });
  expect(publicationPreviewDestination(review, 'navigation/navigation')).toMatchObject({ title: 'Homepage' });
  expect(publicationPreviewDestination(review, 'missing/missing')).toMatchObject({ title: 'Release' });
});
