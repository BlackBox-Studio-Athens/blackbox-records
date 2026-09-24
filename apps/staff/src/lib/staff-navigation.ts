import { DISTRO_GROUP_VALUES } from '@blackbox/content-model';
import { contentSections, singletonContentSections, type ContentSection } from './content-sections';

const namespace = 'blackboxStaff';
const handoffKey = 'blackbox-staff-handoff';
type Origin = { position: number; url: string };
type Navigation = Origin & {
  origin?: Origin;
  pages?: string[];
  row?: string | undefined;
  scroll?: number[] | undefined;
};
const scrollSelectors = ['#main', '[data-staff-scroll]'];
let currentEntry: { history: History; entry: Navigation } | undefined;

export function staffTarget(value: string, origin: string): string | null {
  if (!value || value.length > 8192 || value.startsWith('//')) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || url.username || url.password) return null;
    const keys: Record<string, string[]> = {
      '/': [],
      '/content/': ['collection', 'id', 'new', 'view', 'q', 'area', 'format', 'sort', 'cursor', 'tab', 'history'],
      '/items/': ['variantId', 'tab'],
      '/items/new/': ['kind', 'collection', 'id'],
      '/stock/': ['variantId', 'q', 'area', 'format', 'cursor'],
      '/orders/': ['checkoutSessionId', 'status', 'q', 'notification', 'cursor'],
      '/review/': ['q', 'scope', 'cursor'],
    };
    const allowed = keys[url.pathname];
    if (!allowed) return null;
    url.searchParams.delete('returnTo');
    const enums: Record<string, readonly string[]> = {
      collection: Object.keys(contentSections),
      view: ['media', 'footer'],
      area: url.pathname === '/stock/' ? ['all', 'release', 'distro', 'merch'] : ['all', 'distro', 'merch'],
      format: DISTRO_GROUP_VALUES,
      sort: ['title', 'updated'],
      tab: ['details', 'selling', 'stock'],
      kind: ['release', 'distro', 'merch'],
      scope: ['all', 'website', 'catalog'],
      new: ['1'],
      history: ['1'],
      status: ['paid', 'not_paid', 'needs_review', 'pending_payment'],
      notification: ['pending', 'needs_review'],
    };
    for (const [key, entry] of url.searchParams) {
      if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1) return null;
      if (entry.length > (key === 'cursor' ? 2048 : key === 'q' ? 200 : 128)) return null;
      if (enums[key] && entry && !enums[key].includes(entry)) return null;
      if (['id', 'variantId', 'checkoutSessionId'].includes(key) && !/^[\w-]{1,128}$/.test(entry)) return null;
    }
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export function staffParent(path: string): { url: string; label: string } {
  const url = new URL(path, 'https://staff.invalid');
  const section = url.searchParams.get('collection') as ContentSection;
  if (
    url.pathname === '/content/' &&
    section &&
    (url.searchParams.has('id') || url.searchParams.has('new') || singletonContentSections.includes(section))
  ) {
    if (['newsletter', 'navigation', 'socials'].includes(section))
      return { url: '/content/?view=footer', label: 'Navigation & footer' };
    if (singletonContentSections.includes(section)) return { url: '/content/', label: 'Pages' };
    return { url: `/content/?collection=${section}`, label: contentSections[section] };
  }
  if (url.pathname === '/items/new/') {
    const kind = url.searchParams.get('kind');
    return kind === 'distro' || kind === 'merch'
      ? { url: `/content/?collection=distro&area=${kind}`, label: 'Distro and merch' }
      : { url: '/content/?collection=releases', label: 'Releases' };
  }
  if (url.pathname === '/stock/' && url.searchParams.has('variantId')) return { url: '/stock/', label: 'Inventory' };
  if (url.pathname === '/orders/' && url.searchParams.has('checkoutSessionId'))
    return { url: '/orders/', label: 'Orders' };
  return { url: '/', label: 'Overview' };
}

