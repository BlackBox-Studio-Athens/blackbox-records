import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

import {
  readPlayerProvidersFromElement,
  type PlayerEmbedLayout,
  type PlayerProvider,
  type PlayerProviderId,
} from '@/components/app-shell/player-provider-data';
import { type ActivePlayerSession } from '@/components/app-shell/player-iframe-session';
import {
  markCurrentHistoryEntryForShellSection,
  syncDesktopNavigationState,
  type ShellNavigationSource,
  waitForAnimationFrames,
} from '@/components/app-shell/navigation/shell-navigation';
import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  type ShellPageSnapshot,
} from '@/components/app-shell/navigation/shell-page-snapshot';
import { createShellPageSnapshotLoader } from '@/components/app-shell/navigation/shell-page-loader';
import { connectShellPortalTarget } from '@/components/app-shell/dom/shell-portal-targets';
import {
  clearShellPageTransition,
  createShellSectionTransitionController,
  scrollShellViewportToTop,
  triggerShellPageEnterTransition,
} from '@/components/app-shell/navigation/shell-transition';
import { createProjectRelativeUrl } from '@/config/site';
import { normalizeAppPathname, type ShellSectionRoute } from '@/lib/app-shell/routing';
import { parseShellSectionRoute } from '@/lib/app-shell/routing';
import {
  connectStoreListingPricePresentation,
  readPublicStoreListingPrices,
} from '@/components/store/StoreListingPricePresentation';
import {
  clearStoreListingPriceActivation,
  getPreparedStoreListingPriceReader,
  prepareStoreListingPriceActivation,
  type StoreListingPriceActivationState,
} from './store-listing-price-activation';
import { Spinner } from '@/components/ui/spinner';
import type { SiteNavigationItem } from '@/lib/site-data';
import type { StoreCartState } from '@/lib/store-cart';
import { createOverlayFragmentLoader } from './overlay/overlay-fragment-loader';
import {
  closeOverlayWithHistoryBack as closeOverlayHistoryWithBack,
  collapseOverlayHistoryToBackground as collapseOverlayHistoryEntryToBackground,
} from './overlay/overlay-history';
import {
  clearRouteLoadingTimer as clearScheduledRouteLoadingTimer,
  scheduleDelayedRouteLoadingStart,
  scheduleRouteLoadingStop,
} from './navigation/route-loading-indicator';
import { syncShellBodyStateClasses } from './dom/shell-body-state';
import { restoreCachedShellPageSnapshot } from './navigation/shell-cached-page-restoration';
import { connectShellDocumentEventRouting } from './dom/shell-document-event-routing';
import { connectHomepageHeroScrollProgress, HOMEPAGE_HERO_SELECTOR } from './dom/shell-hero-scroll-progress';
import { openShellOverlayNavigation, type ShellOverlayState } from './overlay/shell-overlay-navigation';
import { scheduleOverlayContentFocus, scheduleOverlayTriggerFocusRestore } from './overlay/shell-overlay-focus';
import { createShellPlayerSessionController } from './player-shell/shell-player-session-controller';
import { syncShellRenderedNavigationState } from './navigation/shell-rendered-navigation-state';
import { openShellSectionNavigation, type ShellSectionActivationOutcome } from './navigation/shell-section-navigation';
import { enableManualShellScrollRestoration } from './navigation/shell-scroll-restoration';
import { scrollShellTargetIntoView } from './navigation/shell-target-scroll';
import ShellPortalOutlets from './view/ShellPortalOutlets';

const MobileNavigationSheet = lazy(() => import('./view/MobileNavigationSheet'));
const ShellOverlayPanel = lazy(() => import('./view/ShellOverlayPanel'));
const ShellPlayerSurface = lazy(() => import('./view/ShellPlayerSurface'));
const StoreCartDrawer = lazy(() => import('@/components/store/StoreCartDrawer'));

type OverlayState = ShellOverlayState;

type AppShellRootProps = {
  initialPathname: string;
  mobileNavigationItems: SiteNavigationItem[];
  servicesInquiryEmail: string;
  servicesInquirySubmitText: string;
  siteTitle: string;
};

