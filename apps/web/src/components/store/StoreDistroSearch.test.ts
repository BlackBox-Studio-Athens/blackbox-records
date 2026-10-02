import { beforeAll, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createExactFirstSearcher, loadExactFirstFuzzySearch } from '@/lib/exact-first-search';

import {
  applyDistroFormatSelection,
  applyDistroSearch,
  getDistroSearchResultState,
  getDistroSearchVisibleElements,
  getStoreArtistChoices,
  normalizeStoreArtist,
  resolveInitialDistroFormatKey,
  StoreSearchToolbar,
  StoreArtistControls,
  type DistroSearchDom,
} from './StoreDistroSearch';

describe('server Store chrome', () => {
  it('renders the final disabled search controls with an empty reserved result box', () => {
    const html = renderToStaticMarkup(createElement(StoreSearchToolbar, { resultsId: 'all-store-catalog' }));
    expect(html).toContain('data-store-search-toolbar');
    expect(html).toMatch(/<input[^>]*type="search"[^>]*disabled/);
    expect(html).toContain('aria-controls="all-store-catalog"');
    expect(html).toMatch(/data-store-search-summary="[^"]*"><\/p>/);
    expect(html).toMatch(/<button[^>]*disabled[^>]*hidden[^>]*data-store-clear-search/);
    expect(html).toMatch(/data-store-empty-results="[^"]*" hidden/);
  });

  it('renders complete native artist choices before enhancement', () => {
    const html = renderToStaticMarkup(
      createElement(StoreArtistControls, {
        resultsId: 'distro-search-results',
        choices: [
          { key: '', label: 'All artists', count: 2 },
          { key: 'band', label: 'Band', count: 2 },
        ],
      }),
    );
    expect(html).toMatch(/<select[^>]*disabled/);
    expect(html).toContain('All artists (2)');
    expect(html).toContain('Band (2)');
    expect(html).toContain('<fieldset class="store-artists" disabled');
    expect(html).toMatch(/<input[^>]*type="radio"[^>]*checked=""[^>]*value=""/);
  });
});

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
  const navigation = new FakeElement();
  const root = new FakeElement();
  const formatKeys = ['distro-group-vinyl-12-inch', 'distro-group-vinyl-7-inch'];
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
    formatKey: formatKeys[index < 2 ? 0 : 1]!,
  }));
  const dom: DistroSearchDom = {
    formatLinks,
    items,
    navigation: navigation as unknown as HTMLElement,
    root: root as unknown as HTMLElement,
  };

  return { cards, dom, formatKeys, formatLinkElements, navigation, root };
}

