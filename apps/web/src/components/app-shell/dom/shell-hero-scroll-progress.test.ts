import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  calculateHomepageHeroScrollProgress,
  connectHomepageHeroScrollProgress,
  HOMEPAGE_HERO_SCROLLED_CLASS,
} from './shell-hero-scroll-progress';

type FakeHeroElement = Pick<HTMLElement, 'getBoundingClientRect'> & {
  classList: {
    remove: ReturnType<typeof vi.fn<(className: string) => void>>;
    toggle: ReturnType<typeof vi.fn<(className: string, force?: boolean) => boolean>>;
  };
  setTop(top: number): void;
};

function createHeroElement({ height = 500, top = 0 } = {}): FakeHeroElement {
  let heroTop = top;

  return {
    classList: {
      remove: vi.fn<(className: string) => void>(),
      toggle: vi.fn<(className: string, force?: boolean) => boolean>(() => true),
    },
    getBoundingClientRect: vi.fn(() => ({ height, top: heroTop }) as DOMRect),
    setTop(nextTop: number) {
      heroTop = nextTop;
    },
  };
}

function createScheduler({ innerHeight = 1000 } = {}) {
  const animationFrameCallbacks = new Map<number, FrameRequestCallback>();
  let nextAnimationFrameId = 1;

  return {
    addEventListener: vi.fn(),
    cancelAnimationFrame: vi.fn((id: number) => {
      animationFrameCallbacks.delete(id);
    }),
    flushAnimationFrame: (id = nextAnimationFrameId - 1) => {
      animationFrameCallbacks.get(id)?.(performance.now());
    },
    innerHeight,
    removeEventListener: vi.fn(),
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      const id = nextAnimationFrameId;
      nextAnimationFrameId += 1;
      animationFrameCallbacks.set(id, callback);
      return id;
    }),
  };
}

describe('calculateHomepageHeroScrollProgress', () => {
  it('uses the larger of viewport and hero fade distances', () => {
    expect(
      calculateHomepageHeroScrollProgress({
        heroHeight: 500,
        heroTop: -210,
        viewportHeight: 1000,
      }),
    ).toBe(0.5);
  });

  it('clamps progress between zero and one', () => {
    expect(
      calculateHomepageHeroScrollProgress({
        heroHeight: 500,
        heroTop: 50,
        viewportHeight: 1000,
      }),
    ).toBe(0);
    expect(
      calculateHomepageHeroScrollProgress({
        heroHeight: 500,
        heroTop: -900,
        viewportHeight: 1000,
      }),
    ).toBe(1);
  });
});

describe('connectHomepageHeroScrollProgress', () => {
  it('toggles the homepage hero scrolled class on the next animation frame', () => {
    const heroElement = createHeroElement({ top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({
      activePathname: '/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();

    expect(heroElement.classList.toggle).toHaveBeenCalledWith(HOMEPAGE_HERO_SCROLLED_CLASS, true);
    expect(scheduler.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(scheduler.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('does not toggle the scrolled class outside the homepage route', () => {
    const heroElement = createHeroElement({ top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({
      activePathname: '/artists/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();

    expect(heroElement.classList.toggle).not.toHaveBeenCalled();
    expect(scheduler.addEventListener).not.toHaveBeenCalled();
    expect(scheduler.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('does not mutate the hero when the threshold state has not changed', () => {
    const heroElement = createHeroElement({ top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({
      activePathname: '/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();
    const scrollListener = scheduler.addEventListener.mock.calls.find(([type]) => type === 'scroll')?.[1] as
      | (() => void)
      | undefined;
    scrollListener?.();
    scheduler.flushAnimationFrame();

    expect(heroElement.classList.toggle).toHaveBeenCalledTimes(1);
  });

  it('toggles the hero when the threshold state changes', () => {
    const heroElement = createHeroElement({ top: 0 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({
      activePathname: '/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();
    heroElement.setTop(-210);
    const scrollListener = scheduler.addEventListener.mock.calls.find(([type]) => type === 'scroll')?.[1] as
      | (() => void)
      | undefined;
    scrollListener?.();
    scheduler.flushAnimationFrame();

    expect(heroElement.classList.toggle).toHaveBeenNthCalledWith(1, HOMEPAGE_HERO_SCROLLED_CLASS, false);
    expect(heroElement.classList.toggle).toHaveBeenNthCalledWith(2, HOMEPAGE_HERO_SCROLLED_CLASS, true);
  });

  it('removes listeners, cancels pending work, and clears the scrolled class during cleanup', () => {
    const heroElement = createHeroElement({ top: -210 });
    const scheduler = createScheduler();

    const cleanup = connectHomepageHeroScrollProgress({
      activePathname: '/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();
    cleanup();

    expect(scheduler.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(scheduler.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(heroElement.classList.remove).toHaveBeenCalledWith(HOMEPAGE_HERO_SCROLLED_CLASS);
  });

  it('cancels a queued animation frame that has not run yet', () => {
    const scheduler = createScheduler();

    const cleanup = connectHomepageHeroScrollProgress({
      activePathname: '/',
      queryHeroElement: () => createHeroElement(),
      scheduler,
    });

    cleanup();

    expect(scheduler.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
