import { describe, expect, it } from 'vitest';
import { selectReleaseMerchandisingEntries } from './ReleaseCatalogPresentation';
import { releasePresentation, type ReleasePresentationEntry } from './release-presentation';
type Listing = NonNullable<Parameters<typeof releasePresentation>[1]>;

const today = new Date('2026-10-05T12:00:00Z');
const entries: ReleasePresentationEntry[] = [
  {
    id: 'lotus',
    priority: 1,
    edition: { kind: 'native', storeSlug: 'lotus-vinyl', format: 'vinyl' },
    releaseDate: '2026-10-16',
  },
  {
    id: 'disintegration',
    priority: 2,
    edition: { kind: 'native', storeSlug: 'disintegration-vinyl', format: 'vinyl' },
    releaseDate: '2026-06-09',
  },
  {
    id: 'caregivers',
    edition: { kind: 'native', storeSlug: 'caregivers-vinyl', format: 'vinyl' },
    releaseDate: '2026-03-13',
  },
  { id: 'anarchotribal', edition: { kind: 'announced', format: 'vinyl' }, releaseDate: '2026-06-06' },
];
const record = (slug: string, preorder: Listing['preorder'] = null): Listing => ({
  storeItemSlug: slug,
  presentationState: 'ready',
  availabilityState: 'stocked',
  displayPrice: '€28.00',
  preorder,
});
const records = [
  record('lotus-vinyl', { shipEstimate: { kind: 'month', month: '2026-11', part: null } }),
  record('disintegration-vinyl', { shipEstimate: null }),
  record('caregivers-vinyl'),
];

