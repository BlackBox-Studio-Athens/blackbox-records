import { expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { changedPublicationFields, publicationReviewSchema, type PublicationReview } from '@blackbox/content-model';
import PublicationComparison from './PublicationComparison';

test('comparison ignores object key ordering but retains changed list order, formatting, links and image descriptions', () => {
  expect(
    changedPublicationFields({
      before: {
        image: { id: 'old' },
        image_alt: 'Old cover',
        links: ['a', 'b'],
        body: [{ text: 'Text', marks: [] }],
        unchanged: { a: 1, b: 2 },
        enriched: { id: 'same' },
      },
      after: {
        image: { id: 'new' },
        image_alt: 'New cover',
        links: ['b', 'a'],
        body: [{ text: 'Text', marks: ['strong'] }],
        unchanged: { b: 2, a: 1 },
        enriched: { id: 'same', provider: 'local', width: 100 },
      },
    }),
  ).toEqual(['image', 'image_alt', 'links', 'body']);
});
test('renders readable before/after values and new entry state without internal image identities', () => {
  const review: PublicationReview = {
    baseline: 'a'.repeat(64),
    environment: 'local',
    publicUrl: 'http://localhost',
    entries: [
      {
        collection: 'news',
        recordId: 'news',
        expectedRevision: 'rev',
        title: 'Announcement',
        slug: 'announcement',
        before: null,
        after: {
          title: 'Announcement',
          image: { id: 'private-image-id' },
          image_alt: 'Cover description',
          body: [
            { _type: 'block', children: [{ _type: 'span', text: 'A new record', marks: ['strong'] }], markDefs: [] },
            { _type: 'image', asset: { _ref: 'private-image-id' }, alt: 'Inline illustration' },
          ],
        },
        issues: [],
      },
    ],
    dependencies: [],
    destinations: [],
    media: { 'private-image-id': { src: '/image.png', width: 100, height: 100, format: 'png' } },
    referenceTitles: {},
    baselineReferenceTitles: {},
  };
  const html = renderToStaticMarkup(<PublicationComparison review={review} />);
  expect(html).toContain('Not yet published');
  expect(html).toContain('On the website');
  expect(html).toContain('After publishing');
  expect(html).toContain('<strong>A new record</strong>');
  expect(html).toContain('Cover description');
  expect(html).toContain('Inline illustration');
  expect(html).not.toContain('private-image-id');
  expect(html).not.toContain('_type');
  review.entries[0]!.before = { artist: 'old-artist' };
  review.entries[0]!.after = { artist: 'new-artist' };
  review.baselineReferenceTitles = { 'old-artist': 'Original artist name' };
  review.referenceTitles = { 'old-artist': 'Renamed draft', 'new-artist': 'New artist name' };
  const referenceHtml = renderToStaticMarkup(<PublicationComparison review={review} />);
  expect(referenceHtml).toContain('Original artist name');
  expect(referenceHtml).toContain('New artist name');
  expect(referenceHtml).not.toContain('Renamed draft');
});
test('review input enforces distinct entries, bounded selections and no browser-authored content', () => {
  const entry = { collection: 'news', recordId: 'news' };
  expect(publicationReviewSchema.safeParse({ records: [entry, entry] }).success).toBe(false);
  expect(
    publicationReviewSchema.safeParse({
      records: Array.from({ length: 21 }, (_, i) => ({ ...entry, recordId: `news-${i}` })),
    }).success,
  ).toBe(false);
  expect(publicationReviewSchema.safeParse({ records: [{ ...entry, data: { title: 'injected' } }] }).success).toBe(
    false,
  );
});
