import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import {
  readPublicationDetails,
  type PublicationDetails as Details,
  type ContentPublication,
} from '../../lib/backend/content-publication-api';
import { contentSections, type ContentSection } from '../../lib/content-sections';
const PublicationComparison = lazy(() => import('./PublicationComparison'));

export const publicationTime = (value: number) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Athens' }).format(
    value,
  );

export default function PublicationDetails({ base, item }: { base: string; item: ContentPublication }) {
  const [details, setDetails] = useState<Details>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setDetails(undefined);
    setError('');
    void readPublicationDetails(base, item.id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDetails(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Details unavailable.');
      });
    return () => controller.abort();
  }, [base, item.id, retry]);
  const publication = details?.publication ?? item;
  return (
    <div className="publication-detail-content grid gap-4">
      <dl className="grid gap-2 text-sm">
        <div>
          <dt>Publisher</dt>
          <dd>{publication.actorEmail ?? 'Unavailable for this update'}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{publication.environment?.toUpperCase() ?? 'Unavailable for this update'}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{publication.action === 'withdraw' ? 'Remove from website' : 'Publish update'}</dd>
        </div>
        <div>
          <dt>Requested</dt>
          <dd>{publicationTime(publication.requestedAt)}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>
            {publication.completedAt !== undefined
              ? publicationTime(publication.completedAt)
              : publication.status === 'live'
                ? 'Completion time unavailable for this earlier update'
                : 'Not completed'}
          </dd>
        </div>
      </dl>
      {publication.entries?.length ? (
        <ul className="grid gap-2">
          {publication.entries.map((entry) => (
            <li key={`${entry.collection}/${entry.recordId}`}>
              <strong>{entry.title}</strong> · {contentSections[entry.collection as ContentSection] ?? 'Content'}{' '}
              {entry.editorAvailable && (
                <a
                  className="inline-flex min-h-11 items-center underline"
                  href={`/content/?${new URLSearchParams({ collection: entry.collection, id: entry.recordId })}`}
                >
                  Open editor
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Entry details unavailable for this earlier update.</p>
      )}
      {publication.failureReason && (
        <p role="alert" className="cms-state-error">
          {publication.failureReason}
        </p>
      )}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
            Retry details
          </Button>
        </div>
      ) : !details ? (
        <p role="status">Loading comparison…</p>
      ) : details.comparison ? (
        <Suspense fallback={<p role="status">Loading comparison…</p>}>
          <PublicationComparison historical review={details.comparison} />
        </Suspense>
      ) : (
        <p>{details.reason ?? 'Comparison unavailable for this update.'}</p>
      )}
    </div>
  );
}

export function PublicationDisclosure({ base, item }: { base: string; item: ContentPublication }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="publication-history-details" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Details</summary>
      {open && <PublicationDetails base={base} item={item} />}
    </details>
  );
}
