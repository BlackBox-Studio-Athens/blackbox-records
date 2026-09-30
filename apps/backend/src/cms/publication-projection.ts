import { z } from 'zod';
import { ContentRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import type { ContentSnapshot } from '@blackbox/content-model';

/** Resolve the selected revision's native relation snapshot, never a newer draft's selection. */
export async function readRevisionContent(
  runtime: EmDashRuntime,
  revision: { collection: string; entryId: string; data: Record<string, unknown> },
) {
  if (!['releases', 'news'].includes(revision.collection) || !Object.hasOwn(revision.data, '_references'))
    return revision.data;
  const { _references, _referencesBaseline, ...data } = revision.data;
  const references = z
    .object({ artist: z.array(z.string().min(1)).max(1).optional() })
    .strict()
    .parse(_references);
  if (!references.artist) return data;
  const repository = new ContentRepository(runtime.db);
  const entry = await repository.findById(revision.collection, revision.entryId);
  if (!entry) throw new Error('The selected content is unavailable.');
  const artists = references.artist[0] ? await repository.findTranslations('artists', references.artist[0]) : [];
  const artist = artists.find((item) => item.locale === entry.locale);
  if (references.artist.length && !artist) throw new Error('The selected Artist is unavailable.');
  return { ...data, artist: artist?.id ?? '' };
}

export function projectArtistReference<T extends { data: Record<string, unknown>; references?: unknown }>(item: T): T {
  const references = item.references as { artist?: { children?: Array<{ id: string }> } } | undefined;
  const children = references?.artist?.children;
  if (!children) return item;
  if (children.length > 1) throw new Error('Select at most one Artist.');
  return { ...item, data: { ...item.data, artist: children[0]?.id ?? '' } };
}

/** The same selected source replaces its accepted catalog identity in review and publication. */
export function projectPublicationStoreItems(
  previous: ContentSnapshot['storeItems'],
  record: { collection: string; slug: string },
  catalog: NonNullable<ContentSnapshot['storeItems']>,
): ContentSnapshot['storeItems'] {
  if (!['releases', 'distro'].includes(record.collection)) return previous;
  const kind = record.collection === 'releases' ? 'release' : 'distro';
  const selected = catalog.filter((item) => item.sourceKind === kind && item.sourceId === record.slug);
  return [
    ...(previous ?? []).filter((item) => item.sourceKind !== kind || item.sourceId !== record.slug),
    ...selected,
    ...(kind === 'distro' && !selected.length
      ? [
          {
            sourceKind: 'distro' as const,
            sourceId: record.slug,
            storeItemSlug: record.slug,
            variantId: `variant_${record.slug}_standard`,
          },
        ]
      : []),
  ];
}

/** Reads native metadata only; accepted media never passes through this path. */
export async function readPublicationMedia(runtime: EmDashRuntime, id: string) {
  const result = await runtime.handleMediaGet(id);
  if (!result.success) throw new Error('A selected image is unavailable. Choose another image.');
  const media = z
    .object({
      storageKey: z.string().regex(/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:png|jpe?g|webp)$/i),
      filename: z.string().min(1).max(200),
      size: z
        .number()
        .int()
        .positive()
        .max(20 * 1024 * 1024),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    })
    .parse(result.data.item);
  if (/^(snapshots|backups|drafts)\//.test(media.storageKey))
    throw new Error('A selected image is unavailable. Choose another image.');
  return media;
}
