import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  parseCatalogNumber,
  formatCatalogNumber,
  compareCatalogNumbers,
  catalogNumberMessage,
  catalogNumberSchema,
  validateCmsDraft,
  validateCmsContent,
  parseContentSnapshot,
  parseAcceptedContentSnapshot,
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

describe('Release catalog numbers', () => {
  it('parses only canonical positive padded strings and formats plain JSON', () => {
    for (const value of ['BBR#001', 'BBR#010', 'BBR#999', 'BBR#1000', 'BBR#9007199254740993']) {
      const parsed = parseCatalogNumber(value)!;
      expect(parsed).not.toBeNull();
      expect(formatCatalogNumber(parsed)).toBe(value);
      expect(JSON.parse(JSON.stringify(parsed))).toBe(value);
    }
    for (const value of [
      'BBR#000',
      'BBR001',
      'bbr#001',
      'BBR#1',
      'BBR#01',
      'BBR#0001',
      ' BBR#001',
      'BBR#001 ',
      'BBR#001\n',
      'BBR#-001',
      'BBR#1.5',
      '',
      1,
      null,
      undefined,
      {},
      true,
    ])
      expect(parseCatalogNumber(value)).toBeNull();
    const number = (value: string) => catalogNumberSchema.parse(value);
    expect(compareCatalogNumbers(number('BBR#002'), number('BBR#010'))).toBe(-1);
    expect(compareCatalogNumbers(number('BBR#1000'), number('BBR#999'))).toBe(1);
    expect(compareCatalogNumbers(number('BBR#001'), number('BBR#001'))).toBe(0);
    expect(compareCatalogNumbers(number('BBR#9007199254740993'), number('BBR#9007199254740992'))).toBe(1);
  });

  const release = (slug: string, catalog_number?: unknown) => ({
    collection: 'releases',
    id: `cms-${slug}`,
    slug,
    revisionId: `revision-${slug}`,
    data: {
      title: slug,
      artist: 'artist',
      release_stage: 'upcoming',
      cover_image: { id: 'image' },
      cover_image_alt: 'Cover',
      ...(catalog_number === undefined ? {} : { catalog_number }),
    },
  });
  const snapshot = (records: unknown[], environment = 'local') =>
    JSON.stringify({
      schemaVersion: 1,
      environment,
      records: [
        {
          collection: 'artists',
          id: 'artist',
          slug: 'artist',
          revisionId: 'artist-rev',
          data: { title: 'Artist', genre: 'Rock', bio: 'Bio', image: { id: 'image' }, image_alt: 'Portrait' },
        },
        ...records,
      ],
      media: [
        {
          id: 'image',
          sha256: 'a'.repeat(64),
          filename: 'image.png',
          mimeType: 'image/png',
          size: 1,
          width: 1,
          height: 1,
        },
      ],
    });

  it('permits unfinished drafts but requires a valid catalog number for publication and rejects Distro ownership', () => {
    for (const value of [undefined, null, '']) {
      const data = release('caregivers', value).data;
      expect(validateCmsDraft('releases', data)).toEqual([]);
      expect(validateCmsContent('releases', data)).toContain(`catalog_number: ${catalogNumberMessage}`);
    }
    expect(validateCmsDraft('releases', release('caregivers', 'BBR#1').data)).toContain(
      `catalog_number: ${catalogNumberMessage}`,
    );
    expect(validateCmsContent('releases', release('caregivers', 'BBR#001').data)).toEqual([]);
    expect(validateCmsDraft('distro', { catalog_number: 'BBR#001' }).length).toBeGreaterThan(0);
  });

  it.each(['local', 'uat', 'prd'] as const)(
    'upgrades only absent accepted fields by slug in %s and leaves explicit values strict',
    (environment) => {
      const json = snapshot(
        ['caregivers', 'anarchotribal', 'disintegration', 'lotus'].map((slug) => release(slug)),
        environment,
      );
      const accepted = parseAcceptedContentSnapshot(json, environment);
      expect(accepted.records.filter((r) => r.collection === 'releases').map((r) => r.data.catalog_number)).toEqual([
        'BBR#001',
        'BBR#003',
        'BBR#002',
        'BBR#004',
      ]);
      expect(json).not.toContain('catalog_number');
      expect(() => parseContentSnapshot(json, environment)).toThrow(catalogNumberMessage);
      expect(() =>
        parseAcceptedContentSnapshot(snapshot([release('fictional-unmapped-release')], environment), environment),
      ).toThrow('"fictional-unmapped-release" has no catalog number and no owner-confirmed legacy assignment');
      for (const value of [null, '', 'BBR#000'])
        expect(() =>
          parseAcceptedContentSnapshot(snapshot([release('caregivers', value)], environment), environment),
        ).toThrow(catalogNumberMessage);
      expect(
        parseAcceptedContentSnapshot(snapshot([release('lotus', 'BBR#004')], environment), environment).records[1]!.data
          .catalog_number,
      ).toBe('BBR#004');
    },
  );

  it('rejects duplicate numbers across all releases including accepted legacy upgrades', () => {
    const json = snapshot([release('caregivers', 'BBR#001'), release('lotus', 'BBR#001')]);
    expect(() => parseContentSnapshot(json, 'local')).toThrow(
      'Catalog number BBR#001 is used by releases "caregivers" (cms-caregivers), "lotus" (cms-lotus)',
    );
    expect(() =>
      parseAcceptedContentSnapshot(snapshot([release('caregivers'), release('lotus', 'BBR#001')]), 'local'),
    ).toThrow('Catalog number BBR#001');
  });
});

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
    const home = { title: 'Home', url: '/', order: 0, show_in_header: false, show_in_footer: true };
    expect(navigationContentSchema.safeParse(home).success).toBe(true);
    expect(navigationContentSchema.safeParse({ ...home, show_in_header: true }).error?.issues[0]?.path).toEqual([
      'show_in_header',
    ]);
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
