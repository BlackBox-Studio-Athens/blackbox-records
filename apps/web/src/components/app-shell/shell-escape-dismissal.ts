type ShellEscapeDismissalOptions = {
  closeOverlayWithHistoryBack: () => void;
  closePlayerModal: () => void;
  hasOverlayState: () => boolean;
  isPlayerModalOpen: boolean;
  key: string;
  preventDefault: () => void;
};

export type ShellEscapeDismissalResult = 'ignored' | 'overlay' | 'player-modal';

export function handleShellEscapeDismissal({
  closeOverlayWithHistoryBack,
  closePlayerModal,
  hasOverlayState,
  isPlayerModalOpen,
  key,
  preventDefault,
}: ShellEscapeDismissalOptions): ShellEscapeDismissalResult {
  if (key !== 'Escape') return 'ignored';

  if (isPlayerModalOpen) {
    preventDefault();
    closePlayerModal();
    return 'player-modal';
  }

  if (hasOverlayState()) {
    preventDefault();
    closeOverlayWithHistoryBack();
    return 'overlay';
  }

  return 'ignored';
}
