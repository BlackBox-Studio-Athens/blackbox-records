import { z } from 'zod';
import type { EmDashRuntime } from 'emdash/middleware';
import {
  contentMediaIds,
  isCmsCollection,
  validateCmsContent,
  type PublicContent,
  type PublicationReviewInput,
} from '@blackbox/content-model';
import { previewInputSchema, type PreviewInput } from './preview-content';
import { readPublicationPointer, readPublishedSnapshot, type PublicationEnvironment } from './published-storage';
import { projectPublicationStoreItems, readPublicationMedia } from './publication-projection';
import { readPublicationCatalog } from './item-publication-recovery';
import { reviewPublication, PublicationReviewConflict } from './publication-review';

type Dependencies = {
  runtime: EmDashRuntime;
  bucket: R2Bucket;
  commerce: D1Database;
  environment: PublicationEnvironment;
};
export type PreviewSelection = {
  content: PublicContent;
  input: PreviewInput;
  media: Record<
    string,
    { key: string; filename: string; size: number; sha256?: string; mimeType: string; width: number; height: number }
  >;
};

export function previewDestination(selection: PreviewSelection, view: string, base: string) {
  const { collection, slug } = selection.input;
  if (['artists', 'releases', 'news'].includes(collection))
    return `${base}${collection}/${view === 'listing' ? '' : `${slug}/`}`;
  if (collection === 'distro') {
    const item = selection.content.storeItems?.find((item) => item.sourceKind === 'distro' && item.sourceId === slug);
    if (view !== 'listing' && !item) throw new Error('Store Item identity is unavailable.');
    return view === 'listing' ? `${base}store/distro/` : `${base}store/${item!.storeItemSlug}/`;
  }
  if (collection === 'distro_page') return `${base}store/distro/`;
  if (collection === 'purchase_information') return `${base}terms/`;
  return ['about', 'services'].includes(collection) ? `${base}${collection}/` : base;
}

export async function selectPreviewContent(
  input: PreviewInput | { collection: string; id: string; publication: PublicationReviewInput },
  deps: Dependencies,
): Promise<PreviewSelection> {
  let content: PublicContent;
  let selected: PreviewInput;
  if ('publication' in input) {
    if (!input.publication.baseline)
      throw new PublicationReviewConflict('Review the saved versions before previewing.');
    const { review, candidate } = await reviewPublication(input.publication, deps);
    const destination = review.destinations.find(
      (entry) => entry.collection === input.collection && entry.recordId === input.id,
    );
    const record = candidate.records.find((entry) => entry.collection === input.collection && entry.id === input.id);
    if (!destination || !record || review.dependencies.length || review.entries.some((entry) => entry.issues.length))
      throw new PublicationReviewConflict('Resolve the highlighted publication issues before previewing.');
    content = candidate;
    selected = { collection: record.collection, id: record.id, slug: record.slug, data: record.data };
  } else {
    selected = previewInputSchema.parse(input);
    if (!isCmsCollection(selected.collection)) throw new Error('Unsupported collection.');
    if (selected.collection === 'navigation') {
      selected = { ...selected, data: { ...selected.data } };
      for (const field of ['show_in_header', 'show_in_footer'])
        if (selected.data[field] === 0 || selected.data[field] === 1) selected.data[field] = selected.data[field] === 1;
    }
    const issues = validateCmsContent(selected.collection, selected.data);
    if (issues.length) throw new Error(issues.join('\n'));
    if (selected.id) {
      const current = await deps.runtime.handleContentGet(selected.collection, selected.id);
      if (!current.success || current.data.item.id !== selected.id || current.data.item.slug !== selected.slug)
        throw new Error('Reload this content before previewing.');
    }
    const current = await readPublicationPointer(deps.bucket, deps.environment);
    if (!current) throw new Error('The website has no published baseline. Ask a label administrator.');
    const baseline = await readPublishedSnapshot(deps.bucket, deps.environment, current.pointer.snapshotSha256);
    const record = {
      collection: selected.collection,
      id: selected.id ?? selected.slug,
      slug: selected.slug,
      data: z.record(z.string(), z.json()).parse(selected.data),
    };
    content = {
      ...baseline,
      records: [
        ...baseline.records.filter((entry) => entry.collection !== record.collection || entry.id !== record.id),
        record,
      ],
    };
    if (['releases', 'distro'].includes(record.collection))
      content.storeItems = projectPublicationStoreItems(
        content.storeItems,
        record,
        await readPublicationCatalog(deps.commerce),
      );
  }
  const media: PreviewSelection['media'] = {};
  const ids = [...new Set(content.records.flatMap((record) => contentMediaIds(record.data)))];
  let nativeReads = 0;
  for (const id of ids) {
    const accepted = content.media.find((item) => item.id === id);
    if (accepted) {
      media[id] = { ...accepted, key: `snapshots/${deps.environment}/media/${accepted.sha256}` };
    } else {
      if (++nativeReads > 100) throw new Error('Select fewer image-heavy entries (maximum 100 images).');
      const image = await readPublicationMedia(deps.runtime, id);
      media[id] = { ...image, key: image.storageKey };
    }
  }
  for (const record of content.records) {
    if (
      record.collection === 'releases' &&
      !content.records.some((artist) => artist.collection === 'artists' && artist.id === record.data.artist)
    )
      throw new Error('Include the linked Artist in the review before previewing this Release.');
  }
  return { content, input: selected, media };
}
