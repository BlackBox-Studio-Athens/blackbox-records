import { describe, expect, it, vi } from 'vitest';

import {
  closePlayerModalWithHistoryBack,
  isPlayerModalHistoryState,
  pushPlayerModalHistoryEntry,
} from './player-modal-history';

const releasesHref = 'https://example.test/blackbox-records/releases/';

function createHistoryTarget(initialState: unknown = null) {
  const history = {
    state: initialState,
    back: vi.fn(),
    pushState: vi.fn((state: unknown) => {
      history.state = state;
    }),
  };

  return history;
}

describe('player modal history', () => {
  it('pushes one entry at the same URL and keeps the existing shell state', () => {
    const history = createHistoryTarget({ __appShellSection: true, pathname: '/releases/' });

    expect(pushPlayerModalHistoryEntry(history, releasesHref)).toBe(true);

    expect(history.pushState).toHaveBeenCalledWith(
      { __appShellPlayerModal: true, __appShellSection: true, pathname: '/releases/' },
      '',
      releasesHref,
    );
    expect(isPlayerModalHistoryState(history.state)).toBe(true);
  });

  it('does not push a second entry while the player entry is current', () => {
    const history = createHistoryTarget({ __appShellPlayerModal: true });

    expect(pushPlayerModalHistoryEntry(history, releasesHref)).toBe(false);
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it('pushes from an empty history state', () => {
    const history = createHistoryTarget(null);

    expect(pushPlayerModalHistoryEntry(history, releasesHref)).toBe(true);
    expect(history.pushState).toHaveBeenCalledWith({ __appShellPlayerModal: true }, '', releasesHref);
  });

  it('closes through browser back on the player entry so popstate performs the close', () => {
    const closePlayerModal = vi.fn();
    const history = createHistoryTarget({ __appShellPlayerModal: true });

    closePlayerModalWithHistoryBack(history, closePlayerModal);

    expect(history.back).toHaveBeenCalledTimes(1);
    expect(closePlayerModal).not.toHaveBeenCalled();
  });

  it('closes directly when the current entry is not the player entry', () => {
    const closePlayerModal = vi.fn();
    const history = createHistoryTarget({ __appShellSection: true });

    closePlayerModalWithHistoryBack(history, closePlayerModal);

    expect(history.back).not.toHaveBeenCalled();
    expect(closePlayerModal).toHaveBeenCalledTimes(1);
  });
});
