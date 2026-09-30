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

type FocusTargetRoot = {
  querySelector<ElementType extends Element = Element>(selectors: string): ElementType | null;
};

// The cart drawer has no Radix trigger (the header control lives in a portal), so the shell returns focus itself:
// to whatever opened it while that is still in the page, else the header control, else the main landmark (the
// control is not rendered when the cart is empty away from the store).
export function findStoreCartFocusReturnTarget(root: FocusTargetRoot, opener?: FocusableElement | null) {
  if (opener?.isConnected) return opener;
  return (
    root.querySelector<HTMLElement>('[data-store-cart-trigger]') ??
    root.querySelector<HTMLElement>('main[data-app-shell-main]')
  );
}
