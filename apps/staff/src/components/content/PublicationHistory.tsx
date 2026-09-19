import { useEffect, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '../ui/button';
import {
  readPublicationHistory,
  publicationStage,
  type ContentPublication,
} from '../../lib/backend/content-publication-api';
import { contentSections, type ContentSection } from './ContentFields';

export default function PublicationHistory({
  base,
  collection,
  recordId,
  initiallyOpen = false,
}: {
  base: string;
  collection?: string | undefined;
  recordId?: string | undefined;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [items, setItems] = useState<ContentPublication[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  async function load(next?: string) {
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
  }
  useEffect(() => {
    if (open) void load();
    return () => {
      sequence.current++;
    };
  }, [open, base, collection, recordId]);
  return (
    <section className="publication-history" aria-label="Publication history">
      <Button variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
        <History aria-hidden="true" />
        Publication history
      </Button>
      {open && (
        <div className="publication-history-content">
          <p className="text-sm text-muted-foreground">
            {recordId ? 'Updates containing this entry.' : 'Website publication history.'} Times are shown in Athens
            time.
          </p>
          {error && (
            <p role="alert">
              {error}{' '}
              <Button variant="outline" onClick={() => void load()}>
                Retry history
              </Button>
            </p>
          )}
          <ul className="divide-y divide-border" aria-label="Publication requests">
            {items.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{publicationStage(item)}</strong>
                  <time dateTime={new Date(item.requestedAt).toISOString()}>
                    {new Intl.DateTimeFormat('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Europe/Athens',
                    }).format(item.requestedAt)}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.actorEmail ?? 'Publisher unavailable'} ·{' '}
                  {item.environment?.toUpperCase() ?? 'Destination unavailable'}
                </p>
                {item.entries?.length ? (
                  <ul className="mt-2">
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
                {item.failureReason && <p className="cms-state-error mt-2">{item.failureReason}</p>}
              </li>
            ))}
          </ul>
          {busy && <p role="status">Loading history…</p>}
          {!busy && !error && !items.length && <p>No publications recorded{recordId ? ' for this entry' : ''}.</p>}
          {cursor && (
            <Button variant="outline" disabled={busy} onClick={() => void load(cursor)}>
              Older publications
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
