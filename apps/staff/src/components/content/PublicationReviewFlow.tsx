import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, ArrowLeft } from 'lucide-react';
import type { PublicationReview, PublicationReviewInput } from '@blackbox/content-model';
import { changedPublicationFields } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { Tabs } from 'radix-ui';
import { Skeleton } from '../ui/skeleton';
import ContentPreview from './ContentPreview';
import PublicationComparison from './PublicationComparison';
import { type ContentSection } from '../../lib/content-sections';
import { usePublicationPolling } from './PublicationStatus';
import {
  readPublicationReview,
  readPublicationStatus,
  publishSavedContent,
  publicationStage,
  type ContentPublication,
} from '../../lib/backend/content-publication-api';
import { EditorialApiError } from '../../lib/backend/editorial-api';
import { pendingPublicationKey, restorePublication } from './publication-selection';

const entryKey = (entry?: { collection: string; recordId: string }) =>
  entry ? `${entry.collection}/${entry.recordId}` : '';

export function publicationPreviewDestination(review: PublicationReview, activeEntry: string) {
  const destinations = review.destinations?.length ? review.destinations : review.entries;
  const selected = review.entries.find((entry) => entryKey(entry) === activeEntry);
  if (!selected) return destinations[0];
  if (['navigation', 'socials', 'settings', 'newsletter'].includes(selected.collection))
    return destinations.find((entry) => entry.collection === 'home') ?? destinations[0];
  return destinations.find((entry) => entryKey(entry) === activeEntry) ?? destinations[0];
}

