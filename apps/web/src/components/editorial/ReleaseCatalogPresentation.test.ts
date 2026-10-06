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
  it('a confirmed past digital date advances even when the accepted stage still says upcoming', () => {
    const upcoming: ReleasePresentationEntry = { ...entries[0]!, releaseDate: '2026-10-05', releaseStage: 'upcoming' };
    expect(releasePresentation(upcoming, records[0], today).badges).toEqual([
      'Digital out now',
      'Pre-order · ships around November 2026',
    ]);
    expect(releasePresentation(upcoming, records[0], today).action).toBe('Pre-order vinyl');
    expect(releasePresentation(entries[0]!, records[0], today).shipping).toBe('Expected to ship around November 2026');
  });
  it.each(['sold_out', 'out_of_stock', 'unavailable'] as const)(
    'retains the lead geometry with truthful availability for %s',
    (availabilityState) => {
      const unavailable = records.map((row) =>
        row.storeItemSlug === 'lotus-vinyl' ? { ...row, availabilityState } : row,
      );
      const result = selectReleaseMerchandisingEntries(entries, unavailable);
      expect(result.principal.map((entry) => entry.id)).toEqual(['lotus', 'disintegration']);
      expect(result.states.get('lotus')?.state).toBe(availabilityState);
      expect(selectReleaseMerchandisingEntries(entries, records).principal[0]?.id).toBe('lotus');
    },
  );
  it('unknown reads never assert stock, preorder or positive buying', () => {
    const result = selectReleaseMerchandisingEntries(entries, []);
    expect(result.principal.map((entry) => entry.id)).toEqual(['lotus', 'disintegration']);
    expect(result.remainder).toHaveLength(2);
    expect(result.states.get('lotus')).toMatchObject({ state: 'unknown', action: 'View vinyl details', shipping: '' });
    expect(result.states.get('anarchotribal')?.badges).toEqual(['Digital out now', 'Vinyl coming later']);
  });
  it.each(['2026-06-06', '2026-11-06', undefined])(
    'keeps an upcoming native edition announced before ordering opens with digital date %s',
    (releaseDate) => {
      const entry = { ...entries[0]!, releaseStage: 'upcoming' as const, releaseDate };
      const digitalBadges = releaseDate ? [releaseDate === '2026-06-06' ? 'Digital out now' : 'Album upcoming'] : [];
      const closed = ['sold_out', 'out_of_stock', 'unavailable'].map((availabilityState) => ({
        ...record('lotus-vinyl'),
        availabilityState: availabilityState as Listing['availabilityState'],
      }));
      for (const offer of [undefined, ...closed, { ...closed[0]!, presentationState: 'unavailable' as const }]) {
        expect(releasePresentation(entry, offer, today)).toMatchObject({
          state: 'announced',
          badges: [...digitalBadges, 'Vinyl coming later'],
          action: 'View vinyl details',
          shipping: '',
        });
      }
      expect(releasePresentation(entry, records[0], today).state).toBe('preorder');
      if (!releaseDate) {
        expect(releasePresentation(entry, records[0], today).badges).not.toContain('Album upcoming');
        expect(releasePresentation(entry, records[0], today).badges).not.toContain('Digital out now');
      }
      expect(releasePresentation(entry, { ...records[0]!, availabilityState: 'sold_out' }, today).state).toBe(
        'sold_out',
      );
      expect(releasePresentation(entry, record('lotus-vinyl'), today).state).toBe('available');
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
        releaseStage: state === 'announced' ? 'upcoming' : 'released',
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
    const entry = { ...entries[1]!, releaseDate: '2026-06-09', releaseStage: 'released' as const };
    expect(releasePresentation(entry, records[1], today)).toMatchObject({
      state: 'preorder',
      badges: ['Digital out now', 'Pre-order'],
    });
    const soldOut = releasePresentation(entry, { ...records[1]!, availabilityState: 'sold_out' }, today);
    expect(soldOut).toMatchObject({ state: 'sold_out', action: 'View vinyl details', shipping: '' });
    expect(soldOut).not.toHaveProperty('preorder');
    expect(releasePresentation(entry, records[0], today)).toMatchObject({
      state: 'unknown',
      action: 'View vinyl details',
    });
    expect(releasePresentation(entry, { ...records[1]!, presentationState: 'unavailable' }, today)).toMatchObject({
      state: 'unknown',
      action: 'View vinyl details',
    });
  });
  it.each([
    ['vinyl', 'Vinyl', 'vinyl'],
    ['cd', 'CD', 'CD'],
    ['cassette', 'Cassette', 'cassette'],
  ] as const)(
    'keeps %s announcement, buying and unavailable wording in the same lifecycle',
    (format, medium, action) => {
      const upcoming: ReleasePresentationEntry = {
        ...entries[0]!,
        releaseStage: 'upcoming',
        edition: { kind: 'native', storeSlug: 'lotus-vinyl', format },
      };
      expect(releasePresentation(upcoming, undefined, today).badges).toContain(`${medium} coming later`);
      expect(releasePresentation(upcoming, record('lotus-vinyl'), today).action).toBe(`Buy ${action}`);
      expect(releasePresentation(upcoming, records[0], today).action).toBe(`Pre-order ${action}`);
      expect(
        releasePresentation(
          { ...upcoming, releaseStage: 'released' },
          { ...record('lotus-vinyl'), availabilityState: 'sold_out' },
          today,
        ).badges,
      ).toContain('Sold Out');
    },
  );
});
