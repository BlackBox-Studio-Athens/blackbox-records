import { useEffect, useRef, useState } from 'react';
import { Expand, Minimize, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { editorialWriteData } from '../../lib/backend/editorial-api';
import type { ContentData, ContentSection } from './ContentFields';

export default function ContentPreview({
  collection,
  id,
  slug,
  data,
  base,
  active,
  dirty,
}: {
  collection: ContentSection;
  id: string;
  slug: string;
  data: ContentData;
  base: string;
  active: boolean;
  dirty: boolean;
}) {
  type Rendering = { generation: number; html: string; signal: AbortSignal; finish(): void };
  const [rendered, setRendered] = useState<Rendering | null>(null);
  const [pending, setPending] = useState<Rendering | null>(null);
  const [status, setStatus] = useState('Updating preview');
  const [error, setError] = useState('');
  const [environment, setEnvironment] = useState('');
  const [width, setWidth] = useState('fit');
  const [view, setView] = useState('detail');
  const [expanded, setExpanded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [visible, setVisible] = useState(true);
  const panel = useRef<HTMLElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const scroll = useRef({ x: 0, y: 0 });
  const resetScroll = useRef(false);
  const firstRender = useRef(true);
  const generation = useRef(0);
  const previous = useRef({ payload: '', view, retry, active: false });
  const payload = JSON.stringify({ collection, ...(id ? { id } : {}), slug, data: editorialWriteData(data) });
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!active || !visible) {
      previous.current.active = false;
      return;
    }
    const controller = new AbortController();
    const current = ++generation.current;
    const editing =
      previous.current.payload !== '' &&
      previous.current.payload !== payload &&
      previous.current.view === view &&
      previous.current.retry === retry &&
      previous.current.active;
    previous.current = { payload, view, retry, active: true };
    setStatus('Updating preview');
    setPending(null);
    const deadline = setTimeout(() => {
      if (controller.signal.aborted) return;
      setPending(null);
      setStatus('Preview could not update');
      setError('Preview took too long. Refresh preview to try again. Your edits are still here.');
      controller.abort();
    }, 30_000);
    controller.signal.addEventListener('abort', () => clearTimeout(deadline), { once: true });
    const timeout = setTimeout(
      () => {
        void (async () => {
          try {
            const response = await fetch(`${base}/_emdash/preview?view=${view}`, {
              method: 'POST',
              credentials: 'same-origin',
              cache: 'no-store',
              signal: controller.signal,
              headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
              body: payload,
            });
            if (!response.ok || response.redirected || !response.headers.get('X-Preview-Environment')) {
              const details = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(
                [401, 403].includes(response.status) ||
                  response.redirected ||
                  (response.ok && !response.headers.get('X-Preview-Environment'))
                  ? 'Sign in again to preview. Your edits are still here.'
                  : details?.error || 'Check your connection and try again.',
              );
            }
            const next = await response.text();
            if (controller.signal.aborted) return;
            setPending({
              generation: current,
              html: next,
              signal: controller.signal,
              finish: () => clearTimeout(deadline),
            });
            setEnvironment(response.headers.get('X-Preview-Environment') ?? '');
            setError('');
          } catch (error) {
            if (controller.signal.aborted) return;
            setStatus('Preview could not update');
            setError(error instanceof Error ? error.message : 'Try again.');
            clearTimeout(deadline);
          }
        })();
      },
      editing ? 750 : 0,
    );
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [payload, base, active, visible, view, retry]);
  useEffect(() => {
    if (!expanded) return;
    const siblings: HTMLElement[] = [];
    let node = panel.current;
    while (node?.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
          sibling.inert = true;
          siblings.push(sibling);
        }
      }
      node = node.parentElement;
    }
    expandButton.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      } else if (event.key === 'Tab') {
        const controls = panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), select, iframe:not([aria-hidden="true"])',
        );
        const first = controls?.[0];
        const last = controls?.[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('keydown', escape);
      siblings.forEach((sibling) => {
        sibling.inert = false;
      });
      expandButton.current?.focus();
    };
  }, [expanded]);
  const hasListing = ['artists', 'releases', 'news', 'distro'].includes(collection);
  return (
    <section
      ref={panel}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label="Site preview"
      className={`cms-preview ${expanded ? 'cms-preview-expanded' : ''}`}
      hidden={!active}
    >
      <header className="cms-preview-toolbar">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Private preview{' '}
            <span className="text-xs font-normal text-muted-foreground">{environment.toUpperCase()}</span>
          </p>
          <Button
            ref={expandButton}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={expanded ? 'Close expanded preview' : 'Expand preview'}
            aria-pressed={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize className="size-4" /> : <Expand className="size-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex" role="group" aria-label="Preview width">
            {['fit', 'desktop', 'mobile'].map((size) => (
              <Button
                key={size}
                type="button"
                variant={width === size ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={width === size}
                onClick={() => setWidth(size)}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Button>
            ))}
          </div>
          {hasListing && (
            <label className="text-xs">
              View{' '}
              <select
                className="cms-preview-select"
                value={view}
                onChange={(event) => {
                  scroll.current = { x: 0, y: 0 };
                  resetScroll.current = true;
                  setView(event.target.value);
                }}
              >
                <option value="detail">Detail page</option>
                <option value="listing">Listing</option>
              </select>
            </label>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Refresh preview"
            onClick={() => setRetry((value) => value + 1)}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <p
          role="status"
          className={`text-xs ${error ? 'cms-state-error' : dirty ? 'cms-state-warning' : 'text-muted-foreground'}`}
        >
          {status}
          {dirty ? ' · Unsaved edits' : ' · Saved draft'}
          {error && rendered ? ' · Showing the last successful preview' : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          Appearance only. Uses this CMS version; the live site may use an earlier version.
        </p>
        {collection === 'settings' && (
          <p className="text-xs text-muted-foreground">
            Label name and established year appear in the footer. Website URL, logo metadata and location have no
            visible page effect.
          </p>
        )}
        {collection === 'purchase_information' && (
          <p className="text-xs text-muted-foreground">
            Wording preview only. Approval still controls what appears on the public site.
          </p>
        )}
      </header>
      {error && (
        <Alert variant="destructive" className="m-3 w-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="cms-preview-viewport">
        {[rendered, pending]
          .filter((item): item is Rendering => item !== null)
          .map((item) => (
            <iframe
              key={item.generation}
              ref={item === rendered ? frame : undefined}
              title={item === rendered ? 'Private site appearance preview' : 'Loading private site appearance preview'}
              className={item === pending ? 'cms-preview-pending' : undefined}
              aria-hidden={item === pending ? true : undefined}
              tabIndex={item === pending ? -1 : 0}
              sandbox="allow-same-origin"
              referrerPolicy="no-referrer"
              srcDoc={item.html}
              style={{ width: width === 'desktop' ? 1280 : width === 'mobile' ? 390 : '100%' }}
              onLoad={async (event) => {
                const iframe = event.currentTarget;
                if (item !== pending || item.signal.aborted || item.generation !== generation.current) return;
                try {
                  const document = iframe.contentDocument;
                  if (!document || document.URL !== 'about:srcdoc') return;
                  await checkPreviewAssets(document);
                  if (item.signal.aborted || item.generation !== generation.current) return;
                  if (!resetScroll.current)
                    scroll.current = {
                      x: frame.current?.contentWindow?.scrollX ?? scroll.current.x,
                      y: frame.current?.contentWindow?.scrollY ?? scroll.current.y,
                    };
                  const target =
                    firstRender.current && ['newsletter', 'settings', 'socials'].includes(collection)
                      ? document.querySelector(collection === 'newsletter' ? '#newsletter-signup-area' : 'footer')
                      : null;
                  if (target) {
                    iframe.contentWindow?.scrollTo(0, target.getBoundingClientRect().top - 96);
                  } else iframe.contentWindow?.scrollTo(scroll.current.x, scroll.current.y);
                  firstRender.current = false;
                  resetScroll.current = false;
                  setRendered(item);
                  setPending(null);
                  setError('');
                  setStatus('Preview up to date');
                  item.finish();
                } catch (error) {
                  if (item.signal.aborted || item.generation !== generation.current) return;
                  setPending(null);
                  setError(error instanceof Error ? error.message : 'Preview assets could not load. Refresh preview.');
                  setStatus('Preview could not update');
                  item.finish();
                }
              }}
            />
          ))}
        {!rendered &&
          (error ? (
            <p className="p-6 text-sm text-muted-foreground">Fix the issue above, then refresh the preview.</p>
          ) : (
            <div className="grid gap-4 p-6" aria-label="Loading site preview">
              <Skeleton className="h-64" />
              <Skeleton className="h-10" />
              <Skeleton className="h-24" />
            </div>
          ))}
      </div>
    </section>
  );
}

async function checkPreviewAssets(document: Document) {
  if (
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).some((link) => {
      if (!link.sheet) return true;
      // Chromium can leave an empty sheet after a failed CSS response. Public preview CSS is never empty.
      try {
        return link.sheet.cssRules.length === 0;
      } catch {
        return false;
      } // Cross-origin font stylesheets do not expose their rules.
    })
  )
    throw new Error('Preview styles could not load. Refresh preview; if this continues, sign in again.');
  try {
    await Promise.all(Array.from(document.images).map((image) => image.decode()));
  } catch {
    throw new Error(
      'Preview images could not load. Refresh preview; if this continues, check the selected images or sign in again.',
    );
  }
  await document.fonts?.ready;
  if (document.fonts && Array.from(document.fonts).some((font) => font.status === 'error'))
    throw new Error('Preview fonts could not load. Refresh preview to try again.');
}
