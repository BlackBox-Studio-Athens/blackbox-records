export type PlayerModalHistoryTarget = Pick<History, 'back' | 'pushState'> & {
  readonly state: unknown;
};

export type PlayerModalHistoryState = {
  __appShellPlayerModal: true;
};

export function isPlayerModalHistoryState(state: unknown): state is PlayerModalHistoryState {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { __appShellPlayerModal?: unknown }).__appShellPlayerModal === true
  );
}

// The open player owns one entry at the page's own URL, so device and browser Back close it
// instead of navigating the page beneath it.
export function pushPlayerModalHistoryEntry(history: PlayerModalHistoryTarget, href: string) {
  if (isPlayerModalHistoryState(history.state)) return false;

  const currentHistoryState = typeof history.state === 'object' && history.state !== null ? history.state : {};
  history.pushState({ ...currentHistoryState, __appShellPlayerModal: true }, '', href);
  return true;
}

export function closePlayerModalWithHistoryBack(history: PlayerModalHistoryTarget, closePlayerModal: () => void) {
  if (isPlayerModalHistoryState(history.state)) {
    history.back();
    return;
  }

  closePlayerModal();
}
