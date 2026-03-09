import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Square, X } from 'lucide-react';

import ArtistsRosterFilters from '@/components/artists/ArtistsRosterFilters';
import {
  IDLE_PLAYER_SESSION_MACHINE_STATE,
  reducePlayerSessionMachine,
} from '@/components/app-shell/player-session-machine';
import { derivePlayerPresentationState, OPEN_PLAYER_ACTION_LABEL } from '@/components/app-shell/player-session-ui';
import ServicesInquiryForm from '@/components/services/ServicesInquiryForm';
import { Spinner } from '@/components/ui/spinner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createProjectRelativeUrl, resolveLinkAttributes } from '@/config/site';
import {
  buildOverlayFragmentUrl,
  normalizeAppPathname,
  parseOverlayRoute,
  parseShellSectionRoute,
  type OverlayRoute,
  type ShellSectionKind,
} from '@/lib/app-shell/routing';
import type { SiteNavigationItem } from '@/lib/site-data';
import { isCurrentPath } from '@/utils/urls';

type PlayerProviderId = 'bandcamp' | 'tidal';
type PlayerProvider = {
  id: PlayerProviderId;
  embedUrl: string;
};

type OverlayState = {
  backgroundHref: string;
  href: string;
  html: string;
  isLoading: boolean;
  route: OverlayRoute;
};

type ActivePlayerSession = {
  embedUrl: string;
  hasEmbedInteraction: boolean;
  iframeElement: HTMLIFrameElement;
  providerId: PlayerProviderId;
  releaseTitle: string;
  status: 'minimized' | 'modal-open';
};

type ShellOverlayHistoryState = {
  __appShellOverlay: true;
  backgroundHref: string;
  pathname: string;
};

type ShellSectionHistoryState = {
  __appShellSection: true;
  pathname: string;
};

type ShellNavigationSource = 'footer' | 'header' | 'history' | 'mobile-nav' | 'programmatic';

type ShellPageSnapshot = {
  canonicalHref: string;
  href: string;
  mainClassName: string;
  mainHtml: string;
  pageDescription: string;
  pathname: string;
  title: string;
};

type AppShellRootProps = {
  mobileNavigationItems: SiteNavigationItem[];
  servicesInquiryEmail: string;
  servicesInquirySubmitText: string;
  siteTitle: string;
};

const EMBED_PROVIDER_PRIORITY: PlayerProviderId[] = ['bandcamp', 'tidal'];
const EMBED_PROVIDER_LABELS: Record<PlayerProviderId, string> = {
  bandcamp: 'Bandcamp',
  tidal: 'Tidal',
};
const OVERLAY_KIND_LABELS: Record<OverlayRoute['kind'], string> = {
  artists: 'artist',
  news: 'news',
  releases: 'release',
};
const SHELL_SECTION_LABELS: Record<ShellSectionKind, string> = {
  about: 'About',
  artists: 'Artists',
  home: 'Home',
  news: 'News',
  releases: 'Releases',
  services: 'Services',
};
const EMBED_PROVIDER_WARMUP_ORIGINS: Record<PlayerProviderId, string[]> = {
  bandcamp: ['https://bandcamp.com'],
  tidal: ['https://embed.tidal.com'],
};
const MAX_CACHED_IFRAMES = 6;
const ROUTE_LOADING_RESET_DELAY_MS = 120;
const SHELL_SECTION_TRANSITION_MIN_VISIBLE_MS = 180;
const SHELL_SECTION_TRANSITION_REVEAL_MS = 150;

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function resolveInternalUrl(anchorElement: HTMLAnchorElement) {
  try {
    return new URL(anchorElement.href, window.location.href);
  } catch {
    return null;
  }
}

function waitForAnimationFrames(count = 1) {
  return new Promise<void>((resolve) => {
    function step(remainingFrames: number) {
      window.requestAnimationFrame(() => {
        if (remainingFrames <= 1) {
          resolve();
          return;
        }

        step(remainingFrames - 1);
      });
    }

    step(count);
  });
}

function resolveShellNavigationSource(anchorElement: HTMLAnchorElement, isMobileNavigationLink: boolean): ShellNavigationSource {
  if (isMobileNavigationLink) return 'mobile-nav';
  if (anchorElement.closest('footer')) return 'footer';
  if (anchorElement.closest('header')) return 'header';
  return 'programmatic';
}

function isNavigableOverlayAnchor(anchorElement: HTMLAnchorElement) {
  if (anchorElement.target && anchorElement.target !== '_self') return false;
  if (anchorElement.hasAttribute('download')) return false;
  if (anchorElement.hasAttribute('data-astro-reload')) return false;

  const resolvedUrl = resolveInternalUrl(anchorElement);
  if (!resolvedUrl || resolvedUrl.origin !== window.location.origin) return false;

  return parseOverlayRoute(resolvedUrl.pathname) !== null;
}

function isNavigableShellSectionAnchor(anchorElement: HTMLAnchorElement) {
  if (anchorElement.target && anchorElement.target !== '_self') return false;
  if (anchorElement.hasAttribute('download')) return false;
  if (anchorElement.hasAttribute('data-astro-reload')) return false;

  const resolvedUrl = resolveInternalUrl(anchorElement);
  if (!resolvedUrl || resolvedUrl.origin !== window.location.origin) return false;

  return parseShellSectionRoute(resolvedUrl.pathname) !== null;
}

function readPlayerProviders(element: HTMLElement) {
  const providers: PlayerProvider[] = [];
  const bandcampEmbedUrl = element.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl;
  const tidalEmbedUrl = element.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl;

  if (bandcampEmbedUrl) {
    providers.push({ id: 'bandcamp', embedUrl: bandcampEmbedUrl });
  }
  if (tidalEmbedUrl) {
    providers.push({ id: 'tidal', embedUrl: tidalEmbedUrl });
  }

  return providers;
}

function readPlayerTitle(element: HTMLElement) {
  return element.dataset.musicStreamingServiceEmbeddedPlayerTitle || '';
}

