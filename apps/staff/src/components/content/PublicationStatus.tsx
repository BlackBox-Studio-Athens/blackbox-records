import { useEffect, useRef, useState } from 'react';
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
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  const pending = items.filter((item) => item.status === 'pending');
  const pendingKey = pending.map((item) => item.id).join(',');
  useEffect(() => {
    if (!pendingKey) return;
    const deadline = Date.now() + 120_000;
    let running = false;
    const timer = setInterval(() => {
      if (Date.now() >= deadline) {
        clearInterval(timer);
        return;
      }
      if (document.visibilityState !== 'visible' || running) return;
      running = true;
      void refreshRef.current().finally(() => {
        running = false;
      });
    }, 15_000);
    return () => clearInterval(timer);
  }, [pendingKey]);
  const latestLive = Math.max(0, ...items.filter((item) => item.status === 'live').map((item) => item.requestedAt));
  const failed = items.some((item) => item.status === 'failed' && item.requestedAt > latestLive);
  const unavailable = message.includes('unavailable') || message.includes('could not') || message.includes('failed');
  const warning = failed || unavailable;
  const summary = warning
    ? failed
      ? 'Publication failed'
      : 'Publication status unavailable'
    : pending.length
      ? `Publishing · ${pending.length} pending`
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
            <time dateTime={new Date(item.requestedAt).toISOString()}>
              {new Date(item.requestedAt).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        disabled={checking}
        onClick={() => {
          setChecking(true);
          void refresh().finally(() => setChecking(false));
        }}
      >
        <RefreshCw className="size-4" />
        {checking ? 'Checking…' : 'Refresh publication status'}
      </Button>
    </div>
  );
  return mobile ? (
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
}
