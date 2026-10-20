import { describe, expect, it, vi } from 'vitest';
import { connectReleaseCatalogPresentation, selectReleaseMerchandisingEntries } from './ReleaseCatalogPresentation';
import {
  neutralReleasePresentation,
  releasePresentation,
  renderReleasePresentation,
  sanitizeReleaseCatalogPresentation,
  type Listing,
  type ReleasePresentationEntry,
} from './release-presentation';

const entries: ReleasePresentationEntry[] = [
  { id: 'lotus', priority: 1, edition: { kind: 'native', storeSlug: 'lotus-vinyl', format: 'vinyl' } },
  {
    id: 'disintegration',
    priority: 2,
    edition: { kind: 'native', storeSlug: 'disintegration-vinyl', format: 'vinyl' },
  },
  { id: 'caregivers', edition: { kind: 'native', storeSlug: 'caregivers-vinyl', format: 'vinyl' } },
  { id: 'anarchotribal', edition: { kind: 'announced', format: 'vinyl' } },
];
const record = (slug = 'lotus-vinyl', preorder: Listing['preorder'] = null): Listing => ({
  storeItemSlug: slug,
  presentationState: 'ready',
  availabilityState: 'stocked',
  displayPrice: '€28.00',
  preorder,
});
const preorder = record('lotus-vinyl', { shipEstimate: { kind: 'month', month: '2099-11', part: null } });
const projected = {
  storeItemSlug: 'lotus-vinyl',
  displayPrice: '€28.00',
  shipEstimate: preorder.preorder!.shipEstimate,
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Releases physical merchandising', () => {
  it('retains editorial roles and source order while offers load, fail, open or deplete', () => {
    const expected = { principal: ['lotus', 'disintegration'], remainder: ['caregivers', 'anarchotribal'] };
    const records = entries.flatMap((entry) =>
      entry.edition.kind === 'native' ? [record(entry.edition.storeSlug)] : [],
    );
    for (const offers of [
      [],
      records,
      [preorder],
      records.map((row) => ({ ...row, availabilityState: 'sold_out' as const })),
    ]) {
      const result = selectReleaseMerchandisingEntries(entries, offers);
      expect({
        principal: result.principal.map((entry) => entry.id),
        remainder: result.remainder.map((entry) => entry.id),
      }).toEqual(expected);
      expect(new Set([...result.principal, ...result.remainder].map((entry) => entry.id)).size).toBe(entries.length);
    }
    expect(entries.map((entry) => entry.id)).toEqual(['lotus', 'disintegration', 'caregivers', 'anarchotribal']);
  });

  it('respects explicit priority, stable unranked order, editorial-only entries and empty catalogs', () => {
    const ranked = entries.map((entry) => ({ ...entry, priority: entry.id === 'caregivers' ? 1 : undefined }));
    expect(selectReleaseMerchandisingEntries(ranked).principal.map((entry) => entry.id)).toEqual([
      'caregivers',
      'lotus',
    ]);
    const unranked = entries.map((entry) => ({ ...entry, priority: undefined }));
    expect(selectReleaseMerchandisingEntries(unranked).principal.map((entry) => entry.id)).toEqual([
      'lotus',
      'disintegration',
    ]);
    expect(releasePresentation({ id: 'digital', edition: { kind: 'none' } }, preorder)).toEqual({
      state: 'editorial',
      action: '',
      status: '',
      shipping: '',
      price: '',
    });
    expect(selectReleaseMerchandisingEntries([], []).remainder).toEqual([]);
  });

  it.each([
    ['vinyl', 'vinyl'],
    ['cd', 'CD'],
    ['cassette', 'cassette'],
  ] as const)('uses format-aware actions and static lifecycle wording for %s', (format, label) => {
    const entry: ReleasePresentationEntry = {
      id: 'lotus',
      edition: { kind: 'native', storeSlug: 'lotus-vinyl', format },
    };
    expect(releasePresentation(entry, record())).toMatchObject({
      state: 'available',
      action: `Buy ${label}`,
      status: '',
      shipping: '',
    });
    expect(releasePresentation(entry, preorder)).toMatchObject({
      state: 'preorder',
      action: `Pre-order ${label}`,
      status: '',
      shipping: 'Expected to ship around November 2099',
    });
    expect(releasePresentation(entry, record('lotus-vinyl', { shipEstimate: null }))).toMatchObject({
      state: 'preorder',
      action: `Pre-order ${label}`,
      shipping: '',
    });
    expect(neutralReleasePresentation({ ...entry, edition: { kind: 'announced', format } })).toMatchObject({
      state: 'announced',
      status: 'Coming soon',
      action: '',
      price: '',
    });
  });

  it.each([
    ['coming_soon', 'Coming soon', 'Expected January 2099'],
    ['repressing', 'Repressing', 'Expected January 2099'],
    ['sold_out', 'Sold out', ''],
  ] as const)(
    'depletes a pre-order truthfully to %s, retaining a ready price',
    (availabilityState, status, shipping) => {
      const result = releasePresentation(entries[0]!, { ...preorder, availabilityState, expectedMonth: '2099-01' });
      expect(result).toMatchObject({ state: availabilityState, action: '', status, shipping, price: '€28.00' });
      expect(result).not.toHaveProperty('preorder');
      expect(releasePresentation(entries[0]!, { ...record(), availabilityState }).shipping).toBe('');
    },
  );

  it.each(['unavailable', 'out_of_stock'] as const)(
    'keeps %s internal, while ready prices follow Store rules',
    (state) => {
      expect(
        releasePresentation(entries[0]!, { ...record(), availabilityState: state as Listing['availabilityState'] }),
      ).toEqual({
        state: 'unknown',
        action: '',
        status: '',
        shipping: '',
        price: '€28.00',
      });
    },
  );

  it('makes no public state, action or price claim for pending, missing, mismatched or unready offers', () => {
    for (const missing of [
      undefined,
      record('another-vinyl'),
      { ...record(), presentationState: 'unavailable' } as Listing,
    ]) {
      expect(releasePresentation(entries[0]!, missing)).toEqual({
        state: 'unknown',
        action: '',
        status: '',
        shipping: '',
        price: '',
      });
    }
  });
});

