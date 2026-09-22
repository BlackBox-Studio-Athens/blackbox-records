import { z } from 'zod';
import type { EmDashRuntime } from 'emdash/middleware';
import {
  contentMediaIds,
  isCmsCollection,
  validateCmsRevisionContent,
  publicationReviewSchema,
  type PublicationReview,
  type PublicationReviewInput,
  type ContentSnapshot,
} from '@blackbox/content-model';
import { readPublicationPointer, readPublishedSnapshot, type PublicationEnvironment } from './published-storage';
import { projectPublicationStoreItems, readPublicationMedia } from './publication-projection';
import { readPublicationCatalog } from './item-publication-recovery';

export class PublicationReviewConflict extends Error {}
type Dependencies = {
  runtime: EmDashRuntime;
  bucket: R2Bucket;
  environment: PublicationEnvironment;
  commerce: D1Database;
};
export function publicationPublicUrl(environment: PublicationEnvironment) {
  return environment === 'local'
    ? 'http://127.0.0.1:4321/blackbox-records/'
    : `https://blackbox-records-web${environment === 'uat' ? '-uat' : ''}.pages.dev/`;
}

export async function reviewPublication(input: PublicationReviewInput, deps: Dependencies) {
  let reads = 0;
  const selected = publicationReviewSchema.parse(input);
  const current = await readPublicationPointer(deps.bucket, deps.environment);
  if (!current)
    throw new PublicationReviewConflict('The website has no published baseline. Ask a label administrator.');
  const baseline = current.pointer.snapshotSha256;
  if (selected.baseline && selected.baseline !== baseline)
    throw new PublicationReviewConflict('The website changed. Review the latest comparison before publishing.');
  const snapshot = await readPublishedSnapshot(deps.bucket, deps.environment, baseline);
  const review: PublicationReview = {
    baseline,
    environment: deps.environment,
    publicUrl: publicationPublicUrl(deps.environment),
    entries: [],
    destinations: [],
    dependencies: [],
    media: {},
    referenceTitles: {},
    baselineReferenceTitles: Object.fromEntries(
      snapshot.records
        .filter((record) => record.collection === 'artists')
        .map((record) => [record.id, String(record.data.title ?? record.slug)]),
    ),
  };
  const candidate: ContentSnapshot = { ...snapshot, records: [...snapshot.records] };
  let catalog: Awaited<ReturnType<typeof readPublicationCatalog>> | undefined;
  for (const record of selected.records) {
    if (!isCmsCollection(record.collection)) throw new PublicationReviewConflict('Unsupported collection.');
    reads++;
    const result = await deps.runtime.handleContentGet(record.collection, record.recordId);
    if (!result.success) throw new PublicationReviewConflict('A selected entry is unavailable. Return to selection.');
    const { item, _rev } = result.data;
    if (!_rev) throw new PublicationReviewConflict('The saved version is unavailable. Reload the entry.');
    if (record.expectedRevision && record.expectedRevision !== _rev)
      throw new PublicationReviewConflict('A selected draft changed. Review its latest saved version.');
    const revisionId = item.draftRevisionId ?? item.liveRevisionId;
    if (!revisionId) throw new PublicationReviewConflict('Save the selected entry before reviewing.');
    reads++;
    const revision = await deps.runtime.handleRevisionGet(revisionId);
    if (
      !revision.success ||
      revision.data.item.entryId !== item.id ||
      revision.data.item.collection !== record.collection
    )
      throw new PublicationReviewConflict('The saved version is unavailable. Review again.');
    const { _slug, ...after } = revision.data.item.data;
    if (record.collection === 'navigation')
      for (const key of ['show_in_header', 'show_in_footer'])
        if (after[key] === 0 || after[key] === 1) after[key] = after[key] === 1;
    const slug = String(_slug ?? item.slug);
    const before = snapshot.records.find((r) => r.collection === record.collection && r.id === record.recordId);
    review.entries.push({
      collection: record.collection,
      recordId: item.id,
      expectedRevision: _rev,
      slug,
      title: String(after.title ?? after.label_name ?? slug),
      before: before ? { ...before.data, slug: before.slug } : null,
      after: { ...after, slug },
      issues: validateCmsRevisionContent(record.collection, after),
    });
    candidate.records = candidate.records.filter((r) => r.collection !== record.collection || r.id !== item.id);
    candidate.records.push({
      collection: record.collection,
      id: item.id,
      revisionId,
      slug,
      data: z.record(z.string(), z.json()).parse(after),
    });
    if (['releases', 'distro'].includes(record.collection)) {
      catalog ??= await readPublicationCatalog(deps.commerce);
      candidate.storeItems = projectPublicationStoreItems(
        candidate.storeItems,
        { collection: record.collection, slug },
        catalog,
      );
    }
  }
  review.destinations = review.entries.map(({ collection, recordId, slug, title }) => ({
    collection,
    recordId,
    slug,
    title,
  }));
  const globalChange = review.entries.some((entry) =>
    ['navigation', 'socials', 'settings', 'newsletter'].includes(entry.collection),
  );
  for (const entry of candidate.records.filter(
    (record) => record.collection === 'home' || (globalChange && ['about', 'services'].includes(record.collection)),
  )) {
    if (
      !review.destinations.some(
        (destination) => destination.collection === entry.collection && destination.recordId === entry.id,
      )
    )
      review.destinations.push({
        collection: entry.collection,
        recordId: entry.id,
        slug: entry.slug,
        title:
          entry.collection === 'home'
            ? 'Homepage'
            : `${entry.collection[0]!.toUpperCase()}${entry.collection.slice(1)} page`,
      });
  }
  for (const entry of candidate.records.filter((r) => r.collection === 'artists'))
    review.referenceTitles[entry.id] = String(entry.data.title ?? entry.slug);
  for (const entry of review.entries) {
    if (entry.collection !== 'releases' || typeof entry.after.artist !== 'string') continue;
    if (candidate.records.some((r) => r.collection === 'artists' && r.id === entry.after.artist)) continue;
    reads++;
    const artist = await deps.runtime.handleContentGet('artists', entry.after.artist);
    const title = artist.success ? String(artist.data.item.data.title ?? artist.data.item.slug) : 'Unavailable artist';
    review.dependencies.push({
      collection: 'artists',
      recordId: entry.after.artist,
      title,
      requiredBy: entry.title,
      available: artist.success,
    });
    review.referenceTitles[entry.after.artist] = title;
  }
  // One read per distinct selected image; never scan the media library or unrelated drafts.
  const ids = [...new Set(review.entries.flatMap((entry) => contentMediaIds(entry.after)))];
  if (ids.length > 100) throw new PublicationReviewConflict('Select fewer image-heavy entries (maximum 100 images).');
  for (const id of ids) {
    const accepted = snapshot.media.find((m) => m.id === id);
    if (accepted) continue;
    reads++;
    const media = await readPublicationMedia(deps.runtime, id).catch(() => null);
    if (!media) {
      for (const entry of review.entries.filter((e) => contentMediaIds(e.after).includes(id)))
        entry.issues.push('A selected image is unavailable. Choose another image.');
      continue;
    }
    review.media[id] = {
      src: `/_emdash/api/media/file/${media.storageKey}`,
      width: media.width,
      height: media.height,
      format: media.mimeType === 'image/jpeg' ? 'jpg' : media.mimeType.slice(6),
    };
  }
  for (const media of snapshot.media)
    review.media[media.id] = {
      src: `/_emdash/api/blackbox/review-media/${baseline}/${media.sha256}`,
      width: media.width,
      height: media.height,
      format: media.mimeType === 'image/jpeg' ? 'jpg' : media.mimeType.slice(6),
    };
  return { review, candidate, reads };
}
