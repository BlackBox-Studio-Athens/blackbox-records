import { describe, expect, it } from 'vitest';

import {
  checkImageMarkup,
  checkRosterPortraitBudgets,
  getArtistRosterPortraits,
  getSrcsetCandidateUrl,
} from '../../scripts/check-image-markup';

describe('check-image-markup', () => {
  it('flags missing responsive candidates on card images', () => {
    const html = '<img class="store-item-card__image" src="/full.webp" loading="eager" sizes="100vw">';

    expect(
      checkImageMarkup(new Map([['store/distro/index.html', html]]), [
        {
          route: 'store/distro/index.html',
          images: [{ className: 'store-item-card__image', firstEagerCount: 1, requireSrcset: true }],
        },
      ]),
    ).toEqual([{ route: 'store/distro/index.html', message: 'store-item-card__image #1 lacks srcset/sizes.' }]);
  });

  it('flags first-viewport media that is still lazy', () => {
    const html =
      '<img class="news-detail-lead__image" src="/lead.webp" srcset="/lead.webp 720w" sizes="100vw" loading="lazy">';

    expect(
      checkImageMarkup(new Map([['news/lorem-ipsum/index.html', html]]), [
        {
          route: 'news/lorem-ipsum/index.html',
          images: [{ className: 'news-detail-lead__image', requirePriority: true, requireSrcset: true }],
        },
      ]),
    ).toEqual([
      { route: 'news/lorem-ipsum/index.html', message: 'news-detail-lead__image #1 is not eager.' },
      { route: 'news/lorem-ipsum/index.html', message: 'news-detail-lead__image #1 lacks high fetch priority.' },
    ]);
  });

  it('flags full-size-only srcsets on responsive card images', () => {
    const html =
      '<img class="artist-previous-release__artwork" src="/cover.webp" srcset="/cover.webp 1440w" sizes="5rem" loading="lazy" decoding="async">';

    expect(
      checkImageMarkup(new Map([['artists/afterwise/index.html', html]]), [
        {
          route: 'artists/afterwise/index.html',
          images: [
            {
              className: 'artist-previous-release__artwork',
              minSrcsetCandidates: 2,
              requireDecoding: true,
              requireSrcset: true,
            },
          ],
        },
      ]),
    ).toEqual([
      {
        route: 'artists/afterwise/index.html',
        message: 'artist-previous-release__artwork #1 has fewer than 2 srcset candidates.',
      },
    ]);
  });

  it('flags routes with too many high-priority images', () => {
    const html = [
      '<img class="hero" src="/one.webp" loading="eager" fetchpriority="high">',
      '<img class="other" src="/two.webp" loading="eager" fetchpriority="high">',
    ].join('');

    expect(
      checkImageMarkup(new Map([['releases/index.html', html]]), [
        {
          route: 'releases/index.html',
          maxHighPriorityImages: 1,
          images: [],
        },
      ]),
    ).toEqual([
      {
        route: 'releases/index.html',
        message: 'Expected at most 1 high-priority image(s), found 2.',
      },
    ]);
  });

  it('requires Coverflow priority only on the first image', () => {
    const html = [
      '<img class="store-item-card__image" src="/one.webp" loading="eager" fetchpriority="auto">',
      '<img class="store-item-card__image" src="/two.webp" loading="eager" fetchpriority="high">',
    ].join('');

    expect(
      checkImageMarkup(new Map([['store/index.html', html]]), [
        {
          route: 'store/index.html',
          maxHighPriorityImages: 1,
          images: [{ className: 'store-item-card__image', firstPriorityCount: 1 }],
        },
      ]),
    ).toEqual([
      {
        route: 'store/index.html',
        message: 'store-item-card__image #1 should have high fetch priority.',
      },
      { route: 'store/index.html', message: 'store-item-card__image #2 should stay lazy.' },
      {
        route: 'store/index.html',
        message: 'store-item-card__image #2 should not have high fetch priority.',
      },
    ]);
  });

  it('allows four eager Grid covers while keeping high priority on only the first', () => {
    const html = Array.from(
      { length: 5 },
      (_, index) =>
        '<img class="cover" loading="' +
        (index < 4 ? 'eager' : 'lazy') +
        '" fetchpriority="' +
        (index === 0 ? 'high' : 'auto') +
        '">',
    ).join('');
    const checks = [
      {
        route: 'store',
        maxHighPriorityImages: 1,
        images: [{ className: 'cover', firstPriorityCount: 1, firstEagerCount: 4 }],
      },
    ];
    expect(checkImageMarkup(new Map([['store', html]]), checks)).toEqual([]);
    expect(checkImageMarkup(new Map([['store', html.replace('loading="lazy"', 'loading="eager"')]]), checks)).toEqual([
      { route: 'store', message: 'cover #5 should stay lazy.' },
    ]);
  });

  it('checks the first built detail page that renders the image instead of a fixed slug', () => {
    const cover = (loading: string) =>
      `<img class="release-detail-cover__image" srcset="/a 720w, /b 1080w" sizes="100vw" decoding="async" loading="${loading}" fetchpriority="high">`;
    const checks = [
      {
        route: 'releases/*/index.html',
        maxHighPriorityImages: 1,
        images: [{ className: 'release-detail-cover__image', requirePriority: true, requireSrcset: true }],
      },
    ];
    const pages = new Map([
      // An editor gave this release a gallery, so the page no longer renders the single cover.
      ['releases/disintegration/index.html', '<img class="store-image-gallery__image" srcset="/g 720w">'],
      ['releases/index.html', cover('eager')],
      ['releases/zeta/index.html', cover('lazy')],
      ['releases/eon/index.html', cover('eager')],
    ]);

    expect(checkImageMarkup(pages, checks)).toEqual([]);
    pages.set('releases/eon/index.html', cover('lazy'));
    expect(checkImageMarkup(pages, checks)).toEqual([
      { route: 'releases/eon/index.html', message: 'release-detail-cover__image #1 is not eager.' },
    ]);
    expect(
      checkImageMarkup(
        new Map([['releases/disintegration/index.html', pages.get('releases/disintegration/index.html')!]]),
        checks,
      ),
    ).toEqual([{ route: 'releases/*/index.html', message: 'No built page renders release-detail-cover__image.' }]);
  });

  describe('gallery detail pages', () => {
    // React server rendering keeps camelCase attribute names; HTML attribute names are case-insensitive.
    const gallery = (attributes: string) =>
      `<img src="/g.webp" srcSet="/g 720w, /g2 1080w" sizes="26rem" ${attributes} class="store-image-gallery__image"/>` +
      '<img src="/g.webp" srcSet="/g 96w" sizes="72px" alt="" loading="lazy"/>';
    const cover =
      '<img class="store-item-detail__image" srcset="/a 720w, /b 1080w" sizes="100vw" decoding="async" loading="eager" fetchpriority="high">';
    const galleryCheck = {
      route: 'store/*/index.html',
      maxHighPriorityImages: 1,
      alternative: true,
      images: [
        {
          className: 'store-image-gallery__image',
          minSrcsetCandidates: 2,
          requireDecoding: true,
          requirePriority: true,
          requireSrcset: true,
        },
      ],
    };
    const coverCheck = {
      route: 'store/*/index.html',
      maxHighPriorityImages: 1,
      alternative: true,
      images: [{ className: 'store-item-detail__image', requirePriority: true, requireSrcset: true }],
    };

    it('reads React camelCase attributes on the main gallery image', () => {
      const pages = new Map([
        ['store/aftermaths/index.html', gallery('loading="eager" decoding="async" fetchPriority="high"')],
      ]);
      expect(checkImageMarkup(pages, [galleryCheck])).toEqual([]);

      pages.set('store/aftermaths/index.html', gallery('fetchPriority="high"'));
      expect(checkImageMarkup(pages, [galleryCheck])).toEqual([
        { route: 'store/aftermaths/index.html', message: 'store-image-gallery__image #1 lacks decoding.' },
        { route: 'store/aftermaths/index.html', message: 'store-image-gallery__image #1 is not eager.' },
      ]);
    });

    it('counts camelCase high priority toward the page budget, as on an overlay fragment', () => {
      const pages = new Map([
        [
          'app-shell-overlay/releases/disintegration/index.html',
          gallery('loading="eager" decoding="async" fetchPriority="high"'),
        ],
      ]);
      const overlayCheck = {
        route: 'app-shell-overlay/releases/*/index.html',
        maxHighPriorityImages: 0,
        alternative: true,
        images: [{ className: 'store-image-gallery__image', firstEagerCount: 1, requireDecoding: true }],
      };

      expect(checkImageMarkup(pages, [overlayCheck])).toEqual([
        {
          route: 'app-shell-overlay/releases/disintegration/index.html',
          message: 'Expected at most 0 high-priority image(s), found 1.',
        },
      ]);
      pages.set(
        'app-shell-overlay/releases/disintegration/index.html',
        gallery('loading="eager" decoding="async" fetchPriority="auto"'),
      );
      expect(checkImageMarkup(pages, [overlayCheck])).toEqual([]);
    });

    it('resolves gallery and single-cover checks to different pages', () => {
      const pages = new Map([
        ['store/aftermaths/index.html', gallery('loading="eager" decoding="async" fetchPriority="high"')],
        ['store/lotus/index.html', cover],
      ]);
      expect(checkImageMarkup(pages, [galleryCheck, coverCheck])).toEqual([]);

      // A gallery page never satisfies the single-cover check, and a single-cover page never satisfies the gallery check.
      pages.set('store/aftermaths/index.html', gallery(''));
      expect(checkImageMarkup(pages, [galleryCheck, coverCheck])).toEqual([
        { route: 'store/aftermaths/index.html', message: 'store-image-gallery__image #1 lacks decoding.' },
        { route: 'store/aftermaths/index.html', message: 'store-image-gallery__image #1 is not eager.' },
        { route: 'store/aftermaths/index.html', message: 'store-image-gallery__image #1 lacks high fetch priority.' },
      ]);
    });

    it('passes when every detail page renders one kind, and fails only when no page renders either', () => {
      // Editors may give every item a gallery, or none.
      expect(checkImageMarkup(new Map([['store/lotus/index.html', cover]]), [galleryCheck, coverCheck])).toEqual([]);
      const allGallery = new Map([
        ['store/aftermaths/index.html', gallery('loading="eager" decoding="async" fetchPriority="high"')],
      ]);
      expect(checkImageMarkup(allGallery, [galleryCheck, coverCheck])).toEqual([]);

      // A renamed or dropped class leaves neither kind, which fails the pattern instead of passing silently.
      const neither = new Map([['store/aftermaths/index.html', '<img class="store-image-carousel__image">']]);
      expect(checkImageMarkup(neither, [galleryCheck, coverCheck])).toEqual([
        {
          route: 'store/*/index.html',
          message: 'No built page renders store-image-gallery__image or store-item-detail__image.',
        },
      ]);
    });
  });

  it('selects an exact responsive candidate for byte-budget checks', () => {
    const tag = '<img srcset="/portrait-480.webp 480w, /portrait-720.webp 720w">';

    expect(getSrcsetCandidateUrl(tag, 480)).toBe('/portrait-480.webp');
  });

  it('pairs each roster portrait with its artist by the stable roster hook, skipping the blurred fill copy', () => {
    const html = [
      '<div data-artist-roster-item data-artist-title="Afterwise"><img class="artist-photo-fill" srcset="/fill.webp 160w"><img class="artist-roster-card__image" alt="Afterwise live" srcset="/afterwise-480.webp 480w, /afterwise-720.webp 720w"></div>',
      '<div data-artist-roster-item data-artist-title="Chronoboros"><img class="artist-photo-fill"></div>',
    ].join('');

    const [afterwise, chronoboros] = getArtistRosterPortraits(html);
    expect(afterwise?.artistTitle).toBe('Afterwise');
    expect(afterwise?.tag).toContain('alt="Afterwise live"');
    expect(getSrcsetCandidateUrl(afterwise?.tag || '', 480)).toBe('/afterwise-480.webp');
    expect(chronoboros).toEqual({ artistTitle: 'Chronoboros', tag: '' });
  });

  describe('roster portrait byte budget', () => {
    const item = (title: string, srcset = `/_astro/${title}-480.webp 480w, /_astro/${title}-720.webp 720w`) =>
      `<div data-artist-roster-item data-artist-title="${title}"><img class="artist-photo-fill" srcset="/_astro/${title}-fill.webp 160w"><img class="artist-roster-card__image" srcset="${srcset}"></div>`;
    const sizes = new Map([
      ['/_astro/Afterwise-480.webp', 60_000],
      ['/_astro/Chronoboros-480.webp', 80_000],
      ['/_astro/Afterwise-fill.webp', 500_000],
      ['/_astro/Chronoboros-fill.webp', 500_000],
    ]);
    const sizeOf = (url: string) => sizes.get(url);

    it('passes a roster without the formerly hard-coded artist, ignoring the fill copy', () => {
      expect(checkRosterPortraitBudgets(item('Afterwise') + item('Chronoboros'), sizeOf)).toEqual([]);
    });

    it('flags every oversized portrait by artist and file', () => {
      sizes.set('/_astro/Chronoboros-480.webp', 102_401);
      try {
        expect(checkRosterPortraitBudgets(item('Afterwise') + item('Chronoboros'), sizeOf)).toEqual([
          {
            route: 'artists/index.html',
            message: 'Chronoboros 480w candidate exceeds 100 KiB (102401 bytes, /_astro/Chronoboros-480.webp).',
          },
        ]);
      } finally {
        sizes.set('/_astro/Chronoboros-480.webp', 80_000);
      }
    });

    it('flags an empty roster, a missing 480w candidate and a missing file', () => {
      expect(checkRosterPortraitBudgets('<main></main>', sizeOf)).toEqual([
        { route: 'artists/index.html', message: 'No artist roster portraits rendered.' },
      ]);
      expect(
        checkRosterPortraitBudgets(item('Afterwise', '/_astro/Afterwise-720.webp 720w') + item('Ghost'), sizeOf),
      ).toEqual([
        { route: 'artists/index.html', message: 'Afterwise 480w candidate is missing (none in srcset).' },
        { route: 'artists/index.html', message: 'Ghost 480w candidate is missing (/_astro/Ghost-480.webp).' },
      ]);
    });
  });
});
