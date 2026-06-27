import { describe, expect, it } from 'vitest';

import { checkImageMarkup } from '../../scripts/check-image-markup';

describe('check-image-markup', () => {
  it('flags missing responsive candidates on card images', () => {
    const html = '<img class="distro-card__image" src="/full.webp" loading="eager" sizes="100vw">';

    expect(
      checkImageMarkup(new Map([['distro/index.html', html]]), [
        {
          route: 'distro/index.html',
          images: [{ className: 'distro-card__image', firstEagerCount: 1, requireSrcset: true }],
        },
      ]),
    ).toEqual([{ route: 'distro/index.html', message: 'distro-card__image #1 lacks srcset/sizes.' }]);
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
});
