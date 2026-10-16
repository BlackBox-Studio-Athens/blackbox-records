import { getImage } from 'astro:assets';
import { listArtistProfiles, listReleaseCatalog, listStoreItems } from '@/lib/catalog-data';
import { buildPreorderShowcaseCandidates } from '@/lib/preorder-showcase';
import { largestImageWidth } from '@/platform/lib/editorial-image';
import type { OpenPreorder } from '@/lib/open-preorders';
import type { StorePreorderShowcaseItem } from '@/components/store/StorePreorderShowcase';
import sidusVideoPoster from './_assets/video-posters/sidus-embrace-the-void.jpg';
import sidusBackgroundVideoUrl from './_assets/video-posters/sidus-embrace-the-void-loop.mp4?url';
import sidusBackgroundVideoDesktopUrl from './_assets/video-posters/sidus-embrace-the-void-loop-desktop.mp4?url';
import afterwiseVideoPoster from './_assets/video-posters/afterwise-equilibrium.jpg';
import afterwiseBackgroundVideoUrl from './_assets/video-posters/afterwise-equilibrium-loop.mp4?url';
import afterwiseBackgroundVideoDesktopUrl from './_assets/video-posters/afterwise-equilibrium-loop-desktop.mp4?url';

// Covers fill at most a 21.25rem slot and share the Store card widths (one cached transform per cover); band photos
// span the viewport.
const coverWidths = [360, 720];
const photoWidths = [800, 1200, 1800];

// ponytail: reviewed exact-ID backdrops; prepare a small loop and poster before adding another.
const preparedClips = new Map([
  [
    'MOA5YZDOR6A',
    {
      poster: sidusVideoPoster,
      backgroundVideoUrl: sidusBackgroundVideoUrl,
      backgroundVideoDesktopUrl: sidusBackgroundVideoDesktopUrl,
    },
  ],
  [
    'Cl7rWCTGEqY',
    {
      poster: afterwiseVideoPoster,
      backgroundVideoUrl: afterwiseBackgroundVideoUrl,
      backgroundVideoDesktopUrl: afterwiseBackgroundVideoDesktopUrl,
    },
  ],
]);

/** Home's pre-order chapters: accepted release Store Items the open pre-order projection lists, with its price. */
export async function preorderShowcaseItems(preorders: readonly OpenPreorder[]): Promise<StorePreorderShowcaseItem[]> {
  if (preorders.length === 0) return [];
  const bySlug = new Map(preorders.map((preorder) => [preorder.storeItemSlug, preorder]));
  const [storeItems, releases, artists] = await Promise.all([
    listStoreItems(),
    listReleaseCatalog(),
    listArtistProfiles(),
  ]);
  // Images are prepared only for projected items, so an empty projection costs Home nothing.
  const items = storeItems.filter((item) => item.sourceKind === 'release' && bySlug.has(item.slug));
  const releasesById = new Map(releases.map((release) => [release.id, release]));
  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));
  const images = new Map(
    await Promise.all(
      items.map(async (item) => {
        const release = releasesById.get(item.sourceId);
        if (!release) throw new Error(`Missing showcase release for ${item.slug}`);
        const artist = artistsById.get(release.data.artist.id);
        const [cover, photo, clipMedia] = await Promise.all([
          getImage({
            src: release.data.cover_image,
            widths: coverWidths,
            width: largestImageWidth(release.data.cover_image, coverWidths),
            format: 'webp',
          }),
          artist
            ? getImage({
                src: artist.data.image,
                widths: photoWidths,
                width: largestImageWidth(artist.data.image, photoWidths),
                format: 'webp',
              })
            : null,
          Promise.all(
            [...preparedClips]
              .filter(([id]) => release.data.clips?.some((clip) => clip.youtube_video_id === id))
              .map(async ([id, media]) => {
                const poster = await getImage({ src: media.poster, width: 1200, format: 'webp' });
                return [id, poster.src, media.backgroundVideoUrl, media.backgroundVideoDesktopUrl] as const;
              }),
          ),
        ]);
        const clipPosterUrls = new Map(clipMedia.map(([id, posterUrl]) => [id, posterUrl] as const));
        const clipBackgroundVideoUrls = new Map(clipMedia.map(([id, , videoUrl]) => [id, videoUrl] as const));
        const clipBackgroundVideoDesktopUrls = new Map(clipMedia.map(([id, , , videoUrl]) => [id, videoUrl] as const));
        return [
          item.slug,
          {
            coverUrl: cover.src,
            coverSrcSet: cover.srcSet?.attribute || undefined,
            artistPhotoUrl: photo?.src ?? null,
            artistPhotoSrcSet: photo?.srcSet?.attribute || undefined,
            clipPosterUrls,
            clipBackgroundVideoUrls,
            clipBackgroundVideoDesktopUrls,
          },
        ] as const;
      }),
    ),
  );
  return buildPreorderShowcaseCandidates(items, releases, images).map((candidate) => {
    const { displayPrice, shipEstimate } = bySlug.get(candidate.slug)!;
    return { ...candidate, displayPrice, shipEstimate };
  });
}
