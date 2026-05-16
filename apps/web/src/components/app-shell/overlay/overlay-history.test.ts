import { describe, expect, it, vi } from 'vitest';

import {
  closeOverlayWithHistoryBack,
  collapseOverlayHistoryToBackground,
  writeOverlayHistoryState,
  type ShellOverlayHistoryState,
} from './overlay-history';

function createHistoryTarget(initialState: unknown = null) {
  const history = {
    state: initialState,
    back: vi.fn(),
    pushState: vi.fn((state: unknown) => {
      history.state = state;
    }),
    replaceState: vi.fn((state: unknown) => {
      history.state = state;
    }),
  };

  return history;
}

describe('overlay history coordination', () => {
  it('uses browser back when the current entry represents an overlay', () => {
    const closeOverlayState = vi.fn();
    const history = createHistoryTarget({
      __appShellOverlay: true,
      backgroundHref: 'https://example.test/blackbox-records/releases/',
      pathname: '/releases/disintegration/',
    } satisfies ShellOverlayHistoryState);

    closeOverlayWithHistoryBack(history, closeOverlayState);

    expect(history.back).toHaveBeenCalledTimes(1);
    expect(closeOverlayState).not.toHaveBeenCalled();
  });

  it('closes overlay state directly when the current entry is not an overlay', () => {
    const closeOverlayState = vi.fn();
    const history = createHistoryTarget({ __appShellOverlay: false });

    closeOverlayWithHistoryBack(history, closeOverlayState);

    expect(history.back).not.toHaveBeenCalled();
    expect(closeOverlayState).toHaveBeenCalledWith();
  });

  it('collapses an overlay entry to its background URL without restoring focus', () => {
    const closeOverlayState = vi.fn();
    const history = createHistoryTarget({
      __appShellOverlay: true,
      existing: 'kept',
    });

    expect(
      collapseOverlayHistoryToBackground(
        history,
        { backgroundHref: 'https://example.test/blackbox-records/releases/' },
        closeOverlayState,
      ),
    ).toBe(true);
    expect(history.replaceState).toHaveBeenCalledWith(
      {
        __appShellOverlay: false,
        existing: 'kept',
      },
      '',
      'https://example.test/blackbox-records/releases/',
    );
    expect(closeOverlayState).toHaveBeenCalledWith({ restoreFocus: false });
  });

  it('does not collapse history when no overlay state is active', () => {
    const closeOverlayState = vi.fn();
    const history = createHistoryTarget({ __appShellOverlay: true });

    expect(collapseOverlayHistoryToBackground(history, null, closeOverlayState)).toBe(false);
    expect(history.replaceState).not.toHaveBeenCalled();
    expect(closeOverlayState).not.toHaveBeenCalled();
  });

  it('writes push and replace overlay history entries', () => {
    const history = createHistoryTarget();
    const options = {
      backgroundHref: 'https://example.test/blackbox-records/releases/',
      href: 'https://example.test/blackbox-records/releases/disintegration/',
      pathname: '/releases/disintegration/',
    };

    writeOverlayHistoryState(history, { ...options, historyMode: 'push' });
    writeOverlayHistoryState(history, { ...options, historyMode: 'replace' });

    const expectedState: ShellOverlayHistoryState = {
      __appShellOverlay: true,
      backgroundHref: options.backgroundHref,
      pathname: options.pathname,
    };
    expect(history.pushState).toHaveBeenCalledWith(expectedState, '', options.href);
    expect(history.replaceState).toHaveBeenCalledWith(expectedState, '', options.href);
  });
});
