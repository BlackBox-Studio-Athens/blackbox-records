import { normalizeAppPathname } from '@/components/app-shell/routing';
import {
  sanitizeStoreArtistChrome,
  sanitizeStoreListingPricePlaceholders,
} from '@/components/store/StoreListingPricePresentation';
import { sanitizeReleaseCatalogPresentation } from '@/components/editorial/release-presentation';

export type ShellPageSnapshot = {
  canonicalHref: string;
  href: string;
  mainClassName: string;
  // Sanitized children of main, owned by an inert document. Apply a clone, never the fragment itself: a snapshot is
  // applied again on every cached return.
  mainContent: DocumentFragment;
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
    if (serverMarkup !== undefined) {
      island.innerHTML = serverMarkup;
      // The clone's inert document parses with scripting disabled; keep noscript content as text, as the live page has
      // it, so inserting the snapshot cannot fetch a noscript image.
      island.querySelectorAll('noscript').forEach((element) => {
        element.textContent = element.innerHTML;
      });
    }
    island.setAttribute('ssr', '');
  });
}

export function sanitizeStoreCoverflowSnapshot(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-store-coverflow-group]').forEach((groupElement) => {
    groupElement.dataset.storeCoverflowMode = 'catalog';
    groupElement.removeAttribute('data-store-coverflow-ready');
    groupElement.removeAttribute('data-store-coverflow-reveal');
    groupElement.removeAttribute('data-store-coverflow-transitioning');
    groupElement.removeAttribute('data-store-coverflow-visited');
    groupElement.removeAttribute('aria-roledescription');

    const controlsElement = groupElement.querySelector<HTMLElement>('[data-store-coverflow-controls]');
    if (controlsElement) {
      controlsElement.hidden = false;
      controlsElement.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        button.disabled = true;
      });
    }
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
    const listen = groupElement.querySelector<HTMLButtonElement>('[data-store-coverflow-listen]');
    if (listen) {
      for (const { name } of [...listen.attributes]) {
        if (name.startsWith('data-music-') && name !== 'data-music-streaming-service-embedded-player-trigger') {
          listen.removeAttribute(name);
        }
      }
      listen.hidden = true;
      listen.disabled = false;
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

function queryShellMainElement(targetDocument: Document) {
  return (
    targetDocument.querySelector<HTMLElement>('main[data-app-shell-main]') ||
    targetDocument.querySelector<HTMLElement>('main#main')
  );
}

// Cheap part of a snapshot, kept synchronous at mount: it records island markup before any interaction can change it,
// so the full snapshot can wait for an idle period.
export function rememberDocumentIslandServerMarkup(targetDocument: Document = document) {
  const mainElement = queryShellMainElement(targetDocument);
  if (mainElement) rememberIslandServerMarkup(mainElement);
}

// Tuning knob: longest the mount snapshot waits for an idle period before it runs anyway.
export const SHELL_IDLE_SNAPSHOT_TIMEOUT_MS = 2000;

type IdleTaskScheduler = Pick<Window, 'clearTimeout' | 'setTimeout'> &
  Partial<Pick<Window, 'cancelIdleCallback' | 'requestIdleCallback'>>;

// Runs a task when the main thread is idle (Safari lacks requestIdleCallback, so it falls back to a short timer).
// Returns a cancel function.
export function scheduleIdleShellTask(task: () => void, scheduler: IdleTaskScheduler = window) {
  if (typeof scheduler.requestIdleCallback === 'function') {
    const handle = scheduler.requestIdleCallback(task, { timeout: SHELL_IDLE_SNAPSHOT_TIMEOUT_MS });
    return () => scheduler.cancelIdleCallback?.(handle);
  }

  const handle = scheduler.setTimeout(task, 200);
  return () => scheduler.clearTimeout(handle);
}

// Restores the server-rendered state of a snapshot's main element; `root` is a copy that no page listener touches.
function sanitizeShellMainSnapshot(root: ParentNode) {
  // This country-gated island has empty server markup, even if it resolved before the shell remembered it.
  root.querySelectorAll('.international-order-notice').forEach((notice) => notice.remove());
  root.querySelectorAll<HTMLElement>('[data-newsletter-form]').forEach((placeholder) => {
    placeholder.replaceChildren();
  });
  root.querySelectorAll<HTMLElement>('[data-artists-roster-filters]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  root.querySelectorAll<HTMLElement>('[data-store-search-toolbar]').forEach((toolbar) => {
    toolbar.removeAttribute('data-store-search-ready');
    const input = toolbar.querySelector<HTMLInputElement>('input[type="search"]');
    if (input) {
      input.disabled = true;
      input.value = '';
      input.removeAttribute('value');
    }
    const summary = toolbar.querySelector<HTMLElement>('[data-store-search-summary]');
    if (summary) summary.textContent = '';
    toolbar.querySelectorAll<HTMLButtonElement>('button:not([data-store-artists-trigger])').forEach((button) => {
      button.disabled = true;
      button.hidden = true;
    });
  });
  root.querySelectorAll<HTMLElement>('[data-store-search-active]').forEach((element) => {
    element.removeAttribute('data-store-search-active');
  });
  sanitizeStoreArtistChrome(root);
  root.querySelectorAll<HTMLElement>('[data-store-empty-results], [data-store-result-total]').forEach((element) => {
    element.hidden = true;
  });
  root.querySelectorAll<HTMLElement>('[data-store-gallery-live]').forEach((element) => {
    element.remove();
  });
  root.querySelectorAll<HTMLElement>('[data-store-gallery-fallback]').forEach((element) => {
    element.hidden = false;
  });
  root.querySelectorAll<HTMLImageElement>('img[data-store-grid-sizes]').forEach((image) => {
    image.sizes = image.dataset.storeGridSizes!;
  });
  root.querySelectorAll<HTMLElement>('[data-distro-search-hidden]').forEach((hiddenElement) => {
    hiddenElement.removeAttribute('data-distro-search-hidden');
  });
  sanitizeStoreCoverflowSnapshot(root);
  sanitizeStoreListingPricePlaceholders(root);
  sanitizeReleaseCatalogPresentation(root);
  root.querySelectorAll<HTMLElement>('[data-store-preview-ready]').forEach((image) => {
    image.removeAttribute('data-store-preview-ready');
  });
  root.querySelectorAll<HTMLElement>('[data-services-inquiry-form]').forEach((placeholderElement) => {
    placeholderElement.innerHTML = '';
  });
  // A copy button's two-second feedback timer belongs to the live element, so the cached copy starts idle.
  root.querySelectorAll<HTMLElement>('[data-copied]').forEach((button) => {
    button.removeAttribute('data-copied');
  });
  root.querySelectorAll<HTMLElement>('[data-copy-status]').forEach((status) => {
    status.textContent = '';
  });
}

