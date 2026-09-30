import { describe, expect, it } from 'vitest';

import {
  applyPreviewState,
  getPrintDepth,
  initialPreviewState,
  nextPreviewState,
  readListedArtistIds,
  reconcilePreviewState,
  resolvePreviewTargetId,
  type PreviewState,
} from './artist-roster-preview-state';
import { filterArtistRoster, sortArtistRoster } from './artist-roster-search';

// The repository has no DOM test environment, so these fakes cover only the attribute writes the module makes.
function fakeElement(id: string, attributes: Record<string, string> = {}) {
  const attributeMap = new Map(Object.entries(attributes));
  return {
    attributes: attributeMap,
    dataset: { artistId: id },
    hidden: attributeMap.has('hidden'),
    removeAttribute: (name: string) => void attributeMap.delete(name),
    setAttribute: (name: string, value: string) => void attributeMap.set(name, value),
    toggleAttribute: (name: string, force: boolean) =>
      void (force ? attributeMap.set(name, '') : attributeMap.delete(name)),
  };
}

function fakeRoster(ids: string[]) {
  const prints = ids.map((id, index) => fakeElement(id, index === 0 ? { 'data-print-depth': '0' } : { hidden: '' }));
  const details = ids.map((id, index) => fakeElement(id, index === 0 ? {} : { hidden: '' }));
  const rows = ids.map((id) => fakeElement(id));
  const items = ids.map((id) => fakeElement(id));
  const root = {
    querySelectorAll(selector: string) {
      const bySelector: Record<string, unknown[]> = {
        '[data-artist-preview-print]': prints,
        '[data-artist-preview-details]': details,
        '[data-artist-roster-row]': rows,
        '[data-artist-roster-item]': items,
      };
      return bySelector[selector] ?? [];
    },
  } as unknown as ParentNode;
  return { details, items, prints, root, rows };
}

function hover(state: PreviewState, ...ids: string[]) {
  return ids.reduce(nextPreviewState, state);
}

describe('artist roster preview state', () => {
  it('keeps the newest print on top with the two previous underneath', () => {
    const state = hover({ active: 'a', history: [] }, 'b', 'c', 'd');

    expect(state).toEqual({ active: 'd', history: ['c', 'b'] });
    expect(['a', 'b', 'c', 'd'].map((id) => getPrintDepth(state, id))).toEqual([null, 2, 1, 0]);
  });

  it('ignores re-hovering the active artist and pulls a revisited artist out of the pile', () => {
    const state = hover({ active: 'a', history: [] }, 'b', 'c');

    expect(nextPreviewState(state, 'c')).toBe(state);
    expect(nextPreviewState(state, 'a')).toEqual({ active: 'a', history: ['c', 'b'] });
    expect(nextPreviewState(state, 'b')).toEqual({ active: 'b', history: ['c', 'a'] });
  });

  it('falls back to the first listed row when the active artist is filtered out', () => {
    const state = hover({ active: 'a', history: [] }, 'b', 'c');

    expect(reconcilePreviewState(state, ['b', 'c', 'e'])).toEqual({ active: 'c', history: ['b'] });
    expect(reconcilePreviewState(state, ['e', 'f'])).toEqual({ active: 'e', history: [] });
    expect(reconcilePreviewState(initialPreviewState, ['x', 'y'])).toEqual({ active: 'x', history: [] });
    expect(reconcilePreviewState(state, ['a', 'b', 'c'])).toBe(state);
    expect(reconcilePreviewState(state, [])).toBe(state);
  });

  it('resolves rows for pointer events and rows or items for focus', () => {
    const row = { dataset: { artistId: 'a' } };
    const item = { dataset: { artistId: 'b' } };
    const target = (match: Record<string, unknown>) =>
      ({
        closest: (selector: string) => Object.entries(match).find(([key]) => selector.includes(key))?.[1] ?? null,
      }) as unknown as Element;

    expect(resolvePreviewTargetId('pointerover', target({ 'data-artist-roster-row': row }))).toBe('a');
    expect(resolvePreviewTargetId('pointerover', target({ 'data-artist-roster-item': item }))).toBeNull();
    expect(resolvePreviewTargetId('focusin', target({ 'data-artist-roster-item': item }))).toBe('b');
    expect(resolvePreviewTargetId('pointerover', null)).toBeNull();
  });

  it('writes depth, hidden, aria-hidden, details, and the active row for A to D', () => {
    const { details, prints, root, rows } = fakeRoster(['a', 'b', 'c', 'd']);

    applyPreviewState(root, hover({ active: 'a', history: [] }, 'b', 'c', 'd'));

    expect(prints.map((print) => print.attributes.get('data-print-depth') ?? null)).toEqual([null, '2', '1', '0']);
    expect(prints.map((print) => print.hidden)).toEqual([true, false, false, false]);
    expect(prints.map((print) => print.attributes.get('aria-hidden') ?? null)).toEqual([null, 'true', 'true', null]);
    expect(details.map((block) => block.hidden)).toEqual([true, true, true, false]);
    expect(rows.map((row) => row.attributes.has('data-active'))).toEqual([false, false, false, true]);
  });

  it('restores the server default when reset with null', () => {
    const { details, prints, root, rows } = fakeRoster(['a', 'b', 'c']);
    applyPreviewState(root, hover({ active: 'a', history: [] }, 'b', 'c'));

    applyPreviewState(root, null);

    expect(prints.map((print) => print.attributes.get('data-print-depth') ?? null)).toEqual(['0', null, null]);
    expect(prints.map((print) => print.hidden)).toEqual([false, true, true]);
    expect(prints.map((print) => print.attributes.has('aria-hidden'))).toEqual([false, false, false]);
    expect(details.map((block) => block.hidden)).toEqual([false, true, true]);
    expect(rows.map((row) => row.attributes.has('data-active'))).toEqual([false, false, false]);
  });
});

