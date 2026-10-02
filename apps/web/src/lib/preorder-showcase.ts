import type { ReleaseCatalogEntry, StoreItem } from './catalog-data';

export function buildPreorderShowcaseCandidates(
  items: readonly Pick<
    StoreItem,
    'sourceKind' | 'sourceId' | 'slug' | 'title' | 'subtitle' | 'storePath' | 'releaseDate' | 'metadata'
  >[],
  releases: readonly { id: string; data: Pick<ReleaseCatalogEntry['data'], 'clips'> }[],
  images: ReadonlyMap<string, { coverUrl: string; artistPhotoUrl: string | null }>,
) {
  const releasesById = new Map(releases.map((release) => [release.id, release]));
  return items
    .filter((item) => item.sourceKind === 'release')
    .map((item) => {
      const release = releasesById.get(item.sourceId);
      const media = images.get(item.slug);
      if (!release || !media) throw new Error(`Missing pre-order showcase source or images for ${item.slug}`);
      return {
        slug: item.slug,
        title: item.title,
        artist: item.subtitle,
        option:
          item.metadata.slice(1).find((format) => format.trim().toLowerCase() !== 'digital') ?? 'Physical release',
        storePath: item.storePath,
        releaseDate: item.releaseDate?.toISOString().slice(0, 10) ?? null,
        coverUrl: media.coverUrl,
        firstClipId: release.data.clips?.[0]?.youtube_video_id ?? null,
        artistPhotoUrl: media.artistPhotoUrl,
      };
    });
}