// Only offer-owned fields are writable: touching stable date/format metadata fails this fixture.
function renderedCard(withProjection = true, withFormat = true) {
  const ownerDocument = { activeElement: null as unknown };
  const format = { focus: vi.fn() };
  const title = { focus: vi.fn() };
  const label = { textContent: withProjection ? 'Pre-order vinyl' : '' };
  const action = {
    isConnected: true,
    ownerDocument,
    className: withProjection ? 'preorder-action' : '',
    hidden: !withProjection,
    textContent: 'record mark and label',
    querySelector: () => label,
    attributes: new Map<string, string>(),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
  };
  const price = { textContent: withProjection ? '€28.00' : '', hidden: !withProjection };
  const shipping = { textContent: '', hidden: true };
  const terms = { hidden: !withProjection };
  const status = { textContent: '', hidden: true, dataset: {} };
  const slot = { hidden: !withProjection };
  const fields: Record<string, unknown> = {
    '[data-release-purchase]': action,
    '[data-release-price]': price,
    '[data-release-terms]': terms,
    '[data-release-status]': status,
    '[data-release-purchase-slot]': slot,
    '[data-release-shipping]': shipping,
    '.release-card-formats .release-format-link[href]': withFormat ? format : null,
    '.release-card-title-link[href]': title,
  };
  const card = {
    dataset: {
      releaseId: 'lotus',
      releaseRole: 'lead',
      releaseName: 'LOTUS',
      releaseStoreSlug: 'lotus-vinyl',
      releasePhysicalFormat: 'vinyl',
      ...(withProjection ? { releaseProjected: JSON.stringify(projected) } : {}),
    },
    querySelector(selector: string) {
      if (!(selector in fields)) throw new Error(`Offer renderer touched stable metadata: ${selector}`);
      return fields[selector];
    },
  } as unknown as HTMLElement;
  const root = { querySelectorAll: () => [card] } as unknown as HTMLElement;
  return { root, card, label, action, price, terms, status, slot, shipping, ownerDocument, format, title };
}

