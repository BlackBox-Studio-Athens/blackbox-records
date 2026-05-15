type PlayerFocusScheduler = {
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type FocusableElement = Pick<HTMLElement, 'focus'>;

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
