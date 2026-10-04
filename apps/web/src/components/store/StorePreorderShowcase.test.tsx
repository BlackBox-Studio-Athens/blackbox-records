import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicApiComponents } from '@blackbox/api-client/public';
import StorePreorderShowcase, {
  loadStorePreorderShowcase,
  type StorePreorderShowcaseCandidate,
} from './StorePreorderShowcase';

type Listing = PublicApiComponents['schemas']['PublicStoreListingPrice'];
type ReadyListing = Extract<Listing, { presentationState: 'ready' }>;
type Items = Awaited<ReturnType<typeof loadStorePreorderShowcase>>;
const rendered = vi.hoisted(() => {
  const items: Items = [];
  return { active: false, items, selected: 0, playing: false, selectedClip: 0, cursor: 0 };
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (!rendered.active) return actual.useState(initial);
      const cursor = rendered.cursor++;
      if (cursor === 0) return [rendered.items, vi.fn()];
      if (cursor === 1)
        return [
          rendered.selected,
          (value: number) => {
            rendered.selected = value;
          },
        ];
      if (cursor === 2)
        return [
          rendered.playing,
          (value: boolean) => {
            rendered.playing = value;
          },
        ];
      return [
        rendered.selectedClip,
        (value: number) => {
          rendered.selectedClip = value;
        },
      ];
    },
    useEffect: (effect: React.EffectCallback, dependencies?: React.DependencyList) => {
      if (!rendered.active) actual.useEffect(effect, dependencies);
    },
  };
});

const clip: StorePreorderShowcaseCandidate = {
  slug: 'clip-vinyl',
  title: 'Clip album',
  artist: 'Clip band',
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
const props = { candidatesUrl: '/blackbox-records/preorder-showcase.json', storeUrl: '/blackbox-records/store/' };

function ready(slug: string, overrides: Partial<ReadyListing> = {}): ReadyListing {
  return {
    storeItemSlug: slug,
    presentationState: 'ready',
    availabilityState: 'stocked',
    displayPrice: '€28.00',
    preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
    ...overrides,
  };
}

function stubReads(records: Listing[], candidates: StorePreorderShowcaseCandidate[]) {
  const fetchRequest = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(records))
    .mockResolvedValueOnce(Response.json(candidates));
  vi.stubGlobal('fetch', fetchRequest);
  return fetchRequest;
}

function render() {
  rendered.active = true;
  rendered.cursor = 0;
  return StorePreorderShowcase(props);
}

type ElementProps = { children?: React.ReactNode; className?: string; onClick?: () => void };
function buttons(node: React.ReactNode): React.ReactElement<ElementProps>[] {
  const found: React.ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<ElementProps>(child)) return;
    if (child.type === 'button') found.push(child);
    found.push(...buttons(child.props.children));
  });
  return found;
}

