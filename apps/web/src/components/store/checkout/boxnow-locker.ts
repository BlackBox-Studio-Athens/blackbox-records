/** The locker a shopper chose on BOX NOW's public map, reduced to the fields the order keeps. */
export type BoxNowLocker = {
  lockerId: string;
  name: string;
  addressLine?: string;
  postalCode?: string;
  countryCode: 'GR';
};

export const BOXNOW_WIDGET_ORIGIN = 'https://widget-v5.boxnow.gr';
export const BOXNOW_MAP_TIMEOUT_MS = 10_000;
export const BOXNOW_LAST_LOCKER_KEY = 'blackbox-boxnow-last-locker';
export const BOXNOW_LOCKER_CHOSEN_EVENT = 'blackbox:boxnow-locker-chosen';

// Same bounds the Worker enforces on Start Checkout.
const LIMITS = { lockerId: 32, name: 200, addressLine: 200, postalCode: 16 } as const;

/**
 * BOX NOW's public map frame, without a partner ID, as the reference shop uses it. A preselected locker is never
 * passed: with autoselect the frame could report it at once and close the map before the shopper chooses.
 */
export function boxNowMapUrl(): string {
  const params = new URLSearchParams({ partnerId: '0', gps: 'no', autoselect: 'yes', autoclose: 'no', language: 'en' });
  return `${BOXNOW_WIDGET_ORIGIN}/iframe.html?${params.toString()}`;
}

function bounded(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const text = String(value).trim();
  return text && text.length <= max ? text : undefined;
}

/** Accepts only a Greek locker sent by BOX NOW's frame; every other field in the message is dropped. */
export function readBoxNowSelection(event: Pick<MessageEvent, 'data' | 'origin'>): BoxNowLocker | null {
  if (event.origin !== BOXNOW_WIDGET_ORIGIN) return null;
  return parseLocker(
    event.data && typeof event.data === 'object'
      ? {
          lockerId: event.data.boxnowLockerId,
          name: event.data.boxnowLockerName,
          addressLine: [event.data.boxnowLockerAddressLine1, event.data.boxnowLockerAddressLine2]
            .map((part) => (typeof part === 'string' ? part.trim() : ''))
            .filter(Boolean)
            .join(', '),
          postalCode: event.data.boxnowLockerPostalCode,
          countryCode: event.data.boxnowCountry,
        }
      : null,
  );
}

function parseLocker(value: unknown): BoxNowLocker | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const lockerId = bounded(input.lockerId, LIMITS.lockerId);
  const name = bounded(input.name, LIMITS.name);
  if (!lockerId || !name || String(input.countryCode).toUpperCase() !== 'GR') return null;
  const addressLine = bounded(input.addressLine, LIMITS.addressLine);
  const postalCode = bounded(input.postalCode, LIMITS.postalCode);
  return {
    lockerId,
    name,
    ...(addressLine ? { addressLine } : {}),
    ...(postalCode ? { postalCode } : {}),
    countryCode: 'GR',
  };
}

export function readLastLocker(storage: Pick<Storage, 'getItem'> | null): BoxNowLocker | null {
  try {
    return parseLocker(JSON.parse(storage?.getItem(BOXNOW_LAST_LOCKER_KEY) ?? 'null'));
  } catch {
    return null;
  }
}

export function writeLastLocker(storage: Pick<Storage, 'setItem'> | null, locker: BoxNowLocker): void {
  try {
    storage?.setItem(BOXNOW_LAST_LOCKER_KEY, JSON.stringify(locker));
  } catch {
    // Storage is a convenience; the shopper can still choose on the map.
  }
}

export function lockerAddressText(locker: Pick<BoxNowLocker, 'addressLine' | 'postalCode'>): string {
  return [locker.addressLine, locker.postalCode].filter(Boolean).join(' ');
}
