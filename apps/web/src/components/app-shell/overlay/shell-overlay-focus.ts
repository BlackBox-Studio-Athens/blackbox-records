import { scrollWithLenis } from '../lenis-scroll';

type OverlayFocusScheduler = {
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type FocusableElement = Pick<HTMLElement, 'focus' | 'isConnected'>;

type OverlayScrollContainer = HTMLElement;

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
    scrollWithLenis(getScrollContainer(), 0, { immediate: true });
    getCloseButton()?.focus();
  });
}
