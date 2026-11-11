import { describe, expect, test } from 'vitest';
import {
  LINK_SERVICES,
  durationFromParts,
  durationParts,
  formatDayDate,
  formatDuration,
  formatEuro,
  formatArtistCountries,
  generateServiceIds,
  convertTypedValues,
  projectDistroValues,
  readTypedValues,
  moneySchema,
  parseCountryCode,
  parseArtistCountries,
  parseDuration,
  parseEuroAmount,
  parseHttpsUrl,
  parseIsoDate,
  parseServiceUrl,
  parseSlug,
  parseTimeOfDay,
  parseYoutubeVideoId,
  recognizeService,
  slugify,
  timeOfDayFromParts,
  timeOfDayParts,
  timeOfDaySchema,
} from '@blackbox/content-model';

describe('shared editorial values', () => {
  test('parses euro input exactly as integer cents and formats it', () => {
    for (const [input, cents, display] of [
      ['10', 1000, '€10'],
      ['12.5', 1250, '€12.50'],
      ['12,50', 1250, '€12.50'],
      ['€12.50', 1250, '€12.50'],
      ['0.01', 1, '€0.01'],
    ] as const) {
      expect(parseEuroAmount(input)).toEqual({ ok: true, value: cents });
      expect(formatEuro(cents)).toBe(display);
      expect(moneySchema.safeParse(cents).success).toBe(true);
    }
    expect(parseEuroAmount('12.345')).toEqual({ ok: false, message: 'Use at most two decimals.' });
    for (const input of ['0', '0.00', '-1'])
      expect(parseEuroAmount(input)).toEqual({ ok: false, message: 'Enter an amount above €0.' });
    for (const input of ['', '1,2,3', 'hello', '9999999999999999999999999'])
      expect(parseEuroAmount(input)).toEqual({ ok: false, message: 'Enter an amount in euros, such as 12 or 12.50.' });
    for (const value of [0, -1, 10.5, Number.MAX_SAFE_INTEGER + 1])
      expect(moneySchema.safeParse(value).success).toBe(false);
  });

  test('keeps dates and 24-hour times independent of Greek locale and timezone', () => {
    const date = parseIsoDate('2026-12-05');
    expect(date && formatDayDate(date)).toBe('Sat 05 Dec 2026');
    expect(parseIsoDate('2026-02-29')).toBeNull();
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('2026-12-05T00:00:00Z')).toBeNull();
    const time = timeOfDayFromParts(20, 0);
    expect(time).toBe('20:00');
    expect(time && timeOfDayParts(time)).toEqual({ hour: 20, minute: 0 });
    expect(timeOfDaySchema.parse('20:00')).toBe(time);
    for (const invalid of ['08:00 μμ', '24:00', '20:60', '8:00']) expect(parseTimeOfDay(invalid)).toBeNull();
    expect(timeOfDayFromParts(23, 59)).toBe('23:59');
    expect(timeOfDayFromParts(20, 60)).toBeNull();
  });

  test('converts duration parts and checks bounds', () => {
    const duration = durationFromParts(4, 32);
    expect(duration).toBe(272);
    expect(duration && durationParts(duration)).toEqual({ minutes: 4, seconds: 32 });
    expect(duration && formatDuration(duration)).toBe('4:32');
    expect(parseDuration('4:32')).toBe(duration);
    for (const input of ['4:60', '4:2', '-1:02', '4.32']) expect(parseDuration(input)).toBeNull();
    expect(durationFromParts(1, 60)).toBeNull();
    expect(durationFromParts(-1, 0)).toBeNull();
  });

  test('requires HTTPS, matches actual provider hosts and recognises More.com', () => {
    expect(parseHttpsUrl('https://example.com/path')).toBe('https://example.com/path');
    for (const input of ['http://example.com', 'https://user@example.com', '/relative', null])
      expect(parseHttpsUrl(input)).toBeNull();
    expect(parseServiceUrl('facebook', 'facebook.com/events/123')).toEqual({
      ok: true,
      value: 'https://facebook.com/events/123',
      label: 'Facebook',
    });
    for (const input of [
      'instagram.com/p/123',
      'facebook.com.evil.example/events/123',
      'facebook.com/profile',
      'http://facebook.com/events/123',
    ])
      expect(parseServiceUrl('facebook', input)).toEqual({ ok: false, message: 'Paste a facebook.com event address.' });
    for (const [service, input] of [
      ['instagram', 'www.instagram.com/artist'],
      ['youtube', 'youtu.be/abcdefghijk'],
      ['bandcamp', 'artist.bandcamp.com/album/example'],
      ['tidal', 'tidal.com/album/123'],
      ['spotify', 'open.spotify.com/artist/123'],
      ['soundcloud', 'soundcloud.com/artist'],
      ['apple-music', 'music.apple.com/us/album/example'],
      ['more-com', 'www.more.com/gr-el/tickets/123'],
      ['generic', 'artist.example/music'],
    ] as const)
      expect(parseServiceUrl(service, input)).toMatchObject({ ok: true, label: LINK_SERVICES[service].label });
    expect(recognizeService('https://www.more.com/gr-el/tickets/123')).toEqual({ id: 'more-com', label: 'More.com' });
    expect(recognizeService('https://example.com')).toBeNull();
    expect(recognizeService('http://more.com')).toBeNull();
  });

  test('parses YouTube IDs, ISO country codes and generated slugs', () => {
    const id = 'abcdefghijk';
    for (const input of [
      id,
      `https://youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}`,
      `https://youtube.com/shorts/${id}`,
    ])
      expect(parseYoutubeVideoId(input)).toBe(id);
    for (const input of ['short', `https://youtube.com.evil.test/watch?v=${id}`, `http://youtu.be/${id}`])
      expect(parseYoutubeVideoId(input)).toBeNull();
    expect(parseCountryCode('GR')).toBe('GR');
    expect(parseCountryCode('cy')).toBe('CY');
    for (const input of ['Greece', 'ZZ', '', null]) expect(parseCountryCode(input)).toBeNull();
    expect(slugify('Vinyl Mastering')).toBe('vinyl-mastering');
    expect(slugify('Αθήνα')).toBe('athina');
    expect(parseSlug(slugify('Vinyl Mastering'))).toBe('vinyl-mastering');
    expect(parseSlug('Upper Case')).toBeNull();
  });

  test('reads legacy country labels and ordered country codes with the same public labels', () => {
    const legacy = parseArtistCountries('Greece / Cyprus');
    const typed = parseArtistCountries(['GR', 'CY']);
    expect(legacy).toEqual(typed);
    expect(typed && formatArtistCountries(typed)).toBe('Greece / Cyprus');
    expect(parseArtistCountries(['GR', 'GR'])).toBeNull();
    expect(parseArtistCountries(['Greece'])).toBeNull();
    expect(parseArtistCountries('Unknown place')).toBeNull();
  });

  test('generates unique service anchors while retaining existing ids', () => {
    const data = {
      services: {
        items: [
          { title: 'Old title', id: 'vinyl-mastering' },
          { title: 'Vinyl Mastering' },
          { title: 'Vinyl Mastering', id: '' },
        ],
      },
    };
    const generated = generateServiceIds(data);
    expect(generated.services).toEqual({
      items: [
        { title: 'Old title', id: 'vinyl-mastering' },
        { title: 'Vinyl Mastering', id: 'vinyl-mastering-2' },
        { title: 'Vinyl Mastering', id: 'vinyl-mastering-3' },
      ],
    });
    expect(generateServiceIds(generated)).toEqual(generated);
    expect(data.services.items[1]).toEqual({ title: 'Vinyl Mastering' });
  });

  test('plans typed conversions atomically and can repeat them', () => {
    const old = {
      group: 'CDs',
      format: 'CD',
      tracklist: { format: 'cd', discs: [{ tracks: [{ title: 'Song', duration: '4:32' }] }] },
    };
    const converted = convertTypedValues('distro', old);
    expect(converted).toEqual({
      data: {
        format: 'CDs',
        format_override: 'CD',
        tracklist: { discs: [{ tracks: [{ title: 'Song', duration: 272 }] }] },
      },
      problems: [],
    });
    expect(convertTypedValues('distro', converted.data)).toEqual(converted);
    const mismatched = { group: 'CDs', format: 'CD', tracklist: { format: 'vinyl', sides: [] } };
    expect(convertTypedValues('distro', mismatched)).toEqual({ data: mismatched, problems: ['tracklist.format'] });
    const invalidDuration = {
      group: 'CDs',
      tracklist: { format: 'cd', discs: [{ tracks: [{ title: 'Song', duration: '4:99' }] }] },
    };
    expect(convertTypedValues('distro', invalidDuration)).toEqual({
      data: invalidDuration,
      problems: ['tracklist.0.0.duration'],
    });
    expect(convertTypedValues('artists', { country: 'Greece / Cyprus', is_active: 1 })).toEqual({
      data: { country: ['GR', 'CY'], is_active: true },
      problems: [],
    });
    const invalid = { country: 'Unknown place', is_active: 1 };
    expect(convertTypedValues('artists', invalid)).toEqual({ data: invalid, problems: ['country'] });
    expect(convertTypedValues('socials', { title: 'Bandcamp', url: '#', order: 4 })).toEqual({
      data: { title: 'Bandcamp', visible: false, order: 4 },
      problems: [],
    });
  });

  test('projects legacy and typed Distro values to identical public labels and filters', () => {
    const old = { group: 'CDs', format: 'CD' };
    const typed = { format: 'CDs', format_override: 'CD' };
    expect(projectDistroValues(old)).toMatchObject({ group: 'CDs', format: 'CD' });
    expect(projectDistroValues(typed)).toMatchObject({ group: 'CDs', format: 'CD' });
    expect(readTypedValues('artists', { country: 'Greece / Cyprus' }).country).toEqual(['GR', 'CY']);
    expect(readTypedValues('artists', { country: ['GR', 'CY'] }).country).toEqual(['GR', 'CY']);
  });
});
