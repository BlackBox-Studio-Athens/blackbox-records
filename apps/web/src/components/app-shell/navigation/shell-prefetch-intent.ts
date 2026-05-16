import type { PlayerProvider } from '../player-provider-data';

type ShellPrefetchIntentOptions = {
  eventTarget: EventTarget | null;
  isNavigableOverlayAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  isNavigableShellSectionAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  prefetchOverlayHref: (href: string) => Promise<void> | void;
  prefetchShellSectionHref: (href: string) => Promise<void> | void;
  readPlayerProvidersFromElement: (playerElement: HTMLElement) => PlayerProvider[];
  warmProviderOrigins: (providers: PlayerProvider[]) => void;
};

type ClosestCapableEventTarget = EventTarget & {
  closest: <T extends Element = Element>(selectors: string) => T | null;
};

function canResolveClosestElement(eventTarget: EventTarget | null): eventTarget is ClosestCapableEventTarget {
  return typeof (eventTarget as { closest?: unknown } | null)?.closest === 'function';
}

export function primeShellPrefetchIntent({
  eventTarget,
  isNavigableOverlayAnchor,
  isNavigableShellSectionAnchor,
  prefetchOverlayHref,
  prefetchShellSectionHref,
  readPlayerProvidersFromElement,
  warmProviderOrigins,
}: ShellPrefetchIntentOptions) {
  if (!canResolveClosestElement(eventTarget)) return;

  const playerElement = eventTarget.closest<HTMLElement>('[data-music-streaming-service-embedded-player-card]');
  if (playerElement) {
    warmProviderOrigins(readPlayerProvidersFromElement(playerElement));
  }

  const anchorElement = eventTarget.closest<HTMLAnchorElement>('a[href]');
  if (!anchorElement) return;

  if (isNavigableShellSectionAnchor(anchorElement)) {
    void prefetchShellSectionHref(anchorElement.href);
  }

  if (isNavigableOverlayAnchor(anchorElement)) {
    void prefetchOverlayHref(anchorElement.href);
  }
}