// A clone keeps what a visitor typed or picked in a form control; markup holds only the defaults. Re-create each
// remaining control from its attributes so a restored page starts from its server state.
// Parses through a template rather than the outerHTML setter, which throws for a control whose parent is the
// fragment itself (a control placed directly in main).
function resetClonedFormControls(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('input, select, textarea').forEach((control) => {
    const holder = control.ownerDocument.createElement('template');
    holder.innerHTML = control.outerHTML;
    control.replaceWith(holder.content);
  });
}

// DOMParser parses with scripting disabled, unlike the live document. Make parsed main behave as markup set through
// innerHTML did: a script stays inert (fragment parsing marks it already started, whereas some engines run a
// DOMParser script once it is inserted into the page) and noscript content stays text.
function matchLiveFragmentParsing(root: Element) {
  root.querySelectorAll('noscript').forEach((element) => {
    element.textContent = element.innerHTML;
  });
  root.querySelectorAll('script').forEach((script) => {
    const holder = script.ownerDocument.createElement('div');
    holder.innerHTML = script.outerHTML;
    script.replaceWith(...holder.childNodes);
  });
}

// Sanitizes `contentRoot`, a main element in an inert document, and moves its children into the snapshot.
function createShellPageSnapshot(
  targetDocument: Document,
  mainElement: HTMLElement,
  contentRoot: HTMLElement,
  href: string,
  currentHref: string,
): ShellPageSnapshot {
  sanitizeShellMainSnapshot(contentRoot);
  const mainContent = contentRoot.ownerDocument.createDocumentFragment();
  mainContent.append(...contentRoot.childNodes);

  const resolvedUrl = new URL(href, currentHref);
  const canonicalHref =
    targetDocument.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || resolvedUrl.toString();
  const pageDescription = targetDocument.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || '';

  return {
    canonicalHref,
    href: resolvedUrl.toString(),
    mainClassName: mainElement.getAttribute('class') || '',
    mainContent,
    pageDescription,
    pathname: normalizeAppPathname(resolvedUrl.pathname),
    title: targetDocument.title,
  };
}

// Snapshot of the page the shell renders. Live main stays untouched: the snapshot holds a sanitized clone.
export function readDocumentShellPageSnapshot(
  targetDocument: Document,
  href: string,
  currentHref = window.location.href,
): ShellPageSnapshot | null {
  const mainElement = queryShellMainElement(targetDocument);

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
  const snapshot = createShellPageSnapshot(targetDocument, mainElement, mainElementClone, href, currentHref);
  resetClonedFormControls(snapshot.mainContent);
  return snapshot;
}

// Snapshot of a fetched page that DOMParser parsed. That document is inert and belongs to the caller, so main is
// sanitized in place and its nodes become the snapshot: the page is parsed once and never cloned or serialized.
export function readParsedShellPageSnapshot(
  parsedDocument: Document,
  href: string,
  currentHref = window.location.href,
): ShellPageSnapshot | null {
  const mainElement = queryShellMainElement(parsedDocument);

  if (!mainElement) return null;
  if (mainElement.querySelectorAll('[data-aria-hidden]').length > 0) return null;

  matchLiveFragmentParsing(mainElement);
  const snapshot = createShellPageSnapshot(parsedDocument, mainElement, mainElement, href, currentHref);
  // The fragment keeps its owner document alive; release the rest of the fetched page.
  parsedDocument.replaceChildren();
  return snapshot;
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
  // The clone is made in the snapshot's inert document, so it fetches nothing; inserting adopts it into the page,
  // where loading="lazy" applies as usual. The cached fragment stays intact for the next return.
  mainElement.replaceChildren(pageSnapshot.mainContent.cloneNode(true));
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
