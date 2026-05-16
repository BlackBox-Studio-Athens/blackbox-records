type PlayerFocusScheduler = {
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type FocusableElement = Pick<HTMLElement, 'focus'>;
type ConnectedFocusableElement = Pick<HTMLElement, 'focus' | 'isConnected'>;

export function restoreConnectedPlayerTriggerFocus(triggerElement: ConnectedFocusableElement | null) {
  if (triggerElement?.isConnected) {
    triggerElement.focus();
  }
}

export function schedulePlayerModalCloseButtonFocus({
  getCloseButton,
  scheduler,
}: {
  getCloseButton: () => FocusableElement | null;
  scheduler: PlayerFocusScheduler;
}) {
  scheduler.requestAnimationFrame(() => {
    getCloseButton()?.focus();
  });
}
