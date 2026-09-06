import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyDistroFormatSelection,
  applyDistroSearch,
  closeDistroFormatDisclosure,
  getDistroSearchResultState,
  resolveInitialDistroFormatKey,
  selectDistroFormat,
  type DistroSearchDom,
} from './StoreDistroSearch';

const source = readFileSync(fileURLToPath(new URL('./StoreDistroSearch.tsx', import.meta.url)), 'utf8');

afterEach(() => vi.unstubAllGlobals());

class FakeElement {
  dataset: Record<string, string> = {};
  focus = vi.fn();
  hiddenWrites = 0;
  scrollIntoView = vi.fn();
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
  }

  setAttribute(name: string, value = '') {
    this.attributes.set(name, value);
  }

  toggleAttribute(name: string, force: boolean) {
    if (force) this.attributes.set(name, '');
    else this.attributes.delete(name);
  }
}

function createDom() {
  const cards = [new FakeElement(), new FakeElement(), new FakeElement()];
  const chunks = [new FakeElement(), new FakeElement()];
  const groups = [new FakeElement(), new FakeElement()];
  const targets = [new FakeElement(), new FakeElement()];
  const navigation = new FakeElement();
  const root = new FakeElement();
  const formatSummaryCurrent = new FakeElement();
  const formatDisclosure = { open: true };
  const formatKeys = ['distro-group-vinyl-12-inch', 'distro-group-vinyl-7-inch'];
  targets[0]!.textContent = 'Vinyl 12-inch';
  targets[1]!.textContent = 'Vinyl 7-inch';
  const linkKeys = ['all', ...formatKeys, 'all', ...formatKeys];
  const formatLinkElements = linkKeys.map(() => new FakeElement());
  const formatLinks = formatLinkElements.map((element, index) => ({
    element: element as unknown as HTMLElement,
    formatKey: linkKeys[index]!,
  }));
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
    formatLinks,
    formatSummaryCurrent: formatSummaryCurrent as unknown as HTMLElement,
    groups: [
      {
        chunks: chunkRecords.slice(0, 1),
        element: groups[0] as unknown as HTMLElement,
        formatKey: formatKeys[0]!,
        target: targets[0] as unknown as HTMLElement,
      },
      {
        chunks: chunkRecords.slice(1),
        element: groups[1] as unknown as HTMLElement,
        formatKey: formatKeys[1]!,
        target: targets[1] as unknown as HTMLElement,
      },
    ],
    items,
    navigation: navigation as unknown as HTMLElement,
    root: root as unknown as HTMLElement,
  };

  return {
    cards,
    chunks,
    dom,
    formatDisclosure,
    formatKeys,
    formatLinkElements,
    formatSummaryCurrent,
    groups,
    navigation,
    root,
    targets,
  };
}

describe('Distro format selection', () => {
  it('accepts rendered fragments and resolves invalid or malformed fragments to All formats', () => {
    const { dom, formatKeys } = createDom();

    expect(resolveInitialDistroFormatKey(`#${formatKeys[1]}`, dom)).toBe(formatKeys[1]);
    expect(resolveInitialDistroFormatKey('#missing-format', dom)).toBe('all');
    expect(resolveInitialDistroFormatKey('#%E0%A4%A', dom)).toBe('all');
    expect(resolveInitialDistroFormatKey('', dom)).toBe('all');
  });

  it('updates both link sets, section semantics, summary, disclosure, and Coverflow without hidden writes', () => {
    const { dom, formatDisclosure, formatKeys, formatLinkElements, formatSummaryCurrent, groups, root } = createDom();
    const setFocusedGroup = vi.fn();
    const hiddenWritesBefore = [root, ...groups, ...formatLinkElements].map((element) => element.hiddenWrites);

    applyDistroFormatSelection(dom, formatKeys[1]!, { setFocusedGroup });

    expect(root.getAttribute('data-distro-selected-format')).toBe(formatKeys[1]);
    expect(groups.map((group) => group.hasAttribute('data-distro-format-current'))).toEqual([false, true]);
    expect(groups.map((group) => group.getAttribute('aria-current'))).toEqual([null, 'true']);
    expect(formatLinkElements.map((link) => link.hasAttribute('data-distro-format-current'))).toEqual([
      false,
      false,
      true,
      false,
      false,
      true,
    ]);
    expect(formatLinkElements.map((link) => link.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'true',
      null,
      null,
      'true',
    ]);
    expect(formatSummaryCurrent.textContent).toBe('Vinyl 7-inch');
    expect(formatDisclosure.open).toBe(false);
    expect(setFocusedGroup).toHaveBeenCalledWith(dom.groups[1]!.element);
    expect([root, ...groups, ...formatLinkElements].map((element) => element.hiddenWrites)).toEqual(hiddenWritesBefore);

    applyDistroFormatSelection(dom, 'invalid', { setFocusedGroup });
    expect(root.hasAttribute('data-distro-selected-format')).toBe(false);
    expect(groups.every((group) => !group.hasAttribute('data-distro-format-current'))).toBe(true);
    expect(groups.every((group) => group.getAttribute('aria-current') === null)).toBe(true);
    expect(formatSummaryCurrent.textContent).toBe('All formats');
    expect(setFocusedGroup).toHaveBeenLastCalledWith(null);
  });

  it('selects before one final frame focuses and scrolls the target', () => {
    const { dom, formatKeys, targets } = createDom();
    const events: string[] = [];
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return 17;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    targets[0]!.focus = vi.fn(() => events.push('focus'));
    targets[0]!.scrollIntoView = vi.fn(() => events.push('scroll'));

    selectDistroFormat(dom, formatKeys[0]!, { setFocusedGroup: () => events.push('select') }, true);
    expect(events).toEqual(['select']);
    frames[0]!(0);

    expect(events).toEqual(['select', 'focus', 'scroll']);
    expect(targets[0]!.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(targets[0]!.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('restores All formats before search activation and again during cleanup', () => {
    const searchEffectIndex = source.indexOf(
      'if (hasQuery)',
      source.indexOf('useEffect(() =>', source.indexOf('[pageKey]')),
    );
    const searchResetIndex = source.indexOf(
      'applyDistroFormatSelection(dom, ALL_DISTRO_FORMATS_KEY, coverflowControllerRef.current);',
      searchEffectIndex,
    );
    expect(searchResetIndex).toBeGreaterThan(searchEffectIndex);
    expect(searchResetIndex).toBeLessThan(source.indexOf('setSearchActive(hasQuery)', searchEffectIndex));
    expect(source).toMatch(
      /return \(\) => \{[\s\S]*?applyDistroFormatSelection\(dom, ALL_DISTRO_FORMATS_KEY[\s\S]*?coverflowControllerRef\.current\?\.cleanup\(\)/,
    );
    expect(source).toContain('const initialFormatKey = resolveInitialDistroFormatKey(window.location.hash, dom);');
    expect(source).not.toContain("addEventListener('hashchange'");
  });
});

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
