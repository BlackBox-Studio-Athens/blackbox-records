import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Square, X } from 'lucide-react';

import ArtistsRosterFilters from '@/components/artists/ArtistsRosterFilters';
import { reducePlayerSessionMachine } from '@/components/app-shell/player-session-machine';
import { OPEN_PLAYER_ACTION_LABEL } from '@/components/app-shell/player-session-ui';
import {
  readPlayerProvidersFromElement,
  readPlayerTitleFromElement,
  type PlayerEmbedLayout,
  type PlayerProvider,
  type PlayerProviderId,
} from '@/components/app-shell/player-provider-data';
import {
  DEFAULT_MAX_CACHED_PLAYER_IFRAMES,
  markPlayerIframeAsActive,
  resolvePlayerIframe,
  retirePlayerSession,
  type ActivePlayerSession,
} from '@/components/app-shell/player-iframe-session';
import { warmPlayerProviderOrigins } from '@/components/app-shell/player-provider-warmup';
import ServicesInquiryForm from '@/components/services/ServicesInquiryForm';
import StoreCartButton from '@/components/store/StoreCartButton';
import StoreCartDrawer from '@/components/store/StoreCartDrawer';
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
  applyStoreCartStateAndPersist,
  connectStoreCartBridge,
  getStoreCartBrowserStorage,
} from '@/components/app-shell/store-cart/store-cart-bridge';
import {
  clearShellPageTransition,
  createShellSectionTransitionController,
  scrollShellViewportToTop,
  triggerShellPageEnterTransition,
} from '@/components/app-shell/navigation/shell-transition';
import { Spinner } from '@/components/ui/spinner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createProjectRelativeUrl, resolveLinkAttributes } from '@/config/site';
import { normalizeAppPathname, type OverlayRoute } from '@/lib/app-shell/routing';
import type { SiteNavigationItem } from '@/lib/site-data';
import {
  createEmptyStoreCartState,
  decrementCartLineQuantityByVariant,
  incrementCartLineQuantityByVariant,
  removeCartLineByVariant,
  type StoreCartState,
} from '@/lib/store-cart';
import { isCurrentPath } from '@/utils/urls';
import { createOverlayFragmentLoader } from './overlay/overlay-fragment-loader';
import {
  closeOverlayWithHistoryBack as closeOverlayHistoryWithBack,
  collapseOverlayHistoryToBackground as collapseOverlayHistoryEntryToBackground,
} from './overlay/overlay-history';
import {
  clearRouteLoadingTimer as clearScheduledRouteLoadingTimer,
  scheduleRouteLoadingStop,
} from './navigation/route-loading-indicator';
import { syncShellBodyStateClasses } from './dom/shell-body-state';
import { restoreCachedShellPageSnapshot } from './navigation/shell-cached-page-restoration';
import { connectShellDocumentEventRouting } from './dom/shell-document-event-routing';
import { connectHomepageHeroScrollProgress, HOMEPAGE_HERO_SELECTOR } from './dom/shell-hero-scroll-progress';
import { openShellOverlayNavigation, type ShellOverlayState } from './overlay/shell-overlay-navigation';
import { scheduleOverlayContentFocus, scheduleOverlayTriggerFocusRestore } from './overlay/shell-overlay-focus';
import { syncPlayerSessionFrameHost } from './player-shell/shell-player-frame-host';
import {
  restoreConnectedPlayerTriggerFocus,
  schedulePlayerModalCloseButtonFocus,
} from './player-shell/shell-player-focus';
import { resolvePlayerModalOpenRequest } from './player-shell/shell-player-modal-open-request';
import { derivePlayerSessionMachineState } from './player-shell/shell-player-session-machine-state';
import { derivePlayerShellViewState, PLAYER_PROVIDER_LABELS } from './player-shell/shell-player-view-state';
import { syncShellRenderedNavigationState } from './navigation/shell-rendered-navigation-state';
import { openShellSectionNavigation } from './navigation/shell-section-navigation';
import { enableManualShellScrollRestoration } from './navigation/shell-scroll-restoration';
import { scrollShellTargetIntoView } from './navigation/shell-target-scroll';

type OverlayState = ShellOverlayState;

type AppShellRootProps = {
  mobileNavigationItems: SiteNavigationItem[];
  servicesInquiryEmail: string;
  servicesInquirySubmitText: string;
  siteTitle: string;
};