describe('Distro format selection', () => {
  it('accepts rendered fragments and resolves invalid or malformed fragments to All formats', () => {
    const { dom, formatKeys } = createDom();

    expect(resolveInitialDistroFormatKey(`#${formatKeys[1]}`, dom)).toBe(formatKeys[1]);
    expect(resolveInitialDistroFormatKey('#missing-format', dom)).toBe('all');
    expect(resolveInitialDistroFormatKey('#%E0%A4%A', dom)).toBe('all');
    expect(resolveInitialDistroFormatKey('', dom)).toBe('all');
  });

  it('updates format links and the catalog marker without changing native visibility', () => {
    const { dom, formatKeys, formatLinkElements, root } = createDom();
    const hiddenWritesBefore = [root, ...formatLinkElements].map((element) => element.hiddenWrites);

    applyDistroFormatSelection(dom, formatKeys[1]!);

    expect(root.getAttribute('data-distro-selected-format')).toBe(formatKeys[1]);
    expect(formatLinkElements.map((link) => link.hasAttribute('data-distro-format-current'))).toEqual([
      false,
      false,
      true,
    ]);
    expect(formatLinkElements.map((link) => link.getAttribute('aria-current'))).toEqual([null, null, 'true']);
    expect([root, ...formatLinkElements].map((element) => element.hiddenWrites)).toEqual(hiddenWritesBefore);

    applyDistroFormatSelection(dom, 'invalid');
    expect(root.hasAttribute('data-distro-selected-format')).toBe(false);
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
    expect(dom.root.hasAttribute('data-distro-search-hidden')).toBe(false);
    expect(applyDistroFormatSelection(dom, formatKeys[0]!).target).toBe(dom.root);
    expect(dom.root.dataset.distroSelectedFormat).toBe(formatKeys[0]);
    expect(applyDistroSearch(dom, null)).toBe(2);
    applyDistroFormatSelection(dom, 'all');
    expect(applyDistroSearch(dom, band)).toBe(2);
    expect(applyDistroSearch(dom, null)).toBe(3);
    expect(dom.items).toEqual(original);
  });

  it('filters interleaved formats and promoted cards with the same rules', () => {
    const { cards, dom, formatKeys } = createDom();
    dom.items[1]!.formatKey = formatKeys[1]!;
    dom.items[2]!.formatKey = formatKeys[0]!;
    cards[1]!.setAttribute('data-store-promotion', 'recent');
    const original = [...dom.items];
    applyDistroFormatSelection(dom, formatKeys[0]!);
    expect(applyDistroSearch(dom, null)).toBe(2);
    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([false, true, false]);
    expect(applyDistroSearch(dom, new Set([dom.items[1]!.element]))).toBe(0);
    applyDistroFormatSelection(dom, 'all');
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
  beforeAll(async () => {
    await loadExactFirstFuzzySearch();
  });

  it.each(['all', 'distro'])('combines pre-orders with %s text, artist and format filters', (scope) => {
    const { cards, dom, formatKeys } = createDom();
    if (scope === 'all') dom.formatLinks = [];
    cards[0]!.setAttribute('data-store-preorder');
    cards[2]!.setAttribute('data-store-preorder');
    const original = [...dom.items];
    expect(applyDistroSearch(dom, null, true)).toBe(2);
    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([false, true, false]);
    const band = new Set(dom.items.filter((item) => item.artist === 'Band').map((item) => item.element));
    if (scope === 'distro') applyDistroFormatSelection(dom, formatKeys[0]!);
    expect(applyDistroSearch(dom, band, true)).toBe(scope === 'distro' ? 1 : 2);
    expect(applyDistroSearch(dom, new Set([dom.items[1]!.element]), true)).toBe(0);
    applyDistroFormatSelection(dom, 'all');
    expect(applyDistroSearch(dom, null)).toBe(3);
    expect(dom.items).toEqual(original);
  });

  it('reads refreshed pre-order membership and preserves native hidden cards', () => {
    const { cards, dom } = createDom();
    cards[0]!.setAttribute('data-store-preorder');
    cards[2]!.setAttribute('data-store-preorder');
    cards[2]!.hidden = true;
    expect(applyDistroSearch(dom, null, true)).toBe(1);
    cards[0]!.removeAttribute('data-store-preorder');
    cards[1]!.setAttribute('data-store-preorder');
    expect(applyDistroSearch(dom, null, true)).toBe(1);
    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([true, false, true]);
    cards[1]!.removeAttribute('data-store-preorder');
    cards[2]!.removeAttribute('data-store-preorder');
    expect(applyDistroSearch(dom, null, true)).toBe(0);
    expect(applyDistroSearch(dom, null)).toBe(2);
    expect(cards[2]!.hidden).toBe(true);
  });

  it.each(['all', 'distro'])('matches and clears the %s catalog without replacing or reordering cards', (scope) => {
    const { dom } = createDom();
    if (scope === 'all') {
      dom.formatLinks = [];
      dom.navigation = null;
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
    if (scope === 'all') dom.formatLinks = [];
    dom.items = dom.items.slice(0, count);
    const searcher = createExactFirstSearcher(dom.items, () => 'Title');
    expect(applyDistroSearch(dom, new Set(searcher.search('Title').map((item) => item.element)))).toBe(count);
    expect(applyDistroSearch(dom, new Set())).toBe(0);
    expect(applyDistroSearch(dom, null)).toBe(count);
  });

  it('derives the visible set during render without touching the cards', () => {
    const { cards, dom, formatKeys } = createDom();
    const visible = getDistroSearchVisibleElements(
      dom,
      new Set([dom.items[0]!.element, dom.items[2]!.element]),
      formatKeys[1],
    );

    expect([...visible]).toEqual([dom.items[2]!.element]);
    expect(cards.every((card) => !card.hasAttribute('data-distro-search-hidden') && card.hiddenWrites === 0)).toBe(
      true,
    );
    expect(getDistroSearchVisibleElements(dom, null, undefined).size).toBe(3);
  });

  it('hides unmatched cards without hiding the catalog or changing order', () => {
    const { cards, dom } = createDom();
    const originalOrder = dom.items.slice();

    expect(applyDistroSearch(dom, new Set([dom.items[2]!.element]))).toBe(1);

    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([true, true, false]);
    expect(dom.root.hasAttribute('data-distro-search-hidden')).toBe(false);
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
