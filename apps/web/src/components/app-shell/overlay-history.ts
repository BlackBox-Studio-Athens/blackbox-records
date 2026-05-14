type OverlayHistoryTarget = Pick<History, 'back' | 'pushState' | 'replaceState'> & {
  readonly state: unknown;
};

type CloseOverlayState = (options?: { restoreFocus?: boolean }) => void;

type OverlayStateForHistory = {
  backgroundHref: string;
};

export type ShellOverlayHistoryState = {
  __appShellOverlay: true;
  backgroundHref: string;
  pathname: string;
};

export function closeOverlayWithHistoryBack(history: OverlayHistoryTarget, closeOverlayState: CloseOverlayState) {
  if (isShellOverlayHistoryState(history.state)) {
    history.back();
    return;
  }

  closeOverlayState();
}

export function collapseOverlayHistoryToBackground(
  history: OverlayHistoryTarget,
  overlayState: OverlayStateForHistory | null,
  closeOverlayState: CloseOverlayState,
) {
  if (!overlayState) return false;

  const currentHistoryState = typeof history.state === 'object' && history.state !== null ? history.state : {};
  history.replaceState(
    {
      ...currentHistoryState,
      __appShellOverlay: false,
    },
    '',
    overlayState.backgroundHref,
  );
  closeOverlayState({ restoreFocus: false });
  return true;
}

export function writeOverlayHistoryState(
  history: OverlayHistoryTarget,
  options: {
    historyMode: 'push' | 'replace';
    href: string;
    backgroundHref: string;
    pathname: string;
  },
) {
  const nextHistoryState: ShellOverlayHistoryState = {
    __appShellOverlay: true,
    backgroundHref: options.backgroundHref,
    pathname: options.pathname,
  };

  if (options.historyMode === 'push') {
    history.pushState(nextHistoryState, '', options.href);
    return;
  }

  history.replaceState(nextHistoryState, '', options.href);
}

function isShellOverlayHistoryState(state: unknown): state is ShellOverlayHistoryState {
  return (
    typeof state === 'object' && state !== null && (state as { __appShellOverlay?: unknown }).__appShellOverlay === true
  );
}