export function staffLabel(path: string): string {
  const url = new URL(path, 'https://staff.invalid');
  if (url.pathname === '/content/') {
    if (url.searchParams.get('view') === 'media') return 'Images';
    if (url.searchParams.get('view') === 'footer') return 'Navigation & footer';
    const section = url.searchParams.get('collection') as ContentSection;
    return contentSections[section] ?? 'Pages';
  }
  return (
    (
      {
        '/': 'Overview',
        '/review/': 'Review changes',
        '/stock/': 'Inventory',
        '/orders/': 'Orders',
        '/items/new/': 'Item setup',
      } as Record<string, string>
    )[url.pathname] ?? 'Catalog'
  );
}

function validOrigin(value: unknown): value is Origin {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Origin;
  return (
    Number.isSafeInteger(entry.position) &&
    entry.position >= 0 &&
    typeof entry.url === 'string' &&
    staffTarget(entry.url, location.origin) === entry.url
  );
}

export function staffEntry(): Navigation {
  const value = history.state?.[namespace] as Navigation | undefined;
  if (validOrigin(value)) {
    currentEntry = { history, entry: value };
    return value;
  }
  // The lazy EmDash editor initializes its router by replacing history state.
  // Retain only this document's current navigation entry, never draft content.
  if (currentEntry?.history === history && currentEntry.entry.url === staffTarget(location.href, location.origin)) {
    saveStaffEntry(currentEntry.entry);
    return currentEntry.entry;
  }
  const entry: Navigation = {
    position: 0,
    url: staffTarget(location.href, location.origin) ?? '/',
  };
  try {
    const raw = sessionStorage.getItem(handoffKey);
    sessionStorage.removeItem(handoffKey);
    const handoff = raw && raw.length <= 16384 ? JSON.parse(raw) : null;
    if (handoff?.destination === location.pathname + location.search && validOrigin(handoff.origin)) {
      entry.origin = handoff.origin;
      entry.position = handoff.origin.position + 1;
    }
  } catch {
    /* Explicit parent links still work without optional storage. */
  }
  saveStaffEntry(entry);
  return entry;
}

function saveStaffEntry(entry: Navigation, url = location.href, push = false): boolean {
  try {
    history[push ? 'pushState' : 'replaceState']({ ...history.state, [namespace]: entry }, '', url);
    currentEntry = { history, entry };
    return true;
  } catch {
    return false;
  }
}

export function staffPages(cursor: string): string[] {
  const pages = staffEntry().pages;
  return Array.isArray(pages) &&
    pages.length > 0 &&
    pages.length <= 1000 &&
    pages.every((page) => typeof page === 'string' && page.length <= 2048) &&
    pages.at(-1) === cursor
    ? pages
    : [cursor];
}

export function rememberStaffPosition() {
  const entry = staffEntry();
  const row = document.activeElement?.closest<HTMLElement>('[data-staff-row]')?.dataset.staffRow;
  saveStaffEntry({
    ...entry,
    row: row ?? entry.row,
    scroll: [
      ...scrollSelectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((node) => node.scrollTop)),
      window.scrollY,
    ],
  });
}

export function restoreStaffPosition(fallback?: HTMLElement | null) {
  const entry = staffEntry();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const row =
        typeof entry.row === 'string' && entry.row.length <= 256
          ? [...document.querySelectorAll<HTMLElement>('[data-staff-row]')].find(
              (node) => node.dataset.staffRow === entry.row,
            )
          : null;
      (row ?? fallback)?.focus({ preventScroll: true });
      if (
        !Array.isArray(entry.scroll) ||
        entry.scroll.length > 10 ||
        !entry.scroll.every((n) => Number.isFinite(n) && n >= 0)
      )
        return;
      const nodes = scrollSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
      nodes.forEach((node, index) => {
        node.scrollTop = entry.scroll![index] ?? 0;
      });
      window.scrollTo(0, entry.scroll.at(-1) ?? 0);
    });
  });
}

