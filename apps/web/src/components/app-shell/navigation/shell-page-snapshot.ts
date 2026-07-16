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

export function sanitizeDistroCoverflowSnapshot(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-distro-coverflow-group]').forEach((groupElement) => {
    groupElement.dataset.distroCoverflowMode = 'preview';
    groupElement.removeAttribute('data-distro-coverflow-ready');
    groupElement.removeAttribute('data-distro-coverflow-reveal');
    groupElement.removeAttribute('data-distro-coverflow-transitioning');
  });
  root.querySelectorAll<HTMLElement>('[data-distro-coverflow-card]').forEach((cardElement) => {
    const initialPosition = cardElement.dataset.distroCoverflowInitialPosition;
    if (initialPosition) cardElement.dataset.distroCoverflowPosition = initialPosition;
    else cardElement.removeAttribute('data-distro-coverflow-position');
    cardElement.removeAttribute('data-distro-coverflow-selected');
  });
  root.querySelectorAll<HTMLElement>('[data-distro-coverflow-controls]').forEach((controlsElement) => {
    controlsElement.hidden = false;
  });
  root
    .querySelectorAll<HTMLElement>(
      '[data-distro-coverflow-previous], [data-distro-coverflow-next], [data-distro-coverflow-toggle]',
    )
    .forEach((buttonElement) => {
      buttonElement.removeAttribute('aria-disabled');
    });
  root.querySelectorAll<HTMLElement>('[data-distro-coverflow-toggle]').forEach((buttonElement) => {
    buttonElement.textContent = buttonElement.dataset.distroCoverflowViewAllLabel || '';
  });
  root.querySelectorAll<HTMLElement>('[data-distro-coverflow-status]').forEach((statusElement) => {
    statusElement.textContent = statusElement.dataset.distroCoverflowInitialLabel || '';
    statusElement.hidden = false;
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
  sanitizeDistroCoverflowSnapshot(mainElementClone);
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
