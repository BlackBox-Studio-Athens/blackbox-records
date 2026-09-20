import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  ChevronLeft,
  Disc3,
  Globe,
  House,
  History,
  ImageIcon,
  Menu,
  PanelLeft,
  Plus,
  ReceiptText,
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { getInternalStockApiBaseUrl } from '../lib/backend/internal-stock-api';
import { publicationHistoryEvent, type PublicationHistoryFilter } from '../lib/publication-history-events';

const PublicationHistory = lazy(() => import('./content/PublicationHistory'));

const areas = [
  { label: 'Overview', href: '/', icon: House, color: 'overview', links: [] },
  {
    label: 'Catalog',
    href: '/content/?collection=releases',
    icon: Disc3,
    color: 'catalog',
    links: [
      { label: 'Artists', href: '/content/?collection=artists' },
      { label: 'Releases', href: '/content/?collection=releases' },
      { label: 'Distro & merch', href: '/content/?collection=distro' },
    ],
  },
  {
    label: 'Website',
    href: '/content/',
    icon: Globe,
    color: 'website',
    links: [
      { label: 'Pages', href: '/content/' },
      { label: 'News', href: '/content/?collection=news' },
      { label: 'Navigation & footer', href: '/content/?view=footer' },
      { label: 'Label details', href: '/content/?collection=settings' },
    ],
  },
  { label: 'Images', href: '/content/?view=media', icon: ImageIcon, color: 'images', links: [] },
  { label: 'Stock', href: '/stock/', icon: Boxes, color: 'stock', links: [] },
  { label: 'Orders', href: '/orders/', icon: ReceiptText, color: 'orders', links: [] },
];
const additions = [
  { label: 'Artist', href: '/content/?collection=artists&new=1' },
  { label: 'Release', href: '/items/new/?kind=release' },
  { label: 'Distro', href: '/items/new/?kind=distro' },
  { label: 'Merch', href: '/items/new/?kind=merch' },
];

