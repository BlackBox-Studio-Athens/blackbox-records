import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StorePreorderShowcase, {
  type StorePreorderShowcaseCandidate,
  type StorePreorderShowcaseItem,
} from './StorePreorderShowcase';

vi.mock('astro:config/client', () => ({ base: '/blackbox-records/', site: undefined }));

const clip: StorePreorderShowcaseCandidate = {
  slug: 'clip-vinyl',
  title: 'Clip album',
  artist: 'Clip band',
  artistPath: '/blackbox-records/artists/clip-band/',
  option: 'Vinyl',
  storePath: '/blackbox-records/store/clip-vinyl/',
  releaseDate: '2026-10-16',
  coverUrl: '/clip.webp',
  firstClipId: 'dQw4w9WgXcQ',
  clips: [
    { id: 'dQw4w9WgXcQ', title: 'First official video', posterUrl: '/video-poster.webp' },
    { id: '01234567890', title: 'Second official video', posterUrl: null },
  ],
  artistPhotoUrl: '/clip-band.webp',
};
const photo: StorePreorderShowcaseCandidate = {
  ...clip,
  slug: 'photo-vinyl',
  title: 'Photo album',
  storePath: '/blackbox-records/store/photo-vinyl/',
  firstClipId: null,
  clips: [],
  artistPhotoUrl: '/photo-band.webp',
};
const cover: StorePreorderShowcaseCandidate = {
  ...clip,
  slug: 'cover-vinyl',
  title: 'Cover album',
  storePath: '/blackbox-records/store/cover-vinyl/',
  firstClipId: null,
  clips: [],
  artistPhotoUrl: null,
};
const storeUrl = '/blackbox-records/store/';

// Home passes server-built items: accepted candidates the open pre-order projection lists, with its price and estimate.
function item(
  candidate: StorePreorderShowcaseCandidate,
  overrides: Partial<Pick<StorePreorderShowcaseItem, 'displayPrice' | 'shipEstimate'>> = {},
): StorePreorderShowcaseItem {
  return {
    ...candidate,
    displayPrice: '€28.00',
    shipEstimate: { kind: 'month', month: '2026-10', part: null },
    ...overrides,
  };
}

