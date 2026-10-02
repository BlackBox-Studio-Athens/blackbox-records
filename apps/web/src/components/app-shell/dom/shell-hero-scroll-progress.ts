import { isCurrentPath } from '@/platform/utils/urls';

export const HOMEPAGE_HERO_SCROLLED_CLASS = 'homepage-hero-section--scrolled';
export const HOMEPAGE_HERO_SELECTOR = '#homepage-hero-section';
const HOMEPAGE_HERO_SCROLLED_PROGRESS_THRESHOLD = 0.5;
// The paused fallback fade in global.css lasts 1s, so full scroll progress is 1000 ms.
const HOMEPAGE_HERO_FADE_ANIMATION_NAMES = ['homepage-hero-ghost', 'homepage-hero-ghost-veil'];
const HOMEPAGE_HERO_FADE_DURATION_MS = 1000;

type HeroScrollScheduler = {
  addEventListener(type: 'resize' | 'scroll', listener: () => void, options?: AddEventListenerOptions): void;
  cancelAnimationFrame(id: number): void;
  innerHeight: number;
  removeEventListener(type: 'resize' | 'scroll', listener: () => void): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type HomepageHeroElement = Pick<HTMLElement, 'getAnimations' | 'getBoundingClientRect'> & {
  classList: Pick<DOMTokenList, 'remove' | 'toggle'>;
};

export function calculateHomepageHeroScrollProgress({
  heroHeight,
  heroTop,
  viewportHeight,
}: {
  heroHeight: number;
  heroTop: number;
  viewportHeight: number;
}) {
  const fadeDistance = Math.max(viewportHeight * 0.42, heroHeight * 0.32);
  if (fadeDistance <= 0) return 0;

  return Math.min(Math.max(-heroTop / fadeDistance, 0), 1);
}

export function connectHomepageHeroScrollProgress({
  activePathname,
  queryHeroElement,
  scheduler,
}: {
  activePathname: string;
  queryHeroElement: () => HomepageHeroElement | null;
  scheduler: HeroScrollScheduler;
}) {
  if (!isCurrentPath(activePathname, '/')) return () => {};

  // Without scroll-driven animations, global.css applies the hero fade paused; the scroll progress seeks it instead.
  const seeksHeroFade = typeof CSS !== 'undefined' && !CSS.supports('animation-timeline: scroll()');
  let animationFrameId: number | null = null;
  let currentHeroElement: HomepageHeroElement | null = null;
  let syncedHeroElement: HomepageHeroElement | null = null;
  let isHeroScrolled: boolean | null = null;
  let fadeHeroElement: HomepageHeroElement | null = null;
  let fadeAnimations: Animation[] = [];
  let fadeProgress: number | null = null;

  const seekHeroFade = (heroElement: HomepageHeroElement, progress: number) => {
    if (fadeHeroElement !== heroElement) {
      fadeHeroElement = heroElement;
      fadeAnimations = heroElement
        .getAnimations({ subtree: true })
        .filter((animation) => HOMEPAGE_HERO_FADE_ANIMATION_NAMES.includes((animation as CSSAnimation).animationName));
      fadeProgress = null;
    }
    if (fadeProgress === progress) return;

    fadeProgress = progress;
    for (const animation of fadeAnimations) {
      animation.currentTime = progress * HOMEPAGE_HERO_FADE_DURATION_MS;
    }
  };

  const applyHeroScrollProgress = () => {
    animationFrameId = null;
    currentHeroElement = queryHeroElement();

    if (!currentHeroElement) return;

    const heroRect = currentHeroElement.getBoundingClientRect();
    const progress = calculateHomepageHeroScrollProgress({
      heroHeight: heroRect.height,
      heroTop: heroRect.top,
      viewportHeight: scheduler.innerHeight,
    });
    if (seeksHeroFade) seekHeroFade(currentHeroElement, progress);

    const nextIsHeroScrolled = progress >= HOMEPAGE_HERO_SCROLLED_PROGRESS_THRESHOLD;
    if (syncedHeroElement === currentHeroElement && isHeroScrolled === nextIsHeroScrolled) return;

    if (syncedHeroElement !== currentHeroElement) {
      syncedHeroElement?.classList.remove(HOMEPAGE_HERO_SCROLLED_CLASS);
    }

    currentHeroElement.classList.toggle(HOMEPAGE_HERO_SCROLLED_CLASS, nextIsHeroScrolled);
    syncedHeroElement = currentHeroElement;
    isHeroScrolled = nextIsHeroScrolled;
  };

  const queueHeroScrollSync = () => {
    if (animationFrameId !== null) return;

    animationFrameId = scheduler.requestAnimationFrame(applyHeroScrollProgress);
  };

  queueHeroScrollSync();
  scheduler.addEventListener('scroll', queueHeroScrollSync, { passive: true });
  scheduler.addEventListener('resize', queueHeroScrollSync);

  return () => {
    scheduler.removeEventListener('scroll', queueHeroScrollSync);
    scheduler.removeEventListener('resize', queueHeroScrollSync);

    if (animationFrameId !== null) {
      scheduler.cancelAnimationFrame(animationFrameId);
    }

    syncedHeroElement?.classList.remove(HOMEPAGE_HERO_SCROLLED_CLASS);
  };
}
