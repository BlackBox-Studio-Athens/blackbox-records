import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlayerProvider } from '../../music/player-provider-data';
import {
  createShellHoverPrefetchDwell,
  prefersReducedPrefetchData,
  primeShellPrefetchIntent,
  SHELL_HOVER_PREFETCH_DWELL_MS,
  type ShellPrefetchOptions,
} from './shell-prefetch-intent';

const playerProviders: PlayerProvider[] = [
  {
    embedLayout: 'bandcamp-album',
    embedUrl: 'https://example.com/bandcamp',
    id: 'bandcamp',
  },
];

describe('primeShellPrefetchIntent', () => {
  it('ignores non-element event targets', () => {
    const prefetchShellSectionHref = vi.fn();
    const prefetchOverlayHref = vi.fn();
    const warmProviderOrigins = vi.fn();

    primeShellPrefetchIntent({
      eventTarget: new EventTarget(),
      isNavigableOverlayAnchor: () => true,
      isNavigableShellSectionAnchor: () => true,
      prefetchOverlayHref,
      prefetchShellSectionHref,
      readPlayerProvidersFromElement: () => playerProviders,
      warmProviderOrigins,
    });

    expect(warmProviderOrigins).not.toHaveBeenCalled();
    expect(prefetchShellSectionHref).not.toHaveBeenCalled();
    expect(prefetchOverlayHref).not.toHaveBeenCalled();
  });

  it('warms player provider origins from the nearest player card', () => {
    const playerCard = {} as HTMLElement;
    const target = {
      closest: vi.fn((selector: string) =>
        selector === '[data-music-streaming-service-embedded-player-card]' ? playerCard : null,
      ),
    } as unknown as EventTarget;
    const readPlayerProvidersFromElement = vi.fn(() => playerProviders);
    const warmProviderOrigins = vi.fn();

    primeShellPrefetchIntent({
      eventTarget: target,
      isNavigableOverlayAnchor: () => false,
      isNavigableShellSectionAnchor: () => false,
      prefetchOverlayHref: vi.fn(),
      prefetchShellSectionHref: vi.fn(),
      readPlayerProvidersFromElement,
      warmProviderOrigins,
    });

    expect(readPlayerProvidersFromElement).toHaveBeenCalledWith(playerCard);
    expect(warmProviderOrigins).toHaveBeenCalledWith(playerProviders);
  });

  it('prefetches shell section and overlay anchors through the supplied classifiers', () => {
    const anchor = { href: 'https://example.com/releases/' } as HTMLAnchorElement;
    const target = {
      closest: vi.fn((selector: string) => (selector === 'a[href]' ? anchor : null)),
    } as unknown as EventTarget;
    const prefetchShellSectionHref = vi.fn();
    const prefetchOverlayHref = vi.fn();

    primeShellPrefetchIntent({
      eventTarget: target,
      isNavigableOverlayAnchor: () => true,
      isNavigableShellSectionAnchor: () => true,
      prefetchOverlayHref,
      prefetchShellSectionHref,
      readPlayerProvidersFromElement: () => playerProviders,
      warmProviderOrigins: vi.fn(),
    });

    expect(prefetchShellSectionHref).toHaveBeenCalledWith(anchor.href);
    expect(prefetchOverlayHref).toHaveBeenCalledWith(anchor.href);
  });

  describe('hover dwell', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function createAnchorTarget(href: string) {
      const anchor = { href } as HTMLAnchorElement;
      const target = {
        closest: vi.fn((selector: string) => (selector === 'a[href]' ? anchor : null)),
      } as unknown as EventTarget;
      return { anchor, target };
    }

    function hover(
      eventTarget: EventTarget,
      hoverDwell: ReturnType<typeof createShellHoverPrefetchDwell>,
      callbacks: {
        prefersReducedData?: () => boolean;
        prefetchOverlayHref?: (href: string) => void;
        prefetchShellSectionHref: (href: string, options?: ShellPrefetchOptions) => void;
      },
    ) {
      primeShellPrefetchIntent({
        eventTarget,
        hoverDwell,
        isNavigableOverlayAnchor: () => false,
        isNavigableShellSectionAnchor: () => true,
        prefersReducedData: callbacks.prefersReducedData ?? (() => false),
        prefetchOverlayHref: callbacks.prefetchOverlayHref ?? vi.fn(),
        prefetchShellSectionHref: callbacks.prefetchShellSectionHref,
        readPlayerProvidersFromElement: () => playerProviders,
        warmProviderOrigins: vi.fn(),
      });
    }

    it('prefetches speculatively once the mouse rests on a link for the dwell', async () => {
      vi.useFakeTimers();
      const hoverDwell = createShellHoverPrefetchDwell();
      const prefetchShellSectionHref = vi.fn();
      const { anchor, target } = createAnchorTarget('https://example.com/store/');

      hover(target, hoverDwell, { prefetchShellSectionHref });
      // A pointerover from a child of the same link keeps the pending dwell instead of restarting it.
      await vi.advanceTimersByTimeAsync(SHELL_HOVER_PREFETCH_DWELL_MS - 10);
      hover(target, hoverDwell, { prefetchShellSectionHref });
      expect(prefetchShellSectionHref).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10);
      expect(prefetchShellSectionHref).toHaveBeenCalledTimes(1);
      expect(prefetchShellSectionHref).toHaveBeenCalledWith(anchor.href, { speculative: true });
    });

    it('cancels the pending prefetch when the mouse moves on before the dwell', async () => {
      vi.useFakeTimers();
      const hoverDwell = createShellHoverPrefetchDwell();
      const prefetchShellSectionHref = vi.fn();
      const first = createAnchorTarget('https://example.com/store/');
      const second = createAnchorTarget('https://example.com/artists/');
      const blank = { closest: vi.fn(() => null) } as unknown as EventTarget;

      hover(first.target, hoverDwell, { prefetchShellSectionHref });
      await vi.advanceTimersByTimeAsync(SHELL_HOVER_PREFETCH_DWELL_MS / 2);
      hover(second.target, hoverDwell, { prefetchShellSectionHref });
      await vi.advanceTimersByTimeAsync(SHELL_HOVER_PREFETCH_DWELL_MS / 2);
      hover(blank, hoverDwell, { prefetchShellSectionHref });
      await vi.advanceTimersByTimeAsync(SHELL_HOVER_PREFETCH_DWELL_MS * 2);

      expect(prefetchShellSectionHref).not.toHaveBeenCalled();
    });

    it('skips hover prefetch when the visitor asks for reduced data', async () => {
      vi.useFakeTimers();
      const hoverDwell = createShellHoverPrefetchDwell();
      const prefetchShellSectionHref = vi.fn();
      const { target } = createAnchorTarget('https://example.com/store/');

      hover(target, hoverDwell, { prefersReducedData: () => true, prefetchShellSectionHref });
      await vi.advanceTimersByTimeAsync(SHELL_HOVER_PREFETCH_DWELL_MS * 2);

      expect(prefetchShellSectionHref).not.toHaveBeenCalled();
    });

    it('cancel clears a pending hover', async () => {
      vi.useFakeTimers();
      const hoverDwell = createShellHoverPrefetchDwell();
      const prefetchShellSectionHref = vi.fn();
      const { target } = createAnchorTarget('https://example.com/store/');

      hover(target, hoverDwell, { prefetchShellSectionHref });
      hoverDwell.cancel();
      await vi.advanceTimersByTimeAsync(SHELL_HOVER_PREFETCH_DWELL_MS * 2);

      expect(prefetchShellSectionHref).not.toHaveBeenCalled();
    });
  });

  describe('prefersReducedPrefetchData', () => {
    it.each([
      [undefined, false],
      [{}, false],
      [{ connection: { effectiveType: '4g' } }, false],
      [{ connection: { effectiveType: '3g' } }, false],
      [{ connection: { effectiveType: '2g' } }, true],
      [{ connection: { effectiveType: 'slow-2g' } }, true],
      [{ connection: { effectiveType: '4g', saveData: true } }, true],
    ])('reads %j as %s', (navigatorLike, expected) => {
      expect(prefersReducedPrefetchData(navigatorLike)).toBe(expected);
    });
  });
});
