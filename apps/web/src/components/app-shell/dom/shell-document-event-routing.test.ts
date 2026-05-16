import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  connectShellDocumentEventRouting,
  type ShellDocumentEventRoutingOptions,
} from './shell-document-event-routing';

type DocumentHandlers = Record<string, (event: Event) => void>;
type WindowHandlers = Record<string, () => void>;

function createTargets() {
  const documentHandlers: DocumentHandlers = {};
  const windowHandlers: WindowHandlers = {};

  return {
    documentHandlers,
    documentTarget: {
      addEventListener: vi.fn((type: string, handler: (event: Event) => void) => {
        documentHandlers[type] = handler;
      }),
      removeEventListener: vi.fn(),
    },
    windowHandlers,
    windowTarget: {
      addEventListener: vi.fn((type: string, handler: () => void) => {
        windowHandlers[type] = handler;
      }),
      removeEventListener: vi.fn(),
    },
  };
}

function createMouseEvent(target: EventTarget | null = null) {
  return {
    button: 0,
    ctrlKey: false,
    defaultPrevented: false,
    metaKey: false,
    preventDefault: vi.fn(),
    shiftKey: false,
    target,
  } as unknown as MouseEvent;
}

function createOptions(overrides: Partial<ShellDocumentEventRoutingOptions> = {}): ShellDocumentEventRoutingOptions & {
  documentHandlers: DocumentHandlers;
  windowHandlers: WindowHandlers;
} {
  const targets = createTargets();
  return {
    closeMobileNavigation: vi.fn(),
    closeOverlayState: vi.fn(),
    closeOverlayWithHistoryBack: vi.fn(),
    closePlayerModal: vi.fn(),
    collapseOverlayHistoryToBackground: vi.fn(),
    currentHref: vi.fn(() => 'https://example.test/blackbox-records/releases/'),
    currentOrigin: vi.fn(() => 'https://example.test'),
    currentPathname: vi.fn(() => '/blackbox-records/releases/'),
    documentTarget: targets.documentTarget,
    getActiveElement: vi.fn(() => null),
    getActivePlayerSession: vi.fn(() => null),
    getHistoryState: vi.fn(() => ({})),
    getOverlayBackgroundHref: vi.fn(() => null),
    hasCachedShellPage: vi.fn(() => false),
    hasOverlayState: vi.fn(() => false),
    isPlayerModalOpen: vi.fn(() => false),
    markActivePlayerSessionAsInteracted: vi.fn(),
    navigateDocumentTo: vi.fn(),
    openOverlayHref: vi.fn(async () => true),
    openPlayerModal: vi.fn(),
    openShellSectionHref: vi.fn(async () => true),
    prefetchOverlayHref: vi.fn(),
    prefetchShellSectionHref: vi.fn(),
    readPlayerProvidersFromElement: vi.fn(() => []),
    reopenPlayerModal: vi.fn(),
    restoreCachedShellPage: vi.fn(async () => true),
    scheduler: {
      setTimeout: vi.fn(),
    },
    scrollToTargetId: vi.fn(() => false),
    setMobileNavigationOpen: vi.fn(),
    setOverlayTriggerElement: vi.fn(),
    stopPlayerSession: vi.fn(),
    warmProviderOrigins: vi.fn(),
    windowTarget: targets.windowTarget,
    documentHandlers: targets.documentHandlers,
    windowHandlers: targets.windowHandlers,
    ...overrides,
  };
}

