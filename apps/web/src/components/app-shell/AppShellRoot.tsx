import { useEffect, useMemo, useRef, useState } from 'react';

import {
  readPlayerProvidersFromElement,
  type PlayerEmbedLayout,
  type PlayerProvider,
  type PlayerProviderId,
} from '@/components/music/player-provider-data';
import { type ActivePlayerSession } from '@/components/music/player-iframe-session';
import {
  markCurrentHistoryEntryForShellSection,
  syncNavigationCurrentState,
  type ShellNavigationSource,
  waitForAnimationFrames,
} from '@/components/app-shell/navigation/shell-navigation';
import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  rememberDocumentIslandServerMarkup,
  scheduleIdleShellTask,
  type ShellPageSnapshot,
} from '@/components/app-shell/navigation/shell-page-snapshot';
import { createShellPageSnapshotLoader } from '@/components/app-shell/navigation/shell-page-loader';
import { connectShellPortalTarget } from '@/components/app-shell/dom/shell-portal-targets';
import {
  clearShellPageTransition,
  createShellSectionTransitionController,
  scrollShellViewportToTop,
  triggerShellPageEnterTransition,
  type ShellMotionControls,
} from '@/components/app-shell/navigation/shell-transition';
import { createProjectRelativeUrl } from '@/platform/config/site';
import { isCurrentPath } from '@/platform/utils/urls';
import { normalizeAppPathname, type ShellSectionRoute } from '@/components/app-shell/routing';
import { parseShellSectionRoute } from '@/components/app-shell/routing';
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
import { connectStorePreviewImages } from './dom/store-preview-images';
import { connectCopyButtons } from './dom/copy-buttons';
import type { MainNavigation } from '@/lib/site-data';
import type { StoreCartState } from '@/components/store/cart/store-cart';
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
import {
  findStoreCartFocusReturnTarget,
  scheduleOverlayContentFocus,
  scheduleOverlayTriggerFocusRestore,
} from './overlay/shell-overlay-focus';
import { isPlayerModalHistoryState } from './player-shell/player-modal-history';
import { createShellPlayerSessionController } from './player-shell/shell-player-session-controller';
import { syncShellRenderedNavigationState } from './navigation/shell-rendered-navigation-state';
import { MOBILE_NAVIGATION_TRIGGER_SELECTOR } from './navigation/shell-document-click-intent';
import { waitForEagerImages } from './navigation/shell-first-screen-images';
import type { ShellPrefetchOptions } from './navigation/shell-prefetch-intent';
import { openShellSectionNavigation, type ShellSectionActivationOutcome } from './navigation/shell-section-navigation';
import { enableManualShellScrollRestoration } from './navigation/shell-scroll-restoration';
import { scrollShellTargetIntoView } from './navigation/shell-target-scroll';
import { connectLenisScrollRoots } from './lenis-scroll';
import ShellPortalOutlets from './view/ShellPortalOutlets';
import {
  connectShellSurfaceIntent,
  createShellSurfaceLoader,
  scheduleShellIdleTask,
  useShellSurface,
  warmShellSurface,
} from './view/shell-surface-loader';

// Dormant surfaces stay out of the eager graph and never suspend on open: see shell-surface-loader.
const mobileNavigationSheetSurface = createShellSurfaceLoader(() =>
  import('./view/MobileNavigationSheet').then((module) => module.default),
);
const shellOverlayPanelSurface = createShellSurfaceLoader(() =>
  import('./view/ShellOverlayPanel').then((module) => module.default),
);
const shellPlayerSurface = createShellSurfaceLoader(() =>
  import('./view/ShellPlayerSurface').then((module) => module.default),
);
const storeCartDrawerSurface = createShellSurfaceLoader(() =>
  Promise.all([
    import('@/components/store/cart/StoreCartDrawer'),
    import('@/components/store/checkout/DeliverySummary'),
  ]).then(([drawerModule, deliverySummaryModule]) => ({
    CartDeliverySummary: deliverySummaryModule.default,
    StoreCartDrawer: drawerModule.default,
  })),
);
const STORE_CART_INTENT_SELECTOR = '[data-store-cart-header-root], [data-store-item-add-to-cart]';
const preloadStoreDistroSearch = () => import('@/components/store/StoreDistroSearch');

