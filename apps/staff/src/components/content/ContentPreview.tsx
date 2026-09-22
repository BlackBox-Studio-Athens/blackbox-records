import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Expand, Minimize, RefreshCw, Info, Monitor, Smartphone, Scan, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import type { PreviewDiagnostic } from './preview-diagnostics';
import { editorialWriteData } from '../../lib/backend/editorial-api';
import type { ContentData, ContentSection } from '../../lib/content-sections';
import { proseSchema, proseText, type PublicationReviewInput } from '@blackbox/content-model';

export default function ContentPreview({
  collection,
  focusedPath = '',
  id,
  slug,
  data,
  base,
  active,
  dirty,
  valid,
  publication,
  onReadiness,
}: {
  collection: ContentSection;
  focusedPath?: string;
  id: string;
  slug: string;
  data: ContentData;
  base: string;
  active: boolean;
  dirty: boolean;
  valid: boolean;
  publication?: PublicationReviewInput;
  onReadiness?(state: 'loading' | 'ready' | 'failed'): void;
}) {
  type Rendering = {
    generation: number;
    inputKey: string;
    url: string;
    context: string;
    signal: AbortSignal;
    report(error: unknown, stage?: PreviewDiagnostic['stage'], directive?: string): void;
    identify(release: string): void;
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
  const frames = useRef(new Map<number, HTMLIFrameElement>());
  const contexts = useRef(new Set<string>());
  const releaseContext = (context: string) => {
    if (!contexts.current.delete(context)) return;
    void fetch(`${base}/_emdash/preview-release`, {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
      body: JSON.stringify({ context }),
    }).catch(() => {});
  };
  const expandButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!active || !focusedPath) return;
    if (!rendered) return;
    const value = focusedPath
      .split('.')
      .reduce<unknown>(
        (value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
        data,
      );
    const prose = proseSchema.safeParse(data[`${focusedPath}_rich`] ?? value);
    const text = prose.success ? proseText(prose.data).trim() : '';
    frame.current?.contentWindow?.postMessage(
      {
        type: 'focus',
        context: rendered.context,
        generation: rendered.generation,
        text,
        image: focusedPath.includes('image'),
      },
      new URL(rendered.url).origin,
    );
  }, [focusedPath, active]);

  const scroll = useRef({ x: 0, y: 0 });
  const resetScroll = useRef(false);
  const firstRender = useRef(true);
  const generation = useRef(0);
  const displayedGeneration = useRef(0);
  const previous = useRef({ payload: '', view, retry, active: false });
  const payload = JSON.stringify(
    publication
      ? { collection, id, publication }
      : { collection, ...(id ? { id } : {}), slug, data: editorialWriteData(data) },
  );
  const inputKey = JSON.stringify([payload, base, view, retry]);
  const currentInput = useRef(inputKey);
  useEffect(() => {
    onReadiness?.(error ? 'failed' : rendered?.inputKey === inputKey ? 'ready' : 'loading');
  }, [error, rendered?.inputKey, inputKey, onReadiness]);
  useLayoutEffect(() => {
    currentInput.current = inputKey;
  }, [inputKey]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const item = [pending, rendered].find(
        (item) =>
          item &&
          event.origin === new URL(item.url).origin &&
          event.source === frames.current.get(item.generation)?.contentWindow &&
          event.data?.context === item.context &&
          event.data?.generation === item.generation,
      );
      if (!item || !active || !visible) return;
      if (
        item === pending &&
        (item.signal.aborted || item.generation !== generation.current || item.inputKey !== currentInput.current)
      )
        return;
      if (typeof event.data.release === 'string' && /^[a-f0-9]{40}$/.test(event.data.release))
        item.identify(event.data.release);
      if (
        event.data.type === 'scroll' &&
        item === rendered &&
        Number.isFinite(event.data.x) &&
        Number.isFinite(event.data.y)
      )
        scroll.current = { x: event.data.x, y: event.data.y };
      if (event.data.type === 'action' && item === rendered)
        setStatus('This action is unavailable in private preview.');
      if (event.data.type === 'escape') setExpanded(false);
      if (event.data.type === 'failed') {
        const stage = event.data.stage === 'style' ? 'style' : event.data.stage === 'font' ? 'font' : 'image';
        item.report(null, stage);
        item.finish();
        setPending(null);
        setError(
          `Preview ${stage === 'style' ? 'styles' : stage === 'font' ? 'fonts' : 'images'} could not load. Refresh preview.`,
        );
        setStatus('Preview could not update');
        if (item !== rendered) releaseContext(item.context);
      }
      if (event.data.type !== 'ready') return;
      if (
        item === pending &&
        (item.signal.aborted || item.generation !== generation.current || item.inputKey !== currentInput.current)
      )
        return;
      frames.current.get(item.generation)?.contentWindow?.postMessage(
        {
          type: 'activate',
          context: item.context,
          generation: item.generation,
          ...(item === rendered || resetScroll.current ? { x: 0, y: 0 } : scroll.current),
          target:
            firstRender.current && ['newsletter', 'settings', 'socials'].includes(collection)
              ? collection === 'newsletter'
                ? 'newsletter'
                : 'footer'
              : undefined,
        },
        new URL(item.url).origin,
      );
      if (item !== pending) return;
      if (rendered) releaseContext(rendered.context);
      firstRender.current = false;
      resetScroll.current = false;
      setRendered(item);
      displayedGeneration.current = item.generation;
      setPending(null);
      setError('');
      setDiagnostic(null);
      setStatus('Preview up to date');
      item.finish();
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [pending, rendered, active, visible]);
  useEffect(
    () => () => {
      for (const context of contexts.current) releaseContext(context);
    },
    [base],
  );
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
      setRendered(null);
      for (const context of contexts.current) releaseContext(context);
      return;
    }
    if (!valid) {
      previous.current.active = false;
      setPending(null);
      setError('');
      setDiagnostic(null);
      setStatus('Fix the highlighted fields to update preview');
      return;
    }
    const controller = new AbortController();
    let allocated: string | undefined;
    const current = ++generation.current;
    let reported = false;
    let requestId: string | undefined;
    let release = 'unknown';
    const report = (_error: unknown, stage: PreviewDiagnostic['stage'] = 'request', directive?: string) => {
      if (reported || controller.signal.aborted || current !== generation.current) return;
      reported = true;
      const details: PreviewDiagnostic = {
        requestId,
        release,
        requestedGeneration: current,
        displayedGeneration: displayedGeneration.current,
        readiness: 'failed',
        ...(directive ? { directive } : {}),
        stage,
      };
      setDiagnostic(details);
      setCopied(false);
      // Diagnostics remain staff-owned and never include draft content.
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
      setError('Preview took too long. Retry preview to try again. Your edits are still here.');
      report(null, 'timeout');
      controller.abort();
      if (allocated) releaseContext(allocated);
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
              headers: {
                'Content-Type': 'application/json',
                'X-EmDash-Request': '1',
                'X-Preview-Generation': String(current),
              },
              body: payload,
            });
            requestId = response.headers.get('X-Preview-Request-Id') ?? undefined;
            release = response.headers.get('X-Release-SHA') ?? 'unknown';
            const responseGeneration = response.headers.get('X-Preview-Generation');
            if (responseGeneration !== null && responseGeneration !== String(current)) {
              report(null, 'freshness');
              throw new Error('Preview returned an outdated response. Retry preview to try again.');
            }
            if (!response.ok || response.redirected || !response.headers.get('X-Preview-Environment')) {
              const details = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(
                [401, 403].includes(response.status) ||
                  (response.redirected && new URL(response.url).hostname.endsWith('.cloudflareaccess.com'))
                  ? 'Sign in again to preview. Your edits are still here.'
                  : details?.error || 'Preview returned an unexpected response. Retry preview to try again.',
              );
            }
            const next = (await response.json()) as { url: string; context: string };
            const target = new URL(next.url);
            if (
              !/^[a-f0-9-]{36}$/.test(next.context) ||
              target.origin === window.location.origin ||
              !['http:', 'https:'].includes(target.protocol) ||
              target.searchParams.get('__preview') !== next.context
            )
              throw new Error('Preview returned an invalid document. Retry preview.');
            contexts.current.add(next.context);
            allocated = next.context;
            if (controller.signal.aborted || currentInput.current !== inputKey) {
              releaseContext(next.context);
              return;
            }
            setPending({
              generation: current,
              inputKey,
              url: next.url,
              context: next.context,
              signal: controller.signal,
              report,
              identify: (value) => {
                release = value;
              },
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
      if (allocated && displayedGeneration.current !== current) releaseContext(allocated);
    };
  }, [payload, base, active, valid, visible, view, retry, inputKey]);
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
            <p className="text-sm font-semibold">
              {publication
                ? `Preview of ${publication.records.length === 1 ? 'this change' : `all ${publication.records.length} changes`}`
                : 'Preview'}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="About preview" title="About preview">
                  <Info className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="cms-surface text-sm" align="start">
                Browse this private version of the website. Checkout and form delivery are blocked. Refresh preview to
                load changes made elsewhere.
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
          {hasListing && !publication && (
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
          {error && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Retry preview"
              title="Retry preview"
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw className="size-4" />
            </Button>
          )}
        </div>
        <p
          role="status"
          className={`text-xs ${error ? 'cms-state-error' : dirty ? 'cms-state-warning' : 'text-muted-foreground'}`}
        >
          {status === 'Preview up to date' && rendered?.inputKey !== inputKey ? 'Updating preview' : status}
          {rendered && (error || rendered.inputKey !== inputKey)
            ? ' · Showing the last successful preview (outdated)'
            : ''}
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
              data-preview-generation={item.generation}
              data-preview-readiness={item === rendered ? 'ready' : 'loading'}
              ref={(element) => {
                if (element) frames.current.set(item.generation, element);
                else frames.current.delete(item.generation);
                if (item === rendered) frame.current = element;
              }}
              title={item === rendered ? 'Private site appearance preview' : 'Loading private site appearance preview'}
              className={item === pending ? 'cms-preview-pending' : undefined}
              aria-hidden={item === pending ? true : undefined}
              tabIndex={item === pending ? -1 : 0}
              sandbox="allow-same-origin allow-scripts"
              referrerPolicy="no-referrer"
              src={item.url}
              style={{ width: width === 'desktop' ? 1280 : width === 'mobile' ? 390 : '100%' }}
            />
          ))}
        {!rendered &&
          (error ? (
            <p className="p-6 text-sm text-muted-foreground">Fix the issue above, then retry the preview.</p>
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
