import type { ReleaseCatalogEntry, StoreItem } from './catalog-data';
import { tracklistGroups } from '@blackbox/content-model';

export function buildPreorderShowcaseCandidates(
  items: readonly Pick<
    StoreItem,
    | 'sourceKind'
    | 'sourceId'
    | 'slug'
    | 'title'
    | 'subtitle'
    | 'storePath'
    | 'releaseDate'
    | 'metadata'
    | 'summary'
    | 'embeddedPlayerData'
  >[],
  releases: readonly { id: string; data: Pick<ReleaseCatalogEntry['data'], 'clips' | 'tracklist' | 'credits'> }[],
  images: ReadonlyMap<
    string,
    { coverUrl: string; artistPhotoUrl: string | null; clipPosterUrls?: ReadonlyMap<string, string> }
  >,
) {
  const releasesById = new Map(releases.map((release) => [release.id, release]));
  return items
    .filter((item) => item.sourceKind === 'release')
    .map((item) => {
      const release = releasesById.get(item.sourceId);
      const media = images.get(item.slug);
      if (!release || !media) throw new Error(`Missing pre-order showcase source or images for ${item.slug}`);
      const option =
        item.metadata.slice(1).find((format) => format.trim().toLowerCase() !== 'digital') ?? 'Physical release';
      const trackCount = tracklistGroups(release.data.tracklist, option).reduce(
        (count, group) => count + group.tracks.length,
        0,
      );
      const bandcamp = item.embeddedPlayerData?.providers.find((provider) => provider.id === 'bandcamp');
      const tidal = item.embeddedPlayerData?.providers.find((provider) => provider.id === 'tidal');
      return {
        slug: item.slug,
        title: item.title,
        artist: item.subtitle,
        option,
        storePath: item.storePath,
        releaseDate: item.releaseDate?.toISOString().slice(0, 10) ?? null,
        coverUrl: media.coverUrl,
        firstClipId: release.data.clips?.[0]?.youtube_video_id ?? null,
        clips: (release.data.clips ?? []).map((clip) => ({
          id: clip.youtube_video_id,
          title: clip.title,
          posterUrl: media.clipPosterUrls?.get(clip.youtube_video_id) ?? null,
        })),
        artistPhotoUrl: media.artistPhotoUrl,
        summary: item.summary?.split(/(?<=[.!?])\s/)[0] ?? null,
        trackCount: trackCount || null,
        recording: release.data.credits?.find((credit) => /^recorded and mixed at$/i.test(credit.role))?.name ?? null,
        listen: item.embeddedPlayerData
          ? {
              releaseId: item.embeddedPlayerData.releaseId,
              bandcampEmbedUrl: bandcamp?.embedUrl ?? null,
              tidalEmbedUrl: tidal?.embedUrl ?? null,
            }
          : null,
      };
    });
}
