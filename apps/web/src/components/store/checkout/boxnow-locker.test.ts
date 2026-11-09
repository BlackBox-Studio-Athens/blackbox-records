import { describe, expect, it } from 'vitest';

import { BOXNOW_LAST_LOCKER_KEY, readLastLocker, writeLastLocker } from './boxnow-locker';

// Parsing, origin checks and storage failures are tested in @coding-tree-io/boxnow-widget; this checks our key only.
describe('last locker on this device', () => {
  it('round-trips a locker under our key', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    const locker = { lockerId: '7721', name: 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)', countryCode: 'GR' } as const;
    writeLastLocker(storage, locker);
    expect(values.has(BOXNOW_LAST_LOCKER_KEY)).toBe(true);
    expect(readLastLocker(storage)).toEqual(locker);
  });
});
