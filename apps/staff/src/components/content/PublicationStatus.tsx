import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, History, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { ContentPublication } from '../../lib/backend/content-publication-api';
import { requestPublicationHistory } from './PublicationHistory';

type PublicationStatusView = 'pending' | 'failed' | 'live' | 'unavailable' | 'empty';

export type PublicationStatusSummary = {
  view: PublicationStatusView;
  label: string;
  stale: boolean;
};

export function summarizePublicationStatus(
  items: ContentPublication[],
  options: { statusError?: string } = {},
): PublicationStatusSummary {
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
  compact?: boolean;
  statusError?: string;
  message: string;
  refresh(): Promise<void>;
};

export default function PublicationStatus({
  items,
  compact = false,
  statusError = '',
  message,
  refresh,
}: PublicationStatusProps) {
  const current = items[0];
  const pendingKey = current?.status === 'pending' ? current.id : '';
  const { check, checking, paused } = usePublicationPolling(pendingKey, refresh);

  const summary = summarizePublicationStatus(items, { statusError });
  const label = summary.view === 'pending' && paused ? 'Update not confirmed' : summary.label;
  const Icon =
    summary.view === 'failed' || summary.view === 'unavailable'
      ? AlertCircle
      : summary.view === 'pending'
        ? Clock3
        : summary.view === 'live'
          ? CheckCircle2
          : History;
  const stateClass =
    summary.view === 'failed'
      ? 'cms-state-error'
      : summary.view === 'unavailable' || summary.view === 'pending'
        ? 'cms-state-warning'
        : summary.view === 'live'
          ? 'cms-state-success'
          : '';
  if (compact && !statusError && !pendingKey && current?.status !== 'failed') return null;
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        className={`cms-publication-trigger ${stateClass}`}
        aria-label={label}
        title="Open publication history"
        onClick={() => requestPublicationHistory()}
      >
        <Icon className="size-4" aria-hidden="true" />
        <span>{label}</span>
        {summary.stale && <Badge variant="outline">Stale</Badge>}
      </Button>
      {(statusError || paused) && (
        <Button
          type="button"
          variant="ghost"
          className="cms-publication-refresh"
          disabled={checking}
          aria-label="Check publication status"
          title={checking ? 'Checking publication status…' : 'Check publication status'}
          aria-busy={checking}
          onClick={() => void check()}
        >
          <RefreshCw className={`size-4 ${checking ? 'cms-refreshing' : ''}`} aria-hidden="true" />
          <span>Check status</span>
        </Button>
      )}
      <span className="sr-only" role="status">
        {checking ? 'Checking publication status' : message || label}
      </span>
    </div>
  );
}

export function usePublicationPolling(pendingKey: string, refresh: () => Promise<void>) {
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
          if (document.visibilityState === 'visible' && navigator.onLine) void check().finally(schedule);
          else schedule();
        },
        elapsed < 60_000 ? 2000 : 30_000,
      );
    };
    const returned = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void check();
    };
    schedule();
    document.addEventListener('visibilitychange', returned);
    window.addEventListener('focus', returned);
    window.addEventListener('online', returned);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', returned);
      window.removeEventListener('focus', returned);
      window.removeEventListener('online', returned);
    };
  }, [pendingKey, check]);

  return { check, checking, paused };
}
