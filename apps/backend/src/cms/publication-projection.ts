import { z } from 'zod';
import type { EmDashRuntime } from 'emdash/middleware';
import type { ContentSnapshot } from '@blackbox/content-model';

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