describe('Releases SSR, live correction and cached return', () => {
  it.each(['sold_out', 'unavailable'] as const)(
    'moves only a disappearing focused Buy to its format after %s correction',
    async (availabilityState) => {
      for (const focused of [true, false]) {
        const card = renderedCard();
        card.ownerDocument.activeElement = focused ? card.action : null;
        let resolve!: (records: Listing[]) => void;
        connectReleaseCatalogPresentation(
          card.root,
          () =>
            new Promise((done) => {
              resolve = done;
            }),
        );
        expect(card.format.focus).not.toHaveBeenCalled();
        resolve([{ ...record(), availabilityState }]);
        await settle();
        expect(card.action.hidden).toBe(true);
        expect(card.format.focus).toHaveBeenCalledTimes(focused ? 1 : 0);
        expect(card.title.focus).not.toHaveBeenCalled();
      }
    },
  );

  it('uses the existing title destination when no mapped format link exists', () => {
    const card = renderedCard(true, false);
    card.ownerDocument.activeElement = card.action;
    renderReleasePresentation(card.card, entries[0]!, neutralReleasePresentation(entries[0]!));
    expect(card.title.focus).toHaveBeenCalledOnce();
    expect(card.format.focus).not.toHaveBeenCalled();
  });

  it('writes labels and accessible names without dropping the icon or reserving absent terms', () => {
    const card = renderedCard(false);
    renderReleasePresentation(card.card, entries[0]!, releasePresentation(entries[0]!, preorder), 'preorder-action');
    expect(card.label.textContent).toBe('Pre-order vinyl');
    expect(card.action.textContent).toBe('record mark and label');
    expect(card.action.attributes.get('aria-label')).toBe('Pre-order vinyl, LOTUS');
    expect(card.terms.hidden).toBe(false);
    expect(card.slot.hidden).toBe(false);

    renderReleasePresentation(card.card, entries[0]!, releasePresentation(entries[0]!, record()), 'purchase-action');
    expect(card.action.attributes.get('aria-label')).toBe('Buy vinyl, LOTUS');
    expect(card.terms.hidden).toBe(true);

    renderReleasePresentation(card.card, entries[0]!, neutralReleasePresentation(entries[0]!));
    expect(card.label.textContent).toBe('');
    expect(card.action.hidden).toBe(true);
    expect(card.slot.hidden).toBe(true);
    expect(card.price).toEqual({ textContent: '', hidden: true });
  });

  it('keeps the rendered pre-order while a read is delayed and when it fails', async () => {
    const card = renderedCard();
    card.ownerDocument.activeElement = card.action;
    let reject!: (error: Error) => void;
    connectReleaseCatalogPresentation(
      card.root,
      () =>
        new Promise((_done, fail) => {
          reject = fail;
        }),
    );
    expect(card.label.textContent).toBe('Pre-order vinyl');
    reject(new Error('offline'));
    await settle();
    expect(card.label.textContent).toBe('Pre-order vinyl');
    expect(card.price).toEqual({ textContent: '€28.00', hidden: false });
    expect(card.format.focus).not.toHaveBeenCalled();
    expect(card.ownerDocument.activeElement).toBe(card.action);
  });

  it('replaces a projected pre-order with static sold out, removes terms and retains its ready price', async () => {
    const card = renderedCard();
    connectReleaseCatalogPresentation(card.root, async () => [{ ...record(), availabilityState: 'sold_out' }]);
    await settle();
    expect(card.action.hidden).toBe(true);
    expect(card.label.textContent).toBe('');
    expect(card.terms.hidden).toBe(true);
    expect(card.slot.hidden).toBe(false);
    expect(card.status).toMatchObject({
      textContent: 'Sold out',
      hidden: false,
      dataset: { availabilityState: 'sold_out' },
    });
    expect(card.price).toEqual({ textContent: '€28.00', hidden: false });
  });

  it('restores original projected or neutral HTML before a cached return is enriched', () => {
    const projectedCard = renderedCard();
    projectedCard.label.textContent = 'Buy vinyl';
    sanitizeReleaseCatalogPresentation(projectedCard.root);
    expect(projectedCard.label.textContent).toBe('Pre-order vinyl');
    expect(projectedCard.action.className).toContain('preorder-action');
    expect(projectedCard.terms.hidden).toBe(false);

    const neutralCard = renderedCard(false);
    neutralCard.label.textContent = 'Buy vinyl';
    sanitizeReleaseCatalogPresentation(neutralCard.root);
    expect(neutralCard.action.hidden).toBe(true);
    expect(neutralCard.slot.hidden).toBe(true);
    expect(neutralCard.status.hidden).toBe(true);
    expect(neutralCard.price).toEqual({ textContent: '', hidden: true });
  });

  it('ignores a late offer after disposal', async () => {
    const card = renderedCard();
    card.ownerDocument.activeElement = card.action;
    let resolve!: (records: Listing[]) => void;
    const dispose = connectReleaseCatalogPresentation(
      card.root,
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    dispose();
    resolve([{ ...record(), availabilityState: 'sold_out' }]);
    await settle();
    expect(card.label.textContent).toBe('Pre-order vinyl');
    expect(card.action.className).toBe('preorder-action');
    expect(card.format.focus).not.toHaveBeenCalled();
    expect(card.ownerDocument.activeElement).toBe(card.action);
  });
});
