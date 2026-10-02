import { getImage } from 'astro:assets';
import { listArtistProfiles, listReleaseCatalog, listStoreItems } from '@/lib/catalog-data';
import { buildPreorderShowcaseCandidates } from '@/lib/preorder-showcase';
import type { StorePreorderShowcaseCandidate } from '@/components/store/StorePreorderShowcase';

export const prerender = true;

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
          const [cover, photo] = await Promise.all([
            getImage({ src: item.image, width: 720, format: 'webp' }),
            artist ? getImage({ src: artist.data.image, width: 1200, format: 'webp' }) : null,
          ]);
          return [item.slug, { coverUrl: cover.src, artistPhotoUrl: photo?.src ?? null }] as const;
        }),
    ),
  );
  const candidates: StorePreorderShowcaseCandidate[] = buildPreorderShowcaseCandidates(items, releases, images);
  return Response.json(candidates);
}
