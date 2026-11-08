import { getImage } from 'astro:assets';
import { listArtistProfiles, listReleaseCatalog, listStoreItems } from '@/lib/catalog-data';
import { buildPreorderShowcaseCandidates, selectShowcaseChapters } from '@/lib/preorder-showcase';
import { largestImageWidth } from '@/platform/lib/editorial-image';
import type { HomeOffer, OpenPreorder } from '@/lib/open-preorders';
import type { StorePreorderShowcaseItem } from '@/components/store/StorePreorderShowcase';
import sidusVideoPoster from './_assets/video-posters/sidus-embrace-the-void.jpg';
import sidusBackgroundVideoUrl from './_assets/video-posters/sidus-embrace-the-void-loop.mp4?url';
import sidusBackgroundVideoDesktopUrl from './_assets/video-posters/sidus-embrace-the-void-loop-desktop.mp4?url';
import afterwiseVideoPoster from './_assets/video-posters/afterwise-equilibrium.jpg';
import afterwiseBackgroundVideoUrl from './_assets/video-posters/afterwise-equilibrium-loop.mp4?url';
import afterwiseBackgroundVideoDesktopUrl from './_assets/video-posters/afterwise-equilibrium-loop-desktop.mp4?url';
import ouranopithecusVideoPoster from './_assets/video-posters/ouranopithecus-montagu.jpg';
import ouranopithecusBackgroundVideoUrl from './_assets/video-posters/ouranopithecus-montagu-loop.mp4?url';
import ouranopithecusBackgroundVideoDesktopUrl from './_assets/video-posters/ouranopithecus-montagu-loop-desktop.mp4?url';

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
  [
    'T_Bsh__tQXU',
    {
      poster: ouranopithecusVideoPoster,
      backgroundVideoUrl: ouranopithecusBackgroundVideoUrl,
      backgroundVideoDesktopUrl: ouranopithecusBackgroundVideoDesktopUrl,
    },
  ],
]);

/**
 * Home's chapters: accepted release Store Items the projection lists as open pre-orders, then releases staff keep on
 * Home that the projection lists with a stocked or sold-out offer, each with its projected price.
 */
export async function preorderShowcaseItems(
  preorders: readonly OpenPreorder[],
  homeOffers: readonly HomeOffer[],
): Promise<StorePreorderShowcaseItem[]> {
  // The projection lists every stocked release, so Home reads the rest of the catalog only when a pre-order is open or
  // staff keep a release on Home.
  const releases = await listReleaseCatalog();
  if (preorders.length === 0 && !(homeOffers.length > 0 && releases.some((release) => release.data.show_on_home)))
    return [];
  const [storeItems, artists] = await Promise.all([listStoreItems(), listArtistProfiles()]);
  const chapters = selectShowcaseChapters(storeItems, releases, preorders, homeOffers);
  const chapterBySlug = new Map(chapters.map(({ item, chapter }) => [item.slug, chapter]));
  // Images are prepared only for chapters, so an empty projection costs Home nothing.
  const items = chapters.map(({ item }) => item);
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
  return buildPreorderShowcaseCandidates(items, releases, images).map((candidate) => ({
    ...candidate,
    ...chapterBySlug.get(candidate.slug)!,
  }));
}
