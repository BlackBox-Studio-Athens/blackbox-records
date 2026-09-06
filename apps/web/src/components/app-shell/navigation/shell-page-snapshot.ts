import { normalizeAppPathname } from '@/lib/app-shell/routing';
import { sanitizeStoreListingPricePlaceholders } from '@/components/store/StoreListingPricePresentation';

export type ShellPageSnapshot = {
  canonicalHref: string;
  href: string;
  mainClassName: string;
  mainHtml: string;
  pageDescription: string;
  pathname: string;
  title: string;
};

type ShellPageSnapshotCache = {
  cacheSnapshot: (pageSnapshot: ShellPageSnapshot) => void;
};

export function sanitizeStoreCoverflowSnapshot(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-group]').forEach((groupElement) => {
    const initialMode = groupElement.dataset.storeCoverflowInitialMode === 'catalog' ? 'catalog' : 'preview';
    groupElement.dataset.storeCoverflowMode = initialMode;
    const initialPositionRatio = groupElement.dataset.storeCoverflowInitialPositionRatio;
    if (initialPositionRatio) {
      groupElement.style.setProperty('--store-coverflow-position-ratio', initialPositionRatio);
    } else {
      groupElement.style.removeProperty('--store-coverflow-position-ratio');
    }
    groupElement.removeAttribute('data-store-coverflow-ready');
    groupElement.removeAttribute('data-store-coverflow-reveal');
    groupElement.removeAttribute('data-store-coverflow-transitioning');
    groupElement.removeAttribute('data-store-coverflow-visited');
    groupElement.removeAttribute('aria-roledescription');

    const controlsElement = groupElement.querySelector<HTMLElement>('[data-store-coverflow-controls]');
    if (controlsElement) controlsElement.hidden = initialMode === 'catalog';
    groupElement
      .querySelectorAll<HTMLElement>(
        '[data-store-coverflow-previous], [data-store-coverflow-next], [data-store-coverflow-toggle]',
      )
      .forEach((buttonElement) => buttonElement.removeAttribute('aria-disabled'));
    const toggleElement = groupElement.querySelector<HTMLElement>('[data-store-coverflow-toggle]');
    if (toggleElement) {
      toggleElement.textContent =
        initialMode === 'preview' ? toggleElement.dataset.storeCoverflowViewAllLabel || '' : 'Show Coverflow';
      toggleElement.setAttribute('aria-expanded', initialMode === 'catalog' ? 'true' : 'false');
    }
    const statusElement = groupElement.querySelector<HTMLElement>('[data-store-coverflow-status]');
    if (statusElement) {
      statusElement.textContent =
        initialMode === 'preview' ? statusElement.dataset.storeCoverflowInitialLabel || '' : '';
      statusElement.hidden = initialMode === 'catalog';
    }
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-card]').forEach((cardElement) => {
    const initialPosition = cardElement.dataset.storeCoverflowInitialPosition;
    if (initialPosition) cardElement.dataset.storeCoverflowPosition = initialPosition;
    else cardElement.removeAttribute('data-store-coverflow-position');
    cardElement.removeAttribute('data-store-coverflow-selected');
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-initial-value]').forEach((valueElement) => {
    valueElement.textContent = valueElement.dataset.storeCoverflowInitialValue || '';
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-summary]').forEach((summaryElement) => {
    summaryElement.textContent = summaryElement.dataset.storeCoverflowInitialLabel || '';
  });
  root.querySelectorAll<HTMLDetailsElement>('[data-distro-format-disclosure]').forEach((detailsElement) => {
    detailsElement.open = false;
  });
  root.querySelectorAll<HTMLElement>('[data-distro-selected-format]').forEach((element) => {
    element.removeAttribute('data-distro-selected-format');
  });
  root.querySelectorAll<HTMLElement>('[data-distro-format-current]').forEach((element) => {
    element.removeAttribute('data-distro-format-current');
    element.removeAttribute('aria-current');
  });
  root.querySelectorAll<HTMLElement>('[data-distro-format-link]').forEach((element) => {
    const isAllFormats = element.dataset.distroFormatKey === 'all';
    element.toggleAttribute('data-distro-format-current', isAllFormats);
    if (isAllFormats) element.setAttribute('aria-current', 'true');
    else element.removeAttribute('aria-current');
  });
  root.querySelectorAll<HTMLElement>('[data-distro-format-summary-current]').forEach((element) => {
    element.textContent = element.dataset.distroFormatSummaryInitialLabel || 'All formats';
  });
}

export function readDocumentShellPageSnapshot(
  targetDocument: Document,
  href: string,
  currentHref = window.location.href,
): ShellPageSnapshot | null {
  const mainElement =
    targetDocument.querySelector<HTMLElement>('main[data-app-shell-main]') ||
    targetDocument.querySelector<HTMLElement>('main#main');

  if (!mainElement) return null;

  const mainElementClone = mainElement.cloneNode(true) as HTMLElement;
  mainElementClone.querySelectorAll<HTMLElement>('[data-artists-roster-filters]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-distro-search]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-distro-search-hidden]').forEach((hiddenElement) => {
    hiddenElement.removeAttribute('data-distro-search-hidden');
  });
  sanitizeStoreCoverflowSnapshot(mainElementClone);
  sanitizeStoreListingPricePlaceholders(mainElementClone);
  mainElementClone.querySelectorAll<HTMLElement>('[data-services-inquiry-form]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });

  const resolvedUrl = new URL(href, currentHref);
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

export function cacheDocumentShellPageSnapshot({
  currentHref,
  href,
  shellPageCache,
  targetDocument = document,
}: {
  currentHref?: string;
  href: string;
  shellPageCache: ShellPageSnapshotCache;
  targetDocument?: Document;
}) {
  const pageSnapshot = readDocumentShellPageSnapshot(targetDocument, href, currentHref);
  if (!pageSnapshot) return null;

  shellPageCache.cacheSnapshot(pageSnapshot);
  return pageSnapshot;
}

export function applyDocumentShellPageSnapshot({
  getMainElement = () => document.querySelector<HTMLElement>('main[data-app-shell-main]'),
  onHrefApplied,
  onPathnameApplied,
  pageSnapshot,
  targetDocument,
}: {
  getMainElement?: () => HTMLElement | null;
  onHrefApplied?: (href: string) => void;
  onPathnameApplied?: (pathname: string) => void;
  pageSnapshot: ShellPageSnapshot;
  targetDocument?: Document;
}) {
  const mainElement = getMainElement();
  if (!mainElement) return false;

  mainElement.className = pageSnapshot.mainClassName;
  mainElement.innerHTML = pageSnapshot.mainHtml;
  onHrefApplied?.(pageSnapshot.href);
  updateDocumentMetadata(pageSnapshot, targetDocument ?? document);
  onPathnameApplied?.(pageSnapshot.pathname);
  return true;
}

export function updateDocumentMetadata(pageSnapshot: ShellPageSnapshot, targetDocument: Document = document) {
  if (pageSnapshot.title) {
    targetDocument.title = pageSnapshot.title;
  }

  const descriptionMetaElement = targetDocument.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionMetaElement && pageSnapshot.pageDescription) {
    descriptionMetaElement.content = pageSnapshot.pageDescription;
  }

  const canonicalLinkElement = targetDocument.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonicalLinkElement && pageSnapshot.canonicalHref) {
    canonicalLinkElement.href = pageSnapshot.canonicalHref;
  }
}
