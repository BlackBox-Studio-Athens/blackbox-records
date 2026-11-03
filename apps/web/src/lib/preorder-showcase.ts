import type { ReleaseCatalogEntry, StoreItem } from './catalog-data';
import type { HomeOffer, OpenPreorder } from './open-preorders';
import type { ShipEstimate } from '@/platform/lib/preorder-estimate';
import { tracklistGroups } from '@blackbox/content-model';

/** What a Home chapter sells: an open pre-order, or a kept release in stock or sold out (price null when none is listed). */
export type ChapterOffer =
  | { offer: 'preorder'; displayPrice: string; shipEstimate: ShipEstimate | null }
  | { offer: 'stocked' | 'sold_out'; displayPrice: string | null };

type ChapterSource = Pick<StoreItem, 'sourceKind' | 'sourceId' | 'slug' | 'releaseDate'>;

/**
 * Home's chapters: open pre-orders first, then releases staff keep on Home that have a stocked or sold-out Home offer
 * (newest release date first, slug as the tie-break). A release on an open pre-order appears once, as a pre-order.
 */
export function selectShowcaseChapters<T extends ChapterSource>(
  storeItems: readonly T[],
  releases: readonly { id: string; data: { show_on_home?: boolean | undefined } }[],
  preorders: readonly OpenPreorder[],
  homeOffers: readonly HomeOffer[],
): { item: T; chapter: ChapterOffer }[] {
  const preorderBySlug = new Map(preorders.map((preorder) => [preorder.storeItemSlug, preorder]));
  const offerBySlug = new Map(homeOffers.map((offer) => [offer.storeItemSlug, offer]));
  const featuredReleaseIds = new Set(releases.filter((release) => release.data.show_on_home).map((r) => r.id));
  const releaseItems = storeItems.filter((item) => item.sourceKind === 'release');
  const open = releaseItems.flatMap((item): { item: T; chapter: ChapterOffer }[] => {
    const preorder = preorderBySlug.get(item.slug);
    return preorder
      ? [
          {
            item,
            chapter: { offer: 'preorder', displayPrice: preorder.displayPrice, shipEstimate: preorder.shipEstimate },
          },
        ]
      : [];
  });
  const kept = releaseItems
    .filter(
      (item) => !preorderBySlug.has(item.slug) && offerBySlug.has(item.slug) && featuredReleaseIds.has(item.sourceId),
    )
    .sort(
      (a, b) =>
        (b.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY) -
          (a.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY) || a.slug.localeCompare(b.slug),
    )
    .map((item): { item: T; chapter: ChapterOffer } => {
      const { availability, displayPrice } = offerBySlug.get(item.slug)!;
      return { item, chapter: { offer: availability, displayPrice } };
    });
  return [...open, ...kept];
}

export function buildPreorderShowcaseCandidates(
  items: readonly Pick<
    StoreItem,
    | 'sourceKind'
    | 'sourceId'
    | 'slug'
    | 'title'
    | 'subtitle'
    | 'artistPath'
    | 'storePath'
    | 'releaseDate'
    | 'metadata'
    | 'summary'
    | 'embeddedPlayerData'
  >[],
  releases: readonly { id: string; data: Pick<ReleaseCatalogEntry['data'], 'clips' | 'tracklist' | 'credits'> }[],
  images: ReadonlyMap<
    string,
    {
      coverUrl: string;
      coverSrcSet?: string | undefined;
      artistPhotoUrl: string | null;
      artistPhotoSrcSet?: string | undefined;
      clipPosterUrls?: ReadonlyMap<string, string>;
      clipBackgroundVideoUrls?: ReadonlyMap<string, string>;
      clipBackgroundVideoDesktopUrls?: ReadonlyMap<string, string>;
    }
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
        artistPath: item.artistPath ?? null,
        option,
        storePath: item.storePath,
        releaseDate: item.releaseDate?.toISOString().slice(0, 10) ?? null,
        coverUrl: media.coverUrl,
        ...(media.coverSrcSet ? { coverSrcSet: media.coverSrcSet } : {}),
        firstClipId: release.data.clips?.[0]?.youtube_video_id ?? null,
        clips: (release.data.clips ?? []).map((clip) => ({
          id: clip.youtube_video_id,
          title: clip.title,
          posterUrl: media.clipPosterUrls?.get(clip.youtube_video_id) ?? null,
          backgroundVideoUrl: media.clipBackgroundVideoUrls?.get(clip.youtube_video_id) ?? null,
          ...(media.clipBackgroundVideoDesktopUrls?.has(clip.youtube_video_id)
            ? { backgroundVideoDesktopUrl: media.clipBackgroundVideoDesktopUrls.get(clip.youtube_video_id)! }
            : {}),
        })),
        artistPhotoUrl: media.artistPhotoUrl,
        ...(media.artistPhotoUrl && media.artistPhotoSrcSet ? { artistPhotoSrcSet: media.artistPhotoSrcSet } : {}),
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