describe('artist roster filters and preview together', () => {
  const artists = [
    { id: 'a', title: 'Afterwise', genre: 'Post Rock', sortName: 'Afterwise', latestReleaseSort: '2026-06-01' },
    { id: 'c', title: 'Chronoboros', genre: 'Hardcore', sortName: 'Chronoboros', latestReleaseSort: '2026-03-01' },
    {
      id: 'o',
      title: 'Ouranopithecus',
      genre: 'Weird Rock',
      sortName: 'Ouranopithecus',
      latestReleaseSort: '2026-06-01',
    },
    { id: 's', title: 'Sidus', genre: 'Post Rock', sortName: 'Sidus', latestReleaseSort: '9999-12-31' },
  ];

  it('moves a filtered-out active artist to the first visible row and clears its markers', () => {
    const { details, items, prints, root, rows } = fakeRoster(artists.map((artist) => artist.id));
    let state = reconcilePreviewState(initialPreviewState, readListedArtistIds(root));
    state = hover(state, 'c', 'o');
    applyPreviewState(root, state);
    expect(state).toEqual({ active: 'o', history: ['c', 'a'] });

    // A genre filter leaves only the Post Rock artists; latest-release order puts upcoming Sidus first.
    const visible = new Set(filterArtistRoster(artists, { genre: 'Post Rock', query: '' }));
    items.forEach((item, index) => void (item.hidden = !visible.has(artists[index]!)));
    const visibleIds = sortArtistRoster(artists, 'latest')
      .filter((artist) => visible.has(artist))
      .map((artist) => artist.id);
    state = reconcilePreviewState(state, visibleIds);
    applyPreviewState(root, state);

    expect(visibleIds).toEqual(['s', 'a']);
    expect(readListedArtistIds(root)).toEqual(['a', 's']);
    expect(state).toEqual({ active: 's', history: ['a'] });
    expect(prints.map((print) => print.attributes.get('data-print-depth') ?? null)).toEqual(['1', null, null, '0']);
    expect(prints.map((print) => print.hidden)).toEqual([false, true, true, false]);
    expect(details.map((block) => block.hidden)).toEqual([true, true, true, false]);
    expect(rows.map((row) => row.attributes.has('data-active'))).toEqual([false, false, false, true]);
  });
});
