import { type ShellNavigationSource, waitForAnimationFrames } from './shell-navigation';

const SHELL_SECTION_TRANSITION_MIN_VISIBLE_MS = 180;
const SHELL_SECTION_TRANSITION_REVEAL_MS = 150;

type ShellSectionTransitionState = 'closed' | 'entering' | 'revealing';
type MutableRef<T> = {
  current: T;
};

type ShellSectionTransitionControllerOptions = {
  timerRef: MutableRef<number | null>;
  tokenRef: MutableRef<number>;
  startedAtRef: MutableRef<number>;
  setNavigationSource: (source: ShellNavigationSource) => void;
  setState: (state: ShellSectionTransitionState) => void;
  setTarget: (target: string) => void;
};

type ShellPageTransitionOptions = {
  frameRef: MutableRef<number | null>;
  getMainElement: () => HTMLElement | null;
  timerRef: MutableRef<number | null>;
};

export function createShellSectionTransitionController({
  timerRef,
  tokenRef,
  startedAtRef,
  setNavigationSource,
  setState,
  setTarget,
}: ShellSectionTransitionControllerOptions) {
  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function reset() {
    clearTimer();
    setState('closed');
    setTarget('');
    setNavigationSource('programmatic');
  }

  function begin(target: string, source: ShellNavigationSource) {
    clearTimer();
    const nextToken = tokenRef.current + 1;
    tokenRef.current = nextToken;
    startedAtRef.current = performance.now();
    setTarget(target);
    setNavigationSource(source);
    setState('entering');
    return nextToken;
  }

  async function finish(transitionToken: number) {
    const elapsed = performance.now() - startedAtRef.current;
    const remainingVisibleDuration = Math.max(0, SHELL_SECTION_TRANSITION_MIN_VISIBLE_MS - elapsed);

    if (remainingVisibleDuration > 0) {
      await new Promise<void>((resolve) => {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          resolve();
        }, remainingVisibleDuration);
      });
    }

    if (transitionToken !== tokenRef.current) return;

    setState('revealing');

    await new Promise<void>((resolve) => {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        resolve();
      }, SHELL_SECTION_TRANSITION_REVEAL_MS);
    });

    if (transitionToken !== tokenRef.current) return;

    reset();
  }

  return {
    begin,
    clearTimer,
    finish,
    reset,
  };
}

export function clearShellPageTransition(
  { frameRef, getMainElement, timerRef }: ShellPageTransitionOptions,
  mainElement?: HTMLElement | null,
) {
  if (frameRef.current !== null) {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  const targetMainElement = mainElement || getMainElement();
  targetMainElement?.removeAttribute('data-shell-page-transition-state');
}

export function triggerShellPageEnterTransition(options: ShellPageTransitionOptions) {
  const mainElement = options.getMainElement();
  if (!mainElement) return;

  clearShellPageTransition(options, mainElement);
  mainElement.setAttribute('data-shell-page-transition-state', 'enter');

  options.frameRef.current = window.requestAnimationFrame(() => {
    options.frameRef.current = null;
    mainElement.setAttribute('data-shell-page-transition-state', 'enter-active');
  });

  options.timerRef.current = window.setTimeout(() => {
    mainElement.removeAttribute('data-shell-page-transition-state');
    options.timerRef.current = null;
  }, 260);
}

export async function scrollShellViewportToTop(options: {
  getMainElement: () => HTMLElement | null;
  sourceElement?: HTMLElement | null | undefined;
}) {
  const forceScrollTop = () => {
    window.scrollTo(0, 0);
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  options.sourceElement?.blur();
  forceScrollTop();
  await waitForAnimationFrames(1);
  focusShellMainAfterSwap(options.getMainElement);
  forceScrollTop();
  await waitForAnimationFrames(2);
  forceScrollTop();
}

function focusShellMainAfterSwap(getMainElement: () => HTMLElement | null) {
  const mainElement = getMainElement();
  if (!mainElement) return;

  try {
    mainElement.focus({ preventScroll: true });
  } catch {
    mainElement.focus();
  }
}
