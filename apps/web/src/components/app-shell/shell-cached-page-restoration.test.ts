import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { restoreCachedShellPageSnapshot } from './shell-cached-page-restoration';
import type { ShellPageSnapshot } from './shell-page-snapshot';

function createSnapshot(pathname: string): ShellPageSnapshot {
  return {
    canonicalHref: `https://example.test/blackbox-records${pathname}`,
    href: `https://example.test/blackbox-records${pathname}`,
    mainClassName: 'page-main-content-region',
    mainHtml: `<section>${pathname}</section>`,
    pageDescription: `${pathname} description`,
    pathname,
    title: `${pathname} | BlackBox`,
  };
}

function createOptions(overrides: Partial<Parameters<typeof restoreCachedShellPageSnapshot>[0]> = {}) {
  return {
    applyShellPageSnapshot: vi.fn(() => true),
    getCachedSnapshot: vi.fn(() => createSnapshot('/releases/')),
    pathname: '/releases/',
    scrollShellViewportToTop: vi.fn(async () => undefined),
    shellSectionTransition: {
      begin: vi.fn(() => 7),
      finish: vi.fn(async () => undefined),
      reset: vi.fn(),
    },
    stopRouteLoadingSoon: vi.fn(),
    triggerShellPageEnterTransition: vi.fn(),
    waitForAnimationFrames: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('cached shell page restoration', () => {
  it('does not restore when the shell page snapshot is not cached', async () => {
    const options = createOptions({
      getCachedSnapshot: vi.fn(() => null),
    });

    await expect(restoreCachedShellPageSnapshot(options)).resolves.toBe(false);

    expect(options.applyShellPageSnapshot).not.toHaveBeenCalled();
    expect(options.shellSectionTransition.begin).not.toHaveBeenCalled();
    expect(options.stopRouteLoadingSoon).not.toHaveBeenCalled();
  });

  it('applies a cached shell section snapshot through the section transition', async () => {
    const options = createOptions();

    await expect(restoreCachedShellPageSnapshot(options)).resolves.toBe(true);

    expect(options.shellSectionTransition.begin).toHaveBeenCalledWith('Releases', 'history');
    expect(options.waitForAnimationFrames).toHaveBeenCalledWith(2);
    expect(options.applyShellPageSnapshot).toHaveBeenCalledWith(createSnapshot('/releases/'));
    expect(options.scrollShellViewportToTop).toHaveBeenCalledTimes(1);
    expect(options.triggerShellPageEnterTransition).toHaveBeenCalledTimes(1);
    expect(options.shellSectionTransition.finish).toHaveBeenCalledWith(7);
    expect(options.stopRouteLoadingSoon).toHaveBeenCalledTimes(1);
  });

  it('resets the section transition when the cached snapshot cannot be applied', async () => {
    const options = createOptions({
      applyShellPageSnapshot: vi.fn(() => false),
    });

    await expect(restoreCachedShellPageSnapshot(options)).resolves.toBe(false);

    expect(options.shellSectionTransition.reset).toHaveBeenCalledTimes(1);
    expect(options.scrollShellViewportToTop).not.toHaveBeenCalled();
    expect(options.stopRouteLoadingSoon).not.toHaveBeenCalled();
  });

  it('restores non-section cached snapshots without the section transition', async () => {
    const options = createOptions({
      getCachedSnapshot: vi.fn(() => createSnapshot('/legacy-page/')),
      pathname: '/legacy-page/',
    });

    await expect(restoreCachedShellPageSnapshot(options)).resolves.toBe(true);

    expect(options.shellSectionTransition.begin).not.toHaveBeenCalled();
    expect(options.waitForAnimationFrames).not.toHaveBeenCalled();
    expect(options.applyShellPageSnapshot).toHaveBeenCalledWith(createSnapshot('/legacy-page/'));
    expect(options.shellSectionTransition.finish).not.toHaveBeenCalled();
    expect(options.stopRouteLoadingSoon).toHaveBeenCalledTimes(1);
  });
});