describe('shell document event routing', () => {
  it('toggles mobile navigation clicks', () => {
    const options = createOptions({
      dependencies: {
        resolveShellDocumentClickIntent: vi.fn(() => ({ kind: 'mobile-navigation-trigger' as const })),
      },
    });
    connectShellDocumentEventRouting(options);
    const event = createMouseEvent();

    options.documentHandlers.click?.(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.setMobileNavigationOpen).toHaveBeenCalledWith(expect.any(Function));
    const toggle = (options.setMobileNavigationOpen as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as (
      currentState: boolean,
    ) => boolean;
    expect(toggle(false)).toBe(true);
    expect(toggle(true)).toBe(false);
  });

  it('routes mini-player open and stop controls to player lifecycle callbacks', () => {
    const resolveShellDocumentClickIntent = vi
      .fn()
      .mockReturnValueOnce({ kind: 'mini-player-open' })
      .mockReturnValueOnce({ kind: 'mini-player-stop' });
    const options = createOptions({
      dependencies: {
        resolveShellDocumentClickIntent,
      },
    });
    connectShellDocumentEventRouting(options);

    options.documentHandlers.click?.(createMouseEvent());
    options.documentHandlers.click?.(createMouseEvent());

    expect(options.reopenPlayerModal).toHaveBeenCalledTimes(1);
    expect(options.stopPlayerSession).toHaveBeenCalledWith({ restoreFocus: true });
  });

  it('opens player triggers with the resolved trigger and player elements', () => {
    const triggerElement = {} as HTMLElement;
    const playerElement = {} as HTMLElement;
    const options = createOptions({
      dependencies: {
        resolveShellDocumentClickIntent: vi.fn(() => ({
          kind: 'player-trigger' as const,
          playerElement,
          triggerElement,
        })),
      },
    });
    connectShellDocumentEventRouting(options);
    const event = createMouseEvent();

    options.documentHandlers.click?.(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(options.openPlayerModal).toHaveBeenCalledWith(triggerElement, playerElement);
  });

  it('handles scroll target clicks before anchor routing when scrolling succeeds', () => {
    const triggerElement = {} as HTMLAnchorElement;
    const routeShellAnchorClickNavigation = vi.fn();
    const options = createOptions({
      dependencies: {
        resolveShellDocumentClickIntent: vi.fn(() => ({
          anchorElement: triggerElement,
          kind: 'scroll-target' as const,
          targetId: 'details',
          triggerElement,
        })),
        routeShellAnchorClickNavigation,
      },
      scrollToTargetId: vi.fn(() => true),
    });
    connectShellDocumentEventRouting(options);
    const event = createMouseEvent();

    options.documentHandlers.click?.(event);

    expect(options.scrollToTargetId).toHaveBeenCalledWith('details', triggerElement);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(routeShellAnchorClickNavigation).not.toHaveBeenCalled();
  });

  it('delegates anchor clicks with current routing context', () => {
    const anchorElement = {} as HTMLAnchorElement;
    const routeShellAnchorClickNavigation = vi.fn(() => 'shell-section' as const);
    const options = createOptions({
      currentHref: vi.fn(() => 'https://example.test/blackbox-records/about/'),
      dependencies: {
        resolveShellDocumentClickIntent: vi.fn(() => ({
          anchorElement,
          kind: 'anchor' as const,
        })),
        routeShellAnchorClickNavigation,
      },
    });
    connectShellDocumentEventRouting(options);

    options.documentHandlers.click?.(createMouseEvent(anchorElement as EventTarget));

    expect(routeShellAnchorClickNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        anchorElement,
        currentHref: 'https://example.test/blackbox-records/about/',
        currentOrigin: 'https://example.test',
      }),
    );
  });

  it('delegates pointer and focus prefetch checks', () => {
    const primeShellPrefetchIntent = vi.fn();
    const options = createOptions({
      dependencies: {
        primeShellPrefetchIntent,
      },
    });
    connectShellDocumentEventRouting(options);
    const pointerTarget = {} as EventTarget;
    const focusTarget = {} as EventTarget;

    options.documentHandlers.pointerover?.({ target: pointerTarget } as unknown as PointerEvent);
    options.documentHandlers.focusin?.({ target: focusTarget } as unknown as FocusEvent);

    expect(primeShellPrefetchIntent).toHaveBeenCalledWith(expect.objectContaining({ eventTarget: pointerTarget }));
    expect(primeShellPrefetchIntent).toHaveBeenCalledWith(expect.objectContaining({ eventTarget: focusTarget }));
  });

  it('delegates Escape key dismissal with live modal and overlay state', () => {
    const handleShellEscapeDismissal = vi.fn(() => 'player-modal' as const);
    const options = createOptions({
      dependencies: {
        handleShellEscapeDismissal,
      },
      hasOverlayState: vi.fn(() => true),
      isPlayerModalOpen: vi.fn(() => true),
    });
    connectShellDocumentEventRouting(options);
    const event = {
      key: 'Escape',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    options.documentHandlers.keydown?.(event);

    expect(handleShellEscapeDismissal).toHaveBeenCalledWith(
      expect.objectContaining({
        isPlayerModalOpen: true,
        key: 'Escape',
      }),
    );
  });

  it('delegates popstate routing with live history state', () => {
    const routeShellPopStateNavigation = vi.fn(() => 'shell-section' as const);
    const historyState = { __appShellSection: true };
    const options = createOptions({
      currentHref: vi.fn(() => 'https://example.test/blackbox-records/distro/'),
      currentPathname: vi.fn(() => '/blackbox-records/distro/'),
      dependencies: {
        routeShellPopStateNavigation,
      },
      getHistoryState: vi.fn(() => historyState),
    });
    connectShellDocumentEventRouting(options);

    options.windowHandlers.popstate?.();

    expect(routeShellPopStateNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        currentHref: 'https://example.test/blackbox-records/distro/',
        currentPathname: '/blackbox-records/distro/',
        historyState,
      }),
    );
  });

  it('schedules iframe blur interaction checks with live player getters', () => {
    const schedulePlayerIframeBlurInteractionCheck = vi.fn();
    const options = createOptions({
      dependencies: {
        schedulePlayerIframeBlurInteractionCheck,
      },
    });
    connectShellDocumentEventRouting(options);

    options.windowHandlers.blur?.();

    expect(schedulePlayerIframeBlurInteractionCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        getActiveElement: options.getActiveElement,
        getActiveSession: options.getActivePlayerSession,
        markPlayerSessionAsInteracted: options.markActivePlayerSessionAsInteracted,
        scheduler: options.scheduler,
      }),
    );
  });
});
