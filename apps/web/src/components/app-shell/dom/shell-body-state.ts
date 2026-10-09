export const PLAYER_MODAL_OPEN_BODY_CLASS = 'is-music-streaming-service-embedded-player-modal-open';
export const OVERLAY_OPEN_BODY_CLASS = 'is-app-shell-overlay-open';

export function syncShellBodyStateClasses({
  bodyClassList,
  isOverlayOpen,
  isPlayerModalOpen,
  isCartOpen = false,
  isMenuOpen = false,
}: {
  bodyClassList: Pick<DOMTokenList, 'remove' | 'toggle'>;
  isOverlayOpen: boolean;
  isPlayerModalOpen: boolean;
  isCartOpen?: boolean;
  isMenuOpen?: boolean;
}) {
  bodyClassList.toggle(PLAYER_MODAL_OPEN_BODY_CLASS, isPlayerModalOpen);
  bodyClassList.toggle(OVERLAY_OPEN_BODY_CLASS, isOverlayOpen);
  bodyClassList.toggle('is-shell-modal-open', isOverlayOpen || isPlayerModalOpen || isCartOpen || isMenuOpen);

  return () => {
    bodyClassList.remove(PLAYER_MODAL_OPEN_BODY_CLASS);
    bodyClassList.remove(OVERLAY_OPEN_BODY_CLASS);
    bodyClassList.remove('is-shell-modal-open');
  };
}

// The player modal and the detail overlay are custom aria-modal dialogs, so the page behind them leaves the focus and
// accessibility order while either is open. The Radix sheets (cart, Menu) contain focus themselves.
const SHELL_BACKGROUND_SELECTOR = 'body > :is(.accessibility-skip-to-content-link, header, main, footer)';

export function inertShellBackground(root: Pick<ParentNode, 'querySelectorAll'>) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(SHELL_BACKGROUND_SELECTOR));
  for (const element of elements) element.inert = true;
  return () => {
    for (const element of elements) element.inert = false;
  };
}
