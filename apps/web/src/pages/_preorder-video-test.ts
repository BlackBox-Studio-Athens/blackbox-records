import type { StorePreorderShowcaseItem } from '@/components/store/StorePreorderShowcase';
import { createProjectRelativeUrl } from '@/platform/config/site';
import sidusPoster from './_assets/video-posters/sidus-embrace-the-void.jpg?url';
import sidusFilm from './_assets/video-posters/sidus-embrace-the-void-loop.mp4?url';
import sidusDesktopFilm from './_assets/video-posters/sidus-embrace-the-void-loop-desktop.mp4?url';
import afterwisePoster from './_assets/video-posters/afterwise-equilibrium.jpg?url';
import afterwiseFilm from './_assets/video-posters/afterwise-equilibrium-loop.mp4?url';
import afterwiseDesktopFilm from './_assets/video-posters/afterwise-equilibrium-loop-desktop.mp4?url';

// Public PRD chapter details captured 17 October 2026; reuse existing image profiles and prepared footage.
const coverOrigin =
  'https://images.blackboxrecordsathens.com/cdn-cgi/image/width=720,format=webp/https://blackbox-records-web.pages.dev/media/content/';

export function preorderVideoTestItems(): StorePreorderShowcaseItem[] {
  return [
    {
      slug: 'uat-video-lotus',
      title: 'LOTUS',
      artist: 'Sidus',
      artistPhotoUrl: null,
      firstClipId: 'MOA5YZDOR6A',
      artistPath: createProjectRelativeUrl('/artists/'),
      option: "Divine Paradox Edition - Dark Green and Creamy White Vinyl 12''",
      coverUrl: coverOrigin + 'fab86b9cdd8422a83c86c145e9bd845ff81e5df85325be7efa3455b88515b645',
      storePath: createProjectRelativeUrl('/store/'),
      displayPrice: '€26.00',
      releaseDate: '2026-10-02',
      shipEstimate: { kind: 'month', month: '2026-11', part: null },
      clips: [
        {
          id: 'MOA5YZDOR6A',
          title: 'Embrace The Void',
          posterUrl: sidusPoster,
          backgroundVideoUrl: sidusFilm,
          backgroundVideoDesktopUrl: sidusDesktopFilm,
        },
      ],
      listen: {
        releaseId: 'uat-video-lotus',
        bandcampEmbedUrl:
          'https://bandcamp.com/EmbeddedPlayer/album=2528595733/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/',
        tidalEmbedUrl: null,
      },
    },
    {
      slug: 'uat-video-disintegration',
      title: 'Disintegration',
      artist: 'Afterwise',
      artistPhotoUrl: null,
      firstClipId: 'Cl7rWCTGEqY',
      artistPath: createProjectRelativeUrl('/artists/afterwise/'),
      option: "Orange w/ Smoke Vinyl LP 12''",
      coverUrl: coverOrigin + 'e827d48f64543c8cc9aedf79457764226e861c30b96aeedd06db241d494e30c5',
      storePath: createProjectRelativeUrl('/store/'),
      displayPrice: '€25.00',
      releaseDate: '2026-06-09',
      shipEstimate: { kind: 'month', month: '2026-11', part: null },
      clips: [
        {
          id: 'Cl7rWCTGEqY',
          title: 'Equilibrium · Live at Fuzz Club Athens',
          posterUrl: afterwisePoster,
          backgroundVideoUrl: afterwiseFilm,
          backgroundVideoDesktopUrl: afterwiseDesktopFilm,
        },
      ],
      listen: {
        releaseId: 'uat-video-disintegration',
        bandcampEmbedUrl:
          'https://bandcamp.com/EmbeddedPlayer/album=3481803854/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/',
        tidalEmbedUrl: 'https://embed.tidal.com/albums/521945607?coverInitially=true&disableAnalytics=true',
      },
    },
  ];
}
