export type PlayerModalHistoryTarget = Pick<History, 'back' | 'pushState'> & {
  readonly state: unknown;
};

export type PlayerModalHistoryState = {
  __appShellPlayerModal: true;
};

const PLAYER_MODAL_HISTORY_KEY = '__appShellPlayerModal';
// The open cart drawer or phone Menu owns one entry the same way; its value names the sheet.
export const SHELL_SHEET_HISTORY_KEY = '__appShellSheet';
export type ShellSheetKind = 'cart' | 'menu';

export function readHistoryEntryMarker(state: unknown, key: string) {
  return typeof state === 'object' && state !== null ? (state as Record<string, unknown>)[key] : undefined;
}

export function isPlayerModalHistoryState(state: unknown): state is PlayerModalHistoryState {
  return readHistoryEntryMarker(state, PLAYER_MODAL_HISTORY_KEY) === true;
}

// The open surface owns one entry at the page's own URL, so device and browser Back close it
// instead of navigating the page beneath it.
export function pushHistoryEntry(history: PlayerModalHistoryTarget, href: string, key: string, value: unknown = true) {
  if (readHistoryEntryMarker(history.state, key)) return false;

  history.pushState({ ...(history.state as object), [key]: value }, '', href);
  return true;
}

export function closeWithHistoryBack(history: PlayerModalHistoryTarget, key: string, close: () => void) {
  if (readHistoryEntryMarker(history.state, key)) {
    history.back();
    return;
  }

  close();
}

export function pushPlayerModalHistoryEntry(history: PlayerModalHistoryTarget, href: string) {
  return pushHistoryEntry(history, href, PLAYER_MODAL_HISTORY_KEY);
}

export function closePlayerModalWithHistoryBack(history: PlayerModalHistoryTarget, closePlayerModal: () => void) {
  closeWithHistoryBack(history, PLAYER_MODAL_HISTORY_KEY, closePlayerModal);
}