export function writeStaffLocation(url: string, options: { push?: boolean; task?: boolean; pages?: string[] } = {}) {
  const previous = staffEntry();
  const target = staffTarget(url, location.origin);
  if (!target) return;
  const push = !!options.push && target !== previous.url;
  const entry: Navigation = {
    ...previous,
    url: target,
    ...(push ? { position: previous.position + 1, row: undefined, scroll: undefined } : {}),
    ...(options.task && push ? { origin: { position: previous.position, url: previous.url } } : {}),
    ...(options.pages ? { pages: options.pages } : {}),
  };
  if (!saveStaffEntry(entry, url, push)) location.replace(url);
  window.dispatchEvent(new Event('staff:navigation'));
}

export function staffReturn() {
  const entry = staffEntry();
  const origin = validOrigin(entry.origin) && entry.origin.position < entry.position ? entry.origin : undefined;
  const explicit = staffTarget(new URLSearchParams(location.search).get('returnTo') ?? '', location.origin);
  const fallback = staffParent(location.pathname + location.search);
  const url = origin?.url ?? explicit ?? fallback.url;
  return {
    url,
    label: origin || explicit ? staffLabel(url) : fallback.label,
    delta: origin ? origin.position - entry.position : 0,
  };
}

export function returnStaffTask() {
  const target = staffReturn();
  if (target.delta) history.go(target.delta);
  else location.replace(target.url);
}

export function staffLink(href: string): string {
  const target = staffTarget(href, location.origin);
  if (!target) return href;
  rememberStaffPosition();
  const entry = staffEntry();
  const destination = new URL(target, location.origin);
  destination.searchParams.set('returnTo', entry.url);
  const path = destination.pathname + destination.search;
  try {
    sessionStorage.setItem(
      handoffKey,
      JSON.stringify({ destination: path, origin: { position: entry.position, url: entry.url } }),
    );
  } catch {
    /* The validated returnTo link remains a usable fallback. */
  }
  return path;
}

export function replaceStaffTask(href: string) {
  const entry = staffEntry();
  if (validOrigin(entry.origin)) {
    try {
      sessionStorage.setItem(handoffKey, JSON.stringify({ destination: href, origin: entry.origin }));
    } catch {
      /* The explicit return target survives resolution without storage. */
    }
  }
  location.replace(href);
}

export function followStaffHistory(restore: () => void, guard?: () => boolean | Promise<boolean>) {
  let current = staffEntry();
  let pending = false;
  let rolledBack: (() => void) | undefined;
  let replay = false;
  const remember = () => {
    if (!pending) current = staffEntry();
  };
  const followAsync = async () => {
    const target = staffEntry();
    if (pending) {
      const distance = current.position - target.position;
      if (distance) history.go(distance);
      else {
        rolledBack?.();
        rolledBack = undefined;
      }
      return;
    }
    const decision = replay ? true : (guard?.() ?? true);
    replay = false;
    if (decision !== true) {
      pending = true;
      const distance = current.position - target.position;
      const rollback = distance
        ? new Promise<void>((resolve) => {
            rolledBack = resolve;
            history.go(distance);
          })
        : Promise.resolve();
      if (!distance) saveStaffEntry(current, current.url);
      const [allowed] = await Promise.all([decision, rollback]);
      pending = false;
      if (allowed) {
        if (distance) {
          replay = true;
          history.go(-distance);
        } else {
          saveStaffEntry(target, target.url);
          current = target;
          restore();
        }
      }
      window.dispatchEvent(new Event('staff:navigation'));
      return;
    }
    current = staffEntry();
    restore();
    window.dispatchEvent(new Event('staff:navigation'));
  };
  const onPopState = () => void followAsync();
  window.addEventListener('popstate', onPopState);
  window.addEventListener('staff:navigation', remember);
  return () => {
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener('staff:navigation', remember);
  };
}
