import { beforeEach, expect, test, vi } from 'vitest';
import { pendingPublicationKey, readSelection, saveSelection, restorePublication } from './publication-selection';

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

test('normalizes legacy pending requests once without changing identity or grouped selection', () => {
  const record = { collection: 'artists', recordId: 'artist', expectedRevision: 'v1' };
  const id = '00000000-0000-4000-8000-000000000001';
  saveSelection('', [{ ...record, title: 'Band' }]);
  for (const request of [
    { id, ...record },
    { id, records: [record], baseline: 'a'.repeat(64) },
  ]) {
    localStorage.setItem(pendingPublicationKey(''), JSON.stringify(request));
    expect(restorePublication('')).toEqual({
      id,
      records: [record],
      ...('baseline' in request ? { baseline: request.baseline } : {}),
    });
    expect(localStorage.getItem(pendingPublicationKey(''))).toBe(JSON.stringify(request));
    expect(readSelection('')).toEqual([{ ...record, title: 'Band' }]);
  }
  localStorage.setItem(
    pendingPublicationKey(''),
    JSON.stringify({ id, records: [{ collection: 'artists', recordId: 'artist' }] }),
  );
  expect(() => restorePublication('')).toThrow('incomplete');
});
