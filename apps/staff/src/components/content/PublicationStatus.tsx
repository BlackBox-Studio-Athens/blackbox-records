import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, AlertCircle, RefreshCw, History } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { useIsMobile } from '../../hooks/use-mobile';
import type { ContentPublication } from '../../lib/backend/content-publication-api';

export default function PublicationStatus({
  items,
  message,
  refresh,
}: {
  items: ContentPublication[];
  message: string;
  refresh(): Promise<void>;
}) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
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
  const pending = items.filter((item) => item.status === 'pending');
  const pendingKey = pending.map((item) => item.id).join(',');
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
        elapsed < 120_000 ? 15_000 : 30_000,
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
  const latestLive = Math.max(0, ...items.filter((item) => item.status === 'live').map((item) => item.requestedAt));
  const failed = items.some((item) => item.status === 'failed' && item.requestedAt > latestLive);
  const unavailable = message.includes('unavailable') || message.includes('could not') || message.includes('failed');
  const warning = failed || unavailable;
  const summary = warning
    ? failed
      ? 'Publication failed'
      : 'Publication status unavailable'
    : pending.length
      ? paused
        ? 'Still pending · Check again'
        : `Publishing · ${pending.length} pending`
      : items.length
        ? 'Latest publication live'
        : 'Publication history';
  const Icon = warning ? AlertCircle : pending.length ? Clock3 : items.length ? CheckCircle2 : History;
  const trigger = (
    <Button
      type="button"
      variant="ghost"
      className={`cms-publication-trigger ${warning ? 'cms-state-error' : pending.length ? 'cms-state-warning' : items.length ? 'cms-state-success' : ''}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{summary}</span>
    </Button>
  );
  const history = (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Saved drafts are private. Live confirms a publication reached the site. Open a fresh public page to see it.
      </p>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <ul className="max-h-72 overflow-y-auto divide-y divide-border" aria-label="Recent publications">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-xs">
            <div>
              <span
                className={
                  item.status === 'failed'
                    ? 'cms-state-error'
                    : item.status === 'pending'
                      ? 'cms-state-warning'
                      : 'cms-state-success'
                }
              >
                {item.status === 'live' ? 'Live' : item.status === 'pending' ? 'Pending' : 'Failed'}
              </span>
              {item.failureReason && <p className="mt-1 max-w-56 text-muted-foreground">{item.failureReason}</p>}
              {item.status === 'failed' && (
                <details className="mt-1">
                  <summary className="cursor-pointer">Diagnostic details</summary>
                  <p className="break-all">Publication: {item.id}</p>
                </details>
              )}
            </div>
            <time dateTime={new Date(item.requestedAt).toISOString()}>
              {new Date(item.requestedAt).toLocaleString()}
            </time>
          </li>
        ))}
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
        size="icon"
        disabled={checking}
        aria-label="Refresh publication status"
        title={checking ? 'Checking publication status…' : 'Refresh publication status'}
        onClick={() => void check()}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
      </Button>
      <span className="sr-only" role="status">
        {checking ? 'Checking publication status' : summary}
      </span>
    </div>
  );
}
