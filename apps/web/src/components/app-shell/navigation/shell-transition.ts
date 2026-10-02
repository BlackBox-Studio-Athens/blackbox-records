import type { animate as animateMotion } from 'motion/mini';

import { scrollWithLenis } from '../lenis-scroll';
import { type ShellNavigationSource, waitForAnimationFrames } from './shell-navigation';

const SHELL_SECTION_TRANSITION_MIN_VISIBLE_MS = 180;
const SHELL_SECTION_TRANSITION_REVEAL_MS = 150;

type ShellSectionTransitionState = 'closed' | 'entering' | 'revealing';
type MutableRef<T> = {
  current: T;
};

export type ShellMotionControls = ReturnType<typeof animateMotion>;
let animate: typeof animateMotion | undefined;
void import('motion/mini')
  .then((motion) => {
    animate = motion.animate;
  })
  .catch(() => {
    // Navigation remains usable if animation code cannot load.
  });

type ShellSectionTransitionControllerOptions = {
  animationsRef: MutableRef<ShellMotionControls[]>;
  getVeilElement: () => HTMLElement | null;
  shouldReduceMotion: () => boolean;
  timerRef: MutableRef<number | null>;
  tokenRef: MutableRef<number>;
  startedAtRef: MutableRef<number>;
  setNavigationSource: (source: ShellNavigationSource) => void;
  setState: (state: ShellSectionTransitionState) => void;
  setTarget: (target: string) => void;
};

type ShellPageTransitionOptions = {
  animationsRef: MutableRef<ShellMotionControls[]>;
  getMainElement: () => HTMLElement | null;
  shouldReduceMotion: () => boolean;
};

function stopAnimations(animationsRef: MutableRef<ShellMotionControls[]>) {
  for (const animation of animationsRef.current) animation.stop();
  animationsRef.current = [];
}

function clearSectionAnimationStyles(veil: HTMLElement | null) {
  if (!veil) return;
  veil.style.removeProperty('opacity');
  veil.style.removeProperty('background-color');
  veil.style.removeProperty('visibility');
  for (const layer of veil.querySelectorAll<HTMLElement>('[data-shell-transition-layer]')) {
    layer.style.removeProperty('opacity');
    layer.style.removeProperty('transform');
  }
}

function animateVeil(veil: HTMLElement, phase: 'enter' | 'reveal') {
  if (!animate) return [];
  const [texture, shade] = veil.querySelectorAll<HTMLElement>('[data-shell-transition-layer]');
  if (!texture || !shade) return [];

  const entering = phase === 'enter';
  veil.style.visibility = 'visible';
  return [
    animate(
      veil,
      {
        opacity: entering ? [0, 1] : [1, 0],
        backgroundColor: entering
          ? ['rgba(6, 6, 6, 0)', 'rgba(6, 6, 6, 0.14)']
          : ['rgba(6, 6, 6, 0.14)', 'rgba(6, 6, 6, 0.06)'],
      },
      { duration: entering ? 0.16 : SHELL_SECTION_TRANSITION_REVEAL_MS / 1000, ease: 'easeOut' },
    ),
    animate(
      texture,
      {
        opacity: entering ? [0, 0.44] : [0.44, 0],
        transform: entering ? ['translateY(18px)', 'translateY(0px)'] : ['translateY(0px)', 'translateY(-20px)'],
      },
      { duration: entering ? 0.28 : SHELL_SECTION_TRANSITION_REVEAL_MS / 1000, ease: [0.22, 1, 0.36, 1] },
    ),
    animate(
      shade,
      {
        opacity: entering ? [0, 1] : [1, 0.3],
        transform: entering ? ['scaleY(1.02)', 'scaleY(1)'] : ['scaleY(1)', 'scaleY(0.996)'],
      },
      { duration: entering ? 0.28 : SHELL_SECTION_TRANSITION_REVEAL_MS / 1000, ease: [0.22, 1, 0.36, 1] },
    ),
  ];
}

export function createShellSectionTransitionController({
  animationsRef,
  getVeilElement,
  shouldReduceMotion,
  timerRef,
  tokenRef,
  startedAtRef,
  setNavigationSource,
  setState,
  setTarget,
}: ShellSectionTransitionControllerOptions) {
  let resolveTimer: (() => void) | null = null;

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      resolveTimer?.();
      resolveTimer = null;
    }
  }

  function reset() {
    tokenRef.current += 1;
    clearTimer();
    stopAnimations(animationsRef);
    clearSectionAnimationStyles(getVeilElement());
    setState('closed');
    setTarget('');
    setNavigationSource('programmatic');
  }

  function begin(target: string, source: ShellNavigationSource) {
    const nextToken = tokenRef.current + 1;
    tokenRef.current = nextToken;
    clearTimer();
    stopAnimations(animationsRef);
    clearSectionAnimationStyles(getVeilElement());
    startedAtRef.current = performance.now();
    setTarget(target);
    setNavigationSource(source);

    const veil = getVeilElement();
    if (!veil || shouldReduceMotion()) {
      setState('closed');
      return nextToken;
    }

    setState('entering');
    animationsRef.current = animateVeil(veil, 'enter');
    return nextToken;
  }

  async function finish(transitionToken: number) {
    if (shouldReduceMotion()) {
      reset();
      return;
    }

    const elapsed = performance.now() - startedAtRef.current;
    const remainingVisibleDuration = Math.max(0, SHELL_SECTION_TRANSITION_MIN_VISIBLE_MS - elapsed);

    if (remainingVisibleDuration > 0) {
      await new Promise<void>((resolve) => {
        resolveTimer = resolve;
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          resolveTimer = null;
          resolve();
        }, remainingVisibleDuration);
      });
    }

    if (transitionToken !== tokenRef.current || shouldReduceMotion()) return;

    const veil = getVeilElement();
    if (!veil) {
      reset();
      return;
    }

    setState('revealing');
    stopAnimations(animationsRef);
    animationsRef.current = animateVeil(veil, 'reveal');
    await Promise.all(animationsRef.current.map((animation) => animation.finished.catch(() => undefined)));

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
  { animationsRef, getMainElement }: ShellPageTransitionOptions,
  mainElement?: HTMLElement | null,
) {
  stopAnimations(animationsRef);
  const targetMainElement = mainElement || getMainElement();
  targetMainElement?.style.removeProperty('opacity');
  targetMainElement?.style.removeProperty('transform');
}

export function triggerShellPageEnterTransition(options: ShellPageTransitionOptions) {
  const mainElement = options.getMainElement();
  if (!mainElement) return;

  clearShellPageTransition(options, mainElement);
  if (options.shouldReduceMotion()) return;
  if (!animate) return;

  // Opacity only: any transform on <main>, even a settled translateY(0), makes it the containing block of fixed
  // descendants and stretches the Home hero image over the whole page.
  options.animationsRef.current = [
    animate(mainElement, { opacity: [0.68, 1] }, { duration: 0.22, ease: [0.22, 1, 0.36, 1] }),
  ];
}

export async function scrollShellViewportToTop(options: {
  getMainElement: () => HTMLElement | null;
  sourceElement?: HTMLElement | null | undefined;
}) {
  const forceScrollTop = () => {
    scrollWithLenis(null, 0, { immediate: true });
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