export function PublicationSteps({ step }: { step: number }) {
  return (
    <ol className="publication-steps" aria-label="Publication progress">
      {['Select', 'Review', 'Publish'].map((label, index) => (
        <li key={label} aria-current={index + 1 === step ? 'step' : undefined}>
          <span>{index + 1 < step ? <CheckCircle2 aria-label="Complete" /> : index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

export default function PublicationReviewFlow({
  base,
  records: initialRecords,
  individual = false,
  onBack,
  onPublished,
  onReviewed,
}: {
  base: string;
  records: PublicationReviewInput['records'];
  individual?: boolean;
  onBack(): void;
  onPublished?(records: PublicationReviewInput['records']): void;
  onReviewed?(review: PublicationReview): void;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [review, setReview] = useState<PublicationReview | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof restorePublication>>(null);
  const [operation, setOperation] = useState<ContentPublication | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [stale, setStale] = useState(false);
  const [previewState, setPreviewState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [previewStateKey, setPreviewStateKey] = useState('');
  const [activeEntry, setActiveEntry] = useState('');
  const [tab, setTab] = useState('changes');
  const [wide, setWide] = useState(false);
  const lock = useRef(false);
  const sequence = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = useRef('');
  const tabId = useId();
  const onPublishedRef = useRef(onPublished);
  onPublishedRef.current = onPublished;

  async function loadReview(selected = records) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setStale(false);
    const request = ++sequence.current;
    try {
      const next = await readPublicationReview(base, {
        records: selected.map(({ collection, recordId }) => ({ collection, recordId })),
      });
      if (request !== sequence.current) return;
      setReview(next);
      onReviewed?.(next);
      setRecords(next.entries);
      const active = next.entries.some((entry) => entryKey(entry) === activeEntry)
        ? activeEntry
        : entryKey(next.entries[0]);
      setActiveEntry(active);
      setPreviewState('loading');
      setPreviewStateKey('');
      heading.current?.focus();
    } catch (error) {
      if (request === sequence.current) {
        setStale(true);
        setError(error instanceof Error ? error.message : 'Review unavailable.');
      }
    } finally {
      lock.current = false;
      if (request === sequence.current) setBusy(false);
    }
  }
  function settle(result: ContentPublication, request = pending) {
    setOperation(result);
    setError('');
    if (result.status === 'live' && completed.current !== result.id) {
      completed.current = result.id;
      localStorage.removeItem(pendingPublicationKey(base));
      onPublishedRef.current?.(request?.records ?? []);
    }
  }
  async function status() {
    if (!pending) return;
    try {
      const result = await readPublicationStatus(base, pending.id);
      if (result) settle(result);
      setError(result ? '' : 'Request not found yet. Retry sends the same publication, not a second update.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Update not confirmed.');
    }
  }
  const polling = usePublicationPolling(
    pending && operation?.status !== 'live' && operation?.status !== 'failed' ? pending.id : '',
    status,
  );
  useEffect(() => {
    const media = matchMedia('(min-width: 1280px)');
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    try {
      const retained = restorePublication(base);
      if (retained) setPending(retained);
      else void loadReview();
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Saved publication unavailable. Check history.');
    }
    return () => {
      sequence.current++;
      media.removeEventListener('change', update);
    };
  }, [base]);
  useEffect(() => {
    if (pending) void status();
  }, [pending?.id]);
  useEffect(() => {
    const markStale = () => {
      if (!pending && document.visibilityState === 'visible') setStale(true);
    };
    document.addEventListener('visibilitychange', markStale);
    window.addEventListener('online', markStale);
    return () => {
      document.removeEventListener('visibilitychange', markStale);
      window.removeEventListener('online', markStale);
    };
  }, [pending]);

  const reviewHasChanges = Boolean(review?.entries.some((entry) => changedPublicationFields(entry).length > 0));
  const blocked =
    !review ||
    !reviewHasChanges ||
    stale ||
    review.dependencies.length > 0 ||
    review.entries.some((e) => e.issues.length);
  const reviewedSelection = review
    ? {
        baseline: review.baseline,
        records: review.entries.map(({ collection, recordId, expectedRevision }) => ({
          collection,
          recordId,
          expectedRevision,
        })),
      }
    : undefined;

  async function publish() {
    if (lock.current || recoveryError || (!pending && blocked)) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const retained = !pending ? restorePublication(base) : null;
      if (retained) {
        setPending(retained);
        throw new Error('Another publication is retained. Check its status before starting this update.');
      }
      const input = pending ?? {
        id: crypto.randomUUID(),
        ...reviewedSelection!,
      };
      localStorage.setItem(pendingPublicationKey(base), JSON.stringify(input));
      setPending(input);
      settle(await publishSavedContent(base, input), input);
    } catch (error) {
      if (error instanceof EditorialApiError && [400, 409].includes(error.status)) {
        localStorage.removeItem(pendingPublicationKey(base));
        setPending(null);
        setStale(true);
      }
      setError(error instanceof Error ? error.message : 'Update not confirmed. Check status.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const preview = review ? publicationPreviewDestination(review, activeEntry) : undefined;
  const previewKey = preview ? entryKey(preview) : '';
  const previewReady = previewState === 'ready' && previewStateKey === previewKey;
  const previewFailed = previewState === 'failed' && previewStateKey === previewKey;
  return (
    <section className="publication-flow" aria-label="Publication review">
      <header className="publication-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {pending
              ? operation?.status === 'live'
                ? 'Your changes are on the website'
                : 'Website update'
              : 'Review your changes'}
          </h1>
          <p className="text-muted-foreground">
            {pending
              ? 'Publication status is confirmed against the public website.'
              : 'Check what will change. Other drafts stay private.'}
          </p>
        </div>
      </header>
      <PublicationSteps step={pending ? 3 : 2} />
      {(error || recoveryError) && (
        <div role="alert" className="publication-issues">
          <CircleAlert aria-hidden="true" />
          <p>{recoveryError || error}</p>
        </div>
      )}
      {stale && !pending && (
        <div className="publication-issues">
          <p>Review needs to be refreshed before publishing.</p>
          <Button variant="outline" disabled={busy} onClick={() => void loadReview()}>
            Review latest changes
          </Button>
        </div>
      )}
      {busy && !review && !pending && (
        <div role="status" className="publication-loading">
          <span>Loading saved changes…</span>
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {review && !reviewHasChanges && !busy && !pending && (
        <div role="status" className="publication-issues">
          <p>No publishable differences remain. Return to selection.</p>
        </div>
      )}
      {pending ? (
        <div className="publication-result" role="status">
          {operation?.status === 'live' && <CheckCircle2 className="size-8 cms-state-success" aria-hidden="true" />}
          <h3>
            {polling.paused
              ? 'Update not confirmed'
              : operation
                ? publicationStage(operation)
                : 'Checking publication status'}
          </h3>
          {operation?.failureReason && <p>{operation.failureReason}</p>}
          {operation?.status === 'live' ? (
            <>
              <p>The selected saved versions are published. Any newer drafts remain private.</p>
              {review && (
                <a href={review.publicUrl} target="_blank" rel="noreferrer">
                  View website
                </a>
              )}
              <Button variant="outline" onClick={onBack}>
                {individual ? 'Back to editing' : 'Back to changes'}
              </Button>
            </>
          ) : operation?.status === 'failed' ? (
            <Button
              disabled={busy}
              onClick={() => {
                localStorage.removeItem(pendingPublicationKey(base));
                const saved = pending.records;
                setPending(null);
                setOperation(null);
                setRecords(saved);
                void loadReview(saved);
              }}
            >
              Review changes again
            </Button>
          ) : (
            <>
              <p>
                You can leave this page. This request is retained so an interrupted connection will not create a second
                update.
              </p>
              <Button variant="outline" disabled={busy || polling.checking} onClick={() => void polling.check()}>
                Check status
              </Button>
              {!operation && (
                <Button disabled={busy} onClick={() => void publish()}>
                  Retry same publication
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        review && (
          <>
            {review.dependencies.length > 0 && (
              <section className="publication-issues" aria-label="Required drafts">
                <h3>Include required drafts</h3>
                {review.dependencies.map((dependency, index) => (
                  <div key={`${dependency.recordId}/${index}`}>
                    <p>
                      {dependency.requiredBy} needs {dependency.title} on the website.
                    </p>
                    <Button
                      variant="outline"
                      disabled={busy || !dependency.available || records.length >= 20}
                      onClick={() =>
                        void loadReview([
                          ...records,
                          { collection: dependency.collection, recordId: dependency.recordId },
                        ])
                      }
                    >
                      Include {dependency.title}
                    </Button>
                    {!dependency.available && <p>This reference is unavailable. Edit the selected entry to fix it.</p>}
                    {records.length >= 20 && (
                      <p>Remove an entry from selection to make room for this required draft.</p>
                    )}
                  </div>
                ))}
              </section>
            )}
            <Tabs.Root value={tab} onValueChange={setTab} className="publication-mobile-tabs">
              <Tabs.List aria-label="Review view">
                <Tabs.Trigger id={`${tabId}-changes-tab`} aria-controls={`${tabId}-changes`} value="changes">
                  Changes
                </Tabs.Trigger>
                <Tabs.Trigger id={`${tabId}-preview-tab`} aria-controls={`${tabId}-preview`} value="preview">
                  Preview
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <div className="publication-review-grid">
              <div
                id={`${tabId}-changes`}
                role={!wide ? 'tabpanel' : undefined}
                aria-labelledby={!wide ? `${tabId}-changes-tab` : undefined}
                hidden={!wide && tab !== 'changes'}
                className="publication-changes"
              >
                <h3>
                  {review.entries.length} {review.entries.length === 1 ? 'change' : 'changes'} to review
                </h3>
                <PublicationComparison review={review} activeEntry={activeEntry} onActiveEntryChange={setActiveEntry} />
              </div>
              <div
                id={`${tabId}-preview`}
                role={!wide ? 'tabpanel' : undefined}
                aria-labelledby={!wide ? `${tabId}-preview-tab` : undefined}
                hidden={!wide && tab !== 'preview'}
                className="publication-preview-pane"
              >
                {preview && (
                  <div className="publication-preview-destination">
                    <span>Preview</span>
                    <strong>{preview.title}</strong>
                  </div>
                )}
                {preview && (
                  <ContentPreview
                    key={previewKey}
                    base={base}
                    collection={preview.collection as ContentSection}
                    id={preview.recordId}
                    slug={preview.slug}
                    data={{}}
                    publication={reviewedSelection!}
                    active={wide || tab === 'preview'}
                    dirty={false}
                    valid={!blocked}
                    onReadiness={(state) => {
                      setPreviewState(state);
                      setPreviewStateKey(previewKey);
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )
      )}
      {!pending && (
        <footer className="publication-action-bar">
          <div>
            <strong>
              {review
                ? reviewHasChanges
                  ? `${review.entries.length} ${review.entries.length === 1 ? 'change' : 'changes'} selected`
                  : 'No changes to publish'
                : 'Review changes'}
            </strong>
            <p className="text-sm text-muted-foreground">
              {review && !reviewHasChanges
                ? 'Select a saved change before publishing.'
                : review
                  ? `${review.environment.toUpperCase()} website`
                  : 'Saved drafts stay private'}{' '}
              · Price and stock stay unchanged.
            </p>
          </div>
          <div className="publication-actions">
            <Button variant="outline" disabled={busy} onClick={onBack}>
              <ArrowLeft aria-hidden="true" />
              {individual ? 'Back to editing' : 'Back to selection'}
            </Button>
            <Button
              disabled={
                busy ||
                Boolean(blocked) ||
                Boolean(recoveryError) ||
                (!previewReady && !previewFailed && (wide || tab === 'preview'))
              }
              onClick={() => void publish()}
            >
              {busy
                ? 'Checking…'
                : !previewReady
                  ? 'Publish without preview'
                  : review?.entries.length === 1
                    ? 'Publish change'
                    : `Publish ${review?.entries.length ?? 0} changes`}
            </Button>
          </div>
        </footer>
      )}
    </section>
  );
}