export default function AppShellRoot({
  initialPathname,
  mobileNavigationItems,
  servicesInquiryEmail,
  servicesInquirySubmitText,
  siteTitle,
}: AppShellRootProps) {
  const [activeShellPathname, setActiveShellPathname] = useState(() => normalizeAppPathname(initialPathname));
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isStoreLoadingFeedbackVisible, setIsStoreLoadingFeedbackVisible] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [playerProviders, setPlayerProviders] = useState<PlayerProvider[]>([]);
  const [activePlayerProviderId, setActivePlayerProviderId] = useState<PlayerProviderId | ''>('');
  const [activePlayerEmbedLayout, setActivePlayerEmbedLayout] = useState<PlayerEmbedLayout | ''>('');
  const [activePlayerTitle, setActivePlayerTitle] = useState('');
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [miniPlayerStatusLabel, setMiniPlayerStatusLabel] = useState('Player Ready');
  const [playerModalDismissActionLabel, setPlayerModalDismissActionLabel] = useState<'Close' | 'Minimize'>('Close');
  const [playerModalDismissAriaLabel, setPlayerModalDismissAriaLabel] = useState<'Close player' | 'Minimize player'>(
    'Close player',
  );
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [shellSectionTransitionState, setShellSectionTransitionState] = useState<'closed' | 'entering' | 'revealing'>(
    'closed',
  );
  const [shellSectionTransitionTarget, setShellSectionTransitionTarget] = useState('');
  const [shellNavigationSource, setShellNavigationSource] = useState<ShellNavigationSource>('programmatic');
  const [artistsRosterFiltersContainer, setArtistsRosterFiltersContainer] = useState<HTMLElement | null>(null);
  const [distroSearchContainer, setDistroSearchContainer] = useState<HTMLElement | null>(null);
  const [servicesInquiryContainer, setServicesInquiryContainer] = useState<HTMLElement | null>(null);
  const [storeCartHeaderContainer, setStoreCartHeaderContainer] = useState<HTMLElement | null>(null);
  const [storeCartBridgeFailed, setStoreCartBridgeFailed] = useState(false);
  const [storeCartState, setStoreCartState] = useState<StoreCartState>(() => ({ lines: [], primaryLineItem: null }));
  const [isStoreCartDrawerOpen, setIsStoreCartDrawerOpen] = useState(false);

  const overlayStateRef = useRef<OverlayState | null>(null);
  const overlayCacheRef = useRef(new Map<string, string>());
  const overlayInFlightRequestsRef = useRef(new Map<string, Promise<string>>());
  const overlayAbortControllerRef = useRef<AbortController | null>(null);
  const shellPageCacheRef = useRef(new Map<string, ShellPageSnapshot>());
  const shellPageInFlightRequestsRef = useRef(new Map<string, Promise<ShellPageSnapshot>>());
  const shellPageAbortControllerRef = useRef<AbortController | null>(null);
  const overlayTriggerElementRef = useRef<HTMLElement | null>(null);
  const overlayCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const overlayScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const modalCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const iframeFrameHostRef = useRef<HTMLDivElement | null>(null);
  const pendingPlayerProviderRef = useRef<{
    nextStatus: ActivePlayerSession['status'] | undefined;
    provider: PlayerProvider;
    releaseId: string;
    releaseTitle: string;
  } | null>(null);
  const activePlayerTriggerElementRef = useRef<HTMLElement | null>(null);
  const iframeCacheByEmbedUrlRef = useRef(new Map<string, HTMLIFrameElement>());
  const providerSelectionByReleaseIdRef = useRef(new Map<string, PlayerProviderId>());
  const warmedOriginsRef = useRef(new Set<string>());
  const routeLoadingTimerRef = useRef<number | null>(null);
  const storeLoadingFeedbackTimerRef = useRef<number | null>(null);
  const storeListingPriceActivationStateRef = useRef<StoreListingPriceActivationState>({
    current: null,
    generation: 0,
  });
  const shellPageTransitionFrameRef = useRef<number | null>(null);
  const shellPageTransitionTimerRef = useRef<number | null>(null);
  const shellSectionTransitionTokenRef = useRef(0);
  const shellSectionTransitionStartedAtRef = useRef(0);
  const shellSectionTransitionTimerRef = useRef<number | null>(null);
  const activePlayerSessionRef = useRef<ActivePlayerSession | null>(null);
  const renderedPageHrefRef = useRef(typeof window === 'undefined' ? '' : window.location.href);
  const renderedPagePathnameRef = useRef(
    typeof window === 'undefined' ? '' : normalizeAppPathname(window.location.pathname),
  );
  const shellPageLoader = useMemo(
    () =>
      createShellPageSnapshotLoader({
        cache: shellPageCacheRef.current,
        inFlightRequests: shellPageInFlightRequestsRef.current,
      }),
    [],
  );
  const overlayFragmentLoader = useMemo(
    () =>
      createOverlayFragmentLoader({
        cache: overlayCacheRef.current,
        inFlightRequests: overlayInFlightRequestsRef.current,
      }),
    [],
  );

  const providerLogoUrls = useMemo(
    () => ({
      bandcamp: createProjectRelativeUrl('/assets/images/brand/bandcamp-button-black.png'),
      tidal: createProjectRelativeUrl('/assets/images/brand/tidal-button-black.png'),
    }),
    [],
  );
  const shellSectionTransition = useMemo(
    () =>
      createShellSectionTransitionController({
        timerRef: shellSectionTransitionTimerRef,
        tokenRef: shellSectionTransitionTokenRef,
        startedAtRef: shellSectionTransitionStartedAtRef,
        setNavigationSource: setShellNavigationSource,
        setState: setShellSectionTransitionState,
        setTarget: setShellSectionTransitionTarget,
      }),
    [],
  );
  const shellPageTransition = useMemo(
    () => ({
      frameRef: shellPageTransitionFrameRef,
      getMainElement: getCurrentMainElement,
      timerRef: shellPageTransitionTimerRef,
    }),
    [],
  );

  overlayStateRef.current = overlayState;

  async function applyStoreCartState(nextState: StoreCartState) {
    const { applyStoreCartStateAndPersist, getStoreCartBrowserStorage } =
      await import('@/components/app-shell/store-cart/store-cart-bridge');
    applyStoreCartStateAndPersist({
      readStorage: getStoreCartBrowserStorage,
      setStoreCartState,
      state: nextState,
    });
  }

  function getCurrentMainElement() {
    return document.querySelector<HTMLElement>('main[data-app-shell-main]');
  }

  function syncShellNavigationState(pathname: string) {
    syncShellRenderedNavigationState({
      pathname,
      renderedPagePathnameRef,
      setActiveShellPathname,
      syncDesktopNavigationState,
    });
  }

  function cacheDocumentSnapshot(href = renderedPageHrefRef.current || window.location.href) {
    return cacheDocumentShellPageSnapshot({
      href,
      shellPageCache: shellPageLoader,
      targetDocument: document,
    });
  }

  function applyShellPageSnapshot(pageSnapshot: ShellPageSnapshot) {
    return applyDocumentShellPageSnapshot({
      getMainElement: getCurrentMainElement,
      onHrefApplied: (href) => {
        renderedPageHrefRef.current = href;
      },
      onPathnameApplied: syncShellNavigationState,
      pageSnapshot,
      targetDocument: document,
    });
  }

  useEffect(() => {
    return syncShellBodyStateClasses({
      bodyClassList: document.body.classList,
      isOverlayOpen: overlayState !== null,
      isPlayerModalOpen,
    });
  }, [isPlayerModalOpen, overlayState]);

  useEffect(() => {
    if (activeShellPathname !== '/store/distro/' || typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => {
      const groups = [...document.querySelectorAll('[data-distro-coverflow-group]')];
      if (groups.length > 0 && groups.some((group) => !group.hasAttribute('data-distro-coverflow-ready'))) {
        document.documentElement.removeAttribute('data-distro-coverflow-capable');
      }
    }, 15000);

    return () => window.clearTimeout(timeoutId);
  }, [activeShellPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let disconnect: (() => void) | undefined;
    let cancelled = false;
    setStoreCartHeaderContainer(document.querySelector<HTMLElement>('[data-store-cart-header-root]'));
    void import('@/components/app-shell/store-cart/store-cart-bridge')
      .then(({ connectStoreCartBridge, getStoreCartBrowserStorage }) => {
        if (cancelled) return;
        disconnect = connectStoreCartBridge({
          eventTarget: window,
          queryHeaderRoot: () => document.querySelector<HTMLElement>('[data-store-cart-header-root]'),
          readStorage: getStoreCartBrowserStorage,
          setStoreCartDrawerOpen: setIsStoreCartDrawerOpen,
          setStoreCartHeaderContainer,
          setStoreCartState,
        });
      })
      .catch(() => {
        if (!cancelled) setStoreCartBridgeFailed(true);
      });

    return () => {
      cancelled = true;
      disconnect?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (parseShellSectionRoute(activeShellPathname)?.kind !== 'store') return;
    return connectStoreListingPricePresentation({
      readListingPrices:
        getPreparedStoreListingPriceReader(storeListingPriceActivationStateRef.current, activeShellPathname) ??
        readPublicStoreListingPrices,
      root: document,
    });
  }, [activeShellPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    return connectShellPortalTarget({
      activePathname: activeShellPathname,
      queryTarget: () => document.querySelector<HTMLElement>('[data-artists-roster-filters]'),
      scheduler: window,
      setTarget: setArtistsRosterFiltersContainer,
      targetPathname: '/artists/',
    });
  }, [activeShellPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (activeShellPathname !== '/store/distro/') {
      setDistroSearchContainer(null);
      return;
    }

    let disconnect: (() => void) | undefined;
    const connect = () => {
      disconnect = connectShellPortalTarget({
        activePathname: activeShellPathname,
        queryTarget: () => document.querySelector<HTMLElement>('[data-distro-search]'),
        scheduler: window,
        setTarget: setDistroSearchContainer,
        targetPathname: '/store/distro/',
      });
    };

    if (document.readyState === 'complete') connect();
    else window.addEventListener('load', connect, { once: true });

    return () => {
      window.removeEventListener('load', connect);
      disconnect?.();
    };
  }, [activeShellPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    return connectShellPortalTarget({
      activePathname: activeShellPathname,
      queryTarget: () => document.querySelector<HTMLElement>('[data-services-inquiry-form]'),
      scheduler: window,
      setTarget: setServicesInquiryContainer,
      targetPathname: '/services/',
    });
  }, [activeShellPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    return connectHomepageHeroScrollProgress({
      activePathname: activeShellPathname,
      queryHeroElement: () => document.querySelector<HTMLElement>(HOMEPAGE_HERO_SELECTOR),
      scheduler: window,
    });
  }, [activeShellPathname]);

  function clearRouteLoadingTimer() {
    clearScheduledRouteLoadingTimer(routeLoadingTimerRef, window);
  }

  function stopRouteLoadingSoon() {
    scheduleRouteLoadingStop({
      scheduler: window,
      setRouteLoading: setIsRouteLoading,
      timerRef: routeLoadingTimerRef,
    });
  }

  function clearStoreLoadingFeedback() {
    clearScheduledRouteLoadingTimer(storeLoadingFeedbackTimerRef, window);
    setIsStoreLoadingFeedbackVisible(false);
  }

  function startShellSectionActivation({
    cached,
    kind,
    pathname,
  }: {
    cached: boolean;
    kind: ShellSectionRoute['kind'];
    pathname: string;
  }) {
    clearStoreLoadingFeedback();
    clearStoreListingPriceActivation(storeListingPriceActivationStateRef.current);
    if (kind !== 'store') return undefined;

    const activation = prepareStoreListingPriceActivation({
      pathname,
      readListingPrices: readPublicStoreListingPrices,
      state: storeListingPriceActivationStateRef.current,
    });
    if (!cached) {
      scheduleDelayedRouteLoadingStart({
        scheduler: window,
        setRouteLoading: setIsStoreLoadingFeedbackVisible,
        timerRef: storeLoadingFeedbackTimerRef,
      });
    }

    return (outcome: ShellSectionActivationOutcome) => {
      if (storeListingPriceActivationStateRef.current.current?.generation === activation.generation) {
        clearStoreLoadingFeedback();
      }
      if (outcome !== 'complete') {
        clearStoreListingPriceActivation(storeListingPriceActivationStateRef.current, activation.generation);
      }
    };
  }

  const {
    applyPlayerProvider,
    closePlayerModal,
    connectPlayerSurface,
    markActivePlayerSessionAsInteracted,
    markActivePlayerSurfaceAsInteracted,
    openPlayerModal,
    reopenPlayerModal,
    stopPlayerSession,
    warmProviderOrigins,
  } = createShellPlayerSessionController({
    activePlayerSessionRef,
    activePlayerTriggerElementRef,
    getIsPlayerModalOpen: () => isPlayerModalOpen,
    getScheduler: () => window,
    getTargetDocument: () => document,
    iframeCacheByEmbedUrlRef,
    iframeFrameHostRef,
    modalCloseButtonRef,
    pendingPlayerProviderRef,
    providerSelectionByReleaseIdRef,
    setActivePlayerEmbedLayout,
    setActivePlayerProviderId,
    setActivePlayerTitle,
    setIsMiniPlayerVisible,
    setIsPlayerLoading,
    setIsPlayerModalOpen,
    setMiniPlayerStatusLabel,
    setPlayerModalDismissActionLabel,
    setPlayerModalDismissAriaLabel,
    setPlayerProviders,
    warmedOriginsRef,
  });

  async function prefetchOverlayHref(href: string) {
    await overlayFragmentLoader.prefetchHref(href);
  }

  async function prefetchShellSectionHref(href: string) {
    await shellPageLoader.prefetchHref(href);
  }

  async function openShellSectionHref(
    href: string,
    options?: {
      historyMode?: 'push' | 'replace' | 'none';
      source?: ShellNavigationSource;
      sourceElement?: HTMLElement | null;
    },
  ) {
    return openShellSectionNavigation({
      activeAbortControllerRef: shellPageAbortControllerRef,
      applyShellPageSnapshot,
      cacheDocumentSnapshot,
      collapseOverlayHistoryToBackground,
      currentHref: window.location.href,
      currentPathname: window.location.pathname,
      hasOverlayState: () => Boolean(overlayStateRef.current),
      historyMode: options?.historyMode,
      href,
      navigateDocumentTo: (nextHref) => {
        window.location.assign(nextHref);
      },
      onSectionActivationStart: startShellSectionActivation,
      scrollShellViewportToTarget: scrollToTargetId,
      scrollShellViewportToTop: (scrollOptions) =>
        scrollShellViewportToTop({
          getMainElement: getCurrentMainElement,
          sourceElement: scrollOptions?.sourceElement,
        }),
      setIsRouteLoading,
      shellPageLoader,
      shellSectionTransition,
      source: options?.source,
      sourceElement: options?.sourceElement,
      stopRouteLoadingSoon,
      syncShellNavigationState,
      triggerShellPageEnterTransition: () => triggerShellPageEnterTransition(shellPageTransition),
    });
  }

  async function restoreCachedShellPage(pathname: string, options?: { source?: ShellNavigationSource }) {
    return restoreCachedShellPageSnapshot({
      applyShellPageSnapshot,
      getCachedSnapshot: shellPageLoader.getCachedSnapshot,
      onSectionActivationStart: startShellSectionActivation,
      pathname,
      scrollShellViewportToTop: () => scrollShellViewportToTop({ getMainElement: getCurrentMainElement }),
      shellSectionTransition,
      source: options?.source,
      stopRouteLoadingSoon,
      triggerShellPageEnterTransition: () => triggerShellPageEnterTransition(shellPageTransition),
      waitForAnimationFrames,
    });
  }

  function scrollToTargetId(targetId: string, triggerElement?: HTMLElement | null) {
    return scrollShellTargetIntoView({
      documentRoot: document,
      overlayScrollContainer: overlayScrollContainerRef.current,
      targetId,
      triggerElement,
    });
  }

  function closeOverlayState({ restoreFocus = true } = {}) {
    overlayAbortControllerRef.current?.abort();
    overlayAbortControllerRef.current = null;
    setOverlayState(null);

    if (restoreFocus) {
      scheduleOverlayTriggerFocusRestore({
        getTriggerElement: () => overlayTriggerElementRef.current,
        scheduler: window,
      });
    }
  }

  function closeOverlayWithHistoryBack() {
    closeOverlayHistoryWithBack(window.history, closeOverlayState);
  }

  function collapseOverlayHistoryToBackground() {
    collapseOverlayHistoryEntryToBackground(window.history, overlayStateRef.current, closeOverlayState);
  }

  async function openOverlayHref(
    href: string,
    options?: { backgroundHref?: string; pushHistory?: boolean; replaceHistory?: boolean },
  ) {
    return openShellOverlayNavigation({
      activeAbortControllerRef: overlayAbortControllerRef,
      backgroundHref: options?.backgroundHref,
      closeOverlayState,
      currentHref: window.location.href,
      getCurrentOverlayState: () => overlayStateRef.current,
      history: window.history,
      href,
      navigateDocumentTo: (nextHref) => {
        window.location.assign(nextHref);
      },
      overlayFragmentLoader,
      pushHistory: options?.pushHistory,
      replaceHistory: options?.replaceHistory,
      scheduleOverlayContentFocus: () => {
        scheduleOverlayContentFocus({
          getCloseButton: () => overlayCloseButtonRef.current,
          getScrollContainer: () => overlayScrollContainerRef.current,
          scheduler: window,
        });
      },
      setOverlayState,
    });
  }

  useEffect(() => {
    const restoreShellScrollRestoration = enableManualShellScrollRestoration(window.history);

    renderedPageHrefRef.current = window.location.href;
    syncShellNavigationState(normalizeAppPathname(window.location.pathname));
    cacheDocumentSnapshot();
    markCurrentHistoryEntryForShellSection(window.location.pathname);

    const disconnectShellDocumentListeners = connectShellDocumentEventRouting({
      closeMobileNavigation: () => setIsMobileNavigationOpen(false),
      closeOverlayState,
      closeOverlayWithHistoryBack,
      closePlayerModal,
      collapseOverlayHistoryToBackground,
      currentHref: () => window.location.href,
      currentOrigin: () => window.location.origin,
      currentPathname: () => window.location.pathname,
      documentTarget: document,
      getActiveElement: () => document.activeElement,
      getActivePlayerSession: () => activePlayerSessionRef.current,
      getHistoryState: () => window.history.state || {},
      getOverlayBackgroundHref: () => overlayStateRef.current?.backgroundHref,
      hasCachedShellPage: shellPageLoader.hasCachedSnapshot,
      hasOverlayState: () => overlayStateRef.current !== null,
      isPlayerModalOpen: () => isPlayerModalOpen,
      markActivePlayerSessionAsInteracted,
      navigateDocumentTo: (href) => window.location.assign(href),
      openOverlayHref,
      openPlayerModal,
      openShellSectionHref,
      prefetchOverlayHref,
      prefetchShellSectionHref,
      readPlayerProvidersFromElement,
      reopenPlayerModal,
      restoreCachedShellPage,
      scheduler: window,
      scrollToTargetId,
      setMobileNavigationOpen: setIsMobileNavigationOpen,
      setOverlayTriggerElement: (element) => {
        overlayTriggerElementRef.current = element;
      },
      stopPlayerSession,
      warmProviderOrigins,
      windowTarget: window,
    });

    return () => {
      disconnectShellDocumentListeners();
      clearRouteLoadingTimer();
      clearScheduledRouteLoadingTimer(storeLoadingFeedbackTimerRef, window);
      clearStoreListingPriceActivation(storeListingPriceActivationStateRef.current);
      clearShellPageTransition(shellPageTransition);
      shellSectionTransition.reset();
      overlayAbortControllerRef.current?.abort();
      shellPageAbortControllerRef.current?.abort();

      restoreShellScrollRestoration();
    };
  }, [isPlayerModalOpen]);

  return (
    <>
      {isMobileNavigationOpen && (
        <Suspense
          fallback={
            <span className="accessibility-visually-hidden-text" role="status">
              Loading menu
            </span>
          }
        >
          <MobileNavigationSheet
            activeShellPathname={activeShellPathname}
            items={mobileNavigationItems}
            onNavigate={() => setIsMobileNavigationOpen(false)}
            onOpenChange={setIsMobileNavigationOpen}
            open
            siteTitle={siteTitle}
          />
        </Suspense>
      )}

      {isStoreCartDrawerOpen && (
        <Suspense
          fallback={
            <span className="accessibility-visually-hidden-text" role="status">
              Loading cart
            </span>
          }
        >
          <StoreCartDrawer
            cartState={storeCartState}
            open
            resolveHref={createProjectRelativeUrl}
            onContinueShopping={() => setIsStoreCartDrawerOpen(false)}
            onDecrementItem={async (variantId) => {
              const { decrementCartLineQuantityByVariant } = await import('@/lib/store-cart');
              await applyStoreCartState(decrementCartLineQuantityByVariant(variantId, storeCartState));
            }}
            onIncrementItem={async (variantId) => {
              const { incrementCartLineQuantityByVariant } = await import('@/lib/store-cart');
              await applyStoreCartState(incrementCartLineQuantityByVariant(variantId, storeCartState));
            }}
            onOpenChange={setIsStoreCartDrawerOpen}
            onRemoveItem={async (variantId) => {
              const { removeCartLineByVariant } = await import('@/lib/store-cart');
              await applyStoreCartState(removeCartLineByVariant(variantId, storeCartState));
            }}
          />
        </Suspense>
      )}

      <div
        className="app-shell-route-loading-indicator"
        data-state={isRouteLoading ? 'open' : 'closed'}
        data-store-feedback-state={isStoreLoadingFeedbackVisible ? 'open' : 'closed'}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="accessibility-visually-hidden-text">
          {isRouteLoading && !isStoreLoadingFeedbackVisible ? 'Loading section' : ''}
        </span>
        <span className="app-shell-route-loading-indicator__bar" aria-hidden="true"></span>
        {isStoreLoadingFeedbackVisible && (
          <span className="fixed left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 border border-white/20 bg-black/85 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg">
            <Spinner className="size-4" />
            <span>Loading Store</span>
          </span>
        )}
      </div>

      <div
        className="app-shell-section-transition-veil"
        data-state={shellSectionTransitionState}
        data-shell-navigation-source={shellNavigationSource}
        data-shell-navigation-target={shellSectionTransitionTarget || undefined}
        aria-hidden="true"
      ></div>

      {overlayState && (
        <Suspense
          fallback={
            <span className="accessibility-visually-hidden-text" role="status">
              Loading detail
            </span>
          }
        >
          <ShellOverlayPanel
            closeButtonRef={overlayCloseButtonRef}
            onClose={closeOverlayWithHistoryBack}
            onReady={() => {
              scheduleOverlayContentFocus({
                getCloseButton: () => overlayCloseButtonRef.current,
                getScrollContainer: () => overlayScrollContainerRef.current,
                scheduler: window,
              });
            }}
            overlayState={overlayState}
            scrollContainerRef={overlayScrollContainerRef}
          />
        </Suspense>
      )}

      {(isPlayerModalOpen || isMiniPlayerVisible) && (
        <Suspense
          fallback={
            <span className="accessibility-visually-hidden-text" role="status">
              Loading player
            </span>
          }
        >
          <ShellPlayerSurface
            activePlayerEmbedLayout={activePlayerEmbedLayout}
            activePlayerProviderId={activePlayerProviderId}
            activePlayerTitle={activePlayerTitle}
            applyPlayerProvider={(provider) => {
              const activeSession = activePlayerSessionRef.current;
              if (activeSession) {
                applyPlayerProvider(provider, activeSession.releaseId, activeSession.releaseTitle);
              }
            }}
            iframeFrameHostRef={iframeFrameHostRef}
            isMiniPlayerVisible={isMiniPlayerVisible}
            isPlayerLoading={isPlayerLoading}
            isPlayerModalOpen={isPlayerModalOpen}
            markActivePlayerSurfaceAsInteracted={markActivePlayerSurfaceAsInteracted}
            miniPlayerStatusLabel={miniPlayerStatusLabel}
            modalCloseButtonRef={modalCloseButtonRef}
            onModalBackdropClick={(event) => {
              if (event.target === event.currentTarget) {
                closePlayerModal();
              }
            }}
            onReady={connectPlayerSurface}
            playerModalDismissActionLabel={playerModalDismissActionLabel}
            playerModalDismissAriaLabel={playerModalDismissAriaLabel}
            playerProviders={playerProviders}
            providerLogoUrls={providerLogoUrls}
          />
        </Suspense>
      )}

      <ShellPortalOutlets
        activeShellPathname={activeShellPathname}
        artistsRosterFiltersContainer={artistsRosterFiltersContainer}
        distroSearchContainer={distroSearchContainer}
        onOpenStoreCart={() => {
          setIsStoreCartDrawerOpen(true);
        }}
        servicesInquiryContainer={servicesInquiryContainer}
        servicesInquiryEmail={servicesInquiryEmail}
        servicesInquirySubmitText={servicesInquirySubmitText}
        storeCartHeaderContainer={storeCartHeaderContainer}
        storeCartBridgeFailed={storeCartBridgeFailed}
        storeCartState={storeCartState}
      />
    </>
  );
}
