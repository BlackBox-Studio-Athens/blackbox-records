import { describe, expect, it } from 'vitest';
import type { SiteAnalytics } from '../../lib/backend/internal-analytics-api';
import { mergeDevices, mergeSources, pageLabel, sourceLabel } from './stats-labels';
import { deviceSentence, summarySentence, type SummaryPart } from './stats-summary';

const text = (parts: SummaryPart[]) =>
  parts.map((part) => (typeof part === 'string' ? part : `**${part.strong}**`)).join('');
const data = (overrides: Partial<SiteAnalytics>): SiteAnalytics => ({
  range: '7d',
  generatedAt: '2026-10-12T14:00:00.000Z',
  status: 'ok',
  daily: [
    { date: '2026-10-09', visits: 168, pageViews: 400 },
    { date: '2026-10-10', visits: 90, pageViews: 200 },
    { date: '2026-10-11', visits: 31, pageViews: 60 },
  ],
  topPaths: [],
  topReferrers: [
    { host: '', visits: 40, pageViews: 90 },
    { host: 'l.instagram.com', visits: 30, pageViews: 70 },
    { host: 'instagram.com', visits: 20, pageViews: 30 },
  ],
  topCountries: [],
  deviceTypes: [],
  ...overrides,
});

describe('page names', () => {
  it.each([
    ['/', 'Home', 'home'],
    ['/store/', 'Store', 'store'],
    ['/store', 'Store', 'store'],
    ['/store/distro/', 'Distro', 'store'],
    ['/store/disintegration-black-vinyl-lp/', 'Disintegration black vinyl LP · Store', 'store'],
    ['/artists/chronoboros/', 'Chronoboros · Artist', 'artist'],
    ['/releases/', 'Releases', 'release'],
    ['/news/disintegration/', 'Disintegration · News', 'news'],
    ['/services/', 'Services', 'services'],
    ['/privacy/', 'Privacy', 'legal'],
    ['/wp-login.php', '/wp-login.php', 'other'],
    ['/artists/a/b/', '/artists/a/b/', 'other'],
    ['/news/%E0%A4%A/', '/news/%E0%A4%A/', 'other'],
  ])('%s reads as %s', (path, name, kind) => {
    expect(pageLabel(path)).toEqual({ name, kind });
  });
});

describe('source names', () => {
  it.each([
    ['', 'Direct or unknown', 'direct'],
    ['l.instagram.com', 'Instagram', 'instagram'],
    ['m.facebook.com', 'Facebook', 'facebook'],
    ['www.google.gr', 'Google', 'google'],
    ['blackboxrecords.bandcamp.com', 'Bandcamp', 'bandcamp'],
    ['linktr.ee', 'Linktree', 'linktree'],
    ['youtu.be', 'YouTube', 'youtube'],
    ['www.bing.com', 'Bing', 'bing'],
    ['duckduckgo.com', 'DuckDuckGo', 'duckduckgo'],
    ['www.example.org', 'example.org', 'site'],
    ['notgoogle.com', 'notgoogle.com', 'site'],
  ])('%s reads as %s', (host, name, kind) => {
    expect(sourceLabel(host)).toMatchObject({ name, kind });
  });

  it('merges host variants, sums counts and re-sorts by visits', () => {
    expect(mergeSources(data({}).topReferrers).map(({ name, visits, pageViews }) => [name, visits, pageViews])).toEqual(
      [
        ['Instagram', 50, 100],
        ['Direct or unknown', 40, 90],
      ],
    );
  });
});

describe('summary sentence', () => {
  it('names the total, busiest day and top merged source', () => {
    expect(text(summarySentence(data({})))).toBe(
      '**289 visits** in the last 7 days. Busiest day was **Fri 9 Oct** with **168**. Most visitors came from **Instagram**.',
    );
  });

  it('handles direct leaders, ties, today so far and the 30-day range', () => {
    const tie = data({
      range: '30d',
      daily: [
        { date: '2026-10-11', visits: 90, pageViews: 1 },
        { date: '2026-10-12', visits: 90, pageViews: 1 },
      ],
      topReferrers: [{ host: '', visits: 9, pageViews: 9 }],
    });
    expect(text(summarySentence(tie))).toBe(
      '**180 visits** in the last 30 days. Busiest days were **Sun 11 Oct** and **Mon 12 Oct (so far)** with **90** each. Most visits had no referring site.',
    );
    const many = data({
      daily: [1, 2, 3].map((day) => ({ date: `2026-10-0${day}`, visits: 1, pageViews: 1 })),
      topReferrers: [
        { host: 'linktr.ee', visits: 5, pageViews: 5 },
        { host: '', visits: 5, pageViews: 5 },
      ],
    });
    expect(text(summarySentence(many))).toBe(
      '**3 visits** in the last 7 days. **3 days** shared the busiest count of **1**. Most visitors came from **Linktree**, level with visits that had no referring site.',
    );
    expect(
      text(summarySentence(data({ daily: [{ date: '2026-10-12', visits: 1, pageViews: 1 }], topReferrers: [] }))),
    ).toBe('**1 visit** in the last 7 days. Busiest day was **Mon 12 Oct (so far)** with **1**.');
  });
});

describe('device sentence', () => {
  const rows = (mobile: number, desktop: number, tablet = 0) => [
    { deviceType: 'mobile', visits: mobile, pageViews: 0 },
    { deviceType: 'desktop', visits: desktop, pageViews: 0 },
    { deviceType: 'tablet', visits: tablet, pageViews: 0 },
  ];

  it.each([
    [rows(70, 28, 2), '7 in 10 visits came from phones.'],
    [rows(30, 70), '7 in 10 visits came from desktop computers.'],
    [rows(52, 48), 'Visits were split about evenly between phones and desktop computers.'],
    [rows(10, 0), 'All visits came from phones.'],
    [rows(97, 3), 'Almost all visits came from phones.'],
    [rows(0, 0), null],
  ])('%#', (input, sentence) => {
    expect(deviceSentence(input)).toBe(sentence);
  });

  it('groups provider device types and drops empty ones', () => {
    expect(mergeDevices([...rows(3, 1), { deviceType: 'smarttv', visits: 1, pageViews: 2 }])).toEqual([
      { kind: 'phone', visits: 3, pageViews: 0 },
      { kind: 'other', visits: 1, pageViews: 2 },
      { kind: 'desktop', visits: 1, pageViews: 0 },
    ]);
  });
});
