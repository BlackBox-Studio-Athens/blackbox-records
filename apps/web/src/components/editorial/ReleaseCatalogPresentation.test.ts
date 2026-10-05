import { describe, expect, it } from 'vitest';
import { selectReleaseMerchandisingEntries, releasePresentation } from './ReleaseCatalogPresentation';
import { type ReleasePresentationEntry } from './release-presentation';
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
    const upcoming = { ...entries[0]!, releaseDate: '2026-10-05', releaseStage: 'upcoming' };
    expect(releasePresentation(upcoming, records[0], today).badges).toEqual([
      'Digital out now',
      'Pre-order · ships around November 2026',
    ]);
    expect(releasePresentation(upcoming, records[0], today).action).toBe('Pre-order vinyl');
    expect(releasePresentation(entries[0]!, records[0], today).shipping).toBe('Expected to ship around November 2026');
  });
  it.each(['sold_out', 'out_of_stock', 'unavailable'] as const)(
    'replaces an unavailable lead automatically for %s',
    (availabilityState) => {
      const unavailable = records.map((row) =>
        row.storeItemSlug === 'lotus-vinyl' ? { ...row, availabilityState } : row,
      );
      const result = selectReleaseMerchandisingEntries(entries, unavailable);
      expect(result.principal.map((entry) => entry.id)).toEqual(['disintegration', 'caregivers']);
      expect(result.states.get('lotus')?.state).toBe(availabilityState);
      expect(selectReleaseMerchandisingEntries(entries, records).principal[0]?.id).toBe('lotus');
    },
  );
  it('unknown reads never assert stock, preorder or positive buying', () => {
    const result = selectReleaseMerchandisingEntries(entries, []);
    expect(result.principal).toEqual([]);
    expect(result.remainder).toHaveLength(4);
    expect(result.states.get('lotus')).toMatchObject({ state: 'unknown', action: 'View vinyl details', shipping: '' });
    expect(result.states.get('anarchotribal')?.badges).toEqual(['Digital out now', 'Vinyl coming later']);
  });
  it('new offers reorder the remainder automatically, preserving chosen emphasis', () => {
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
    expect(result.remainder.map((entry) => entry.id)).toEqual(['anarchotribal', 'caregivers']);
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
});
