import { describe, expect, it, vi } from 'vitest';

import { handleShellEscapeDismissal } from './shell-escape-dismissal';

function createOptions(overrides: Partial<Parameters<typeof handleShellEscapeDismissal>[0]> = {}) {
  return {
    closeOverlayWithHistoryBack: vi.fn(),
    closePlayerModal: vi.fn(),
    hasOverlayState: vi.fn(() => false),
    isPlayerModalOpen: false,
    key: 'Escape',
    preventDefault: vi.fn(),
    ...overrides,
  };
}

describe('shell escape dismissal', () => {
  it('ignores non-Escape keys without side effects', () => {
    const options = createOptions({
      key: 'Enter',
    });

    expect(handleShellEscapeDismissal(options)).toBe('ignored');

    expect(options.preventDefault).not.toHaveBeenCalled();
    expect(options.closePlayerModal).not.toHaveBeenCalled();
    expect(options.closeOverlayWithHistoryBack).not.toHaveBeenCalled();
  });

  it('closes the player modal before overlay state when both are active', () => {
    const options = createOptions({
      hasOverlayState: vi.fn(() => true),
      isPlayerModalOpen: true,
    });

    expect(handleShellEscapeDismissal(options)).toBe('player-modal');

    expect(options.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.closePlayerModal).toHaveBeenCalledTimes(1);
    expect(options.closeOverlayWithHistoryBack).not.toHaveBeenCalled();
  });

  it('closes overlay history when Escape is pressed without a player modal', () => {
    const options = createOptions({
      hasOverlayState: vi.fn(() => true),
    });

    expect(handleShellEscapeDismissal(options)).toBe('overlay');

    expect(options.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.closeOverlayWithHistoryBack).toHaveBeenCalledTimes(1);
    expect(options.closePlayerModal).not.toHaveBeenCalled();
  });

  it('ignores Escape when there is no dismissible shell state', () => {
    const options = createOptions();

    expect(handleShellEscapeDismissal(options)).toBe('ignored');

    expect(options.preventDefault).not.toHaveBeenCalled();
    expect(options.closePlayerModal).not.toHaveBeenCalled();
    expect(options.closeOverlayWithHistoryBack).not.toHaveBeenCalled();
  });
});
