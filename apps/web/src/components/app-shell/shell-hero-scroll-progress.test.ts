import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  calculateHomepageHeroScrollProgress,
  connectHomepageHeroScrollProgress,
  HOMEPAGE_HERO_SCROLL_PROGRESS_PROPERTY,
} from './shell-hero-scroll-progress';

type FakeHeroElement = Pick<HTMLElement, 'getBoundingClientRect'> & {
  style: {
    removeProperty: ReturnType<typeof vi.fn<(property: string) => string>>;
    setProperty: ReturnType<typeof vi.fn<(property: string, value: string, priority?: string) => void>>;
  };
};

function createHeroElement({ height = 500, top = 0 } = {}): FakeHeroElement {
  return {
    getBoundingClientRect: vi.fn(() => ({ height, top }) as DOMRect),
    style: {
      removeProperty: vi.fn<(property: string) => string>(() => ''),
      setProperty: vi.fn<(property: string, value: string, priority?: string) => void>(),
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
  it('sets homepage hero scroll progress on the next animation frame', () => {
    const heroElement = createHeroElement({ top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({
      activePathname: '/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();

    expect(heroElement.style.setProperty).toHaveBeenCalledWith(HOMEPAGE_HERO_SCROLL_PROGRESS_PROPERTY, '0.5000');
    expect(scheduler.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(scheduler.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('does not set progress outside the homepage route', () => {
    const heroElement = createHeroElement({ top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({
      activePathname: '/artists/',
      queryHeroElement: () => heroElement,
      scheduler,
    });

    scheduler.flushAnimationFrame();

    expect(heroElement.style.setProperty).not.toHaveBeenCalled();
  });

  it('removes listeners, cancels pending work, and clears the CSS property during cleanup', () => {
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
    expect(heroElement.style.removeProperty).toHaveBeenCalledWith(HOMEPAGE_HERO_SCROLL_PROGRESS_PROPERTY);
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
