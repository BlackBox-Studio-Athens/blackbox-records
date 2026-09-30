import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  bandcampEmbedUrlPatternSource,
  createAboutContentSchema,
  createHomeContentSchema,
  createServicesContentSchema,
  emailAddressPatternSource,
  isHttpsUrl,
  isInternalOrHttpsUrl,
  isPublicImagePath,
  isSocialProfileUrl,
  navigationContentSchema,
  settingsContentSchema,
  socialsContentSchema,
  tidalContentUrlPatternSource,
  youtubeVideoIdPatternSource,
} from '@blackbox/content-model';

describe('editorial validation', () => {
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

  it('limits constrained fields to the values the site can render', () => {
    const image = () => z.unknown();
    const aboutItems = createAboutContentSchema(image).shape.contact.shape.items;
    const stats = createAboutContentSchema(image).shape.stats.shape.items;
    const homeLink = createHomeContentSchema(image).shape.news.shape.link_url;
    expect(stats.safeParse([{ key: 'year', label: 'Years' }]).success).toBe(true);
    expect(stats.safeParse([{ key: 'albums', label: 'Albums' }]).success).toBe(false);
    expect(aboutItems.safeParse([{ label: 'Press', value: 'press@example.com' }]).success).toBe(true);
    expect(aboutItems.safeParse([{ label: 'Phone', value: '+30 210 000' }]).success).toBe(false);
    expect(navigationContentSchema.shape.url.safeParse('/about/').success).toBe(true);
    expect(homeLink.safeParse('/store/../secret').success).toBe(false);
    expect(socialsContentSchema.shape.title.safeParse('Linktree').success).toBe(true);
    expect(socialsContentSchema.shape.title.safeParse('MySpace').success).toBe(false);
    const country = settingsContentSchema.shape.location.shape.country;
    expect(country.safeParse('Greece').success).toBe(true);
    expect(country.safeParse('Greece / Cyprus').success).toBe(false);
    expect(country.safeParse('Atlantis').success).toBe(false);
  });

  it('rejects services that share a page anchor', () => {
    const items = createServicesContentSchema(() => z.unknown()).shape.services.shape.items;
    const service = (id: string) => ({
      id,
      title: 'Mixing',
      image: null,
      image_alt: 'Desk',
      summary: 'Summary',
      bullets: ['One', 'Two'],
      contact_note: 'Note',
    });
    expect(items.safeParse([service('mixing'), service('mastering')]).success).toBe(true);
    const duplicate = items.safeParse([service('mixing'), service('mixing')]);
    expect(duplicate.error?.issues.map((issue) => issue.path)).toEqual([[1, 'id']]);
  });
});