beforeEach(() => {
  vi.stubEnv('PUBLIC_BACKEND_BASE_URL', '');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
});
afterEach(() => {
  rendered.active = false;
  rendered.items = [];
  rendered.selected = 0;
  rendered.playing = false;
  rendered.selectedClip = 0;
  rendered.cursor = 0;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('StorePreorderShowcase reads', () => {
  it('performs one fresh narrowed read before static candidates and keeps only matching stocked ready preorders', async () => {
    const records: Listing[] = [
      ready(clip.slug),
      ready(photo.slug),
      ready(cover.slug, { availabilityState: 'sold_out' }),
      ready('ordinary', { preorder: null }),
      {
        storeItemSlug: 'unavailable',
        presentationState: 'unavailable',
        availabilityState: 'stocked',
        preorder: { shipEstimate: null },
      },
    ];
    const fetchRequest = stubReads(records, [photo, cover, clip]);
    const controller = new AbortController();
    const items = await loadStorePreorderShowcase(props.candidatesUrl, controller.signal);
    expect(items.map((item) => item.slug)).toEqual([photo.slug, clip.slug]);
    expect(items[0]?.displayPrice).toBe('€28.00');
    expect(items[0]?.shipEstimate).toEqual({ kind: 'month', month: '2026-10', part: null });
    expect(fetchRequest).toHaveBeenCalledTimes(2);
    expect(fetchRequest).toHaveBeenNthCalledWith(1, '/api/store/listing-prices?scope=preorders', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    expect(fetchRequest).toHaveBeenNthCalledWith(2, props.candidatesUrl, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
  });

  it.each([
    { name: 'empty', records: [] },
    { name: 'ordinary', records: [ready(clip.slug, { preorder: null })] },
    { name: 'sold out', records: [ready(clip.slug, { availabilityState: 'sold_out' })] },
    { name: 'out of stock', records: [ready(clip.slug, { availabilityState: 'out_of_stock' })] },
    { name: 'unavailable', records: [ready(clip.slug, { availabilityState: 'unavailable' })] },
  ])('does not read candidates without a buyable preorder ($name)', async ({ records }) => {
    const fetchRequest = stubReads(records, [clip]);
    rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
    expect(renderToStaticMarkup(render())).toBe('');
    expect(fetchRequest).toHaveBeenCalledTimes(1);
  });

  it('uses the existing configured backend URL', async () => {
    vi.stubEnv('PUBLIC_BACKEND_BASE_URL', 'https://api.example.invalid/');
    const fetchRequest = stubReads([], []);
    await loadStorePreorderShowcase(props.candidatesUrl);
    expect(fetchRequest.mock.calls[0]?.[0]).toBe(
      'https://api.example.invalid/api/store/listing-prices?scope=preorders',
    );
  });

  it.each(['listing-http', 'listing-network', 'listing-json', 'candidate-http', 'candidate-network', 'candidate-json'])(
    'renders nothing after %s failure',
    async (failure) => {
      const fetchRequest = vi.fn<typeof fetch>();
      if (failure === 'listing-http') fetchRequest.mockResolvedValueOnce(new Response('', { status: 503 }));
      else if (failure === 'listing-network') fetchRequest.mockRejectedValueOnce(new Error('offline'));
      else if (failure === 'listing-json') fetchRequest.mockResolvedValueOnce(new Response('invalid json'));
      else {
        fetchRequest.mockResolvedValueOnce(Response.json([ready(clip.slug)]));
        if (failure === 'candidate-http') fetchRequest.mockResolvedValueOnce(new Response('', { status: 503 }));
        else if (failure === 'candidate-network') fetchRequest.mockRejectedValueOnce(new Error('offline'));
        else fetchRequest.mockResolvedValueOnce(Response.json({ invalid: 'candidates' }));
      }
      vi.stubGlobal('fetch', fetchRequest);
      rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
      expect(renderToStaticMarkup(render())).toBe('');
      expect(fetchRequest).toHaveBeenCalledTimes(failure.startsWith('listing') ? 1 : 2);
    },
  );

  it.each([{ candidates: [] }, { candidates: [photo] }])(
    'renders nothing without matching candidates (%j)',
    async ({ candidates }) => {
      stubReads([ready(clip.slug)], candidates);
      rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
      expect(renderToStaticMarkup(render())).toBe('');
    },
  );

  it.each([
    { ...clip, storePath: 'javascript:alert(1)' },
    { ...clip, coverUrl: '//external.example/cover.webp' },
    { ...clip, firstClipId: 'not-a-video-id' },
    { ...clip, clips: [{ id: '01234567890', title: 'Video', posterUrl: '//external.example/poster.webp' }] },
  ])('rejects malformed candidate inputs', async (candidate) => {
    stubReads([ready(clip.slug)], [candidate]);
    expect(await loadStorePreorderShowcase(props.candidatesUrl)).toEqual([]);
  });

  it('stops before candidates when cancelled after the listing read', async () => {
    const controller = new AbortController();
    const fetchRequest = stubReads([ready(clip.slug)], [clip]);
    controller.abort();
    expect(await loadStorePreorderShowcase(props.candidatesUrl, controller.signal)).toEqual([]);
    expect(fetchRequest).toHaveBeenCalledTimes(1);
  });
});

describe('StorePreorderShowcase presentation', () => {
  it('adds no markup before hydration', () => {
    expect(renderToStaticMarkup(<StorePreorderShowcase {...props} />)).toBe('');
  });

  it.each([clip, photo, cover])(
    'renders the $slug stage from stubbed reads without contacting a video provider',
    async (candidate) => {
      const fetchRequest = stubReads([ready(candidate.slug)], [candidate]);
      rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
      const html = renderToStaticMarkup(render());
      expect(html.includes('home-preorders__poster-cover')).toBe(!candidate.firstClipId);
      expect(html.includes('home-preorders__video-poster')).toBe(Boolean(candidate.firstClipId));
      expect(html.includes('home-preorders__poster-photo')).toBe(
        !candidate.firstClipId && Boolean(candidate.artistPhotoUrl),
      );
      expect(html.includes('home-preorders__play')).toBe(Boolean(candidate.firstClipId));
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('youtube');
      expect(html).toContain('Pre-order · out 16 Oct 2026');
      expect(html).toContain(
        candidate.firstClipId
          ? 'Ships around October 2026 · charged today'
          : 'Charged today · ships around October 2026',
      );
      expect(html).toContain('href="/blackbox-records/store/#preorders"');
      expect(html).toContain(`href="${candidate.storePath}"`);
      expect(html).toContain('€28.00');
      expect(html).toContain('aria-pressed="true"');
      expect(fetchRequest).toHaveBeenCalledTimes(2);
    },
  );

  it('creates the video only on Play, then tears it down when selection changes', async () => {
    const fetchRequest = stubReads([ready(clip.slug), ready(photo.slug), ready(cover.slug)], [clip, photo, cover]);
    rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
    const play = buttons(render()).find((button) => button.props.className === 'home-preorders__play');
    expect(play).toBeDefined();
    play?.props.onClick?.();
    expect(renderToStaticMarkup(render())).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
    expect(renderToStaticMarkup(render())).toContain('title="Clip album video"');
    const secondClip = buttons(render()).filter((button) => button.props.className === 'home-preorders__clip')[1];
    secondClip?.props.onClick?.();
    expect(rendered.selectedClip).toBe(1);
    expect(renderToStaticMarkup(render())).not.toContain('<iframe');
    buttons(render())
      .find((button) => button.props.className === 'home-preorders__play')
      ?.props.onClick?.();
    expect(renderToStaticMarkup(render())).toContain('https://www.youtube-nocookie.com/embed/01234567890?autoplay=1');
    const photoButton = buttons(render()).filter((button) => button.props.className === 'home-preorders__item')[1];
    expect(photoButton).toBeDefined();
    photoButton?.props.onClick?.();
    const html = renderToStaticMarkup(render());
    expect(rendered.selected).toBe(1);
    expect(rendered.selectedClip).toBe(0);
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('home-preorders__play');
    expect(html).toContain('src="/photo-band.webp"');
    expect(html).toContain(`href="${photo.storePath}"`);
    expect(fetchRequest).toHaveBeenCalledTimes(2);
  });

  it('shows withheld terms and an Out now badge with a past release', async () => {
    stubReads([ready(cover.slug, { preorder: { shipEstimate: null } })], [{ ...cover, releaseDate: '2026-06-09' }]);
    rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
    const html = renderToStaticMarkup(render());
    expect(html).toContain('Out now');
    expect(html).toContain('To be confirmed');
    expect(html).toContain('Charged today · ships when it arrives');
    expect(html).not.toContain('Release date');
  });

  it('presents the no-video release identity and delegates Listen to the shell', async () => {
    stubReads(
      [ready(photo.slug)],
      [
        {
          ...photo,
          summary: 'A six-track debut.',
          trackCount: 6,
          recording: 'BlackBox Studio',
          listen: {
            releaseId: 'release-a',
            bandcampEmbedUrl: 'https://bandcamp.com/EmbeddedPlayer/album=1/',
            tidalEmbedUrl: null,
          },
        },
      ],
    );
    rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
    const html = renderToStaticMarkup(render());
    expect(html).toContain('<h3>Photo album</h3>');
    expect(html).toContain('Now showing');
    expect(html).toContain('A six-track debut.');
    expect(html).toContain('<dt>Tracks</dt><dd>Six</dd>');
    expect(html).toContain('BlackBox Studio');
    expect(html).toContain('data-music-streaming-service-embedded-player-release-id="release-a"');
    expect(html).not.toContain('<iframe');
  });

  it('shows an exact ship date and no release date without inventing one', async () => {
    stubReads(
      [ready(cover.slug, { preorder: { shipEstimate: { kind: 'date', date: '2026-10-20' } } })],
      [{ ...cover, releaseDate: null }],
    );
    rendered.items = await loadStorePreorderShowcase(props.candidatesUrl);
    const html = renderToStaticMarkup(render());
    expect(html).toContain('On 20 October 2026');
    expect(html).toContain('Charged today · ships on 20 October 2026');
    expect(html).toContain('To be confirmed');
    expect(html).not.toContain('Out now');
  });
});
