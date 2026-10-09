import { describe, expect, it, vi } from 'vitest';

import {
  inertShellBackground,
  OVERLAY_OPEN_BODY_CLASS,
  PLAYER_MODAL_OPEN_BODY_CLASS,
  syncShellBodyStateClasses,
} from './shell-body-state';

describe('syncShellBodyStateClasses', () => {
  it.each([{ isCartOpen: true }, { isMenuOpen: true }])('locks native background scrolling for %o', (state) => {
    const bodyClassList = { remove: vi.fn(), toggle: vi.fn() };
    syncShellBodyStateClasses({ bodyClassList, isOverlayOpen: false, isPlayerModalOpen: false, ...state });
    expect(bodyClassList.toggle).toHaveBeenCalledWith('is-shell-modal-open', true);
  });
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

describe('inertShellBackground', () => {
  it('makes the skip link, header, main and footer inert until cleanup', () => {
    const elements = [{ inert: false }, { inert: false }];
    const root = { querySelectorAll: vi.fn(() => elements) };

    const restore = inertShellBackground(root as unknown as ParentNode);

    expect(root.querySelectorAll).toHaveBeenCalledWith(
      'body > :is(.accessibility-skip-to-content-link, header, main, footer)',
    );
    expect(elements.every((element) => element.inert)).toBe(true);
    restore();
    expect(elements.some((element) => element.inert)).toBe(false);
  });
});
