import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, History, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import {
  readPublicationHistory,
  publicationStage,
  type ContentPublication,
} from '../../lib/backend/content-publication-api';
import { contentSections, type ContentSection } from './ContentFields';

export type PublicationHistoryFilter = {
  collection?: string;
  recordId?: string;
};

export const publicationHistoryEvent = 'staff:open-publication-history';

export function requestPublicationHistory(filter: PublicationHistoryFilter = {}) {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent<PublicationHistoryFilter>(publicationHistoryEvent, { detail: filter }));
}

export function publicationHistoryTitle(item: ContentPublication) {
  const entries = item.entries ?? [];
  if (!entries.length) return 'Website update';
  return entries.length === 1 ? entries[0]!.title : `${entries[0]!.title} + ${entries.length - 1} more`;
}

function status(item: ContentPublication) {
  if (item.status === 'live')
    return { label: 'On the website', icon: CheckCircle2, className: 'publication-history-status-live' };
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="cms-surface publication-history-sheet">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History aria-hidden="true" />
            Publication history
          </SheetTitle>
          <SheetDescription>
            {recordId ? 'Updates containing this entry.' : 'Recent website publication requests.'} Requested times are
            shown in Athens time.
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
                    <time dateTime={new Date(item.requestedAt).toISOString()}>
                      Requested{' '}
                      {new Intl.DateTimeFormat('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Europe/Athens',
                      }).format(item.requestedAt)}
                    </time>
                    <details className="publication-history-details">
                      <summary>Details</summary>
                      <dl>
                        <div>
                          <dt>Publisher</dt>
                          <dd>{item.actorEmail ?? 'Unavailable for this update'}</dd>
                        </div>
                        <div>
                          <dt>Destination</dt>
                          <dd>{item.environment?.toUpperCase() ?? 'Unavailable for this update'}</dd>
                        </div>
                      </dl>
                      {item.entries?.length ? (
                        <ul>
                          {item.entries.map((entry, index) => (
                            <li key={`${entry.collection}/${entry.recordId}/${index}`}>
                              {entry.title}{' '}
                              <span className="text-muted-foreground">
                                · {contentSections[entry.collection as ContentSection] ?? 'Content'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Entry details unavailable for this earlier update.</p>
                      )}
                      {item.failureReason && <p className="cms-state-error">{item.failureReason}</p>}
                    </details>
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
