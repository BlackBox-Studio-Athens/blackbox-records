import type { PlayerProvider } from '../../music/player-provider-data';

// Tuning knob: how long a mouse must rest on a link before hover prefetch starts. Passing over the header in under
// this time fetches nothing; a deliberate hover still warms the page well before the click lands.
export const SHELL_HOVER_PREFETCH_DWELL_MS = 80;

export type ShellPrefetchOptions = {
  // Hover prefetch is a guess: it fetches at low priority and warms only the first eager image.
  speculative?: boolean;
};

type ShellPrefetchIntentOptions = {
  eventTarget: EventTarget | null;
  // Present for mouse hover: anchor prefetch waits for the dwell. Focus and touch/pen presses prefetch at once.
  hoverDwell?: ShellHoverPrefetchDwell | undefined;
  isNavigableOverlayAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  isNavigableShellSectionAnchor: (anchorElement: HTMLAnchorElement) => boolean;
  prefersReducedData?: () => boolean;
  prefetchOverlayHref: (href: string) => Promise<void> | void;
  prefetchShellSectionHref: (href: string, options?: ShellPrefetchOptions) => Promise<void> | void;
  readPlayerProvidersFromElement: (playerElement: HTMLElement) => PlayerProvider[];
  warmProviderOrigins: (providers: PlayerProvider[]) => void;
};

type ClosestCapableEventTarget = EventTarget & {
  closest: <T extends Element = Element>(selectors: string) => T | null;
};

type DwellScheduler = {
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
};

export type ShellHoverPrefetchDwell = ReturnType<typeof createShellHoverPrefetchDwell>;

function canResolveClosestElement(eventTarget: EventTarget | null): eventTarget is ClosestCapableEventTarget {
  return typeof (eventTarget as { closest?: unknown } | null)?.closest === 'function';
}

type NetworkInformationLike = { effectiveType?: string; saveData?: boolean };

// Save-Data or a 2G-class connection: speculative fetches would compete with the page the visitor is reading.
export function prefersReducedPrefetchData(
  navigatorLike: { connection?: NetworkInformationLike } | undefined = globalThis.navigator as
    { connection?: NetworkInformationLike } | undefined,
) {
  const connection = navigatorLike?.connection;
  if (!connection) return false;
  return connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType ?? '');
}

// One pending hover per document. `pointerover` bubbles from every element the mouse enters, so a pointerover whose
// nearest anchor differs from the pending one means the mouse left that link and cancels it.
export function createShellHoverPrefetchDwell({
  dwellMs = SHELL_HOVER_PREFETCH_DWELL_MS,
  scheduler = globalThis as DwellScheduler,
}: { dwellMs?: number; scheduler?: DwellScheduler } = {}) {
  let pendingAnchor: Element | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancel() {
    if (timer !== undefined) scheduler.clearTimeout(timer);
    timer = undefined;
    pendingAnchor = null;
  }

  function hover(anchorElement: Element | null, prefetch: () => void) {
    if (anchorElement && anchorElement === pendingAnchor) return;
    cancel();
    if (!anchorElement) return;

    pendingAnchor = anchorElement;
    timer = scheduler.setTimeout(() => {
      timer = undefined;
      pendingAnchor = null;
      prefetch();
    }, dwellMs);
  }

  return { cancel, hover };
}

export function primeShellPrefetchIntent({
  eventTarget,
  hoverDwell,
  isNavigableOverlayAnchor,
  isNavigableShellSectionAnchor,
  prefersReducedData = prefersReducedPrefetchData,
  prefetchOverlayHref,
  prefetchShellSectionHref,
  readPlayerProvidersFromElement,
  warmProviderOrigins,
}: ShellPrefetchIntentOptions) {
  if (!canResolveClosestElement(eventTarget)) {
    hoverDwell?.cancel();
    return;
  }

  const playerElement = eventTarget.closest<HTMLElement>('[data-music-streaming-service-embedded-player-card]');
  if (playerElement) {
    warmProviderOrigins(readPlayerProvidersFromElement(playerElement));
  }

  const anchorElement = eventTarget.closest<HTMLAnchorElement>('a[href]');
  const isShellSectionAnchor = anchorElement ? isNavigableShellSectionAnchor(anchorElement) : false;
  const isOverlayAnchor = anchorElement ? isNavigableOverlayAnchor(anchorElement) : false;

  if (!anchorElement || (!isShellSectionAnchor && !isOverlayAnchor)) {
    hoverDwell?.cancel();
    return;
  }

  const prefetch = (speculative: boolean) => {
    if (isShellSectionAnchor) {
      void (speculative
        ? prefetchShellSectionHref(anchorElement.href, { speculative: true })
        : prefetchShellSectionHref(anchorElement.href));
    }

    if (isOverlayAnchor) {
      void prefetchOverlayHref(anchorElement.href);
    }
  };

  if (!hoverDwell) {
    prefetch(false);
    return;
  }

  if (prefersReducedData()) {
    hoverDwell.cancel();
    return;
  }

  hoverDwell.hover(anchorElement, () => prefetch(true));
}
