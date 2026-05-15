type OverlayFocusScheduler = {
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type FocusableElement = Pick<HTMLElement, 'focus' | 'isConnected'>;

type OverlayScrollContainer = Pick<HTMLElement, 'scrollTo'>;

export function restoreConnectedOverlayTriggerFocus(triggerElement: FocusableElement | null) {
  if (triggerElement?.isConnected) {
    triggerElement.focus();
  }
}

export function scheduleOverlayTriggerFocusRestore({
  getTriggerElement,
  scheduler,
}: {
  getTriggerElement: () => FocusableElement | null;
  scheduler: OverlayFocusScheduler;
}) {
  scheduler.requestAnimationFrame(() => restoreConnectedOverlayTriggerFocus(getTriggerElement()));
}

export function scheduleOverlayContentFocus({
  getCloseButton,
  getScrollContainer,
  scheduler,
}: {
  getCloseButton: () => FocusableElement | null;
  getScrollContainer: () => OverlayScrollContainer | null;
  scheduler: OverlayFocusScheduler;
}) {
  scheduler.requestAnimationFrame(() => {
    getScrollContainer()?.scrollTo({ top: 0, behavior: 'auto' });
    getCloseButton()?.focus();
  });
}
