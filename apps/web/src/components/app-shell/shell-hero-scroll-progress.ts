import { isCurrentPath } from '@/utils/urls';

export const HOMEPAGE_HERO_SCROLL_PROGRESS_PROPERTY = '--homepage-hero-scroll-progress';
export const HOMEPAGE_HERO_SELECTOR = '#homepage-hero-section';

type HeroScrollScheduler = {
  addEventListener(type: 'resize' | 'scroll', listener: () => void, options?: AddEventListenerOptions): void;
  cancelAnimationFrame(id: number): void;
  innerHeight: number;
  removeEventListener(type: 'resize' | 'scroll', listener: () => void): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
};

type HomepageHeroElement = Pick<HTMLElement, 'getBoundingClientRect'> & {
  style: Pick<CSSStyleDeclaration, 'removeProperty' | 'setProperty'>;
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
  let animationFrameId: number | null = null;
  let currentHeroElement: HomepageHeroElement | null = null;

  const applyHeroScrollProgress = () => {
    animationFrameId = null;
    currentHeroElement = queryHeroElement();

    if (!currentHeroElement || !isCurrentPath(activePathname, '/')) return;

    const heroRect = currentHeroElement.getBoundingClientRect();
    const progress = calculateHomepageHeroScrollProgress({
      heroHeight: heroRect.height,
      heroTop: heroRect.top,
      viewportHeight: scheduler.innerHeight,
    });
    currentHeroElement.style.setProperty(HOMEPAGE_HERO_SCROLL_PROGRESS_PROPERTY, progress.toFixed(4));
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

    currentHeroElement?.style.removeProperty(HOMEPAGE_HERO_SCROLL_PROGRESS_PROPERTY);
  };
}