describe('Releases physical merchandising', () => {
  it('retains editorial roles and source order while offers load, fail or change availability', () => {
    const expected = { principal: ['lotus', 'disintegration'], remainder: ['caregivers', 'anarchotribal'] };
    for (const offers of [[], records, records.map((row) => ({ ...row, availabilityState: 'sold_out' as const }))]) {
      const result = selectReleaseMerchandisingEntries(entries, offers);
      expect({
        principal: result.principal.map((entry) => entry.id),
        remainder: result.remainder.map((entry) => entry.id),
      }).toEqual(expected);
    }
  });
  it('keeps chosen preorders first and every record once, with older stock before announced vinyl', () => {
    const result = selectReleaseMerchandisingEntries(entries, records);
    expect(result.principal.map((entry) => entry.id)).toEqual(['lotus', 'disintegration']);
    expect(result.remainder.map((entry) => entry.id)).toEqual(['caregivers', 'anarchotribal']);
    expect(new Set([...result.principal, ...result.remainder].map((entry) => entry.id)).size).toBe(4);
    expect(entries.map((entry) => entry.id)).toEqual(['lotus', 'disintegration', 'caregivers', 'anarchotribal']);
  });
  it('closed preorders become ordinary buying actions without ending editorial emphasis', () => {
    const ordinary = records.map((row) => ({ ...row, preorder: null }));
    expect(selectReleaseMerchandisingEntries(entries, ordinary).principal.map((entry) => entry.id)).toEqual([
      'lotus',
      'disintegration',
    ]);
    const presentation = releasePresentation(entries[0]!, ordinary[0], today);
    expect(presentation).toMatchObject({ state: 'available', action: 'Buy vinyl', shipping: '' });
    expect(presentation.badges).toContain('Vinyl available');
  });
  it('an explicit editorial priority can lead with an older available record', () => {
    const ranked = entries.map((entry) => ({ ...entry, priority: entry.id === 'caregivers' ? 1 : undefined }));
    expect(selectReleaseMerchandisingEntries(ranked, records).principal.map((entry) => entry.id)).toEqual([
      'caregivers',
      'lotus',
    ]);
  });
  it('a withheld month estimate stays preorder and adds no shipping promise', () => {
    const presentation = releasePresentation(entries[1]!, records[1], today);
    expect(presentation).toMatchObject({ state: 'preorder', action: 'Pre-order vinyl', shipping: '' });
    expect(presentation.badges).toEqual(['Digital out now', 'Pre-order']);
  });
  it('a confirmed past digital date reads Digital out now beside the physical pre-order', () => {
    const upcoming: ReleasePresentationEntry = { ...entries[0]!, releaseDate: '2026-10-05' };
    expect(releasePresentation(upcoming, records[0], today).badges).toEqual([
      'Digital out now',
      'Pre-order · ships around November 2026',
    ]);
    expect(releasePresentation(upcoming, records[0], today).action).toBe('Pre-order vinyl');
    expect(releasePresentation(entries[0]!, records[0], today).shipping).toBe('Expected to ship around November 2026');
  });
  it.each([
    ['sold_out', 'sold_out'],
    ['coming_soon', 'coming_soon'],
    ['repressing', 'repressing'],
    ['unavailable', 'unknown'],
  ] as const)('retains the lead geometry with truthful availability for %s', (availabilityState, state) => {
    const unavailable = records.map((row) =>
      row.storeItemSlug === 'lotus-vinyl' ? { ...row, availabilityState } : row,
    );
    const result = selectReleaseMerchandisingEntries(entries, unavailable);
    expect(result.principal.map((entry) => entry.id)).toEqual(['lotus', 'disintegration']);
    expect(result.states.get('lotus')?.state).toBe(state);
    expect(selectReleaseMerchandisingEntries(entries, records).principal[0]?.id).toBe('lotus');
  });
  it('unknown reads never assert stock, preorder or positive buying', () => {
    const result = selectReleaseMerchandisingEntries(entries, []);
    expect(result.principal.map((entry) => entry.id)).toEqual(['lotus', 'disintegration']);
    expect(result.remainder).toHaveLength(2);
    expect(result.states.get('lotus')).toMatchObject({ state: 'unknown', action: 'Vinyl edition', shipping: '' });
    expect(result.states.get('anarchotribal')?.badges).toEqual(['Digital out now', 'Vinyl Coming Soon']);
    // A native edition has no physical badge until its offer is read.
    expect(result.states.get('lotus')?.badges).toEqual(['Out 16 October 2026']);
  });
  it.each(['2026-06-06', '2026-11-14', undefined])(
    'derives the physical badge from the offer state alone with digital date %s',
    (releaseDate) => {
      const entry = { ...entries[0]!, releaseDate };
      const digitalBadges =
        releaseDate === '2026-06-06' ? ['Digital out now'] : releaseDate ? ['Out 14 November 2026'] : [];
      const offer = (availabilityState: Listing['availabilityState'], expectedMonth?: string) => ({
        ...record('lotus-vinyl'),
        availabilityState,
        ...(expectedMonth ? { expectedMonth } : {}),
      });
      expect(releasePresentation(entry, undefined, today)).toMatchObject({
        state: 'unknown',
        badges: digitalBadges,
        action: 'Vinyl edition',
        shipping: '',
      });
      expect(releasePresentation(entry, offer('coming_soon', '2026-11'), today)).toMatchObject({
        state: 'coming_soon',
        badges: [...digitalBadges, 'Vinyl Coming Soon'],
        action: 'Vinyl edition',
        shipping: 'Expected November 2026',
      });
      expect(releasePresentation(entry, offer('repressing', '2027-01'), today)).toMatchObject({
        state: 'repressing',
        badges: [...digitalBadges, 'Vinyl Repressing'],
        shipping: 'Expected January 2027',
      });
      expect(releasePresentation(entry, offer('sold_out', '2027-01'), today)).toMatchObject({
        state: 'sold_out',
        badges: [...digitalBadges, 'Vinyl Sold Out'],
        shipping: '',
      });
      for (const paused of [offer('unavailable'), offer('out_of_stock' as Listing['availabilityState'])])
        expect(releasePresentation(entry, paused, today)).toMatchObject({ state: 'unknown', badges: digitalBadges });
      expect(releasePresentation(entry, records[0], today).state).toBe('preorder');
      expect(releasePresentation(entry, record('lotus-vinyl'), today).state).toBe('available');
      const copy = JSON.stringify(
        ['coming_soon', 'repressing', 'sold_out', 'unavailable'].map((state) =>
          releasePresentation(entry, offer(state as Listing['availabilityState']), today),
        ),
      );
      expect(copy).not.toMatch(
        /Out of Stock|Currently Unavailable|Unavailable|coming later|Album upcoming|unconfirmed/,
      );
    },
  );
  it('new offers update status without reordering the remainder or chosen emphasis', () => {
    const opened: ReleasePresentationEntry[] = entries.map((entry) =>
      entry.id === 'anarchotribal'
        ? { ...entry, edition: { kind: 'native', format: 'vinyl', storeSlug: 'anarchotribal-vinyl' } }
        : entry,
    );
    const result = selectReleaseMerchandisingEntries(opened, [
      ...records,
      record('anarchotribal-vinyl', { shipEstimate: null }),
    ]);
    expect(result.principal.map((entry) => entry.id)).toEqual(['lotus', 'disintegration']);
    expect(result.remainder.map((entry) => entry.id)).toEqual(['caregivers', 'anarchotribal']);
    expect(result.states.get('anarchotribal')?.state).toBe('preorder');
  });
  it('keeps several lifecycle states truthful without moving or duplicating releases', () => {
    const many: ReleasePresentationEntry[] = ['preorder', 'available', 'announced', 'sold_out'].flatMap((state) =>
      Array.from({ length: 3 }, (_, index): ReleasePresentationEntry => ({
        id: `${state}-${index}`,
        priority: state === 'preorder' ? 3 - index : undefined,
        releaseDate: index === 0 ? '2026-06-06' : '2099-11-06',
        edition: { kind: 'native', storeSlug: `${state}-${index}`, format: 'vinyl' },
      })),
    );
    const offers = many.map((entry): Listing => ({
      ...record(entry.id, entry.id.startsWith('preorder') ? { shipEstimate: null } : null),
      availabilityState: entry.id.startsWith('announced') || entry.id.startsWith('sold_out') ? 'sold_out' : 'stocked',
    }));
    const result = selectReleaseMerchandisingEntries(many.toReversed(), offers);
    expect(result.principal.map((entry) => entry.id)).toEqual(['preorder-2', 'preorder-1']);
    expect(result.remainder.map((entry) => entry.id)).toEqual([
      'sold_out-2',
      'sold_out-1',
      'sold_out-0',
      'announced-2',
      'announced-1',
      'announced-0',
      'available-2',
      'available-1',
      'available-0',
      'preorder-0',
    ]);
    expect(new Set([...result.principal, ...result.remainder].map((entry) => entry.id)).size).toBe(many.length);
  });
  it('format identity controls wording and unranked ties retain catalog order', () => {
    expect(
      releasePresentation(
        { ...entries[0]!, edition: { kind: 'native', format: 'cd', storeSlug: 'lotus-vinyl' } },
        records[0],
        today,
      ).action,
    ).toBe('Pre-order CD');
    expect(releasePresentation({ ...entries[0]!, edition: { kind: 'none' } }, records[0], today).state).toBe(
      'editorial',
    );
    const unranked = entries.map((entry) => ({ ...entry, priority: undefined }));
    expect(selectReleaseMerchandisingEntries(unranked, records).principal.map((entry) => entry.id)).toEqual([
      'lotus',
      'disintegration',
    ]);
    expect(selectReleaseMerchandisingEntries([], []).remainder).toEqual([]);
  });
  it('keeps digital-out plus physical preorder valid, but never buys a sold-out or unconfirmed edition', () => {
    const entry = { ...entries[1]!, releaseDate: '2026-06-09' };
    expect(releasePresentation(entry, records[1], today)).toMatchObject({
      state: 'preorder',
      badges: ['Digital out now', 'Pre-order'],
    });
    const soldOut = releasePresentation(entry, { ...records[1]!, availabilityState: 'sold_out' }, today);
    expect(soldOut).toMatchObject({ state: 'sold_out', action: 'Vinyl edition', shipping: '' });
    expect(soldOut).not.toHaveProperty('preorder');
    expect(releasePresentation(entry, records[0], today)).toMatchObject({
      state: 'unknown',
      action: 'Vinyl edition',
    });
    expect(releasePresentation(entry, { ...records[1]!, presentationState: 'unavailable' }, today)).toMatchObject({
      state: 'unknown',
      action: 'Vinyl edition',
    });
  });
  it.each([
    ['vinyl', 'Vinyl', 'vinyl'],
    ['cd', 'CD', 'CD'],
    ['cassette', 'Cassette', 'cassette'],
  ] as const)(
    'keeps %s announcement, buying and zero-stock wording in the same lifecycle',
    (format, medium, action) => {
      const native: ReleasePresentationEntry = {
        ...entries[0]!,
        edition: { kind: 'native', storeSlug: 'lotus-vinyl', format },
      };
      expect(
        releasePresentation({ ...native, edition: { kind: 'announced', format } }, undefined, today).badges,
      ).toContain(`${medium} Coming Soon`);
      expect(releasePresentation(native, record('lotus-vinyl'), today).action).toBe(`Buy ${action}`);
      expect(releasePresentation(native, records[0], today).action).toBe(`Pre-order ${action}`);
      expect(
        releasePresentation(native, { ...record('lotus-vinyl'), availabilityState: 'sold_out' }, today).badges,
      ).toContain(`${medium} Sold Out`);
    },
  );
});
