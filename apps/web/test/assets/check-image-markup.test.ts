import { describe, expect, it } from 'vitest';

import { checkImageMarkup, getArtistRosterImageTag, getSrcsetCandidateUrl } from '../../scripts/check-image-markup';

describe('check-image-markup', () => {
  it('flags missing responsive candidates on card images', () => {
    const html = '<img class="distro-card__image" src="/full.webp" loading="eager" sizes="100vw">';

    expect(
      checkImageMarkup(new Map([['store/distro/index.html', html]]), [
        {
          route: 'store/distro/index.html',
          images: [{ className: 'distro-card__image', firstEagerCount: 1, requireSrcset: true }],
        },
      ]),
    ).toEqual([{ route: 'store/distro/index.html', message: 'distro-card__image #1 lacks srcset/sizes.' }]);
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

  it('selects an exact responsive candidate for byte-budget checks', () => {
    const tag = '<img srcset="/portrait-480.webp 480w, /portrait-720.webp 720w">';

    expect(getSrcsetCandidateUrl(tag, 480)).toBe('/portrait-480.webp');
  });

  it('locates an artist image by the stable roster hook instead of mutable alt copy', () => {
    const html = [
      '<div data-artist-roster-item data-artist-title="Afterwise"><img class="artist-roster-card__image" alt="Afterwise"></div>',
      '<div data-artist-roster-item data-artist-title="Ouranopithecus"><img class="artist-roster-card__image" alt="Three members of Ouranopithecus standing among trees" srcset="/ouranopithecus-480.webp 480w, /ouranopithecus-720.webp 720w"></div>',
    ].join('');

    const tag = getArtistRosterImageTag(html, 'Ouranopithecus');
    expect(tag).toContain('alt="Three members of Ouranopithecus standing among trees"');
    expect(getSrcsetCandidateUrl(tag, 480)).toBe('/ouranopithecus-480.webp');
    expect(getArtistRosterImageTag(html, 'Missing artist')).toBe('');
  });
});
