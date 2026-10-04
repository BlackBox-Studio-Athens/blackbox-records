import { getImage } from 'astro:assets';
import { listArtistProfiles, listReleaseCatalog, listStoreItems } from '@/lib/catalog-data';
import { buildPreorderShowcaseCandidates } from '@/lib/preorder-showcase';
import type { StorePreorderShowcaseCandidate } from '@/components/store/StorePreorderShowcase';
import sidusVideoPoster from './_assets/video-posters/sidus-embrace-the-void.jpg';

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
            getImage({ src: release.data.cover_image, width: 720, format: 'webp' }),
            artist ? getImage({ src: artist.data.image, width: 1200, format: 'webp' }) : null,
            artist?.data.slug === 'sidus' ? getImage({ src: sidusVideoPoster, width: 1200, format: 'webp' }) : null,
          ]);
          const clipPosterUrls = new Map(
            (release.data.clips ?? []).flatMap((clip) =>
              videoPoster && /^embrace the void(?:\s|$)/i.test(clip.title)
                ? [[clip.youtube_video_id, videoPoster.src] as const]
                : [],
            ),
          );
          return [item.slug, { coverUrl: cover.src, artistPhotoUrl: photo?.src ?? null, clipPosterUrls }] as const;
        }),
    ),
  );
  const candidates: StorePreorderShowcaseCandidate[] = buildPreorderShowcaseCandidates(items, releases, images);
  return Response.json(candidates, { headers: { 'Cache-Control': 'no-store' } });
}
