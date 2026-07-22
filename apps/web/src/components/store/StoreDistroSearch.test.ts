import { describe, expect, it } from 'vitest';

import {
  applyDistroSearch,
  closeDistroFormatDisclosure,
  getDistroSearchResultState,
  type DistroSearchDom,
} from './StoreDistroSearch';

class FakeElement {
  hidden = false;
  private readonly attributes = new Set<string>();

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  toggleAttribute(name: string, force: boolean) {
    if (force) this.attributes.add(name);
    else this.attributes.delete(name);
  }
}

function createDom() {
  const cards = [new FakeElement(), new FakeElement(), new FakeElement()];
  const chunks = [new FakeElement(), new FakeElement()];
  const groups = [new FakeElement(), new FakeElement()];
  const navigation = new FakeElement();
  const formatDisclosure = { open: true };
  const items = cards.map((element, index) => ({
    element: element as unknown as HTMLElement,
    searchText: `item ${index + 1}`,
  }));
  const chunkRecords = [
    { element: chunks[0] as unknown as HTMLElement, items: items.slice(0, 2) },
    { element: chunks[1] as unknown as HTMLElement, items: items.slice(2) },
  ];
  const dom: DistroSearchDom = {
    chunks: chunkRecords,
    formatDisclosure: formatDisclosure as HTMLDetailsElement,
    groups: [
      { element: groups[0] as unknown as HTMLElement, chunks: chunkRecords.slice(0, 1) },
      { element: groups[1] as unknown as HTMLElement, chunks: chunkRecords.slice(1) },
    ],
    items,
    navigation: navigation as unknown as HTMLElement,
    root: {} as ParentNode,
  };

  return { cards, chunks, dom, formatDisclosure, groups, navigation };
}

describe('Distro search DOM filtering', () => {
  it('hides unmatched cards and empty chunks and groups without changing order', () => {
    const { cards, chunks, dom, groups } = createDom();
    const originalOrder = dom.items.slice();

    const visibleCount = applyDistroSearch(dom, new Set([dom.items[2]!.element]));

    expect(visibleCount).toBe(1);
    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([false, false, false]);
    expect(chunks.map((chunk) => chunk.hasAttribute('data-distro-search-hidden'))).toEqual([false, false]);
    expect(groups.map((group) => group.hasAttribute('data-distro-search-hidden'))).toEqual([true, false]);
    expect(dom.items).toEqual(originalOrder);
  });

  it('restores native catalog state and closes the mobile format disclosure', () => {
    const { cards, dom, formatDisclosure, navigation } = createDom();
    cards[2]!.hidden = true;

    applyDistroSearch(dom, new Set([dom.items[0]!.element]));
    expect(navigation.hidden).toBe(true);

    closeDistroFormatDisclosure(dom);
    const visibleCount = applyDistroSearch(dom, null);

    expect(formatDisclosure.open).toBe(false);
    expect(visibleCount).toBe(2);
    expect(navigation.hidden).toBe(false);
    expect(cards.map((card) => card.hidden)).toEqual([false, false, true]);
  });

  it('reports zero results as an empty state and pluralizes the count', () => {
    expect(getDistroSearchResultState(0)).toEqual({ isEmpty: true, visibleLabel: '0 items' });
    expect(getDistroSearchResultState(1)).toEqual({ isEmpty: false, visibleLabel: '1 item' });
  });
});
