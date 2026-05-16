import { describe, expect, it, vi } from 'vitest';

import { OVERLAY_OPEN_BODY_CLASS, PLAYER_MODAL_OPEN_BODY_CLASS, syncShellBodyStateClasses } from './shell-body-state';

describe('syncShellBodyStateClasses', () => {
  it('toggles the player modal and overlay body classes from shell state', () => {
    const bodyClassList = {
      remove: vi.fn(),
      toggle: vi.fn(),
    };

    syncShellBodyStateClasses({
      bodyClassList,
      isOverlayOpen: true,
      isPlayerModalOpen: false,
    });

    expect(bodyClassList.toggle).toHaveBeenCalledWith(PLAYER_MODAL_OPEN_BODY_CLASS, false);
    expect(bodyClassList.toggle).toHaveBeenCalledWith(OVERLAY_OPEN_BODY_CLASS, true);
  });

  it('removes shell-owned body classes during cleanup', () => {
    const bodyClassList = {
      remove: vi.fn(),
      toggle: vi.fn(),
    };

    const cleanup = syncShellBodyStateClasses({
      bodyClassList,
      isOverlayOpen: false,
      isPlayerModalOpen: true,
    });

    cleanup();

    expect(bodyClassList.remove).toHaveBeenCalledWith(PLAYER_MODAL_OPEN_BODY_CLASS);
    expect(bodyClassList.remove).toHaveBeenCalledWith(OVERLAY_OPEN_BODY_CLASS);
  });
});
