import { useEffect, useRef, useState } from 'react';
import { Expand, Minimize, RefreshCw, Info, Monitor, Smartphone, Scan, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { checkPreviewAssets, PreviewAssetError, safePreviewAsset, type PreviewDiagnostic } from './preview-diagnostics';
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
  type Rendering = {
    generation: number;
    html: string;
    signal: AbortSignal;
    report(error: unknown, stage?: PreviewDiagnostic['stage'], directive?: string): void;
    finish(): void;
  };
  const [rendered, setRendered] = useState<Rendering | null>(null);
  const [pending, setPending] = useState<Rendering | null>(null);
  const [status, setStatus] = useState('Updating preview');
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState<PreviewDiagnostic | null>(null);
  const [copied, setCopied] = useState(false);
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
      setPending(null);
      return;
    }
    const controller = new AbortController();
    const current = ++generation.current;
    let reported = false;
    let requestId: string | undefined;
    let release = 'unknown';
    const report = (error: unknown, stage: PreviewDiagnostic['stage'] = 'request', directive?: string) => {
      if (reported || controller.signal.aborted || current !== generation.current) return;
      reported = true;
      const details: PreviewDiagnostic = {
        requestId,
        release,
        ...(directive ? { directive } : {}),
        stage: error instanceof PreviewAssetError ? error.stage : stage,
        ...(error instanceof PreviewAssetError ? { asset: safePreviewAsset(error.asset) } : {}),
      };
      setDiagnostic(details);
      setCopied(false);
      // Parent sends diagnostics; the isolated preview retains connect-src 'none'. No retries.
      void fetch(`${base}/_emdash/preview-diagnostics`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
        body: JSON.stringify(details),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    };
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
      report(null, 'timeout');
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
            requestId = response.headers.get('X-Preview-Request-Id') ?? undefined;
            release = response.headers.get('X-Release-SHA') ?? 'unknown';
            if (!response.ok || response.redirected || !response.headers.get('X-Preview-Environment')) {
              const details = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(
                [401, 403].includes(response.status) ||
                  (response.redirected && new URL(response.url).hostname.endsWith('.cloudflareaccess.com'))
                  ? 'Sign in again to preview. Your edits are still here.'
                  : details?.error || 'Preview returned an unexpected response. Refresh preview to try again.',
              );
            }
            const next = await response.text();
            if (controller.signal.aborted) return;
            setPending({
              generation: current,
              html: next,
              signal: controller.signal,
              report,
              finish: () => clearTimeout(deadline),
            });

            setError('');
          } catch (error) {
            if (controller.signal.aborted) return;
            report(error);
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
    if (!active) setExpanded(false);
  }, [active]);
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
      if (event.defaultPrevented) return;
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
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold">Preview</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="About preview" title="About preview">
                  <Info className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="cms-surface text-sm" align="start">
                Check appearance before publishing. Links and forms are inactive. The live website may look different
                until its next update.
              </PopoverContent>
            </Popover>
          </div>
          <Button
            ref={expandButton}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={expanded ? 'Close expanded preview' : 'Expand preview'}
            title={expanded ? 'Close expanded preview' : 'Expand preview'}
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
                {size === 'desktop' ? (
                  <Monitor className="size-4" aria-hidden="true" />
                ) : size === 'mobile' ? (
                  <Smartphone className="size-4" aria-hidden="true" />
                ) : (
                  <Scan className="size-4" aria-hidden="true" />
                )}
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
            title="Refresh preview"
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
          {error && rendered ? ' · Showing the last successful preview' : ''}
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
          <AlertDescription>
            {error}
            {diagnostic && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer">Diagnostic details</summary>
                <p className="mt-2 break-all">
                  Reference: {diagnostic.requestId ?? 'Request did not reach the preview service'} · {diagnostic.stage}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(JSON.stringify(diagnostic, null, 2))
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false));
                  }}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {copied ? 'Copied' : 'Copy diagnostic details'}
                </Button>
              </details>
            )}
          </AlertDescription>
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
                let directive: string | undefined;
                const recordViolation = (event: SecurityPolicyViolationEvent) => {
                  if (['style-src', 'style-src-elem', 'img-src', 'font-src'].includes(event.effectiveDirective))
                    directive = event.effectiveDirective;
                };
                const previewDocument = iframe.contentDocument;
                // Some violations predate load; never invent a directive when the browser did not expose an event.
                previewDocument?.addEventListener('securitypolicyviolation', recordViolation);
                try {
                  const document = previewDocument;
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
                  setDiagnostic(null);
                  setStatus('Preview up to date');
                  item.finish();
                } catch (error) {
                  if (item.signal.aborted || item.generation !== generation.current) return;
                  item.report(error, 'request', directive);
                  setPending(null);
                  setError(error instanceof Error ? error.message : 'Preview assets could not load. Refresh preview.');
                  setStatus('Preview could not update');
                  item.finish();
                } finally {
                  previewDocument?.removeEventListener('securitypolicyviolation', recordViolation);
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
