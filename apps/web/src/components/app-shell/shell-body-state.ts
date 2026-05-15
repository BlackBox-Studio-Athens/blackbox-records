export const PLAYER_MODAL_OPEN_BODY_CLASS = 'is-music-streaming-service-embedded-player-modal-open';
export const OVERLAY_OPEN_BODY_CLASS = 'is-app-shell-overlay-open';

export function syncShellBodyStateClasses({
  bodyClassList,
  isOverlayOpen,
  isPlayerModalOpen,
}: {
  bodyClassList: Pick<DOMTokenList, 'remove' | 'toggle'>;
  isOverlayOpen: boolean;
  isPlayerModalOpen: boolean;
}) {
  bodyClassList.toggle(PLAYER_MODAL_OPEN_BODY_CLASS, isPlayerModalOpen);
  bodyClassList.toggle(OVERLAY_OPEN_BODY_CLASS, isOverlayOpen);

  return () => {
    bodyClassList.remove(PLAYER_MODAL_OPEN_BODY_CLASS);
    bodyClassList.remove(OVERLAY_OPEN_BODY_CLASS);
  };
}
