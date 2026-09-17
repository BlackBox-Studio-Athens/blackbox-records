import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, AlertCircle, RefreshCw, History } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { useIsMobile } from '../../hooks/use-mobile';
import type { ContentPublication } from '../../lib/backend/content-publication-api';

export type PublicationStatusView = 'requesting' | 'pending' | 'failed' | 'live' | 'unavailable' | 'empty';

export type PublicationStatusSummary = {
  view: PublicationStatusView;
  label: string;
  stale: boolean;
};

export function summarizePublicationStatus(
  items: ContentPublication[],
  options: { requesting?: boolean; statusError?: string } = {},
): PublicationStatusSummary {
  if (options.requesting) return { view: 'requesting', label: 'Publishing…', stale: false };

  const current = items[0];
  if (current?.status === 'pending') {
    return {
      view: 'pending',
      label: `Publishing · ${items.filter((item) => item.status === 'pending').length} pending`,
      stale: !!options.statusError,
    };
  }
  if (current?.status === 'failed')
    return { view: 'failed', label: 'Publication failed', stale: !!options.statusError };
  if (current?.status === 'live')
    return { view: 'live', label: 'Latest publication live', stale: !!options.statusError };
  if (options.statusError) return { view: 'unavailable', label: 'Publication status unavailable', stale: true };
  return items.length
    ? { view: 'unavailable', label: 'Publication status unavailable', stale: false }
    : { view: 'empty', label: 'Publication history', stale: false };
}

export type PublicationStatusProps = {
  items: ContentPublication[];
  requesting?: boolean;
  statusError?: string;
  message: string;
  refresh(): Promise<void>;
  open?: boolean;
  onOpenChange?(open: boolean): void;
};

export default function PublicationStatus({
  items,
  requesting = false,
  statusError = '',
  message,
  refresh,
  open: controlledOpen,
  onOpenChange,
}: PublicationStatusProps) {
  const mobile = useIsMobile();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paused, setPaused] = useState(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  const check = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    setChecking(true);
    const request = Promise.resolve()
      .then(() => refreshRef.current())
      .catch(() => {})
      .finally(() => {
        inFlight.current = null;
        setChecking(false);
      });
    inFlight.current = request;
    return request;
  }, []);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const current = items[0];
  const pendingKey = current?.status === 'pending' ? current.id : '';
  useEffect(() => {
    setPaused(false);
    if (!pendingKey) return;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const schedule = () => {
      if (stopped) return;
      const elapsed = Date.now() - started;
      if (elapsed >= 30 * 60_000) {
        setPaused(true);
        return;
      }
      timer = setTimeout(
        () => {
          if (document.visibilityState === 'visible') void check().finally(schedule);
          else schedule();
        },
        elapsed < 60_000 ? 2000 : 30_000,
      );
    };
    const returned = () => {
      if (document.visibilityState === 'visible') void check();
    };
    schedule();
    document.addEventListener('visibilitychange', returned);
    window.addEventListener('focus', returned);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', returned);
      window.removeEventListener('focus', returned);
    };
  }, [pendingKey, check]);

  const summary = summarizePublicationStatus(items, { requesting, statusError });
  const label = summary.view === 'pending' && paused ? 'Still pending · Check again' : summary.label;
  const Icon =
    summary.view === 'failed' || summary.view === 'unavailable'
      ? AlertCircle
      : summary.view === 'pending' || summary.view === 'requesting'
        ? Clock3
        : summary.view === 'live'
          ? CheckCircle2
          : History;
  const stateClass =
    summary.view === 'failed' || summary.view === 'unavailable'
      ? 'cms-state-error'
      : summary.view === 'pending' || summary.view === 'requesting'
        ? 'cms-state-warning'
        : summary.view === 'live'
          ? 'cms-state-success'
          : '';
  const trigger = (
    <Button
      type="button"
      variant="ghost"
      className={`cms-publication-trigger ${stateClass}`}
      aria-label={label}
      title="Open publication history"
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{label}</span>
      {summary.stale && <Badge variant="outline">Stale</Badge>}
    </Button>
  );
  const history = (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Live confirms a publication reached the site. Open a fresh public page to see it.
      </p>
      {statusError && (
        <p role="status" className="text-sm cms-state-warning">
          {statusError}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <ul className="max-h-72 overflow-y-auto divide-y divide-border" aria-label="Recent publications">
        {items.map((item, index) => {
          const isCurrent = index === 0;
          return (
            <li key={item.id} className="cms-publication-history-row">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      item.status === 'failed'
                        ? 'cms-state-error'
                        : item.status === 'pending'
                          ? 'cms-state-warning'
                          : 'cms-state-success'
                    }
                  >
                    {item.status === 'live' ? 'Live' : item.status === 'pending' ? 'Pending' : 'Failed'}
                  </Badge>
                  {isCurrent && <span className="text-xs font-medium">Current</span>}
                  {item.status === 'pending' && item.stage && (
                    <span className="text-xs text-muted-foreground">
                      {{
                        queued: 'Waiting',
                        preparing: 'Preparing content',
                        verifying: 'Checking pages',
                        confirming: 'Confirming public site',
                        retrying: 'Retrying',
                      }[item.stage] ?? 'Publishing'}
                    </span>
                  )}
                  {!isCurrent && item.status === 'failed' && (
                    <span className="text-xs text-muted-foreground">Earlier failure</span>
                  )}
                </div>
                {item.failureReason && <p className="mt-1 max-w-56 text-muted-foreground">{item.failureReason}</p>}
                {item.status === 'failed' && (
                  <Accordion type="single" collapsible className="mt-1">
                    <AccordionItem value={`diagnostic-${item.id}`} className="border-b-0">
                      <AccordionTrigger className="w-fit justify-start py-1 text-xs font-normal hover:no-underline">
                        Diagnostic details
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 text-xs">
                        <p className="break-all">Publication: {item.id}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
              <time dateTime={new Date(item.requestedAt).toISOString()}>
                {new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Europe/Athens',
                }).format(new Date(item.requestedAt))}
              </time>
            </li>
          );
        })}
      </ul>
    </div>
  );
  const disclosure = mobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="cms-surface overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Publication history</SheetTitle>
          <SheetDescription>Recent publication requests for this environment.</SheetDescription>
        </SheetHeader>
        <div className="p-4">{history}</div>
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="cms-surface w-96 max-w-[calc(100vw-2rem)]">
        <h2 className="mb-3 text-sm font-semibold">Publication history</h2>
        {history}
      </PopoverContent>
    </Popover>
  );
  return (
    <div className="flex min-w-0 items-center gap-1">
      {disclosure}
      <Button
        type="button"
        variant="ghost"
        className="cms-publication-refresh"
        disabled={checking}
        aria-label="Refresh publication status"
        title={checking ? 'Checking publication status…' : 'Refresh publication status'}
        aria-busy={checking}
        onClick={() => void check()}
      >
        <RefreshCw className={`size-4 ${checking ? 'cms-refreshing' : ''}`} aria-hidden="true" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <span className="sr-only" role="status">
        {checking ? 'Checking publication status' : label}
      </span>
    </div>
  );
}
