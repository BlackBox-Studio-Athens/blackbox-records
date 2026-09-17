import { beforeEach, expect, test, vi } from 'vitest';
import { readSelection, saveSelection } from './publication-selection';

beforeEach(() => {
  for (const name of ['sessionStorage', 'localStorage']) {
    const data = new Map<string, string>();
    vi.stubGlobal(name, {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    });
  }
});
test('restores an old selection once and preserves same-tab edits across reloads', () => {
  const item = { collection: 'artists', recordId: 'artist', expectedRevision: 'v1', title: 'Band' };
  localStorage.setItem('blackbox-content-publication-selection:', JSON.stringify([item]));
  expect(readSelection('')).toEqual([item]);
  expect(localStorage.getItem('blackbox-content-publication-selection:')).toBeNull();
  saveSelection('', [{ ...item, expectedRevision: 'v2' }]);
  expect(readSelection('')[0]?.expectedRevision).toBe('v2');
});
test('rejects malformed or oversized selections before they can become publication input', () => {
  const item = { collection: 'artists', recordId: 'artist', expectedRevision: 'v1', title: 'Band' };
  expect(() => saveSelection('', Array(21).fill(item))).toThrow();
  localStorage.setItem('blackbox-content-publication-selection:', '[{"collection":"unknown"}]');
  expect(() => readSelection('')).toThrow();
});
