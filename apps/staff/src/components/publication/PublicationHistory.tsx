import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, History, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { acquireLenisModalLock } from '../../lib/lenis-scroll';
import {
  readPublicationHistory,
  publicationStage,
  type ContentPublication,
} from '../../lib/backend/content-publication-api';
import { PublicationDisclosure, publicationTime } from './PublicationDetails';

export { publicationHistoryEvent, requestPublicationHistory } from '../../lib/publication-history-events';
export type { PublicationHistoryFilter } from '../../lib/publication-history-events';

export function publicationHistoryTitle(item: ContentPublication) {
  const entries = item.entries ?? [];
  if (!entries.length) return 'Website update';
  return entries.length === 1 ? entries[0]!.title : `${entries[0]!.title} + ${entries.length - 1} more`;
}

function status(item: ContentPublication) {
  if (item.status === 'live')
    return {
      label: item.action === 'withdraw' ? 'Removed from the website' : 'Published',
      icon: CheckCircle2,
      className: 'publication-history-status-live',
    };
  if (item.status === 'failed')
    return { label: 'Failed', icon: XCircle, className: 'publication-history-status-failed' };
  return { label: publicationStage(item), icon: Clock3, className: 'publication-history-status-pending' };
}

export default function PublicationHistory({
  base,
  collection,
  recordId,
  open = false,
  onOpenChange,
}: {
  base: string;
  collection?: string | undefined;
  recordId?: string | undefined;
  open?: boolean;
  onOpenChange(open: boolean): void;
}) {
  const [items, setItems] = useState<ContentPublication[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (next?: string) => {
      const request = ++sequence.current;
      setBusy(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (next) params.set('cursor', next);
        if (collection && recordId) {
          params.set('collection', collection);
          params.set('recordId', recordId);
        }
        const result = await readPublicationHistory(base, params);
        if (request !== sequence.current) return;
        setItems((previous) => (next ? [...previous, ...result.items] : result.items));
        setCursor(result.nextCursor);
      } catch (error) {
        if (request === sequence.current) setError(error instanceof Error ? error.message : 'History unavailable.');
      } finally {
        if (request === sequence.current) setBusy(false);
      }
    },
    [base, collection, recordId],
  );

  useEffect(() => {
    sequence.current++;
    setItems([]);
    setCursor(undefined);
    setError('');
    if (open) void load();
    return () => {
      sequence.current++;
    };
  }, [open, load]);
  useEffect(() => {
    const scrollRoot = scrollRootRef.current;
    if (!open || !scrollRoot) return;
    return acquireLenisModalLock(scrollRoot);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={scrollRootRef}
        side="right"
        className="cms-surface publication-history-sheet"
        data-lenis-scroll-root
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History aria-hidden="true" />
            Publication history
          </SheetTitle>
          <SheetDescription>
            {recordId ? 'Updates containing this entry.' : 'Recent website publication requests.'} Times are shown in
            Athens time.
          </SheetDescription>
        </SheetHeader>
        <div className="publication-history-content">
          {error && (
            <div role="alert" className="publication-history-unavailable">
              <AlertCircle aria-hidden="true" />
              <p>{error}</p>
              <Button variant="outline" disabled={busy} onClick={() => void load()}>
                <RefreshCw aria-hidden="true" />
                Retry history
              </Button>
            </div>
          )}
          <ul className="publication-history-list" aria-label="Publication requests">
            {items.map((item) => {
              const current = status(item);
              const Icon = current.icon;
              return (
                <li key={item.id} className="publication-history-row">
                  <div className="publication-history-row-main">
                    <div className="publication-history-row-heading">
                      <strong>{publicationHistoryTitle(item)}</strong>
                      <Badge variant="outline" className={current.className}>
                        <Icon aria-hidden="true" />
                        {current.label}
                      </Badge>
                    </div>
                    <time dateTime={new Date(item.completedAt ?? item.requestedAt).toISOString()}>
                      {item.completedAt !== undefined ? 'Completed' : 'Requested'}{' '}
                      {publicationTime(item.completedAt ?? item.requestedAt)}
                    </time>
                    <PublicationDisclosure base={base} item={item} />
                  </div>
                </li>
              );
            })}
          </ul>
          {busy && <p role="status">Loading history…</p>}
          {!busy && !error && !items.length && (
            <p>{recordId ? 'No publications recorded for this entry.' : 'No publications recorded.'}</p>
          )}
          {cursor && (
            <Button variant="outline" disabled={busy} onClick={() => void load(cursor)}>
              Older publications
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
