import { describe, expect, it } from 'vitest';

import {
  bandcampEmbedUrlPatternSource,
  emailAddressPatternSource,
  isHttpsUrl,
  isInternalOrHttpsUrl,
  isInternalSitePath,
  isPublicImagePath,
  isSocialProfileUrl,
  tidalContentUrlPatternSource,
  youtubeVideoIdPatternSource,
} from './editorial-validation';

describe('editorial validation', () => {
  it('accepts safe internal paths and rejects traversal, protocol-relative, and backslash paths', () => {
    expect(isInternalSitePath('/')).toBe(true);
    expect(isInternalSitePath('/store/distro/#vinyl')).toBe(true);
    expect(isInternalSitePath('//example.com')).toBe(false);
    expect(isInternalSitePath('/../secret')).toBe(false);
    expect(isInternalSitePath('/store/../secret')).toBe(false);
    expect(isInternalSitePath('/store\\secret')).toBe(false);
  });

  it('accepts HTTPS and internal links at their intended seams', () => {
    expect(isHttpsUrl('https://example.com/path')).toBe(true);
    expect(isHttpsUrl('http://example.com/path')).toBe(false);
    expect(isHttpsUrl('not-a-url')).toBe(false);
    expect(isInternalOrHttpsUrl('/store/')).toBe(true);
    expect(isInternalOrHttpsUrl('https://example.com/product')).toBe(true);
    expect(isInternalOrHttpsUrl('mailto:test@example.com')).toBe(false);
  });

  it('keeps the explicit hidden-social sentinel while validating active profiles', () => {
    expect(isSocialProfileUrl('#')).toBe(true);
    expect(isSocialProfileUrl('https://bandcamp.com/example')).toBe(true);
    expect(isSocialProfileUrl('javascript:alert(1)')).toBe(false);
  });

  it('validates the supported public image path shape', () => {
    expect(isPublicImagePath('/assets/images/brand/logo.png')).toBe(true);
    expect(isPublicImagePath('/assets/../secret.png')).toBe(false);
    expect(isPublicImagePath('https://example.com/logo.png')).toBe(false);
  });

  it('keeps provider and identity patterns executable', () => {
    expect(new RegExp(emailAddressPatternSource).test('label@example.com')).toBe(true);
    expect(new RegExp(youtubeVideoIdPatternSource).test('Cl7rWCTGEqY')).toBe(true);
    expect(
      new RegExp(bandcampEmbedUrlPatternSource).test(
        'https://bandcamp.com/EmbeddedPlayer/album=1012756998/size=large/artwork=big/transparent=true/',
      ),
    ).toBe(true);
    expect(new RegExp(tidalContentUrlPatternSource).test('https://tidal.com/browse/album/123456789?u')).toBe(true);
    expect(new RegExp(tidalContentUrlPatternSource).test('https://tidal.com/artist/123456789')).toBe(false);
  });
});
