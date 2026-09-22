import { describe, expect, it } from 'vitest';
import { createExactFirstSearcher } from '@/lib/exact-first-search';

import {
  applyDistroFormatSelection,
  applyDistroSearch,
  getDistroSearchResultState,
  getStoreArtistChoices,
  normalizeStoreArtist,
  resolveInitialDistroFormatKey,
  type DistroSearchDom,
} from './StoreDistroSearch';

class FakeElement {
  dataset: Record<string, string> = {};
  hiddenWrites = 0;
  textContent = '';
  private readonly attributes = new Map<string, string>();
  private hiddenValue = false;

  get hidden() {
    return this.hiddenValue;
  }

  set hidden(value: boolean) {
    this.hiddenValue = value;
    this.hiddenWrites += 1;
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name === 'data-distro-selected-format') delete this.dataset.distroSelectedFormat;
  }

  setAttribute(name: string, value = '') {
    this.attributes.set(name, value);
    if (name === 'data-distro-selected-format') this.dataset.distroSelectedFormat = value;
  }

  toggleAttribute(name: string, force: boolean) {
    if (force) this.attributes.set(name, '');
    else this.attributes.delete(name);
  }
}

function createDom() {
  const cards = [new FakeElement(), new FakeElement(), new FakeElement()];
  const groups = [new FakeElement(), new FakeElement()];
  const targets = [new FakeElement(), new FakeElement()];
  const navigation = new FakeElement();
  const root = new FakeElement();
  const formatDisclosure = { open: true };
  const formatKeys = ['distro-group-vinyl-12-inch', 'distro-group-vinyl-7-inch'];
  targets[0]!.textContent = 'Vinyl 12-inch';
  targets[1]!.textContent = 'Vinyl 7-inch';
  const linkKeys = ['all', ...formatKeys];
  const formatLinkElements = linkKeys.map(() => new FakeElement());
  const formatLinks = formatLinkElements.map((element, index) => ({
    element: element as unknown as HTMLElement,
    formatKey: linkKeys[index]!,
  }));
  const items = cards.map((element, index) => ({
    element: element as unknown as HTMLElement,
    searchText: `item ${index + 1}`,
    artist: index === 1 ? 'Other' : 'Band',
  }));
  const dom: DistroSearchDom = {
    formatDisclosure: formatDisclosure as HTMLDetailsElement,
    formatLinks,
    groups: [
      {
        element: groups[0] as unknown as HTMLElement,
        formatKey: formatKeys[0]!,
        items: items.slice(0, 2),
        target: targets[0] as unknown as HTMLElement,
      },
      {
        element: groups[1] as unknown as HTMLElement,
        formatKey: formatKeys[1]!,
        items: items.slice(2),
        target: targets[1] as unknown as HTMLElement,
      },
    ],
    items,
    navigation: navigation as unknown as HTMLElement,
    root: root as unknown as HTMLElement,
  };

  return { cards, dom, formatKeys, formatLinkElements, groups, navigation, root };
}

