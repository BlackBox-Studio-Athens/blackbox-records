import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

import {
  checkImageMarkup,
  checkImageMarkupDirectory,
  checkRosterPortraitBudgets,
  checkSrcsetSelections,
  evaluateSizes,
  getArtistRosterPortraits,
  getSrcsetCandidateUrl,
  getSrcsetCandidates,
  imageCandidateBytes,
  pickSrcsetCandidate,
  srcsetSlotChecks,
} from '../../scripts/check-image-markup';

describe('check-image-markup', () => {
  it('preserves commas in hosted Images candidates and selects their responsive widths', () => {
    const small =
      'https://images.blackboxrecordsathens.com/cdn-cgi/image/width=480,format=auto/https://source.test/media/content/abc';
    const large = small.replace('width=480', 'width=960');
    const tag = `<img srcset="${small} 480w, ${large} 960w">`;
    expect(getSrcsetCandidates(tag)).toEqual([
      { url: small, width: 480 },
      { url: large, width: 960 },
    ]);
    expect(getSrcsetCandidateUrl(tag, 480)).toBe(small);
    expect(pickSrcsetCandidate(tag, 300, 2)?.url).toBe(large);
  });

  it('uses the separate client asset root and fails closed for absent inputs and candidates', () => {
    const artifactRoot = resolve('../../.codex-artifacts/performance-resume');
    mkdirSync(artifactRoot, { recursive: true });
    const root = mkdtempSync(join(artifactRoot, 'image-gate-test-'));
    try {
      const documents = join(root, 'documents');
      const assets = join(root, 'client');
      mkdirSync(documents);
      mkdirSync(join(assets, '_astro'), { recursive: true });
      writeFileSync(join(assets, '_astro/portrait.webp'), new Uint8Array(800));
      expect(imageCandidateBytes('/_astro/portrait.webp', assets, documents)).toBe(800);
      expect(imageCandidateBytes('/_astro/missing.webp', assets, documents)).toBeUndefined();
      expect(
        imageCandidateBytes('https://images.blackboxrecordsathens.com/missing', assets, documents),
      ).toBeUndefined();
      expect(checkImageMarkupDirectory(documents, assets)).toContainEqual({
        route: 'index.html',
        message: 'Route HTML is missing.',
      });
      expect(() => checkImageMarkupDirectory(join(root, 'missing'), assets)).toThrow('Document directory is missing');
      expect(() => checkImageMarkupDirectory(documents, join(root, 'missing'))).toThrow(
        'Client asset directory is missing',
      );
    } finally {
      expect(root.startsWith(`${artifactRoot}${sep}image-gate-test-`)).toBe(true);
      rmSync(root, { recursive: true, force: true });
    }
  });

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

  describe('srcset selection at 390@2, 390@3 and 1440@1', () => {
    const ladder = '/a-720.webp 720w, /a-1080.webp 1080w, /a-1440.webp 1440w, /a-1800.webp 1800w';
    const leadTag = (sizes: string) =>
      `<img class="news-detail-lead__image" srcset="${ladder}" sizes="${sizes}" width="1800" height="1200">`;
    const leadSizes =
      '(min-width: 72rem) 63.25rem, (min-width: 64rem) calc(100vw - 8.75rem), (min-width: 40rem) calc(100vw - 7.75rem), calc(100vw - 5.75rem)';

    it('evaluates media conditions and calc() lengths in px, rem and vw', () => {
      expect(evaluateSizes(leadSizes, 390)).toBe(298);
      expect(evaluateSizes(leadSizes, 1024)).toBe(884);
      expect(evaluateSizes(leadSizes, 1440)).toBe(1012);
      expect(evaluateSizes('(min-width: 87rem) 39rem, calc((100vw - 4.25rem) * 1.03)', 390)).toBeCloseTo(331.66);
      expect(evaluateSizes('(min-width: 1024px) 36vw, 100vw', 1440)).toBeCloseTo(518.4);
      expect(evaluateSizes('(max-width: 40rem) 50vw, 20rem', 390)).toBe(195);
      expect(evaluateSizes('(min-width: 80rem) calc((100vw - 9.5rem) * 0.5), 100vw', 1440)).toBe(644);
      expect(evaluateSizes('(min-width: 40rem) and (max-width: 63.99rem) calc(50vw - 2.25rem), 100vw', 768)).toBe(348);
    });

    it('picks the narrowest candidate covering the slot at the pixel ratio, else the widest', () => {
      const tag = leadTag(leadSizes);
      expect(pickSrcsetCandidate(tag, 298, 2)?.width).toBe(720);
      expect(pickSrcsetCandidate(tag, 298, 3)?.width).toBe(1080);
      expect(pickSrcsetCandidate(tag, 1012, 1)?.width).toBe(1080);
      expect(pickSrcsetCandidate(tag, 1012, 2)?.width).toBe(1800);
    });

    it('flags sizes that overstate the slot by a rung, as the full-viewport news lead did', () => {
      const html = leadTag('(min-width: 1024px) 72rem, 100vw');
      const check = srcsetSlotChecks.filter(({ className }) => className === 'news-detail-lead__image');

      expect(checkSrcsetSelections(new Map([['news/lead/index.html', html]]), check)).toEqual([
        {
          route: 'news/lead/index.html',
          message: 'news-detail-lead__image fetches 1080w at 390@2 where 720w covers its 302px slot.',
        },
        {
          route: 'news/lead/index.html',
          message: 'news-detail-lead__image fetches 1440w at 390@3 where 1080w covers its 302px slot.',
        },
        {
          route: 'news/lead/index.html',
          message: 'news-detail-lead__image fetches 1440w at 1440@1 where 1080w covers its 1016px slot.',
        },
      ]);
      expect(checkSrcsetSelections(new Map([['news/lead/index.html', leadTag(leadSizes)]]), check)).toEqual([]);
    });

    it('flags sizes below the painted slot, which would blur the image', () => {
      const html = leadTag('calc(100vw - 10rem)');
      const check = srcsetSlotChecks.filter(({ className }) => className === 'news-detail-lead__image');

      expect(checkSrcsetSelections(new Map([['news/lead/index.html', html]]), check)).toContainEqual({
        route: 'news/lead/index.html',
        message: 'news-detail-lead__image sizes gives 230px at 390@2, below its 298px slot.',
      });
    });

    it('sizes a contained artist portrait by the width it paints, not the frame', () => {
      const check = srcsetSlotChecks.filter(({ className }) => className === 'artist-detail-hero__image');
      const portrait = (sizes: string) =>
        `<img class="artist-detail-hero__image" srcset="/p-360.webp 360w, /p-480.webp 480w, /p-720.webp 720w, /p-1080.webp 1080w" sizes="${sizes}" width="1080" height="1440">`;

      expect(
        checkSrcsetSelections(
          new Map([['artists/a/index.html', portrait('(min-width: 1024px) 34rem, 100vw')]]),
          check,
        ).map(({ message }) => message),
      ).toEqual([
        'artist-detail-hero__image fetches 1080w at 390@2 where 480w covers its 225px slot.',
        'artist-detail-hero__image fetches 1080w at 390@3 where 720w covers its 225px slot.',
        'artist-detail-hero__image fetches 720w at 1440@1 where 480w covers its 363px slot.',
      ]);
      expect(
        checkSrcsetSelections(
          new Map([
            [
              'artists/a/index.html',
              portrait('(min-width: 72rem) calc(34.75rem * 0.64), calc((100vw - 2.125rem) * 0.61)'),
            ],
          ]),
          check,
        ),
      ).toEqual([]);
    });

    it('requires a built page for every slot check', () => {
      expect(checkSrcsetSelections(new Map(), srcsetSlotChecks.slice(0, 1))).toEqual([
        { route: 'releases/index.html', message: 'No built page renders releases-latest-feature__artwork.' },
      ]);
    });
  });

  it('allows high fetch priority on only the first News index card', () => {
    const card = (attributes: string) =>
      `<img class="news-card__image" srcset="/n-360.webp 360w, /n-540.webp 540w" sizes="100vw" decoding="async" ${attributes}>`;
    const check = [
      {
        route: 'news/index.html',
        maxHighPriorityImages: 1,
        images: [{ className: 'news-card__image', firstPriorityCount: 1, firstEagerCount: 1 }],
      },
    ];

    expect(
      checkImageMarkup(
        new Map([['news/index.html', card('loading="eager" fetchpriority="high"') + card('loading="lazy"')]]),
        check,
      ),
    ).toEqual([]);
    expect(
      checkImageMarkup(new Map([['news/index.html', card('loading="eager"') + card('loading="lazy"')]]), check),
    ).toEqual([{ route: 'news/index.html', message: 'news-card__image #1 should have high fetch priority.' }]);
  });
});
