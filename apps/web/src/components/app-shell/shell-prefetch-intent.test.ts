import { describe, expect, it, vi } from 'vitest';

import type { PlayerProvider } from './player-provider-data';
import { primeShellPrefetchIntent } from './shell-prefetch-intent';

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
});