describe('Distro format selection', () => {
  it('accepts rendered fragments and resolves invalid or malformed fragments to All formats', () => {
    const { dom, formatKeys } = createDom();

    expect(resolveInitialDistroFormatKey(`#${formatKeys[1]}`, dom)).toBe(formatKeys[1]);
    expect(resolveInitialDistroFormatKey('#missing-format', dom)).toBe('all');
    expect(resolveInitialDistroFormatKey('#%E0%A4%A', dom)).toBe('all');
    expect(resolveInitialDistroFormatKey('', dom)).toBe('all');
  });

  it('updates format links and section semantics without changing visibility', () => {
    const { dom, formatKeys, formatLinkElements, groups, root } = createDom();
    const hiddenWritesBefore = [root, ...groups, ...formatLinkElements].map((element) => element.hiddenWrites);

    applyDistroFormatSelection(dom, formatKeys[1]!);

    expect(root.getAttribute('data-distro-selected-format')).toBe(formatKeys[1]);
    expect(groups.map((group) => group.hasAttribute('data-distro-format-current'))).toEqual([false, true]);
    expect(groups.map((group) => group.getAttribute('aria-current'))).toEqual([null, 'true']);
    expect(formatLinkElements.map((link) => link.hasAttribute('data-distro-format-current'))).toEqual([
      false,
      false,
      true,
    ]);
    expect(formatLinkElements.map((link) => link.getAttribute('aria-current'))).toEqual([null, null, 'true']);
    expect([root, ...groups, ...formatLinkElements].map((element) => element.hiddenWrites)).toEqual(hiddenWritesBefore);

    applyDistroFormatSelection(dom, 'invalid');
    expect(root.hasAttribute('data-distro-selected-format')).toBe(false);
    expect(groups.every((group) => !group.hasAttribute('data-distro-format-current'))).toBe(true);
    expect(groups.every((group) => group.getAttribute('aria-current') === null)).toBe(true);
    expect(formatLinkElements.map((link) => link.hasAttribute('data-distro-format-current'))).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('intersects text, artist and format without hiding navigation or changing order', () => {
    const { dom, formatKeys, navigation } = createDom();
    const original = [...dom.items];
    const band = new Set(
      dom.items.filter((item) => normalizeStoreArtist(item.artist) === 'band').map((item) => item.element),
    );
    applyDistroFormatSelection(dom, formatKeys[0]!);
    expect(applyDistroSearch(dom, band)).toBe(1);
    expect(navigation.hidden).toBe(false);
    expect(applyDistroSearch(dom, new Set([dom.items[2]!.element]))).toBe(0);
    expect(dom.root.dataset.distroSelectedFormat).toBe(formatKeys[0]);
    expect(applyDistroSearch(dom, null)).toBe(2);
    applyDistroFormatSelection(dom, 'all');
    expect(applyDistroSearch(dom, band)).toBe(2);
    expect(applyDistroSearch(dom, null)).toBe(3);
    expect(dom.items).toEqual(original);
  });

  it('merges equivalent artist spellings without splitting collaborations or stripping accents', () => {
    const choices = getStoreArtistChoices(
      ['  Café  Band ', 'CAFE\u0301   BAND', 'Cafe Band', 'A & B', 'A', 'Label'].map((artist) => ({ artist })),
    );
    expect(choices.map((choice) => choice.label)).toEqual(['A', 'A & B', 'Cafe Band', 'Café Band', 'Label']);
    expect(choices.find((choice) => choice.key === 'café band')?.count).toBe(2);
  });
});

describe('Distro search DOM filtering', () => {
  it.each(['all', 'distro'])('matches and clears the %s catalog without replacing or reordering cards', (scope) => {
    const { dom } = createDom();
    if (scope === 'all') {
      dom.groups = [];
      dom.formatLinks = [];
      dom.navigation = null;
      dom.formatDisclosure = null;
    }
    dom.items.forEach((item, index) => {
      item.searchText = ['Disintegration Black Vinyl LP', 'Disintegraton LP', 'Disintegration CD'][index]!;
    });
    const originalItems = [...dom.items];
    const searcher = createExactFirstSearcher(dom.items, (item) => item.searchText);
    const exact = searcher.search('  DISINTEGRATION  ');
    expect(exact).toEqual([dom.items[0], dom.items[2]]);
    expect(applyDistroSearch(dom, new Set(exact.map((item) => item.element)))).toBe(2);
    expect(dom.items[1]!.element.hasAttribute('data-distro-search-hidden')).toBe(true);
    expect(dom.items.every((item) => !item.searchText.toLowerCase().includes('disintegraion'))).toBe(true);
    expect(searcher.search('disintegraion')).not.toHaveLength(0);
    expect(applyDistroSearch(dom, new Set(searcher.search('zzzzzzzz').map((item) => item.element)))).toBe(0);
    expect(searcher.search('   ')).toEqual(originalItems);
    expect(applyDistroSearch(dom, null)).toBe(3);
    expect(dom.items.every((item) => !item.element.hasAttribute('data-distro-search-hidden'))).toBe(true);
    expect(dom.items).toEqual(originalItems);
  });

  it.each([
    ['all', 0],
    ['all', 1],
    ['distro', 0],
    ['distro', 1],
  ] as const)('filters %s with %i cards and missing optional text', (scope, count) => {
    const { dom } = createDom();
    if (scope === 'all') dom.groups = [];
    dom.items = dom.items.slice(0, count);
    const searcher = createExactFirstSearcher(dom.items, () => 'Title');
    expect(applyDistroSearch(dom, new Set(searcher.search('Title').map((item) => item.element)))).toBe(count);
    expect(applyDistroSearch(dom, new Set())).toBe(0);
    expect(applyDistroSearch(dom, null)).toBe(count);
  });

  it('hides unmatched cards and empty groups without changing order', () => {
    const { cards, dom, groups } = createDom();
    const originalOrder = dom.items.slice();

    expect(applyDistroSearch(dom, new Set([dom.items[2]!.element]))).toBe(1);

    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([true, true, false]);
    expect(groups.map((group) => group.hasAttribute('data-distro-search-hidden'))).toEqual([true, false]);
    expect(dom.items).toEqual(originalOrder);
  });

  it('respects native hidden state when restoring the complete catalog', () => {
    const { cards, dom, navigation } = createDom();
    cards[2]!.hidden = true;

    applyDistroSearch(dom, new Set([dom.items[0]!.element]));
    expect(navigation.hidden).toBe(false);

    expect(applyDistroSearch(dom, null)).toBe(2);
    expect(navigation.hidden).toBe(false);
    expect(cards.map((card) => card.hidden)).toEqual([false, false, true]);
    expect(cards[2]!.hasAttribute('data-distro-search-hidden')).toBe(true);
  });

  it('reports zero results as an empty state and pluralizes the count', () => {
    expect(getDistroSearchResultState(0)).toEqual({ isEmpty: true, visibleLabel: '0 items' });
    expect(getDistroSearchResultState(1)).toEqual({ isEmpty: false, visibleLabel: '1 item' });
  });
});
