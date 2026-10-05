import { getImage } from 'astro:assets';
import { listArtistProfiles, listReleaseCatalog, listStoreItems } from '@/lib/catalog-data';
import { buildPreorderShowcaseCandidates } from '@/lib/preorder-showcase';
import { largestImageWidth } from '@/platform/lib/editorial-image';
import type { StorePreorderShowcaseCandidate } from '@/components/store/StorePreorderShowcase';
import sidusVideoPoster from './_assets/video-posters/sidus-embrace-the-void.jpg';
import sidusBackgroundVideoUrl from './_assets/video-posters/sidus-embrace-the-void-loop.mp4?url';

// ponytail: one reviewed backdrop; add another exact clip-ID mapping only when its footage is prepared.
const preparedClipId = 'MOA5YZDOR6A';

export async function GET() {
  const [items, releases, artists] = await Promise.all([listStoreItems(), listReleaseCatalog(), listArtistProfiles()]);
  const releasesById = new Map(releases.map((release) => [release.id, release]));
  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));
  const images = new Map(
    await Promise.all(
      items
        .filter((item) => item.sourceKind === 'release')
        .map(async (item) => {
          const release = releasesById.get(item.sourceId);
          if (!release) throw new Error(`Missing showcase release for ${item.slug}`);
          const artist = artistsById.get(release.data.artist.id);
          const [cover, photo, videoPoster] = await Promise.all([
            getImage({
              src: release.data.cover_image,
              width: largestImageWidth(release.data.cover_image, [1200]),
              format: 'webp',
            }),
            artist
              ? getImage({
                  src: artist.data.image,
                  width: largestImageWidth(artist.data.image, [1800]),
                  format: 'webp',
                })
              : null,
            release.data.clips?.some((clip) => clip.youtube_video_id === preparedClipId)
              ? getImage({ src: sidusVideoPoster, width: 1200, format: 'webp' })
              : null,
          ]);
          const clipPosterUrls = new Map(videoPoster ? [[preparedClipId, videoPoster.src]] : []);
          const clipBackgroundVideoUrls = new Map(videoPoster ? [[preparedClipId, sidusBackgroundVideoUrl]] : []);
          return [
            item.slug,
            { coverUrl: cover.src, artistPhotoUrl: photo?.src ?? null, clipPosterUrls, clipBackgroundVideoUrls },
          ] as const;
        }),
    ),
  );
  const candidates: StorePreorderShowcaseCandidate[] = buildPreorderShowcaseCandidates(items, releases, images);
  return Response.json(candidates);
}
