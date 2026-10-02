import { afterEach, describe, expect, it, vi } from 'vitest';

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
  getAnimations: ReturnType<typeof vi.fn<(options?: GetAnimationsOptions) => Animation[]>>;
  setTop(top: number): void;
};

type FakeAnimation = { animationName: string; currentTime: number | null };

function createHeroElement({ animations = [] as FakeAnimation[], height = 500, top = 0 } = {}): FakeHeroElement {
  let heroTop = top;

  return {
    classList: {
      remove: vi.fn<(className: string) => void>(),
      toggle: vi.fn<(className: string, force?: boolean) => boolean>(() => true),
    },
    getAnimations: vi.fn<(options?: GetAnimationsOptions) => Animation[]>(() => animations as unknown as Animation[]),
    getBoundingClientRect: vi.fn(() => ({ height, top: heroTop }) as DOMRect),
    setTop(nextTop: number) {
      heroTop = nextTop;
    },
  };
}

function createFadeAnimations() {
  return {
    ghost: { animationName: 'homepage-hero-ghost', currentTime: null } as FakeAnimation,
    veil: { animationName: 'homepage-hero-ghost-veil', currentTime: null } as FakeAnimation,
    unrelated: { animationName: 'fade-rise', currentTime: null } as FakeAnimation,
  };
}

function findScrollListener(scheduler: ReturnType<typeof createScheduler>) {
  return scheduler.addEventListener.mock.calls.find(([type]) => type === 'scroll')?.[1] as () => void;
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
      (() => void) | undefined;
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
      (() => void) | undefined;
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

describe('homepage hero fade without scroll timelines', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('seeks only the paused hero fade to the scroll progress, once per change', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    const { ghost, veil, unrelated } = createFadeAnimations();
    const heroElement = createHeroElement({ animations: [ghost, veil, unrelated], top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({ activePathname: '/', queryHeroElement: () => heroElement, scheduler });
    scheduler.flushAnimationFrame();

    expect(heroElement.getAnimations).toHaveBeenCalledWith({ subtree: true });
    expect([ghost.currentTime, veil.currentTime, unrelated.currentTime]).toEqual([500, 500, null]);

    ghost.currentTime = -1;
    findScrollListener(scheduler)();
    scheduler.flushAnimationFrame();
    expect(ghost.currentTime).toBe(-1);

    heroElement.setTop(-900);
    findScrollListener(scheduler)();
    scheduler.flushAnimationFrame();
    expect([ghost.currentTime, veil.currentTime]).toEqual([1000, 1000]);
    expect(heroElement.getAnimations).toHaveBeenCalledTimes(1);
  });

  it('reads the fade of a replaced hero element', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    const first = createFadeAnimations();
    const second = createFadeAnimations();
    let heroElement = createHeroElement({ animations: [first.ghost], top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({ activePathname: '/', queryHeroElement: () => heroElement, scheduler });
    scheduler.flushAnimationFrame();
    heroElement = createHeroElement({ animations: [second.ghost], top: -210 });
    findScrollListener(scheduler)();
    scheduler.flushAnimationFrame();

    expect([first.ghost.currentTime, second.ghost.currentTime]).toEqual([500, 500]);
  });

  it('leaves the fade to the scroll timeline where it is supported', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    const { ghost } = createFadeAnimations();
    const heroElement = createHeroElement({ animations: [ghost], top: -210 });
    const scheduler = createScheduler();

    connectHomepageHeroScrollProgress({ activePathname: '/', queryHeroElement: () => heroElement, scheduler });
    scheduler.flushAnimationFrame();

    expect(heroElement.getAnimations).not.toHaveBeenCalled();
    expect(ghost.currentTime).toBeNull();
    expect(heroElement.classList.toggle).toHaveBeenCalledWith(HOMEPAGE_HERO_SCROLLED_CLASS, true);
  });
});
