import { describe, expect, it, vi } from 'vitest';

const { animate } = vi.hoisted(() => ({ animate: vi.fn(() => ({ stop: vi.fn(), finished: Promise.resolve() })) }));
vi.mock('motion/mini', () => ({ animate }));
vi.mock('astro:config/client', () => ({ base: '/blackbox-records/', site: 'https://example.test' }));

describe('shell page enter transition', () => {
  it('fades <main> without a transform, so fixed descendants stay viewport-fixed', async () => {
    const { triggerShellPageEnterTransition, warmShellNavigationMotion } = await import('./shell-transition');
    expect(animate).not.toHaveBeenCalled();
    await warmShellNavigationMotion();
    const mainElement = { style: { removeProperty: vi.fn() } } as unknown as HTMLElement;

    // motion/mini loads through a dynamic import, so retry until the animation runs.
    await vi.waitFor(() => {
      triggerShellPageEnterTransition({
        animationsRef: { current: [] },
        getMainElement: () => mainElement,
        shouldReduceMotion: () => false,
      });
      expect(animate).toHaveBeenCalled();
    });

    expect(animate).toHaveBeenLastCalledWith(mainElement, { opacity: [0.68, 1] }, expect.any(Object));
  });
});
