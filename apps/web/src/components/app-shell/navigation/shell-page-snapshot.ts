import { normalizeAppPathname } from '@/components/app-shell/routing';
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

// Astro hydrates an island only while it has `ssr`, and removes it once hydrated. Remember each island's markup from
// before any interaction so a restored snapshot hydrates afresh instead of staying inert or matching edited DOM.
const islandServerMarkup = new WeakMap<Element, string>();

function rememberIslandServerMarkup(root: ParentNode) {
  root.querySelectorAll('astro-island').forEach((island) => {
    if (!islandServerMarkup.has(island)) islandServerMarkup.set(island, island.innerHTML);
  });
}

function restoreIslandServerMarkup(liveRoot: ParentNode, cloneRoot: ParentNode) {
  const liveIslands = liveRoot.querySelectorAll('astro-island');
  cloneRoot.querySelectorAll('astro-island').forEach((island, index) => {
    const serverMarkup = islandServerMarkup.get(liveIslands[index]!);
    if (serverMarkup !== undefined) island.innerHTML = serverMarkup;
    island.setAttribute('ssr', '');
  });
}

export function sanitizeStoreCoverflowSnapshot(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-group]').forEach((groupElement) => {
    groupElement.dataset.storeCoverflowMode = 'catalog';
    groupElement
      .querySelector<HTMLElement>('[data-store-coverflow-disclosure-rail]')
      ?.style.removeProperty('--store-coverflow-position-ratio');
    groupElement.removeAttribute('data-store-coverflow-ready');
    groupElement.removeAttribute('data-store-coverflow-reveal');
    groupElement.removeAttribute('data-store-coverflow-transitioning');
    groupElement.removeAttribute('data-store-coverflow-visited');
    groupElement.removeAttribute('aria-roledescription');

    const controlsElement = groupElement.querySelector<HTMLElement>('[data-store-coverflow-controls]');
    if (controlsElement) controlsElement.hidden = true;
    groupElement
      .querySelectorAll<HTMLElement>(
        '[data-store-coverflow-previous], [data-store-coverflow-next], [data-store-coverflow-toggle], [data-store-coverflow-preview]',
      )
      .forEach((buttonElement) => buttonElement.removeAttribute('aria-disabled'));
    groupElement.querySelector('[data-store-coverflow-toggle]')?.setAttribute('aria-pressed', 'true');
    groupElement.querySelector('[data-store-coverflow-preview]')?.setAttribute('aria-pressed', 'false');
    const status = groupElement.querySelector<HTMLElement>('[data-store-coverflow-status]');
    if (status) {
      status.textContent = '';
      status.hidden = true;
    }
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-card]').forEach((cardElement) => {
    cardElement.removeAttribute('data-store-coverflow-position');
    cardElement.removeAttribute('data-store-coverflow-selected');
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-initial-value]').forEach((valueElement) => {
    valueElement.textContent = valueElement.dataset.storeCoverflowInitialValue || '';
  });
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-summary]').forEach((summaryElement) => {
    summaryElement.textContent = summaryElement.dataset.storeCoverflowInitialLabel || '';
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
  rememberIslandServerMarkup(mainElement);

  // A dialog can temporarily hide descendants. Keep the existing clean snapshot
  // instead of persisting its accessibility mask into the next visit.
  if (mainElement.querySelectorAll('[data-aria-hidden]').length > 0) return null;

  // Clone into an inert document: a clone in the live document makes Chrome fetch every lazy image it holds.
  const mainElementClone = targetDocument
    .createElement('template')
    .content.ownerDocument.importNode(mainElement, true) as HTMLElement;
  restoreIslandServerMarkup(mainElement, mainElementClone);
  mainElementClone.querySelectorAll<HTMLElement>('[data-artists-roster-filters]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-distro-search]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-store-search]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-store-search-active]').forEach((element) => {
    element.removeAttribute('data-store-search-active');
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-store-artists]').forEach((element) => {
    element.innerHTML = '';
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-store-result-total]').forEach((element) => {
    element.hidden = false;
  });
  mainElementClone.querySelectorAll<HTMLImageElement>('img[data-store-grid-sizes]').forEach((image) => {
    image.sizes = image.dataset.storeGridSizes!;
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-distro-search-hidden]').forEach((hiddenElement) => {
    hiddenElement.removeAttribute('data-distro-search-hidden');
  });
  sanitizeStoreCoverflowSnapshot(mainElementClone);
  sanitizeStoreListingPricePlaceholders(mainElementClone);
  mainElementClone.querySelectorAll<HTMLElement>('[data-store-preview-ready]').forEach((image) => {
    image.removeAttribute('data-store-preview-ready');
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-services-inquiry-form]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  // A copy button's two-second feedback timer belongs to the live element, so the cached copy starts idle.
  mainElementClone.querySelectorAll<HTMLElement>('[data-copied]').forEach((button) => {
    button.removeAttribute('data-copied');
  });
  mainElementClone.querySelectorAll<HTMLElement>('[data-copy-status]').forEach((status) => {
    status.textContent = '';
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
  // Islands load their component asynchronously, so this still reads the snapshot's server markup.
  rememberIslandServerMarkup(mainElement);
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