export default function StaffShell({
  children,
  title,
  environment,
}: {
  children: ReactNode;
  title: string;
  environment?: string;
}) {
  const [location, setLocation] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hiddenAreas, setHiddenAreas] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<PublicationHistoryFilter>({});
  const historyFocus = useRef<HTMLElement | null>(null);
  const historyUrl = useRef('');
  const base = getInternalStockApiBaseUrl();
  useEffect(() => {
    const update = () => setLocation(window.location.pathname + window.location.search);
    update();
    try {
      setHiddenAreas(
        ['Catalog', 'Website'].filter((area) => localStorage.getItem(`staff-navigation:${area}`) === 'hidden'),
      );
    } catch {
      /* Navigation remains available when storage is disabled. */
    }
    window.addEventListener('popstate', update);
    window.addEventListener('staff:navigation', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('staff:navigation', update);
    };
  }, []);
  function showHistory(filter: PublicationHistoryFilter = {}, trigger?: HTMLElement | null) {
    historyFocus.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setHistoryFilter(filter);
    setMenuOpen(false);
    window.setTimeout(() => setHistoryOpen(true), 0);
  }
  function closeHistory(open: boolean) {
    setHistoryOpen(open);
    if (!open) {
      const trigger = historyFocus.current;
      window.requestAnimationFrame(() => trigger?.focus());
    }
  }
  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<PublicationHistoryFilter>).detail ?? {};
      showHistory(detail);
    };
    window.addEventListener(publicationHistoryEvent, open);
    return () => window.removeEventListener(publicationHistoryEvent, open);
  }, []);
  useEffect(() => {
    const url = new URL(location || '/', window.location.origin);
    if (url.searchParams.get('history') !== '1' || historyUrl.current === url.href) return;
    historyUrl.current = url.href;
    const collection = url.searchParams.get('collection');
    const recordId = url.searchParams.get('id');
    showHistory({ ...(collection ? { collection } : {}), ...(recordId ? { recordId } : {}) });
  }, [location]);
  const url = new URL(location || '/', 'https://staff.invalid');
  const section =
    url.searchParams.get('collection') ??
    (url.pathname.startsWith('/items/')
      ? ['distro', 'merch'].includes(url.searchParams.get('kind') ?? '')
        ? 'distro'
        : 'releases'
      : null);
  const view = url.searchParams.get('view');
  const area = areas.find(
    (entry) =>
      entry.color ===
      (url.pathname.startsWith('/orders/')
        ? 'orders'
        : url.pathname.startsWith('/stock/')
          ? 'stock'
          : view === 'media'
            ? 'images'
            : ['artists', 'releases', 'distro'].includes(section ?? '')
              ? 'catalog'
              : url.pathname.startsWith('/content/')
                ? 'website'
                : 'overview'),
  )!;
  const selectedHref =
    area.color === 'website'
      ? view === 'footer' || ['navigation', 'socials', 'newsletter'].includes(section ?? '')
        ? '/content/?view=footer'
        : ['news', 'settings'].includes(section ?? '')
          ? `/content/?collection=${section}`
          : '/content/'
      : `/content/?collection=${section}`;
  const hidden = hiddenAreas.includes(area.label);
  const publicUrl =
    environment === 'uat'
      ? 'https://blackbox-records-web-uat.pages.dev/'
      : environment === 'prd'
        ? 'https://blackbox-records-web.pages.dev/'
        : 'http://127.0.0.1:4321/blackbox-records/';
  function toggleNavigation() {
    setHiddenAreas((current) => (hidden ? current.filter((label) => label !== area.label) : [...current, area.label]));
    try {
      localStorage.setItem(`staff-navigation:${area.label}`, hidden ? 'visible' : 'hidden');
    } catch {
      /* Optional preference. */
    }
  }
  function primaryLinks() {
    return areas.map(({ label, href, icon: Icon, color }) => (
      <a
        key={label}
        href={href}
        className="staff-area-link"
        data-area={color}
        aria-current={!url.pathname.startsWith('/review/') && area.label === label ? 'page' : undefined}
      >
        <span className="staff-area-icon">
          <Icon aria-hidden="true" />
        </span>
        <span>{label}</span>
      </a>
    ));
  }
  function contextualLinks() {
    return area.links.map(({ label, href }) => (
      <a key={href} href={href} aria-current={selectedHref === href ? 'page' : undefined}>
        {label}
      </a>
    ));
  }
  function utilities() {
    return (
      <>
        <Button asChild className="staff-review-link">
          <a href="/review/" aria-current={url.pathname.startsWith('/review/') ? 'page' : undefined}>
            <ClipboardCheck aria-hidden="true" />
            Review changes
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="staff-history-link"
          onClick={(event) => showHistory({}, event.currentTarget)}
        >
          <History aria-hidden="true" />
          Publication history
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Plus aria-hidden="true" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="cms-surface staff-add-menu" align="end">
            {additions.map(({ label, href }) => (
              <DropdownMenuItem key={href} asChild onSelect={(event) => event.preventDefault()}>
                <a href={href}>{label}</a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <a className="staff-view-website" href={publicUrl} target="_blank" rel="noopener noreferrer">
          View website
          <ArrowUpRight aria-hidden="true" />
        </a>
      </>
    );
  }
  return (
    <div className="staff-shell cms-surface">
      <header className="staff-shell-header">
        <a className="staff-brand" href="/" aria-label="BlackBox Records Staff">
          <img src="/logo-horizontal.png" alt="" width="686" height="162" />
        </a>
        <nav className="staff-top-navigation" aria-label="Staff workspace">
          {primaryLinks()}
        </nav>
        <div className="staff-header-context">
          <span className="staff-current-area">
            {url.pathname.startsWith('/review/') ? 'Website changes' : area.label}
          </span>
          {environment === 'uat' && <span className="staff-environment-badge">Test environment</span>}
        </div>
        <div className="staff-header-utilities">{utilities()}</div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="staff-menu-trigger">
              <Menu aria-hidden="true" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="cms-surface staff-navigation-drawer" aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle>Staff workspace</SheetTitle>
            </SheetHeader>
            <nav aria-label="Staff workspace">{primaryLinks()}</nav>
            {area.links.length > 0 && (
              <nav className="staff-context-links" aria-label={area.label}>
                <h2>{area.label}</h2>
                {contextualLinks()}
              </nav>
            )}
            <div className="staff-drawer-utilities">{utilities()}</div>
          </SheetContent>
        </Sheet>
      </header>
      <div className="staff-shell-body">
        {area.links.length > 0 && (
          <aside className="staff-context-navigation" data-collapsed={hidden}>
            {!hidden && (
              <>
                <h2>{area.label}</h2>
                <nav className="staff-context-links" aria-label={area.label}>
                  {contextualLinks()}
                </nav>
              </>
            )}
            <Button
              variant="ghost"
              onClick={toggleNavigation}
              aria-expanded={!hidden}
              aria-label={hidden ? 'Show navigation' : 'Hide navigation'}
            >
              {hidden ? <PanelLeft aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
              <span>{hidden ? 'Show navigation' : 'Hide navigation'}</span>
            </Button>
          </aside>
        )}
        <div className="staff-shell-main">
          <main id="main" tabIndex={-1} aria-label={title}>
            {children}
          </main>
        </div>
      </div>
      {historyOpen && (
        <Suspense fallback={<p role="status">Loading history…</p>}>
          <PublicationHistory
            base={base}
            collection={historyFilter.collection}
            recordId={historyFilter.recordId}
            open={historyOpen}
            onOpenChange={closeHistory}
          />
        </Suspense>
      )}
    </div>
  );
}