const OVERLAY_KIND_LABELS: Record<OverlayRoute['kind'], string> = {
  artists: 'artist',
  news: 'news',
  releases: 'release',
};
export default function AppShellRoot({
  mobileNavigationItems,
  servicesInquiryEmail,
  servicesInquirySubmitText,
  siteTitle,
}: AppShellRootProps) {
  const [activeShellPathname, setActiveShellPathname] = useState(() =>
    typeof window === 'undefined' ? '' : normalizeAppPathname(window.location.pathname),
  );
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
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
  const [servicesInquiryContainer, setServicesInquiryContainer] = useState<HTMLElement | null>(null);
  const [storeCartHeaderContainer, setStoreCartHeaderContainer] = useState<HTMLElement | null>(null);
  const [storeCartState, setStoreCartState] = useState<StoreCartState>(() => createEmptyStoreCartState());
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
  const activePlayerTriggerElementRef = useRef<HTMLElement | null>(null);
  const iframeCacheByEmbedUrlRef = useRef(new Map<string, HTMLIFrameElement>());
  const providerSelectionByTitleRef = useRef(new Map<string, PlayerProviderId>());
  const warmedOriginsRef = useRef(new Set<string>());
  const routeLoadingTimerRef = useRef<number | null>(null);
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

  function applyStoreCartState(nextState: StoreCartState) {
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
    if (typeof window === 'undefined') return;

    return connectStoreCartBridge({
      eventTarget: window,
      queryHeaderRoot: () => document.querySelector<HTMLElement>('[data-store-cart-header-root]'),
      readStorage: getStoreCartBrowserStorage,
      setStoreCartDrawerOpen: setIsStoreCartDrawerOpen,
      setStoreCartHeaderContainer,
      setStoreCartState,
    });
  }, []);

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

  function retireActivePlayerSession(activeSession: ActivePlayerSession | null) {
    retirePlayerSession(iframeCacheByEmbedUrlRef.current, activeSession);
  }

  function updatePlayerUiFromSession(activeSession: ActivePlayerSession | null) {
    if (!activeSession) {
      setPlayerProviders([]);
    }

    const viewState = derivePlayerShellViewState(activeSession);
    setActivePlayerProviderId(viewState.activePlayerProviderId);
    setActivePlayerEmbedLayout(viewState.activePlayerEmbedLayout);
    setActivePlayerTitle(viewState.activePlayerTitle);
    setIsPlayerLoading(viewState.isPlayerLoading);
    setIsMiniPlayerVisible(viewState.isMiniPlayerVisible);
    setMiniPlayerStatusLabel(viewState.miniPlayerStatusLabel);
    setPlayerModalDismissActionLabel(viewState.playerModalDismissActionLabel);
    setPlayerModalDismissAriaLabel(viewState.playerModalDismissAriaLabel);
  }

  function markActivePlayerSessionAsInteracted(embedUrl: string) {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession || activeSession.embedUrl !== embedUrl || activeSession.hasEmbedInteraction) return;

    activeSession.hasEmbedInteraction = true;
    updatePlayerUiFromSession(activeSession);
  }

  function markActivePlayerSurfaceAsInteracted() {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession) return;

    markActivePlayerSessionAsInteracted(activeSession.embedUrl);
  }

  function syncActivePlayerSessionIntoFrameHost() {
    syncPlayerSessionFrameHost({
      activeSession: activePlayerSessionRef.current,
      frameHostElement: iframeFrameHostRef.current,
      markIframeAsActive: markPlayerIframeAsActive,
      updatePlayerUiFromSession,
    });
  }

  function resolveIframe(provider: PlayerProvider, releaseTitle: string) {
    const frameHostElement = iframeFrameHostRef.current;
    if (!frameHostElement) return null;

    return resolvePlayerIframe({
      callbacks: {
        onInteraction: markActivePlayerSessionAsInteracted,
        onLoadStateChange: (embedUrl) => {
          if (activePlayerSessionRef.current?.embedUrl !== embedUrl) return;
          setIsPlayerLoading(false);
          updatePlayerUiFromSession(activePlayerSessionRef.current);
        },
      },
      frameHostElement,
      iframeCache: iframeCacheByEmbedUrlRef.current,
      maxCachedIframes: DEFAULT_MAX_CACHED_PLAYER_IFRAMES,
      provider,
      releaseTitle,
    });
  }

  function warmProviderOrigins(providers: PlayerProvider[]) {
    warmPlayerProviderOrigins({
      providers,
      targetDocument: document,
      warmedOrigins: warmedOriginsRef.current,
    });
  }

  function applyPlayerProvider(
    provider: PlayerProvider,
    releaseTitle: string,
    options?: {
      nextStatus?: ActivePlayerSession['status'];
    },
  ) {
    const activeSession = activePlayerSessionRef.current;
    if (activeSession && activeSession.embedUrl && activeSession.embedUrl !== provider.embedUrl) {
      retireActivePlayerSession(activeSession);
      activePlayerSessionRef.current = null;
    }

    const iframeElement = resolveIframe(provider, releaseTitle);
    if (!iframeElement) return;

    const nextSession: ActivePlayerSession = {
      embedUrl: provider.embedUrl,
      embedLayout: provider.embedLayout,
      hasEmbedInteraction: false,
      iframeElement,
      providerId: provider.id,
      releaseTitle,
      status: options?.nextStatus ?? (isPlayerModalOpen ? 'modal-open' : 'minimized'),
    };

    activePlayerSessionRef.current = nextSession;
    providerSelectionByTitleRef.current.set(releaseTitle, provider.id);
    setActivePlayerProviderId(provider.id);
    setActivePlayerEmbedLayout(provider.embedLayout);
    setActivePlayerTitle(releaseTitle);
    setIsPlayerLoading(iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState !== 'loaded');
    updatePlayerUiFromSession(nextSession);
  }

  function stopPlayerSession({ restoreFocus = true } = {}) {
    retireActivePlayerSession(activePlayerSessionRef.current);
    activePlayerSessionRef.current = null;
    setIsPlayerModalOpen(false);
    updatePlayerUiFromSession(null);

    if (restoreFocus) {
      restoreConnectedPlayerTriggerFocus(activePlayerTriggerElementRef.current);
    }
  }

  function minimizePlayerSession() {
    if (!activePlayerSessionRef.current) return;
    activePlayerSessionRef.current.status = 'minimized';
    setIsPlayerModalOpen(false);
    updatePlayerUiFromSession(activePlayerSessionRef.current);
  }

  function closePlayerModal() {
    const activeSession = activePlayerSessionRef.current;
    const nextSessionState = reducePlayerSessionMachine(derivePlayerSessionMachineState(activeSession), {
      type: 'dismiss-requested',
    });

    if (activeSession && nextSessionState.hasSession && nextSessionState.status === 'minimized') {
      minimizePlayerSession();
      return;
    }

    stopPlayerSession({ restoreFocus: true });
  }

  function reopenPlayerModal() {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession) return;

    activeSession.status = reducePlayerSessionMachine(derivePlayerSessionMachineState(activeSession), {
      type: 'reopen-requested',
    }).status as ActivePlayerSession['status'];
    setIsPlayerModalOpen(true);
    syncActivePlayerSessionIntoFrameHost();
    schedulePlayerModalCloseButtonFocus({
      getCloseButton: () => modalCloseButtonRef.current,
      scheduler: window,
    });
  }

  function openPlayerModal(triggerElement: HTMLElement, playerElement: HTMLElement) {
    const focusPlayerModalCloseButtonSoon = () => {
      schedulePlayerModalCloseButtonFocus({
        getCloseButton: () => modalCloseButtonRef.current,
        scheduler: window,
      });
    };

    const providers = readPlayerProvidersFromElement(playerElement);
    const releaseTitle = readPlayerTitleFromElement(playerElement);
    const playerModalOpenRequest = resolvePlayerModalOpenRequest({
      activeSession: activePlayerSessionRef.current,
      cachedProviderId: providerSelectionByTitleRef.current.get(releaseTitle),
      providers,
      releaseTitle,
    });
    if (playerModalOpenRequest.kind === 'without-provider') return;

    if (playerModalOpenRequest.kind === 'new-provider' && playerModalOpenRequest.shouldStopActiveSession) {
      stopPlayerSession({ restoreFocus: false });
    }

    activePlayerTriggerElementRef.current = triggerElement;
    warmProviderOrigins(providers);
    setPlayerProviders(providers);
    setActivePlayerTitle(releaseTitle);
    setIsPlayerModalOpen(true);

    if (playerModalOpenRequest.kind === 'reuse-active-session') {
      playerModalOpenRequest.activeSession.status = 'modal-open';
      syncActivePlayerSessionIntoFrameHost();
      focusPlayerModalCloseButtonSoon();
      return;
    }

    applyPlayerProvider(playerModalOpenRequest.nextProvider, releaseTitle, { nextStatus: 'modal-open' });
    focusPlayerModalCloseButtonSoon();
  }

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
      clearShellPageTransition(shellPageTransition);
      shellSectionTransition.reset();
      overlayAbortControllerRef.current?.abort();
      shellPageAbortControllerRef.current?.abort();

      restoreShellScrollRestoration();
    };
  }, [isPlayerModalOpen]);

  return (
    <>
      <Sheet open={isMobileNavigationOpen} onOpenChange={setIsMobileNavigationOpen}>
        <SheetContent
          side="right"
          className="top-[var(--header-height)] bottom-auto h-[calc(100dvh-var(--header-height))] w-[min(92vw,320px)] border-l border-border/80 bg-background/95 pt-6"
        >
          <div className="flex h-full flex-col gap-6">
            <SheetHeader>
              <SheetTitle className="font-display text-3xl tracking-[0.1em] uppercase">Menu</SheetTitle>
              <SheetDescription className="text-xs tracking-[0.16em] uppercase">{siteTitle}</SheetDescription>
            </SheetHeader>

            <nav className="grid gap-1" aria-label="Mobile" data-app-shell-mobile-navigation>
              {mobileNavigationItems.map((item) => {
                const navigationIsActive = activeShellPathname ? isCurrentPath(activeShellPathname, item.url) : false;
                const linkAttributes = resolveLinkAttributes(item.url);
                const isServicesNavigationItem = item.url === '/services/';
                const isStoreNavigationItem = item.url === '/store/';

                return (
                  <a
                    key={item.id}
                    href={linkAttributes.href}
                    target={linkAttributes.target}
                    rel={linkAttributes.rel}
                    data-astro-prefetch={linkAttributes.shouldPrefetch ? true : undefined}
                    aria-current={navigationIsActive ? 'page' : undefined}
                    data-services-navigation-link={isServicesNavigationItem ? 'true' : undefined}
                    data-store-navigation-link={isStoreNavigationItem ? 'true' : undefined}
                    className={[
                      'relative inline-flex min-h-11 items-center border-b border-border/70 py-1 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors',
                      isStoreNavigationItem
                        ? 'border-l-2 border-l-[var(--store-accent-active)] pl-3 text-[var(--store-accent-active)] hover:text-[var(--store-accent-hover)]'
                        : isServicesNavigationItem
                          ? navigationIsActive
                            ? 'border-l-2 border-l-[var(--services-accent-active)] pl-3 text-[var(--services-accent-active)]'
                            : 'text-foreground/90 hover:text-[var(--services-accent-hover)]'
                          : navigationIsActive
                            ? 'border-l-2 border-l-foreground/85 pl-3 text-foreground'
                            : 'text-foreground/90 hover:text-foreground',
                    ].join(' ')}
                    onClick={() => setIsMobileNavigationOpen(false)}
                  >
                    {item.title}
                  </a>
                );
              })}
            </nav>

            <button
              className="mt-auto w-full text-[11px] tracking-[0.18em] uppercase text-muted-foreground transition-colors hover:text-foreground"
              type="button"
              onClick={() => setIsMobileNavigationOpen(false)}
            >
              Close
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <StoreCartDrawer
        cartState={storeCartState}
        open={isStoreCartDrawerOpen}
        resolveHref={createProjectRelativeUrl}
        onContinueShopping={() => setIsStoreCartDrawerOpen(false)}
        onDecrementItem={(variantId) =>
          applyStoreCartState(decrementCartLineQuantityByVariant(variantId, storeCartState))
        }
        onIncrementItem={(variantId) =>
          applyStoreCartState(incrementCartLineQuantityByVariant(variantId, storeCartState))
        }
        onOpenChange={setIsStoreCartDrawerOpen}
        onRemoveItem={(variantId) => applyStoreCartState(removeCartLineByVariant(variantId, storeCartState))}
      />

      <div
        className="app-shell-route-loading-indicator"
        data-state={isRouteLoading ? 'open' : 'closed'}
        aria-hidden="true"
      >
        <span className="app-shell-route-loading-indicator__bar"></span>
      </div>

      <div
        className="app-shell-section-transition-veil"
        data-state={shellSectionTransitionState}
        data-shell-navigation-source={shellNavigationSource}
        data-shell-navigation-target={shellSectionTransitionTarget || undefined}
        aria-hidden="true"
      ></div>

      <div
        className="app-shell-content-overlay"
        data-state={overlayState ? 'open' : 'closed'}
        aria-hidden={overlayState ? 'false' : 'true'}
      >
        <div className="app-shell-content-overlay__backdrop" onClick={closeOverlayWithHistoryBack}></div>
        <div
          className="app-shell-content-overlay__panel"
          role="dialog"
          aria-modal="true"
          aria-busy={overlayState?.isLoading ? 'true' : 'false'}
        >
          <div className="app-shell-content-overlay__header">
            <span className="app-shell-content-overlay__eyebrow">
              {overlayState ? OVERLAY_KIND_LABELS[overlayState.route.kind] : 'detail'}
            </span>
            <button
              ref={overlayCloseButtonRef}
              className="app-shell-content-overlay__close-button"
              type="button"
              aria-label="Close detail view"
              onClick={closeOverlayWithHistoryBack}
            >
              <X className="size-4" />
            </button>
          </div>
          <div ref={overlayScrollContainerRef} className="app-shell-content-overlay__scroll-region">
            {overlayState?.isLoading ? (
              <div className="app-shell-content-overlay__loading-state" role="status" aria-live="polite">
                <div className="music-streaming-service-embedded-player-loading-card">
                  <div className="music-streaming-service-embedded-player-loading-card-status">
                    <Spinner className="size-3.5 text-foreground/72" />
                    <span>loading</span>
                  </div>
                  <div className="music-streaming-service-embedded-player-loading-card-bars" aria-hidden="true">
                    <span className="music-streaming-service-embedded-player-loading-card-bar music-streaming-service-embedded-player-loading-card-bar--long"></span>
                    <span className="music-streaming-service-embedded-player-loading-card-bar music-streaming-service-embedded-player-loading-card-bar--short"></span>
                  </div>
                </div>
              </div>
            ) : (
              overlayState?.html && (
                <div
                  className="app-shell-content-overlay__content"
                  dangerouslySetInnerHTML={{ __html: overlayState.html }}
                />
              )
            )}
          </div>
        </div>
      </div>

      <div
        className="music-streaming-service-embedded-player-modal-overlay"
        data-state={isPlayerModalOpen ? 'open' : 'closed'}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closePlayerModal();
          }
        }}
      >
        <div
          aria-labelledby="music-streaming-service-embedded-player-modal-title"
          aria-modal="true"
          aria-busy={isPlayerLoading ? 'true' : 'false'}
          className="music-streaming-service-embedded-player-modal-card"
          role="dialog"
          data-music-streaming-service-embedded-player-active-provider={activePlayerProviderId}
          data-music-streaming-service-embedded-player-embed-layout={activePlayerEmbedLayout}
          data-music-streaming-service-embedded-player-loading={isPlayerLoading ? 'true' : 'false'}
        >
          <h2 className="accessibility-visually-hidden-text" id="music-streaming-service-embedded-player-modal-title">
            Music player
          </h2>
          <div className="music-streaming-service-embedded-player-modal-header">
            <div className="music-streaming-service-embedded-player-modal-topbar">
              <button
                ref={modalCloseButtonRef}
                aria-label={playerModalDismissAriaLabel}
                className="music-streaming-service-embedded-player-modal-close-button"
                data-music-streaming-service-embedded-player-modal-dismiss
                type="button"
              >
                {playerModalDismissActionLabel}
              </button>
            </div>
            <div
              className="music-streaming-service-embedded-player-provider-switcher grid grid-cols-2 gap-2"
              hidden={playerProviders.length < 2}
            >
              {(['bandcamp', 'tidal'] as PlayerProviderId[]).map((providerId) => {
                const provider = playerProviders.find((item) => item.id === providerId);

                return (
                  <button
                    key={providerId}
                    className="music-streaming-service-embedded-player-provider-button music-streaming-service-embedded-player-provider-button--has-logo inline-flex min-h-10 items-center justify-center rounded-md px-4 transition-colors"
                    type="button"
                    data-state={activePlayerProviderId === providerId ? 'active' : 'inactive'}
                    aria-label={PLAYER_PROVIDER_LABELS[providerId]}
                    hidden={!provider}
                    aria-pressed={activePlayerProviderId === providerId}
                    onClick={() => {
                      if (!provider) return;
                      applyPlayerProvider(provider, activePlayerTitle);
                    }}
                  >
                    <img
                      className="music-streaming-service-embedded-player-provider-button-logo h-4 w-auto"
                      src={providerLogoUrls[providerId]}
                      alt=""
                      aria-hidden="true"
                    />
                    <span className="accessibility-visually-hidden-text">{PLAYER_PROVIDER_LABELS[providerId]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className="music-streaming-service-embedded-player-modal-frame"
            onPointerDownCapture={markActivePlayerSurfaceAsInteracted}
            onMouseDownCapture={markActivePlayerSurfaceAsInteracted}
            onTouchStartCapture={markActivePlayerSurfaceAsInteracted}
          >
            <div
              className="music-streaming-service-embedded-player-modal-loading-state absolute inset-0 flex items-center justify-center bg-background/92 px-3 py-3 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="music-streaming-service-embedded-player-loading-card">
                <div className="music-streaming-service-embedded-player-loading-card-status">
                  <Spinner className="size-3.5 text-foreground/72" />
                  <span>loading</span>
                </div>
                <div className="music-streaming-service-embedded-player-loading-card-bars" aria-hidden="true">
                  <span className="music-streaming-service-embedded-player-loading-card-bar music-streaming-service-embedded-player-loading-card-bar--long"></span>
                  <span className="music-streaming-service-embedded-player-loading-card-bar music-streaming-service-embedded-player-loading-card-bar--short"></span>
                </div>
              </div>
            </div>
            <div
              ref={iframeFrameHostRef}
              className="music-streaming-service-embedded-player-modal-frame-host flex w-full justify-center"
            ></div>
          </div>
        </div>
      </div>

      <div
        className="music-streaming-service-embedded-player-mini-player"
        data-state={isMiniPlayerVisible ? 'open' : 'closed'}
      >
        <div className="music-streaming-service-embedded-player-mini-player-copy">
          <p className="music-streaming-service-embedded-player-mini-player-provider uppercase text-muted-foreground">
            {miniPlayerStatusLabel}
          </p>
          <p className="music-streaming-service-embedded-player-mini-player-title text-foreground/92">
            {activePlayerTitle}
          </p>
        </div>
        <div className="music-streaming-service-embedded-player-mini-player-actions">
          <button
            aria-label="Open player"
            className="music-streaming-service-embedded-player-mini-player-action inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-border/80 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/78 transition-colors hover:bg-accent hover:text-accent-foreground"
            data-music-streaming-service-embedded-player-mini-player-open
            type="button"
          >
            {OPEN_PLAYER_ACTION_LABEL}
          </button>
          <button
            aria-label="Stop player"
            className="music-streaming-service-embedded-player-mini-player-action music-streaming-service-embedded-player-mini-player-action--icon inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-border/80 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            data-music-streaming-service-embedded-player-mini-player-stop
            type="button"
          >
            <Square className="size-3 fill-current" aria-hidden="true" strokeWidth={0} />
          </button>
        </div>
      </div>

      {artistsRosterFiltersContainer
        ? createPortal(
            <ArtistsRosterFilters key={activeShellPathname} pageKey={activeShellPathname} />,
            artistsRosterFiltersContainer,
          )
        : null}

      {servicesInquiryContainer
        ? createPortal(
            <ServicesInquiryForm
              key={activeShellPathname}
              email={servicesInquiryEmail}
              submitText={servicesInquirySubmitText}
            />,
            servicesInquiryContainer,
          )
        : null}

      {storeCartHeaderContainer
        ? createPortal(
            <StoreCartButton
              cartState={storeCartState}
              onClick={() => {
                setIsStoreCartDrawerOpen(true);
              }}
            />,
            storeCartHeaderContainer,
          )
        : null}
    </>
  );
}
