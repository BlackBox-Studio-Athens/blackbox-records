import { readStoredLocker, writeStoredLocker, type BoxNowLocker } from '@coding-tree-io/boxnow-widget';

export { lockerAddressText, type BoxNowLocker } from '@coding-tree-io/boxnow-widget';

export const BOXNOW_MAP_TIMEOUT_MS = 10_000;
export const BOXNOW_LAST_LOCKER_KEY = 'blackbox-boxnow-last-locker';
export const BOXNOW_LOCKER_CHOSEN_EVENT = 'blackbox:boxnow-locker-chosen';

export function readLastLocker(storage: Pick<Storage, 'getItem'> | null): BoxNowLocker | null {
  return readStoredLocker(storage, BOXNOW_LAST_LOCKER_KEY);
}

export function writeLastLocker(storage: Pick<Storage, 'setItem'> | null, locker: BoxNowLocker): void {
  writeStoredLocker(storage, BOXNOW_LAST_LOCKER_KEY, locker);
}
