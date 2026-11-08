import { describe, expect, it } from 'vitest';

import {
  BOXNOW_LAST_LOCKER_KEY,
  BOXNOW_WIDGET_ORIGIN,
  boxNowMapUrl,
  readBoxNowSelection,
  readLastLocker,
  writeLastLocker,
} from './boxnow-locker';

const payload = {
  boxnowLockerId: '7721',
  boxnowLockerLat: '37.98454721',
  boxnowLockerLng: '23.73216353',
  boxnowLockerName: 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)',
  boxnowLockerPostalCode: '10672',
  boxnowLockerAddressLine1: 'Ακαδημίας 86',
  boxnowLockerAddressLine2: 'Αθήνα',
  boxnowCountry: 'GR',
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

describe('readBoxNowSelection', () => {
  it('keeps only the five locker fields from BOX NOW', () => {
    expect(readBoxNowSelection({ origin: BOXNOW_WIDGET_ORIGIN, data: payload })).toEqual({
      lockerId: '7721',
      name: 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)',
      addressLine: 'Ακαδημίας 86, Αθήνα',
      postalCode: '10672',
      countryCode: 'GR',
    });
  });

  it('ignores messages from any other origin', () => {
    expect(readBoxNowSelection({ origin: 'https://widget-v5.boxnow.gr.example.com', data: payload })).toBeNull();
    expect(readBoxNowSelection({ origin: 'https://widget.boxnow.gr', data: payload })).toBeNull();
  });

  it('rejects a locker outside Greece, without a name, or with an over-long ID', () => {
    const origin = BOXNOW_WIDGET_ORIGIN;
    expect(readBoxNowSelection({ origin, data: { ...payload, boxnowCountry: 'CY' } })).toBeNull();
    expect(readBoxNowSelection({ origin, data: { ...payload, boxnowLockerName: ' ' } })).toBeNull();
    expect(readBoxNowSelection({ origin, data: { ...payload, boxnowLockerId: '9'.repeat(33) } })).toBeNull();
    expect(readBoxNowSelection({ origin, data: 'boxnowLockerId=7721' })).toBeNull();
  });

  it('omits empty or over-long optional fields', () => {
    const selection = readBoxNowSelection({
      origin: BOXNOW_WIDGET_ORIGIN,
      data: {
        ...payload,
        boxnowLockerAddressLine1: '',
        boxnowLockerAddressLine2: '',
        boxnowLockerPostalCode: '1'.repeat(17),
      },
    });
    expect(selection).toEqual({ lockerId: '7721', name: payload.boxnowLockerName, countryCode: 'GR' });
  });
});

describe('last locker on this device', () => {
  it('round-trips a valid locker and ignores corrupt or missing storage', () => {
    const storage = memoryStorage();
    const locker = readBoxNowSelection({ origin: BOXNOW_WIDGET_ORIGIN, data: payload })!;
    writeLastLocker(storage, locker);
    expect(readLastLocker(storage)).toEqual(locker);

    storage.setItem(BOXNOW_LAST_LOCKER_KEY, '{not json');
    expect(readLastLocker(storage)).toBeNull();
    expect(readLastLocker(null)).toBeNull();
  });

  it('survives storage that throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readLastLocker(throwing)).toBeNull();
    expect(() => writeLastLocker(throwing, { lockerId: '1', name: 'A', countryCode: 'GR' })).not.toThrow();
  });
});

describe('boxNowMapUrl', () => {
  it('opens the public map in English without a partner account or a preselected locker', () => {
    const url = new URL(boxNowMapUrl());
    expect(url.origin).toBe(BOXNOW_WIDGET_ORIGIN);
    expect(url.searchParams.get('partnerId')).toBe('0');
    expect(url.searchParams.get('language')).toBe('en');
    expect(url.searchParams.get('gps')).toBe('no');
    expect(url.searchParams.has('lockerId')).toBe(false);
  });
});