function selectDefaultPlayerProvider(providers: PlayerProvider[]) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const preferredProviderId = EMBED_PROVIDER_PRIORITY.find((providerId) => providerById.has(providerId));
  return preferredProviderId ? providerById.get(preferredProviderId) || providers[0] : providers[0];
}

function appendHeadLink(rel: string, href: string, useCrossOrigin: boolean) {
  if (!document.head || document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

  const linkElement = document.createElement('link');
  linkElement.rel = rel;
  linkElement.href = href;
  if (useCrossOrigin) {
    linkElement.crossOrigin = 'anonymous';
  }
  document.head.appendChild(linkElement);
}

function readDocumentShellPageSnapshot(targetDocument: Document, href: string): ShellPageSnapshot | null {
  const mainElement =
    targetDocument.querySelector<HTMLElement>('main[data-app-shell-main]') ||
    targetDocument.querySelector<HTMLElement>('main#main');

  if (!mainElement) return null;

  const mainElementClone = mainElement.cloneNode(true) as HTMLElement;
  mainElementClone.querySelectorAll<HTMLElement>('[data-artists-roster-filters]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-services-inquiry-form]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });

  const resolvedUrl = new URL(href, window.location.href);
  const canonicalHref =
    targetDocument.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || resolvedUrl.toString();
  const pageDescription = targetDocument.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || '';

  return {
    canonicalHref,
    href: resolvedUrl.toString(),
    mainClassName: mainElement.getAttribute('class') || '',
    mainHtml: mainElementClone.innerHTML,
    pageDescription,
    pathname: normalizeAppPathname(resolvedUrl.pathname),
    title: targetDocument.title,
  };
}

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
  const [activePlayerTitle, setActivePlayerTitle] = useState('');
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [miniPlayerStatusLabel, setMiniPlayerStatusLabel] = useState('Player Ready');
  const [playerModalDismissActionLabel, setPlayerModalDismissActionLabel] = useState<'Close' | 'Minimize'>('Close');
  const [playerModalDismissAriaLabel, setPlayerModalDismissAriaLabel] = useState<'Close player' | 'Minimize player'>(
    'Close player',
  );
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [shellSectionTransitionState, setShellSectionTransitionState] = useState<'closed' | 'entering' | 'revealing'>('closed');
  const [shellSectionTransitionTarget, setShellSectionTransitionTarget] = useState('');
  const [shellNavigationSource, setShellNavigationSource] = useState<ShellNavigationSource>('programmatic');
  const [artistsRosterFiltersContainer, setArtistsRosterFiltersContainer] = useState<HTMLElement | null>(null);
  const [servicesInquiryContainer, setServicesInquiryContainer] = useState<HTMLElement | null>(null);

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
  const renderedPagePathnameRef = useRef(typeof window === 'undefined' ? '' : normalizeAppPathname(window.location.pathname));

  const providerLogoUrls = useMemo(
    () => ({
      bandcamp: createProjectRelativeUrl('/assets/images/brand/bandcamp-button-black.png'),
      tidal: createProjectRelativeUrl('/assets/images/brand/tidal-button-black.png'),
    }),
    [],
  );

  overlayStateRef.current = overlayState;

  function getCurrentMainElement() {
    return document.querySelector<HTMLElement>('main[data-app-shell-main]');
  }

  function updateDocumentMetadata(pageSnapshot: ShellPageSnapshot) {
    if (pageSnapshot.title) {
      document.title = pageSnapshot.title;
    }

    const descriptionMetaElement = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descriptionMetaElement && pageSnapshot.pageDescription) {
      descriptionMetaElement.content = pageSnapshot.pageDescription;
    }

    const canonicalLinkElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalLinkElement && pageSnapshot.canonicalHref) {
      canonicalLinkElement.href = pageSnapshot.canonicalHref;
    }
  }

  function syncDesktopNavigationState(pathname: string) {
    document.querySelectorAll<HTMLAnchorElement>('.header-nav-link[href]').forEach((anchorElement) => {
      const anchorPathname = normalizeAppPathname(
        anchorElement.dataset.navigationPathname || new URL(anchorElement.href, window.location.href).pathname,
      );
      const isActive = isCurrentPath(pathname, anchorPathname);

      if (isActive) {
        anchorElement.setAttribute('aria-current', 'page');
      } else {
        anchorElement.removeAttribute('aria-current');
      }
    });
  }

  function syncShellNavigationState(pathname: string) {
    renderedPagePathnameRef.current = pathname;
    setActiveShellPathname(pathname);
    syncDesktopNavigationState(pathname);
  }

  function markCurrentHistoryEntryForShellSection(pathname: string, href = window.location.href) {
    const shellSectionRoute = parseShellSectionRoute(pathname);
    if (!shellSectionRoute) return;

    window.history.replaceState(
      {
        ...(window.history.state || {}),
        __appShellSection: true,
        pathname: shellSectionRoute.pathname,
      } satisfies ShellSectionHistoryState,
      '',
      href,
    );
  }

  function cacheDocumentSnapshot(href = renderedPageHrefRef.current || window.location.href) {
    const pageSnapshot = readDocumentShellPageSnapshot(document, href);
    if (!pageSnapshot) return null;

    shellPageCacheRef.current.set(pageSnapshot.pathname, pageSnapshot);
    return pageSnapshot;
  }

  function applyShellPageSnapshot(pageSnapshot: ShellPageSnapshot) {
    const mainElement = getCurrentMainElement();
    if (!mainElement) return false;

    mainElement.className = pageSnapshot.mainClassName;
    mainElement.innerHTML = pageSnapshot.mainHtml;
    renderedPageHrefRef.current = pageSnapshot.href;
    updateDocumentMetadata(pageSnapshot);
    syncShellNavigationState(pageSnapshot.pathname);
    return true;
  }

  useEffect(() => {
    document.body.classList.toggle('is-music-streaming-service-embedded-player-modal-open', isPlayerModalOpen);
    document.body.classList.toggle('is-app-shell-overlay-open', overlayState !== null);

    return () => {
      document.body.classList.remove('is-music-streaming-service-embedded-player-modal-open');
      document.body.classList.remove('is-app-shell-overlay-open');
    };
  }, [isPlayerModalOpen, overlayState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isCurrentPath(activeShellPathname, '/artists/')) {
      setArtistsRosterFiltersContainer(null);
      return;
    }

    let animationFrameId = 0;

    const syncArtistsRosterFiltersContainer = () => {
      setArtistsRosterFiltersContainer(document.querySelector<HTMLElement>('[data-artists-roster-filters]'));
    };

    syncArtistsRosterFiltersContainer();
    animationFrameId = window.requestAnimationFrame(syncArtistsRosterFiltersContainer);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeShellPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isCurrentPath(activeShellPathname, '/services/')) {
      setServicesInquiryContainer(null);
      return;
    }

    let animationFrameId = 0;

    const syncServicesInquiryContainer = () => {
      setServicesInquiryContainer(document.querySelector<HTMLElement>('[data-services-inquiry-form]'));
    };

    syncServicesInquiryContainer();
    animationFrameId = window.requestAnimationFrame(syncServicesInquiryContainer);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeShellPathname]);

  function clearRouteLoadingTimer() {
    if (routeLoadingTimerRef.current) {
      window.clearTimeout(routeLoadingTimerRef.current);
      routeLoadingTimerRef.current = null;
    }
  }

  function clearShellSectionTransitionTimer() {
    if (shellSectionTransitionTimerRef.current !== null) {
      window.clearTimeout(shellSectionTransitionTimerRef.current);
      shellSectionTransitionTimerRef.current = null;
    }
  }

  function resetShellSectionTransitionState() {
    clearShellSectionTransitionTimer();
    setShellSectionTransitionState('closed');
    setShellSectionTransitionTarget('');
    setShellNavigationSource('programmatic');
  }

  function clearShellPageTransition(mainElement?: HTMLElement | null) {
    if (shellPageTransitionFrameRef.current !== null) {
      window.cancelAnimationFrame(shellPageTransitionFrameRef.current);
      shellPageTransitionFrameRef.current = null;
    }

    if (shellPageTransitionTimerRef.current !== null) {
      window.clearTimeout(shellPageTransitionTimerRef.current);
      shellPageTransitionTimerRef.current = null;
    }

    const targetMainElement = mainElement || getCurrentMainElement();
    targetMainElement?.removeAttribute('data-shell-page-transition-state');
  }

  function blurNavigationSourceElement(sourceElement?: HTMLElement | null) {
    sourceElement?.blur();
  }

  function focusShellMainAfterSwap() {
    const mainElement = getCurrentMainElement();
    if (!mainElement) return;

    try {
      mainElement.focus({ preventScroll: true });
    } catch {
      mainElement.focus();
    }
  }

  function beginShellSectionTransition(target: string, source: ShellNavigationSource) {
    clearShellSectionTransitionTimer();
    const nextToken = shellSectionTransitionTokenRef.current + 1;
    shellSectionTransitionTokenRef.current = nextToken;
    shellSectionTransitionStartedAtRef.current = performance.now();
    setShellSectionTransitionTarget(target);
    setShellNavigationSource(source);
    setShellSectionTransitionState('entering');
    return nextToken;
  }

  async function finishShellSectionTransition(transitionToken: number) {
    const elapsed = performance.now() - shellSectionTransitionStartedAtRef.current;
    const remainingVisibleDuration = Math.max(0, SHELL_SECTION_TRANSITION_MIN_VISIBLE_MS - elapsed);

    if (remainingVisibleDuration > 0) {
      await new Promise<void>((resolve) => {
        shellSectionTransitionTimerRef.current = window.setTimeout(() => {
          shellSectionTransitionTimerRef.current = null;
          resolve();
        }, remainingVisibleDuration);
      });
    }

    if (transitionToken !== shellSectionTransitionTokenRef.current) return;

    setShellSectionTransitionState('revealing');

    await new Promise<void>((resolve) => {
      shellSectionTransitionTimerRef.current = window.setTimeout(() => {
        shellSectionTransitionTimerRef.current = null;
        resolve();
      }, SHELL_SECTION_TRANSITION_REVEAL_MS);
    });

    if (transitionToken !== shellSectionTransitionTokenRef.current) return;

    resetShellSectionTransitionState();
  }

  function triggerShellPageEnterTransition() {
    const mainElement = getCurrentMainElement();
    if (!mainElement) return;

    clearShellPageTransition(mainElement);
    mainElement.setAttribute('data-shell-page-transition-state', 'enter');

    shellPageTransitionFrameRef.current = window.requestAnimationFrame(() => {
      shellPageTransitionFrameRef.current = null;
      mainElement.setAttribute('data-shell-page-transition-state', 'enter-active');
    });

    shellPageTransitionTimerRef.current = window.setTimeout(() => {
      mainElement.removeAttribute('data-shell-page-transition-state');
      shellPageTransitionTimerRef.current = null;
    }, 260);
  }

  async function scrollShellViewportToTop(sourceElement?: HTMLElement | null) {
    const forceScrollTop = () => {
      window.scrollTo(0, 0);
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    blurNavigationSourceElement(sourceElement);
    forceScrollTop();
    await waitForAnimationFrames(1);
    focusShellMainAfterSwap();
    forceScrollTop();
    await waitForAnimationFrames(2);
    forceScrollTop();
  }

  function stopRouteLoadingSoon() {
    clearRouteLoadingTimer();
    routeLoadingTimerRef.current = window.setTimeout(() => {
      setIsRouteLoading(false);
      routeLoadingTimerRef.current = null;
    }, ROUTE_LOADING_RESET_DELAY_MS);
  }

  function markIframeAsActive(activeIframeElement: HTMLIFrameElement) {
    const frameHostElement = iframeFrameHostRef.current;
    if (!frameHostElement) return;

    Array.from(frameHostElement.querySelectorAll<HTMLIFrameElement>('[data-music-streaming-service-embedded-player-iframe]')).forEach(
      (iframeElement) => {
        iframeElement.dataset.state = iframeElement === activeIframeElement ? 'active' : 'inactive';
      },
    );
  }

  function pruneIframeCache(activeEmbedUrl = '') {
    const iframeCache = iframeCacheByEmbedUrlRef.current;
    if (iframeCache.size <= MAX_CACHED_IFRAMES) return;

    for (const [embedUrl, iframeElement] of iframeCache) {
      if (embedUrl === activeEmbedUrl) continue;
      iframeElement.remove();
      iframeCache.delete(embedUrl);

      if (iframeCache.size <= MAX_CACHED_IFRAMES) {
        return;
      }
    }
  }

  function retireActivePlayerSession(activeSession: ActivePlayerSession | null) {
    if (!activeSession) return;
    iframeCacheByEmbedUrlRef.current.delete(activeSession.embedUrl);
    activeSession.iframeElement.remove();
  }

  function updatePlayerUiFromSession(activeSession: ActivePlayerSession | null) {
    if (!activeSession) {
      setActivePlayerProviderId('');
      setActivePlayerTitle('');
      setPlayerProviders([]);
      const presentation = derivePlayerPresentationState({
        hasEmbedInteraction: false,
        hasSession: false,
        isLoaded: false,
      });
      setIsPlayerLoading(presentation.isLoading);
      setIsMiniPlayerVisible(presentation.isMiniPlayerVisible);
      setMiniPlayerStatusLabel(presentation.miniPlayerStatusLabel);
      setPlayerModalDismissActionLabel(presentation.closeActionLabel);
      setPlayerModalDismissAriaLabel(presentation.closeActionAriaLabel);
      return;
    }

    setActivePlayerProviderId(activeSession.providerId);
    setActivePlayerTitle(activeSession.releaseTitle);
    const isLoaded = activeSession.iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState === 'loaded';
    const presentation = derivePlayerPresentationState({
      hasEmbedInteraction: activeSession.hasEmbedInteraction,
      hasSession: true,
      isLoaded,
      providerLabel: EMBED_PROVIDER_LABELS[activeSession.providerId],
      status: activeSession.status,
    });
    setIsPlayerLoading(presentation.isLoading);
    setIsMiniPlayerVisible(presentation.isMiniPlayerVisible);
    setMiniPlayerStatusLabel(presentation.miniPlayerStatusLabel);
    setPlayerModalDismissActionLabel(presentation.closeActionLabel);
    setPlayerModalDismissAriaLabel(presentation.closeActionAriaLabel);
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
    const activeSession = activePlayerSessionRef.current;
    const frameHostElement = iframeFrameHostRef.current;
    if (!activeSession || !frameHostElement) return;

    if (!frameHostElement.contains(activeSession.iframeElement)) {
      frameHostElement.appendChild(activeSession.iframeElement);
    }

    markIframeAsActive(activeSession.iframeElement);
    updatePlayerUiFromSession(activeSession);
  }

  function createIframe(provider: PlayerProvider, releaseTitle: string) {
    const iframeElement = document.createElement('iframe');
    iframeElement.allow = 'autoplay; encrypted-media; fullscreen; clipboard-write https://embed.tidal.com; web-share';
    iframeElement.className = 'music-streaming-service-embedded-player-iframe border-0';
    iframeElement.dataset.musicStreamingServiceEmbeddedPlayerIframe = '';
    iframeElement.dataset.musicStreamingServiceEmbeddedPlayerEmbedUrl = provider.embedUrl;
    iframeElement.dataset.musicStreamingServiceEmbeddedPlayerProvider = provider.id;
    iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState = 'loading';
    iframeElement.dataset.state = 'inactive';
    iframeElement.loading = 'eager';
    iframeElement.referrerPolicy = 'strict-origin-when-cross-origin';
    iframeElement.title = releaseTitle ? `${releaseTitle} player` : 'Music player';
    iframeElement.src = provider.embedUrl;

    iframeElement.addEventListener('load', () => {
      iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState = 'loaded';
      if (activePlayerSessionRef.current?.embedUrl !== provider.embedUrl) return;
      setIsPlayerLoading(false);
      updatePlayerUiFromSession(activePlayerSessionRef.current);
    });

    iframeElement.addEventListener('error', () => {
      iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState = 'error';
      if (activePlayerSessionRef.current?.embedUrl !== provider.embedUrl) return;
      setIsPlayerLoading(false);
      updatePlayerUiFromSession(activePlayerSessionRef.current);
    });

    iframeElement.addEventListener('focus', () => {
      markActivePlayerSessionAsInteracted(provider.embedUrl);
    });

    return iframeElement;
  }

  function resolveIframe(provider: PlayerProvider, releaseTitle: string) {
    const frameHostElement = iframeFrameHostRef.current;
    if (!frameHostElement) return null;

    const cachedIframeElement = iframeCacheByEmbedUrlRef.current.get(provider.embedUrl) || null;
    if (cachedIframeElement) {
      if (!frameHostElement.contains(cachedIframeElement)) {
        frameHostElement.appendChild(cachedIframeElement);
      }
      markIframeAsActive(cachedIframeElement);
      iframeCacheByEmbedUrlRef.current.delete(provider.embedUrl);
      iframeCacheByEmbedUrlRef.current.set(provider.embedUrl, cachedIframeElement);
      return cachedIframeElement;
    }

    const iframeElement = createIframe(provider, releaseTitle);
    frameHostElement.appendChild(iframeElement);
    markIframeAsActive(iframeElement);
    iframeCacheByEmbedUrlRef.current.set(provider.embedUrl, iframeElement);
    pruneIframeCache(provider.embedUrl);
    return iframeElement;
  }

  function warmProviderOrigins(providers: PlayerProvider[]) {
    providers
      .flatMap((provider) => EMBED_PROVIDER_WARMUP_ORIGINS[provider.id] || [])
      .forEach((origin) => {
        if (!origin || warmedOriginsRef.current.has(origin)) return;
        appendHeadLink('preconnect', origin, true);
        appendHeadLink('dns-prefetch', origin, false);
        warmedOriginsRef.current.add(origin);
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
      hasEmbedInteraction: false,
      iframeElement,
      providerId: provider.id,
      releaseTitle,
      status: options?.nextStatus ?? (isPlayerModalOpen ? 'modal-open' : 'minimized'),
    };

    activePlayerSessionRef.current = nextSession;
    providerSelectionByTitleRef.current.set(releaseTitle, provider.id);
    setActivePlayerProviderId(provider.id);
    setActivePlayerTitle(releaseTitle);
    setIsPlayerLoading(iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState !== 'loaded');
    markIframeAsActive(iframeElement);
    updatePlayerUiFromSession(nextSession);
  }

  function stopPlayerSession({ restoreFocus = true } = {}) {
    retireActivePlayerSession(activePlayerSessionRef.current);
    activePlayerSessionRef.current = null;
    setIsPlayerModalOpen(false);
    updatePlayerUiFromSession(null);

    if (restoreFocus && activePlayerTriggerElementRef.current?.isConnected) {
      activePlayerTriggerElementRef.current.focus();
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
    const nextSessionState = reducePlayerSessionMachine(
      activeSession
        ? {
            hasEmbedInteraction: activeSession.hasEmbedInteraction,
            hasSession: true,
            isLoaded: activeSession.iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState === 'loaded',
            status: activeSession.status,
          }
        : IDLE_PLAYER_SESSION_MACHINE_STATE,
      { type: 'dismiss-requested' },
    );

    if (activeSession && nextSessionState.hasSession && nextSessionState.status === 'minimized') {
      minimizePlayerSession();
      return;
    }

    stopPlayerSession({ restoreFocus: true });
  }

  function reopenPlayerModal() {
    const activeSession = activePlayerSessionRef.current;
    if (!activeSession) return;

    activeSession.status = reducePlayerSessionMachine(
      {
        hasEmbedInteraction: activeSession.hasEmbedInteraction,
        hasSession: true,
        isLoaded: activeSession.iframeElement.dataset.musicStreamingServiceEmbeddedPlayerLoadState === 'loaded',
        status: activeSession.status,
      },
      { type: 'reopen-requested' },
    ).status as ActivePlayerSession['status'];
    setIsPlayerModalOpen(true);
    syncActivePlayerSessionIntoFrameHost();
    window.requestAnimationFrame(() => modalCloseButtonRef.current?.focus());
  }

  function openPlayerModal(triggerElement: HTMLElement, playerElement: HTMLElement) {
    const focusPlayerModalCloseButtonSoon = () => {
      window.requestAnimationFrame(() => modalCloseButtonRef.current?.focus());
    };

    const providers = readPlayerProviders(playerElement);
    if (providers.length === 0) return;

    const releaseTitle = readPlayerTitle(playerElement);
    const activeSession = activePlayerSessionRef.current;
    const isSameRelease = Boolean(activeSession && activeSession.releaseTitle === releaseTitle);

    if (activeSession && !isSameRelease) {
      stopPlayerSession({ restoreFocus: false });
    }

    activePlayerTriggerElementRef.current = triggerElement;
    warmProviderOrigins(providers);
    setPlayerProviders(providers);
    setActivePlayerTitle(releaseTitle);
    setIsPlayerModalOpen(true);

    if (activePlayerSessionRef.current && isSameRelease) {
      activePlayerSessionRef.current.status = 'modal-open';
      syncActivePlayerSessionIntoFrameHost();
      focusPlayerModalCloseButtonSoon();
      return;
    }

    const cachedProviderId = providerSelectionByTitleRef.current.get(releaseTitle);
    const cachedProvider = providers.find((provider) => provider.id === cachedProviderId);
    const nextProvider = cachedProvider || selectDefaultPlayerProvider(providers);
    if (!nextProvider) return;

    applyPlayerProvider(nextProvider, releaseTitle, { nextStatus: 'modal-open' });
    focusPlayerModalCloseButtonSoon();
  }

  async function fetchOverlayHtml(pathname: string, signal?: AbortSignal) {
    const cachedHtml = overlayCacheRef.current.get(pathname);
    if (cachedHtml) return cachedHtml;

    const existingRequest = overlayInFlightRequestsRef.current.get(pathname);
    if (existingRequest) {
      return existingRequest;
    }

    const fragmentUrl = buildOverlayFragmentUrl(pathname);
    if (!fragmentUrl) {
      throw new Error(`Overlay fragment is not available for ${pathname}`);
    }

    const request = fetch(fragmentUrl, {
      credentials: 'same-origin',
      headers: {
        accept: 'text/html',
      },
      signal: signal ?? null,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Overlay fragment request failed for ${pathname}`);
        }
        const html = await response.text();
        overlayCacheRef.current.set(pathname, html);
        return html;
      })
      .finally(() => {
        overlayInFlightRequestsRef.current.delete(pathname);
      });

    overlayInFlightRequestsRef.current.set(pathname, request);
    return request;
  }

  async function prefetchOverlayHref(href: string) {
    const resolvedUrl = new URL(href, window.location.href);
    const route = parseOverlayRoute(resolvedUrl.pathname);
    if (!route || overlayCacheRef.current.has(route.pathname)) return;

    try {
      await fetchOverlayHtml(route.pathname);
    } catch {
      // Ignore speculative prefetch failures and let click fallback to real navigation.
    }
  }

  async function fetchShellPageSnapshot(pathname: string, href: string, signal?: AbortSignal) {
    const normalizedPathname = normalizeAppPathname(pathname);
    const cachedSnapshot = shellPageCacheRef.current.get(normalizedPathname);
    if (cachedSnapshot) return cachedSnapshot;

    const existingRequest = shellPageInFlightRequestsRef.current.get(normalizedPathname);
    if (existingRequest) {
      return existingRequest;
    }

    const request = fetch(href, {
      credentials: 'same-origin',
      headers: {
        accept: 'text/html',
      },
      signal: signal ?? null,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Shell page request failed for ${normalizedPathname}`);
        }

        const html = await response.text();
        const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
        const pageSnapshot = readDocumentShellPageSnapshot(parsedDocument, response.url || href);

        if (!pageSnapshot) {
          throw new Error(`Shell page snapshot is not available for ${normalizedPathname}`);
        }

        shellPageCacheRef.current.set(normalizedPathname, pageSnapshot);
        return pageSnapshot;
      })
      .finally(() => {
        shellPageInFlightRequestsRef.current.delete(normalizedPathname);
      });

    shellPageInFlightRequestsRef.current.set(normalizedPathname, request);
    return request;
  }

  async function prefetchShellSectionHref(href: string) {
    const resolvedUrl = new URL(href, window.location.href);
    const route = parseShellSectionRoute(resolvedUrl.pathname);
    if (!route || shellPageCacheRef.current.has(route.pathname)) return;

    try {
      await fetchShellPageSnapshot(route.pathname, resolvedUrl.toString());
    } catch {
      // Ignore speculative prefetch failures and let click fallback to real navigation.
    }
  }

  async function openShellSectionHref(
    href: string,
    options?: {
      historyMode?: 'push' | 'replace' | 'none';
      source?: ShellNavigationSource;
      sourceElement?: HTMLElement | null;
    },
  ) {
    const resolvedUrl = new URL(href, window.location.href);
    const route = parseShellSectionRoute(resolvedUrl.pathname);
    if (!route) return false;
    const navigationSource = options?.source || 'programmatic';

    if (overlayStateRef.current) {
      collapseOverlayHistoryToBackground();
    }

    const currentSnapshot = cacheDocumentSnapshot();
    const currentPathname = currentSnapshot?.pathname || normalizeAppPathname(window.location.pathname);
    if (route.pathname === currentPathname) {
      syncShellNavigationState(currentPathname);
      await scrollShellViewportToTop(options?.sourceElement);
      if (options?.historyMode === 'replace') {
        markCurrentHistoryEntryForShellSection(route.pathname, resolvedUrl.toString());
      }
      return true;
    }

    shellPageAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    shellPageAbortControllerRef.current = abortController;

    const cachedSnapshot = shellPageCacheRef.current.get(route.pathname) || null;
    if (!cachedSnapshot) {
      setIsRouteLoading(true);
    }

    const sectionTransitionToken = beginShellSectionTransition(SHELL_SECTION_LABELS[route.kind], navigationSource);
    await waitForAnimationFrames(2);

    try {
      const pageSnapshot =
        cachedSnapshot || (await fetchShellPageSnapshot(route.pathname, resolvedUrl.toString(), abortController.signal));

      if (abortController.signal.aborted) {
        return true;
      }

      const applied = applyShellPageSnapshot(pageSnapshot);
      if (!applied) {
        throw new Error(`Unable to apply shell page snapshot for ${route.pathname}`);
      }

      if (options?.historyMode === 'push') {
        window.history.pushState({ __appShellSection: true, pathname: route.pathname } satisfies ShellSectionHistoryState, '', resolvedUrl.toString());
      } else if (options?.historyMode === 'replace') {
        markCurrentHistoryEntryForShellSection(route.pathname, resolvedUrl.toString());
      }

      await scrollShellViewportToTop(options?.sourceElement);
      triggerShellPageEnterTransition();
      await finishShellSectionTransition(sectionTransitionToken);

      return true;
    } catch {
      if (abortController.signal.aborted) {
        return true;
      }

      resetShellSectionTransitionState();
      window.location.assign(resolvedUrl.toString());
      return false;
    } finally {
      if (shellPageAbortControllerRef.current === abortController) {
        shellPageAbortControllerRef.current = null;
      }
      stopRouteLoadingSoon();
    }
  }

  async function restoreCachedShellPage(pathname: string, options?: { source?: ShellNavigationSource }) {
    const pageSnapshot = shellPageCacheRef.current.get(normalizeAppPathname(pathname));
    if (!pageSnapshot) return false;
    const route = parseShellSectionRoute(pathname);
    const sectionTransitionToken = route
      ? beginShellSectionTransition(SHELL_SECTION_LABELS[route.kind], options?.source || 'history')
      : null;

    if (sectionTransitionToken !== null) {
      await waitForAnimationFrames(2);
    }

    const applied = applyShellPageSnapshot(pageSnapshot);
    if (!applied) {
      resetShellSectionTransitionState();
      return false;
    }

    await scrollShellViewportToTop();
    triggerShellPageEnterTransition();
    if (sectionTransitionToken !== null) {
      await finishShellSectionTransition(sectionTransitionToken);
    }

    stopRouteLoadingSoon();
    return true;
  }

  function restoreOverlayTriggerFocus() {
    if (overlayTriggerElementRef.current?.isConnected) {
      overlayTriggerElementRef.current.focus();
    }
  }

  function scrollToTargetId(targetId: string, triggerElement?: HTMLElement | null) {
    const overlayScrollRoot =
      triggerElement && overlayScrollContainerRef.current?.contains(triggerElement) ? overlayScrollContainerRef.current : null;
    const targetElement =
      overlayScrollRoot?.querySelector<HTMLElement>(`[id="${targetId}"]`) ||
      document.querySelector<HTMLElement>(`[id="${targetId}"]`);

    if (!targetElement) return false;

    if (overlayScrollRoot && overlayScrollRoot.contains(targetElement)) {
      const overlayScrollRootRect = overlayScrollRoot.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const nextScrollTop = overlayScrollRoot.scrollTop + (targetRect.top - overlayScrollRootRect.top) - 16;

      overlayScrollRoot.scrollTo({
        top: Math.max(nextScrollTop, 0),
        behavior: 'smooth',
      });
    } else {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    return true;
  }

  function closeOverlayState({ restoreFocus = true } = {}) {
    overlayAbortControllerRef.current?.abort();
    overlayAbortControllerRef.current = null;
    setOverlayState(null);

    if (restoreFocus) {
      window.requestAnimationFrame(() => restoreOverlayTriggerFocus());
    }
  }

  function closeOverlayWithHistoryBack() {
    if (window.history.state?.__appShellOverlay) {
      window.history.back();
      return;
    }

    closeOverlayState();
  }

  function collapseOverlayHistoryToBackground() {
    const currentOverlayState = overlayStateRef.current;
    if (!currentOverlayState) return;

    const currentHistoryState = window.history.state || {};
    window.history.replaceState(
      {
        ...currentHistoryState,
        __appShellOverlay: false,
      },
      '',
      currentOverlayState.backgroundHref,
    );
    closeOverlayState({ restoreFocus: false });
  }

  function writeOverlayHistoryState(options: {
    historyMode: 'push' | 'replace';
    href: string;
    backgroundHref: string;
    pathname: string;
  }) {
    const nextHistoryState: ShellOverlayHistoryState = {
      __appShellOverlay: true,
      backgroundHref: options.backgroundHref,
      pathname: options.pathname,
    };

    if (options.historyMode === 'push') {
      window.history.pushState(nextHistoryState, '', options.href);
      return;
    }

    window.history.replaceState(nextHistoryState, '', options.href);
  }

  async function openOverlayHref(href: string, options?: { backgroundHref?: string; pushHistory?: boolean; replaceHistory?: boolean }) {
    const resolvedUrl = new URL(href, window.location.href);
    const route = parseOverlayRoute(resolvedUrl.pathname);
    if (!route) return false;

    overlayAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    overlayAbortControllerRef.current = abortController;

    const backgroundHref = options?.backgroundHref || overlayStateRef.current?.backgroundHref || window.location.href;
    const cachedHtml = overlayCacheRef.current.get(route.pathname) || '';
    setOverlayState({
      backgroundHref,
      href: resolvedUrl.toString(),
      html: cachedHtml,
      isLoading: !cachedHtml,
      route,
    });

    if (options?.pushHistory || options?.replaceHistory) {
      writeOverlayHistoryState({
        historyMode: options?.pushHistory ? 'push' : 'replace',
        href: resolvedUrl.toString(),
        backgroundHref,
        pathname: route.pathname,
      });
    }

    try {
      const html = cachedHtml || (await fetchOverlayHtml(route.pathname, abortController.signal));
      setOverlayState((currentState) =>
        currentState?.route.pathname === route.pathname
          ? {
              ...currentState,
              html,
              isLoading: false,
            }
          : currentState,
      );
      window.requestAnimationFrame(() => {
        overlayScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        overlayCloseButtonRef.current?.focus();
      });
      return true;
    } catch {
      if (abortController.signal.aborted) {
        return true;
      }

      closeOverlayState({ restoreFocus: false });
      window.location.assign(resolvedUrl.toString());
      return false;
    }
  }

  useEffect(() => {
    const previousScrollRestoration =
      typeof window.history.scrollRestoration === 'string' ? window.history.scrollRestoration : null;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    renderedPageHrefRef.current = window.location.href;
    syncShellNavigationState(normalizeAppPathname(window.location.pathname));
    cacheDocumentSnapshot();
    markCurrentHistoryEntryForShellSection(window.location.pathname);

    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedEvent(event)) return;

      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;

      const mobileNavigationTrigger = eventTarget.closest<HTMLElement>('[data-app-shell-mobile-navigation-trigger]');
      if (mobileNavigationTrigger) {
        event.preventDefault();
        setIsMobileNavigationOpen((currentState) => !currentState);
        return;
      }

      const playerModalDismissTrigger = eventTarget.closest<HTMLElement>(
        '[data-music-streaming-service-embedded-player-modal-dismiss]',
      );
      if (playerModalDismissTrigger) {
        event.preventDefault();
        closePlayerModal();
        return;
      }

      const miniPlayerOpenTrigger = eventTarget.closest<HTMLElement>(
        '[data-music-streaming-service-embedded-player-mini-player-open]',
      );
      if (miniPlayerOpenTrigger) {
        event.preventDefault();
        reopenPlayerModal();
        return;
      }

      const miniPlayerStopTrigger = eventTarget.closest<HTMLElement>(
        '[data-music-streaming-service-embedded-player-mini-player-stop]',
      );
      if (miniPlayerStopTrigger) {
        event.preventDefault();
        stopPlayerSession({ restoreFocus: true });
        return;
      }

      const playerTriggerElement = eventTarget.closest<HTMLElement>('[data-music-streaming-service-embedded-player-trigger]');
      if (playerTriggerElement) {
        const playerElement =
          playerTriggerElement.closest<HTMLElement>('[data-music-streaming-service-embedded-player-card]') || playerTriggerElement;

        if (readPlayerProviders(playerElement).length > 0) {
          event.preventDefault();
          openPlayerModal(playerTriggerElement, playerElement);
        }
        return;
      }

      const scrollTargetTrigger = eventTarget.closest<HTMLElement>('[data-scroll-to-target]');
      if (scrollTargetTrigger) {
        const targetId = scrollTargetTrigger.dataset.scrollToTarget;
        if (targetId && scrollToTargetId(targetId, scrollTargetTrigger)) {
          event.preventDefault();
          return;
        }
      }

      const anchorElement = eventTarget.closest<HTMLAnchorElement>('a[href]');
      if (!anchorElement) return;

      const resolvedUrl = resolveInternalUrl(anchorElement);
      if (!resolvedUrl || resolvedUrl.origin !== window.location.origin) return;
      const isMobileNavigationLink = Boolean(anchorElement.closest('[data-app-shell-mobile-navigation]'));

      if (isMobileNavigationLink) {
        setIsMobileNavigationOpen(false);
      }

      if (isNavigableShellSectionAnchor(anchorElement)) {
        event.preventDefault();
        const navigationSource = resolveShellNavigationSource(anchorElement, isMobileNavigationLink);
        void openShellSectionHref(resolvedUrl.toString(), {
          historyMode: 'push',
          source: navigationSource,
          sourceElement: anchorElement,
        });
        return;
      }

      if (isNavigableOverlayAnchor(anchorElement)) {
        event.preventDefault();
        overlayTriggerElementRef.current = anchorElement;
        void openOverlayHref(resolvedUrl.toString(), {
          backgroundHref: overlayStateRef.current?.backgroundHref || window.location.href,
          pushHistory: true,
        });
        return;
      }

      if (overlayStateRef.current && !anchorElement.hasAttribute('data-astro-reload')) {
        event.preventDefault();
        collapseOverlayHistoryToBackground();
        window.location.assign(resolvedUrl.toString());
      }
    }

    function primeMusicAndOverlayPrefetch(eventTarget: EventTarget | null) {
      if (!(eventTarget instanceof Element)) return;

      const playerElement = eventTarget.closest<HTMLElement>('[data-music-streaming-service-embedded-player-card]');
      if (playerElement) {
        warmProviderOrigins(readPlayerProviders(playerElement));
      }

      const anchorElement = eventTarget.closest<HTMLAnchorElement>('a[href]');
      if (anchorElement) {
        if (isNavigableShellSectionAnchor(anchorElement)) {
          void prefetchShellSectionHref(anchorElement.href);
        }

        if (isNavigableOverlayAnchor(anchorElement)) {
          void prefetchOverlayHref(anchorElement.href);
        }
      }
    }

    function handleDocumentPointerOver(event: PointerEvent) {
      primeMusicAndOverlayPrefetch(event.target);
    }

    function handleDocumentFocusIn(event: FocusEvent) {
      primeMusicAndOverlayPrefetch(event.target);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;

      if (isPlayerModalOpen) {
        event.preventDefault();
        closePlayerModal();
        return;
      }

      if (overlayStateRef.current) {
        event.preventDefault();
        closeOverlayWithHistoryBack();
      }
    }

    function handlePopState() {
      setIsMobileNavigationOpen(false);
      const nextOverlayRoute = parseOverlayRoute(window.location.pathname);
      const nextShellSectionRoute = parseShellSectionRoute(window.location.pathname);
      const nextNormalizedPathname = normalizeAppPathname(window.location.pathname);
      const historyState = window.history.state || {};
      const hasCachedShellPage = shellPageCacheRef.current.has(nextNormalizedPathname);

      if (historyState.__appShellOverlay && nextOverlayRoute) {
        void openOverlayHref(window.location.href, {
          backgroundHref: historyState.backgroundHref || window.location.href,
          replaceHistory: false,
        });
        return;
      }

      if (nextShellSectionRoute) {
        void openShellSectionHref(window.location.href, {
          historyMode: 'none',
          source: 'history',
        });
        return;
      }

      if (hasCachedShellPage) {
        void restoreCachedShellPage(nextNormalizedPathname, {
          source: 'history',
        });
        return;
      }

      closeOverlayState({ restoreFocus: false });
    }

    function handleWindowBlur() {
      window.setTimeout(() => {
        const activeSession = activePlayerSessionRef.current;
        if (!activeSession || activeSession.status !== 'modal-open') return;

        if (document.activeElement === activeSession.iframeElement) {
          markActivePlayerSessionAsInteracted(activeSession.embedUrl);
        }
      }, 0);
    }

    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('pointerover', handleDocumentPointerOver);
    document.addEventListener('focusin', handleDocumentFocusIn);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('pointerover', handleDocumentPointerOver);
      document.removeEventListener('focusin', handleDocumentFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('blur', handleWindowBlur);
      clearRouteLoadingTimer();
      clearShellPageTransition();
      resetShellSectionTransitionState();
      overlayAbortControllerRef.current?.abort();
      shellPageAbortControllerRef.current?.abort();

      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
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

              return (
                <a
                  key={item.id}
                  href={linkAttributes.href}
                  target={linkAttributes.target}
                  rel={linkAttributes.rel}
                  data-astro-prefetch={linkAttributes.shouldPrefetch ? true : undefined}
                  aria-current={navigationIsActive ? 'page' : undefined}
                  data-services-navigation-link={isServicesNavigationItem ? 'true' : undefined}
                  className={[
                    'relative inline-flex min-h-11 items-center border-b border-border/70 py-1 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors',
                    isServicesNavigationItem
                      ? navigationIsActive
                        ? 'text-[var(--services-accent-active)]'
                        : 'text-[var(--services-accent)] hover:text-[var(--services-accent-hover)]'
                      : navigationIsActive
                        ? 'text-foreground'
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

      <div className="app-shell-route-loading-indicator" data-state={isRouteLoading ? 'open' : 'closed'} aria-hidden="true">
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
        <div className="app-shell-content-overlay__panel" role="dialog" aria-modal="true" aria-busy={overlayState?.isLoading ? 'true' : 'false'}>
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
                    aria-label={EMBED_PROVIDER_LABELS[providerId]}
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
                    <span className="accessibility-visually-hidden-text">{EMBED_PROVIDER_LABELS[providerId]}</span>
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
            <div ref={iframeFrameHostRef} className="music-streaming-service-embedded-player-modal-frame-host flex w-full justify-center"></div>
          </div>
        </div>
      </div>

        <div className="music-streaming-service-embedded-player-mini-player" data-state={isMiniPlayerVisible ? 'open' : 'closed'}>
        <div className="music-streaming-service-embedded-player-mini-player-copy">
          <p className="music-streaming-service-embedded-player-mini-player-provider uppercase text-muted-foreground">
            {miniPlayerStatusLabel}
          </p>
          <p className="music-streaming-service-embedded-player-mini-player-title text-foreground/92">{activePlayerTitle}</p>
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
        ? createPortal(<ArtistsRosterFilters key={activeShellPathname} pageKey={activeShellPathname} />, artistsRosterFiltersContainer)
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
    </>
  );
}