function render(items: StorePreorderShowcaseItem[]) {
  return <StorePreorderShowcase items={items} storeUrl={storeUrl} />;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('StorePreorderShowcase first paint', () => {
  it('renders no section without projected pre-orders', () => {
    expect(renderToStaticMarkup(render([]))).toBe('');
  });

  it('puts the chapters, price and estimate in the server markup without a browser read', () => {
    const fetchRequest = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchRequest);
    const html = renderToStaticMarkup(render([item(clip), item(photo, { displayPrice: '€31.50' })]));
    expect(html).toContain('id="preorders"');
    expect(html.match(/<article /g)).toHaveLength(2);
    expect(html).toContain('€28.00');
    expect(html).toContain('€31.50');
    expect(html.toLowerCase()).toContain('around october 2026');
    expect(fetchRequest).not.toHaveBeenCalled();
    // Hydration adds media behavior only: the island has no listing, candidate or retry read to start.
    const source = readFileSync(new URL('./StorePreorderShowcase.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/fetch\(|listing-prices|preorder-showcase\.json|setTimeout\(/);
  });
});

describe('StorePreorderShowcase presentation', () => {
  it.each([clip, photo, cover])(
    'renders the $slug chapter with truthful terms and a real Store Item link',
    (candidate) => {
      const html = renderToStaticMarkup(render([item(candidate)]));
      expect(html.includes('home-preorders__video-poster')).toBe(Boolean(candidate.firstClipId));
      expect(html.includes('home-preorders__band-photo')).toBe(
        !candidate.firstClipId && Boolean(candidate.artistPhotoUrl),
      );
      expect(html.includes('Watch full video')).toBe(Boolean(candidate.firstClipId));
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('youtube');
      expect(html).toContain(candidate.title);
      expect(html).toContain(candidate.artist);
      expect(html).toContain('Pre-order · out 16 Oct 2026');
      expect(html.toLowerCase()).toContain('around october 2026');
      expect(html).toContain('Pre-order &amp; delivery information');
      expect(html).not.toContain('Charged in full');
      expect(html).not.toContain('<dt>Payment</dt>');
      expect(html).toContain(`href="${candidate.artistPath}"`);
      expect(html).not.toContain('target="_blank"');
      expect(html).not.toContain('Open artwork');
      expect(html).not.toContain('home-preorders__cover-link');
      expect(html).not.toContain('Album details');
      expect(html).not.toContain('home-preorders__watch-area');
      expect(html.split(`src="${candidate.coverUrl}"`)).toHaveLength(2);
      expect(html).not.toContain('The record');
      expect(html).toContain('href="/blackbox-records/store/#preorders"');
      expect(html).toContain(`href="${candidate.storePath}"`);
      expect(html).toContain('€28.00');
      expect(html).not.toContain('mailto:orders@blackboxrecordsathens.com');
      expect(html).not.toContain('Deliver to Greece');
      expect(html).not.toContain('Next pre-order:');
    },
  );

  it('presents only the background video as text while keeping explicit Watch available', () => {
    const html = renderToStaticMarkup(render([item(clip)]));
    expect(html).toContain('<span class="home-preorders__clip" aria-current="true">First official video</span>');
    expect(html).not.toMatch(/<button[^>]*home-preorders__clip/);
    expect(html).not.toContain('Second official video');
    expect(html).toContain('Watch full video');
  });

  it('never repeats the sleeve as a missing or artwork-based video poster', () => {
    const candidate = {
      ...clip,
      artistPhotoUrl: null,
      clips: [{ id: 'MOA5YZDOR6A', title: 'Video', posterUrl: clip.coverUrl }],
    };
    const html = renderToStaticMarkup(render([item(candidate, { shipEstimate: null })]));
    expect(html.split(`src="${clip.coverUrl}"`)).toHaveLength(2);
    expect(html).not.toContain('home-preorders__video-poster');
    expect(html).toContain('Vinyl ships at a date to be confirmed');
    expect(html).toContain('Watch full video');
  });

  it('shows a released album shipping estimate once rather than repeating its badge', () => {
    const html = renderToStaticMarkup(render([item({ ...clip, releaseDate: '2020-01-01' })]));
    expect(html).toContain('Digital out now');
    expect(html.match(/around October 2026/g)).toHaveLength(1);
  });

  it('leaves an artist without an accepted profile path as plain text', () => {
    const html = renderToStaticMarkup(render([item({ ...photo, artistPath: null })]));
    expect(html).toContain('<p class="home-preorders__artist">Clip band</p>');
    expect(html).not.toContain('home-preorders__artist-link');
  });

  it('renders successive chapters and next links instead of a release selector', () => {
    const html = renderToStaticMarkup(render([item(clip), item(photo), item(cover)]));
    expect(html.match(/<article /g)).toHaveLength(3);
    expect(html.indexOf(clip.title)).toBeLessThan(html.indexOf(photo.title));
    expect(html.indexOf(photo.title)).toBeLessThan(html.indexOf(cover.title));
    expect(html).toContain(`href="#preorder-${photo.slug}"`);
    expect(html).toContain(`href="#preorder-${cover.slug}"`);
    expect(html.match(/class="home-preorders__next"/g)).toHaveLength(2);
    expect(html).toContain(`aria-label="Go to ${photo.title} by ${photo.artist}"`);
    expect(html).not.toContain('Next pre-order:');
    expect(html).not.toContain('Choose a pre-order');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('src="/photo-band.webp"');
    expect(html).toContain(`href="${photo.storePath}"`);
  });

  it('keeps prepared native footage muted and source-free before visibility', () => {
    const native = {
      ...clip,
      firstClipId: 'MOA5YZDOR6A',
      clips: [
        {
          id: 'MOA5YZDOR6A',
          title: 'Official video',
          posterUrl: '/video-poster.webp',
          backgroundVideoUrl: '/silent-loop.mp4',
        },
      ],
    };
    const html = renderToStaticMarkup(render([item(native)]));
    expect(html).toMatch(/<video[^>]*muted=""[^>]*playsInline=""[^>]*preload="none"/i);
    expect(html).not.toContain('src="/silent-loop.mp4"');
    expect(html).toContain('src="/video-poster.webp"');
    expect(html).not.toMatch(/(?:Play|Pause) background|Background unavailable/);
    expect(html).not.toContain('site-button--icon');
    expect(html).not.toContain('<iframe');
  });

  it('offers no manual motion control; automatic rules and reduced motion decide playback', () => {
    // Hydration alone decides eligibility, so the server markup cannot show the removed control; the source can.
    const source = readFileSync(new URL('./StorePreorderShowcase.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/background motion|manualPause|size: 'icon'/);
    expect(renderToStaticMarkup(render([item(clip)]))).toContain('Watch full video');
  });

  it('shows withheld terms and an Digital out now badge with a past release', () => {
    const html = renderToStaticMarkup(render([item({ ...cover, releaseDate: '2026-06-09' }, { shipEstimate: null })]));
    expect(html).toContain('Digital out now');
    expect(html).toContain('To be confirmed');
    expect(html).toContain('Pre-order &amp; delivery information');
    expect(html).not.toContain('Release date');
  });

  it('offers responsive cover and band-photo candidates sized to their slots', () => {
    const coverSrcSet =
      'https://images.blackboxrecordsathens.com/cdn-cgi/image/width=360,format=webp/https://blackbox-records-web.pages.dev/media/content/a 360w, /clip-720.webp 720w';
    const html = renderToStaticMarkup(
      render([item({ ...photo, coverSrcSet, artistPhotoSrcSet: '/band-800.webp 800w, /band-1800.webp 1800w' })]),
    );
    expect(html).toContain(
      `srcSet="${coverSrcSet}" sizes="(max-width: 50rem) 8rem, (max-width: 62.5rem) 17.5rem, 21.25rem"`,
    );
    expect(html).toContain('srcSet="/band-800.webp 800w, /band-1800.webp 1800w" sizes="100vw"');
  });

  it('presents the no-video release identity and delegates Listen to the shell', () => {
    const html = renderToStaticMarkup(
      render([
        item({
          ...photo,
          summary: 'A six-track debut.',
          trackCount: 6,
          recording: 'BlackBox Studio',
          listen: {
            releaseId: 'release-a',
            bandcampEmbedUrl: 'https://bandcamp.com/EmbeddedPlayer/album=1/',
            tidalEmbedUrl: null,
          },
        }),
      ]),
    );
    expect(html).toMatch(/<h3[^>]*>Photo album<\/h3>/);
    expect(html).toContain('A six-track debut.');
    expect(html).toContain('<dt>Tracks</dt><dd>6</dd>');
    expect(html).toContain('BlackBox Studio');
    expect(html).toContain('data-music-streaming-service-embedded-player-release-id="release-a"');
    expect(html).not.toContain('<iframe');
  });

  it('shows an exact ship date and no release date without inventing one', () => {
    const html = renderToStaticMarkup(
      render([item({ ...cover, releaseDate: null }, { shipEstimate: { kind: 'date', date: '2026-10-20' } })]),
    );
    expect(html).toContain('On 20 October 2026');
    expect(html).toContain('Pre-order &amp; delivery information');
    expect(html).toContain('To be confirmed');
    expect(html).not.toContain('Digital out now');
  });
});

// Phones (global.css, below 48rem) lay each chapter out as a film strip from this markup: the band first with nothing
// over it, then the identity, the purchase and a row with the terms link and Watch full video; a release with neither
// video nor photograph leads with its sleeve.
describe('StorePreorderShowcase phone film strip', () => {
  const native = {
    ...clip,
    firstClipId: 'MOA5YZDOR6A',
    clips: [
      {
        id: 'MOA5YZDOR6A',
        title: 'Official video',
        posterUrl: '/video-poster.webp',
        backgroundVideoUrl: '/silent-loop.mp4',
      },
    ],
  };

  it('puts the film band before the title with no control in it, and Watch full video after the terms link', () => {
    const html = renderToStaticMarkup(render([item(native)]));
    expect(html).toContain('home-preorders__chapter home-preorders__chapter--video');
    const media = html.slice(html.indexOf('data-preorder-ambient='), html.indexOf('home-preorders__film-shade'));
    expect(media).toMatch(/<video[^>]*class="home-preorders__film"/);
    expect(media).not.toMatch(/<(?:button|a)\b/);
    expect(html.indexOf('home-preorders__film-shade')).toBeLessThan(html.indexOf('<h3'));
    const tools = html.slice(html.indexOf('home-preorders__film-tools'), html.indexOf('home-preorders__clips'));
    expect(tools.match(/<button/g)).toHaveLength(1);
    expect(tools).toMatch(
      /aria-controls="preorder-clip-vinyl-video" aria-expanded="false"[^>]*>Watch full video<\/button>/,
    );
    // Phones show the two in one row in this order, so keyboard order follows the visual order.
    expect(html.indexOf('Pre-order &amp; delivery information')).toBeLessThan(html.indexOf('Watch full video'));
  });

  it('shows a clip without a film as its poster, else the artist photograph, with Watch', () => {
    const withoutFilm = {
      ...clip,
      clips: [{ id: 'dQw4w9WgXcQ', title: 'Official video', posterUrl: null }],
    };
    const html = renderToStaticMarkup(render([item(withoutFilm)]));
    expect(html).not.toContain('<video');
    expect(html).toContain('<img src="/clip-band.webp" alt="" class="home-preorders__video-poster"');
    expect(html).toContain('Watch full video');
  });

  it('falls back to the artist photograph band without Watch, then to the sleeve row', () => {
    const photoHtml = renderToStaticMarkup(render([item(photo)]));
    expect(photoHtml).toContain('class="home-preorders__chapter"');
    expect(photoHtml.indexOf('home-preorders__band-photo')).toBeLessThan(photoHtml.indexOf('<h3'));
    expect(photoHtml).not.toContain('Watch full video');

    const sleeveHtml = renderToStaticMarkup(render([item(cover)]));
    expect(sleeveHtml).toContain('home-preorders__chapter home-preorders__chapter--sleeve');
    expect(sleeveHtml).not.toContain('home-preorders__band-photo');
    expect(sleeveHtml).not.toContain('Watch full video');
  });

  it('gives a photo chapter its ship estimate beside the purchase for phones, as the facts do on wider screens', () => {
    const html = renderToStaticMarkup(render([item({ ...photo, releaseDate: '2026-10-16' })]));
    expect(html).toContain('<p class="home-preorders__shipping">Vinyl ships around October 2026</p>');
  });
});