type OverlayState = ShellOverlayState;

type AppShellRootProps = {
  initialPathname: string;
  navigation: MainNavigation;
  servicesInquirySubmitText: string;
  siteTitle: string;
};

export default function AppShellRoot({
  initialPathname,
  navigation,
  servicesInquirySubmitText,
  siteTitle,
}: AppShellRootProps) {
  const [activeShellPathname, setActiveShellPathname] = useState(() => normalizeAppPathname(initialPathname));
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [hasOpenedOverlay, setHasOpenedOverlay] = useState(false);
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
  const [storeCartTotalDisplay, setStoreCartTotalDisplay] = useState<string | null>(null);

  const overlayStateRef = useRef<OverlayState | null>(null);
  const storeCartOpenerRef = useRef<HTMLElement | null>(null);
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
  // A reload on the player's history entry keeps that entry, so the first Back still only steps off it.
  const playerModalHistoryHrefRef = useRef<string | null>(
    typeof window !== 'undefined' && isPlayerModalHistoryState(window.history.state) ? window.location.href : null,
  );
  const iframeCacheByEmbedUrlRef = useRef(new Map<string, HTMLIFrameElement>());
  const providerSelectionByReleaseIdRef = useRef(new Map<string, PlayerProviderId>());
  const warmedOriginsRef = useRef(new Set<string>());
  const routeLoadingTimerRef = useRef<number | null>(null);
  const storeLoadingFeedbackTimerRef = useRef<number | null>(null);
  const storeListingPriceActivationStateRef = useRef<StoreListingPriceActivationState>({
    current: null,
    generation: 0,
  });
  const shellPageTransitionAnimationsRef = useRef<ShellMotionControls[]>([]);
  const shellSectionTransitionVeilRef = useRef<HTMLDivElement | null>(null);
  const shellSectionTransitionAnimationsRef = useRef<ShellMotionControls[]>([]);
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
        animationsRef: shellSectionTransitionAnimationsRef,
        getVeilElement: () => shellSectionTransitionVeilRef.current,
        shouldReduceMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
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
      animationsRef: shellPageTransitionAnimationsRef,
      getMainElement: getCurrentMainElement,
      shouldReduceMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    }),
    [],
  );

  overlayStateRef.current = overlayState;
  // The document listeners connect once; they and the player controller read the modal state through this ref.
  const isPlayerModalOpenRef = useRef(isPlayerModalOpen);
  isPlayerModalOpenRef.current = isPlayerModalOpen;

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

  // Remember what opened the drawer (Add to cart or the header control) so closing can return there.
  function openStoreCartDrawer() {
    const activeElement = document.activeElement;
    storeCartOpenerRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null;
    setIsStoreCartDrawerOpen(true);
  }

  function closeStoreCartDrawer() {
    setIsStoreCartDrawerOpen(false);
    setStoreCartTotalDisplay(null);
    scheduleOverlayTriggerFocusRestore({
      getTriggerElement: () => findStoreCartFocusReturnTarget(document, storeCartOpenerRef.current),
      scheduler: window,
    });
  }

  function syncShellNavigationState(pathname: string) {
    syncShellRenderedNavigationState({
      pathname,
      renderedPagePathnameRef,
      setActiveShellPathname,
      syncNavigationCurrentState,
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

  useEffect(() => connectLenisScrollRoots(document.body), []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handlePreferenceChange = () => {
      if (!reducedMotionQuery.matches) return;
      clearShellPageTransition(shellPageTransition);
      shellSectionTransition.reset();
    };
    reducedMotionQuery.addEventListener('change', handlePreferenceChange);
    return () => reducedMotionQuery.removeEventListener('change', handlePreferenceChange);
  }, [shellPageTransition, shellSectionTransition]);

  // The Menu exists only in the phone layout: its button hides at Tailwind `lg`.
  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 64rem)');
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setIsMobileNavigationOpen(false);
    };
    desktopQuery.addEventListener('change', closeOnDesktop);
    return () => desktopQuery.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    document
      .querySelector(MOBILE_NAVIGATION_TRIGGER_SELECTOR)
      ?.setAttribute('aria-expanded', String(isMobileNavigationOpen));
  }, [isMobileNavigationOpen]);

  // Surface modules load on trigger intent, and at idle where the trigger is likely: the Menu below `lg`, the
  // cart drawer where the cart control shows, and the small detail panel everywhere.
  useEffect(() => {
    const disconnectIntent = connectShellSurfaceIntent(document, [
      { selector: MOBILE_NAVIGATION_TRIGGER_SELECTOR, warm: () => warmShellSurface(mobileNavigationSheetSurface) },
      { selector: STORE_CART_INTENT_SELECTOR, warm: () => warmShellSurface(storeCartDrawerSurface) },
    ]);
    const cancelIdleWarmup = scheduleShellIdleTask(window, () => {
      if (!window.matchMedia('(min-width: 64rem)').matches) warmShellSurface(mobileNavigationSheetSurface);
      warmShellSurface(shellOverlayPanelSurface);
    });
    return () => {
      disconnectIntent();
      cancelIdleWarmup();
    };
  }, []);

  const hasStoreCartLines = storeCartState.lines.length > 0;
  useEffect(() => {
    const isStoreRoute = isCurrentPath(activeShellPathname, '/store/');
    if (!hasStoreCartLines && !isStoreRoute && !document.querySelector('[data-store-item-add-to-cart]')) return;
    return scheduleShellIdleTask(window, () => warmShellSurface(storeCartDrawerSurface));
  }, [activeShellPathname, hasStoreCartLines]);

  useEffect(() => {
    return syncShellBodyStateClasses({
      bodyClassList: document.body.classList,
      isOverlayOpen: overlayState !== null,
      isPlayerModalOpen,
    });
  }, [isPlayerModalOpen, overlayState]);

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
          setStoreCartDrawerOpen: (open) => (open ? openStoreCartDrawer() : closeStoreCartDrawer()),
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

  useEffect(() => connectCopyButtons(document), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (parseShellSectionRoute(activeShellPathname)?.kind !== 'store') return;
    const disconnectPreviewImages = connectStorePreviewImages(document);
    const disconnectPrices = connectStoreListingPricePresentation({
      readListingPrices:
        getPreparedStoreListingPriceReader(storeListingPriceActivationStateRef.current, activeShellPathname) ??
        readPublicStoreListingPrices,
      root: document,
    });
    return () => {
      disconnectPreviewImages();
      disconnectPrices();
    };
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

    if (parseShellSectionRoute(activeShellPathname)?.kind !== 'store') {
      setDistroSearchContainer(null);
      return;
    }

    return connectShellPortalTarget({
      activePathname: activeShellPathname,
      queryTarget: () =>
        document.querySelector<HTMLElement>(
          activeShellPathname === '/store/distro/' ? '[data-distro-search]' : '[data-store-search]',
        ),
      scheduler: window,
      setTarget: setDistroSearchContainer,
      targetPathname: activeShellPathname,
    });
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
    if (parseShellSectionRoute(pathname)?.kind === 'store') void preloadStoreDistroSearch().catch(() => undefined);

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
    closePlayerModalWithHistoryBack,
    connectPlayerSurface,
    markActivePlayerSessionAsInteracted,
    markActivePlayerSurfaceAsInteracted,
    openPlayerModal,
    reopenPlayerModal,
    stopPlayerSession,
    syncPlayerTriggers,
    warmProviderOrigins,
  } = createShellPlayerSessionController({
    activePlayerSessionRef,
    activePlayerTriggerElementRef,
    getCurrentHref: () => window.location.href,
    getHistory: () => window.history,
    getIsPlayerModalOpen: () => isPlayerModalOpenRef.current,
    getScheduler: () => window,
    getTargetDocument: () => document,
    iframeCacheByEmbedUrlRef,
    iframeFrameHostRef,
    modalCloseButtonRef,
    pendingPlayerProviderRef,
    playerModalHistoryHrefRef,
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

  useEffect(() => {
    syncPlayerTriggers();
  }, [activeShellPathname, overlayState]);

  async function prefetchOverlayHref(href: string) {
    warmShellSurface(shellOverlayPanelSurface);
    await overlayFragmentLoader.prefetchHref(href);
  }

  async function prefetchShellSectionHref(href: string, options?: ShellPrefetchOptions) {
    const route = parseShellSectionRoute(new URL(href, window.location.href).pathname);
    // The rendered page is snapshotted from the live DOM (at idle or on leaving), so it is never fetched.
    if (route?.pathname === renderedPagePathnameRef.current) return;
    const pagePrefetch = shellPageLoader.prefetchHref(href, options);
    if (route?.kind === 'store') void preloadStoreDistroSearch().catch(() => undefined);
    await pagePrefetch;
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
      getRenderedPathname: () => renderedPagePathnameRef.current,
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
      waitForFirstScreenImages: () => waitForEagerImages(getCurrentMainElement()),
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
      waitForFirstScreenImages: () => waitForEagerImages(getCurrentMainElement()),
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
    warmShellSurface(shellOverlayPanelSurface);
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
    // Island markup is recorded now, before interaction; the full snapshot waits for idle time. Leaving the page
    // earlier takes it after the transition veil has painted (openShellSectionNavigation).
    rememberDocumentIslandServerMarkup(document);
    const cancelIdleSnapshot = scheduleIdleShellTask(() => {
      if (!shellPageLoader.hasCachedSnapshot(renderedPagePathnameRef.current)) cacheDocumentSnapshot();
    });
    markCurrentHistoryEntryForShellSection(window.location.pathname);

    const disconnectShellDocumentListeners = connectShellDocumentEventRouting({
      closeMobileNavigation: () => setIsMobileNavigationOpen(false),
      closeOverlayState,
      closeOverlayWithHistoryBack,
      closePlayerModal,
      closePlayerModalWithHistoryBack,
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
      isPlayerModalOpen: () => isPlayerModalOpenRef.current,
      markActivePlayerSessionAsInteracted,
      navigateDocumentTo: (href) => window.location.assign(href),
      openOverlayHref,
      openPlayerModal,
      openShellSectionHref,
      playerModalHistoryHrefRef,
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
      warmProviderOrigins: (providers) => {
        warmShellSurface(shellPlayerSurface);
        warmProviderOrigins(providers);
      },
      windowTarget: window,
    });

    return () => {
      cancelIdleSnapshot();
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
    // Connected once per mount: every value it reads is a ref, a state setter or a stable loader, so player open and
    // close no longer re-snapshot main, re-bind document listeners or abort an in-flight navigation.
  }, []);

  const MobileNavigationSheet = useShellSurface(mobileNavigationSheetSurface, isMobileNavigationOpen, () =>
    setIsMobileNavigationOpen(false),
  );
  const storeCartDrawerModules = useShellSurface(storeCartDrawerSurface, isStoreCartDrawerOpen, closeStoreCartDrawer);
  const ShellOverlayPanel = useShellSurface(shellOverlayPanelSurface, Boolean(overlayState) || hasOpenedOverlay, () => {
    // A detail that cannot open in place still opens as its page.
    const overlayHref = overlayStateRef.current?.href;
    closeOverlayState({ restoreFocus: false });
    if (overlayHref) window.location.assign(overlayHref);
  });
  const ShellPlayerSurface = useShellSurface(
    shellPlayerSurface,
    isPlayerModalOpen || isMiniPlayerVisible,
    closePlayerModalWithHistoryBack,
  );

  return (
    <>
      {isMobileNavigationOpen &&
        (MobileNavigationSheet ? (
          <MobileNavigationSheet
            activeShellPathname={activeShellPathname}
            navigation={navigation}
            onNavigate={() => setIsMobileNavigationOpen(false)}
            onOpenChange={setIsMobileNavigationOpen}
            open
            siteTitle={siteTitle}
          />
        ) : (
          <span className="accessibility-visually-hidden-text" role="status">
            Loading menu
          </span>
        ))}

      {isStoreCartDrawerOpen &&
        (storeCartDrawerModules ? (
          <storeCartDrawerModules.StoreCartDrawer
            deliverySummary={
              <storeCartDrawerModules.CartDeliverySummary
                lines={storeCartState.lines}
                onTotalDisplayChange={setStoreCartTotalDisplay}
              />
            }
            cartState={storeCartState}
            checkoutAmountDisplay={storeCartTotalDisplay}
            open
            resolveHref={createProjectRelativeUrl}
            onContinueShopping={closeStoreCartDrawer}
            onDecrementItem={async (variantId) => {
              const { decrementCartLineQuantityByVariant } = await import('@/components/store/cart/store-cart');
              await applyStoreCartState(decrementCartLineQuantityByVariant(variantId, storeCartState));
            }}
            onIncrementItem={async (variantId) => {
              const { incrementCartLineQuantityByVariant } = await import('@/components/store/cart/store-cart');
              await applyStoreCartState(incrementCartLineQuantityByVariant(variantId, storeCartState));
            }}
            onOpenChange={(open) => (open ? setIsStoreCartDrawerOpen(true) : closeStoreCartDrawer())}
            onRemoveItem={async (variantId) => {
              const { removeCartLineByVariant } = await import('@/components/store/cart/store-cart');
              await applyStoreCartState(removeCartLineByVariant(variantId, storeCartState));
            }}
            onRestoreItem={async (line, index) => {
              const { restoreCartLine } = await import('@/components/store/cart/store-cart');
              await applyStoreCartState(restoreCartLine(line, index, storeCartState));
            }}
          />
        ) : (
          <span className="accessibility-visually-hidden-text" role="status">
            Loading cart
          </span>
        ))}

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
        ref={shellSectionTransitionVeilRef}
        className="app-shell-section-transition-veil"
        data-state={shellSectionTransitionState}
        data-shell-navigation-source={shellNavigationSource}
        data-shell-navigation-target={shellSectionTransitionTarget || undefined}
        aria-hidden="true"
      >
        <span
          className="app-shell-section-transition-veil__texture"
          data-shell-transition-layer
          aria-hidden="true"
        ></span>
        <span
          className="app-shell-section-transition-veil__shade"
          data-shell-transition-layer
          aria-hidden="true"
        ></span>
      </div>

      {(overlayState || hasOpenedOverlay) &&
        (ShellOverlayPanel ? (
          <ShellOverlayPanel
            closeButtonRef={overlayCloseButtonRef}
            onClose={closeOverlayWithHistoryBack}
            onExitComplete={() => {
              if (!overlayStateRef.current) setHasOpenedOverlay(false);
            }}
            onReady={() => {
              setHasOpenedOverlay(true);
              syncPlayerTriggers();
              scheduleOverlayContentFocus({
                getCloseButton: () => overlayCloseButtonRef.current,
                getScrollContainer: () => overlayScrollContainerRef.current,
                scheduler: window,
              });
            }}
            overlayState={overlayState}
            scrollContainerRef={overlayScrollContainerRef}
          />
        ) : (
          <span className="accessibility-visually-hidden-text" role="status">
            Loading detail
          </span>
        ))}

      {(isPlayerModalOpen || isMiniPlayerVisible) &&
        (ShellPlayerSurface ? (
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
                closePlayerModalWithHistoryBack();
              }
            }}
            onReady={connectPlayerSurface}
            playerModalDismissActionLabel={playerModalDismissActionLabel}
            playerModalDismissAriaLabel={playerModalDismissAriaLabel}
            playerProviders={playerProviders}
            providerLogoUrls={providerLogoUrls}
          />
        ) : (
          <span className="accessibility-visually-hidden-text" role="status">
            Loading player
          </span>
        ))}

      <ShellPortalOutlets
        activeShellPathname={activeShellPathname}
        artistsRosterFiltersContainer={artistsRosterFiltersContainer}
        distroSearchContainer={distroSearchContainer}
        onOpenStoreCart={openStoreCartDrawer}
        servicesInquiryContainer={servicesInquiryContainer}
        servicesInquirySubmitText={servicesInquirySubmitText}
        storeCartHeaderContainer={storeCartHeaderContainer}
        storeCartBridgeFailed={storeCartBridgeFailed}
        storeCartState={storeCartState}
      />
    </>
  );
}
