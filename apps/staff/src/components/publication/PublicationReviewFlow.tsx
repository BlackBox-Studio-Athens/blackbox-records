import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
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
import { createInternalStockApi } from '../../lib/backend/internal-stock-api';
import {
  applyPriceDraft,
  describePrice,
  planItemPublication,
  shopIntent,
  readItemPublication,
  startItemPublication,
  type ItemCommerceState,
} from '../../lib/item-commerce';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty';
import { Checkbox } from '../ui/checkbox';
import { ItemChangeRows, ItemPublishProgress, type ItemStepState, type StepStatus } from './ItemChanges';
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

export function directPublicationSelection(review: PublicationReview) {
  if (
    review.dependencies.length ||
    !review.entries.some((entry) => changedPublicationFields(entry).length) ||
    review.entries.some((entry) => entry.issues.length || !entry.expectedRevision)
  )
    return null;
  return {
    baseline: review.baseline,
    records: review.entries.map(({ collection, recordId, expectedRevision }) => ({
      collection,
      recordId,
      expectedRevision,
    })),
  };
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
  intent = 'review',
  individual = false,
  commerce,
  onBack,
  onPublished,
  onReviewed,
}: {
  base: string;
  records: PublicationReviewInput['records'];
  intent?: 'review' | 'publish';
  individual?: boolean;
  /** Selling state of a catalog item; its price draft and shop checkout publish in the same run. */
  commerce?: ItemCommerceState;
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
  const staleRef = useRef(false);
  const [previewState, setPreviewState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [previewStateKey, setPreviewStateKey] = useState('');
  const [activeEntry, setActiveEntry] = useState('');
  const [tab, setTab] = useState('changes');
  const [wide, setWide] = useState(false);
  const [directPreparing, setDirectPreparing] = useState(intent === 'publish');
  const lock = useRef(false);
  const sequence = useRef(0);
  const directIntent = useRef(intent === 'publish');
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = useRef('');
  const tabId = useId();
  const onPublishedRef = useRef(onPublished);
  onPublishedRef.current = onPublished;
  const [putOnSale, setPutOnSale] = useState(false);
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [steps, setSteps] = useState<ItemStepState[] | null>(null);
  const stepsRef = useRef<ItemStepState[] | null>(null);
  const [itemPollingKey, setItemPollingKey] = useState('');
  const itemCompleted = useRef(false);
  const confirmId = useId();

  async function loadReview(selected = records, direct = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    staleRef.current = false;
    setStale(false);
    const request = ++sequence.current;
    let publishing = false;
    try {
      const next = await readPublicationReview(base, {
        records: direct ? selected : selected.map(({ collection, recordId }) => ({ collection, recordId })),
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
      if (direct) {
        setDirectPreparing(false);
        const selection =
          selected.every((record) => record.expectedRevision) && !staleRef.current
            ? directPublicationSelection(next)
            : null;
        if (selection) {
          publishing = true;
          void publish(selection, true);
        }
      }
    } catch (error) {
      if (direct) setDirectPreparing(false);
      if (request === sequence.current) {
        staleRef.current = true;
        setStale(true);
        setError(error instanceof Error ? error.message : 'Review unavailable.');
      }
    } finally {
      if (!publishing) {
        lock.current = false;
        if (request === sequence.current) setBusy(false);
      }
    }
  }
  function settle(result: ContentPublication, request = pending) {
    setOperation(result);
    setError('');
    if (result.status === 'live' && completed.current !== result.id) {
      completed.current = result.id;
      localStorage.removeItem(pendingPublicationKey(base));
      window.dispatchEvent(new Event('staff:editorial-change'));
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
      if (retained) {
        directIntent.current = false;
        setDirectPreparing(false);
        setPending(retained);
      } else {
        const direct = directIntent.current;
        directIntent.current = false;
        void loadReview(initialRecords, direct);
      }
    } catch (error) {
      directIntent.current = false;
      setDirectPreparing(false);
      setRecoveryError(error instanceof Error ? error.message : 'Saved publication unavailable. Check history.');
    }
    return () => {
      media.removeEventListener('change', update);
    };
  }, [base]);
  useEffect(() => {
    if (pending) void status();
  }, [pending?.id]);
  useEffect(() => {
    const markStale = () => {
      if (!pending && document.visibilityState === 'visible') {
        staleRef.current = true;
        setStale(true);
      }
    };
    window.addEventListener('online', markStale);
    window.addEventListener('staff:editorial-change', markStale);
    return () => {
      window.removeEventListener('online', markStale);
      window.removeEventListener('staff:editorial-change', markStale);
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

  async function publish(selection = reviewedSelection, ownsLock = false): Promise<boolean> {
    if ((!ownsLock && lock.current) || recoveryError || (!pending && (ownsLock ? !selection : blocked))) return false;
    if (!ownsLock) {
      lock.current = true;
      setBusy(true);
    }
    setError('');
    try {
      const retained = !pending ? restorePublication(base) : null;
      if (retained) {
        setPending(retained);
        throw new Error('Another publication is retained. Check its status before starting this update.');
      }
      const input = pending ?? {
        id: crypto.randomUUID(),
        ...selection!,
      };
      localStorage.setItem(pendingPublicationKey(base), JSON.stringify(input));
      setPending(input);
      settle(await publishSavedContent(base, input), input);
      return true;
    } catch (error) {
      if (error instanceof EditorialApiError && [400, 409].includes(error.status)) {
        localStorage.removeItem(pendingPublicationKey(base));
        setPending(null);
        staleRef.current = true;
        setStale(true);
      }
      setError(error instanceof Error ? error.message : 'Update not confirmed. Check status.');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const plan = commerce
    ? planItemPublication({
        contentChanged: reviewHasChanges,
        priceDraft: !!commerce.priceDraft,
        shop: shopIntent(commerce.shop, putOnSale),
        dependencies: (review?.entries.length ?? 0) > 1,
      })
    : [];
  const commerceBlocked =
    !review ||
    stale ||
    review.dependencies.length > 0 ||
    review.entries.some((entry) => entry.issues.length) ||
    !plan.length ||
    (!!commerce?.requiresLiveConfirmation && !liveConfirmed);
  const changeCount =
    (commerce?.priceDraft ? 1 : 0) +
    (reviewHasChanges ? (review?.entries.length ?? 0) : 0) +
    (putOnSale && !reviewHasChanges ? 1 : 0);
  function updateStep(step: ItemStepState['step'], status: StepStatus) {
    const next = (stepsRef.current ?? []).map((state): ItemStepState =>
      state.step === step ? { step, ...status } : state,
    );
    stepsRef.current = next;
    setSteps(next);
  }

  // One Publish changes run: each step keeps its own retained identity, so Retry resumes only unfinished work.
  async function publishItem() {
    if (!commerce || lock.current) return;
    const previous = stepsRef.current;
    const start: ItemStepState[] = previous?.some((state) => state.status !== 'done')
      ? previous.map((state) => (state.status === 'done' ? state : { step: state.step, status: 'waiting' }))
      : plan.map((step) => ({ step, status: 'waiting' }));
    stepsRef.current = start;
    setSteps(start);
    setError('');
    itemCompleted.current = false;
    heading.current?.focus();
    const api = createInternalStockApi({ backendBaseUrl: base });
    let running: ItemStepState['step'] | null = null;
    try {
      for (const { step, status } of start) {
        if (status === 'done') continue;
        running = step;
        updateStep(step, { status: 'running' });
        if (step === 'price') {
          lock.current = true;
          setBusy(true);
          const result = await applyPriceDraft(base, api, commerce.variantId, commerce.priceDraft!);
          if (result !== 'completed') {
            updateStep(step, {
              status: result === 'needs_review' ? 'review' : 'failed',
              message:
                result === 'needs_review'
                  ? 'Ask a label administrator to review this price change.'
                  : 'Price change not confirmed yet. Retry sends the same change.',
            });
            return;
          }
          updateStep(step, {
            status: 'done',
            message: `${describePrice(commerce.priceDraft!.price)} is live in the shop.`,
          });
          window.dispatchEvent(new Event('staff:editorial-change'));
        } else if (step === 'content') {
          lock.current = false;
          if (!(await publish(reviewedSelection, true))) {
            updateStep(step, { status: 'failed', message: 'The website update was not accepted.' });
            return;
          }
          // The item step publishes the same record again; it waits until this publication is live.
          updateStep(step, { status: 'running', message: 'Updating the website…' });
          return;
        } else {
          lock.current = true;
          setBusy(true);
          const result = await startItemPublication(base, api, commerce.variantId);
          if (result === 'live')
            updateStep(step, { status: 'done', message: 'The website and shop checkout are live.' });
          else if (result === 'pending') {
            updateStep(step, { status: 'running', message: 'Updating the website and shop checkout…' });
            setItemPollingKey(commerce.variantId);
          } else {
            updateStep(step, {
              status: result === 'needs_review' ? 'review' : 'failed',
              message:
                result === 'needs_review'
                  ? 'Ask a label administrator to review this shop update.'
                  : 'The website update failed. Retry uses the same saved content.',
            });
            return;
          }
        }
      }
    } catch (error) {
      if (running)
        updateStep(running, {
          status: 'failed',
          message: error instanceof Error ? error.message : 'Update not confirmed. Retry sends the same change.',
        });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function checkItem() {
    if (!commerce) return;
    const result = await readItemPublication(
      base,
      createInternalStockApi({ backendBaseUrl: base }),
      commerce.variantId,
    );
    if (result === 'pending') return;
    setItemPollingKey('');
    updateStep('item', {
      status: result === 'live' ? 'done' : result === 'needs_review' ? 'review' : 'failed',
      message:
        result === 'live'
          ? 'The website and shop checkout are live.'
          : result === 'needs_review'
            ? 'Ask a label administrator to review this shop update.'
            : 'The website update failed. Retry uses the same saved content.',
    });
  }
  const itemPolling = usePublicationPolling(itemPollingKey, checkItem);
  useEffect(() => {
    if (!stepsRef.current?.some((state) => state.step === 'content' && state.status === 'running')) return;
    if (operation?.status === 'live') {
      updateStep('content', { status: 'done', message: 'The website shows the saved details.' });
      if (stepsRef.current?.some((state) => state.step === 'item' && state.status === 'waiting')) void publishItem();
    } else if (operation?.status === 'failed')
      updateStep('content', {
        status: 'failed',
        message: operation.failureReason ?? 'The website update failed. Review the changes again.',
      });
  }, [operation?.status]);
  const itemDone = !!steps?.length && steps.every((state) => state.status === 'done');
  useEffect(() => {
    if (!itemDone || itemCompleted.current) return;
    itemCompleted.current = true;
    window.dispatchEvent(new Event('staff:editorial-change'));
    window.dispatchEvent(new Event('staff:item-published'));
    onPublishedRef.current?.(records);
  }, [itemDone]);
  function reviewAgain(saved = pending?.records ?? records) {
    localStorage.removeItem(pendingPublicationKey(base));
    setPending(null);
    setOperation(null);
    stepsRef.current = null;
    setSteps(null);
    setRecords(saved);
    void loadReview(saved);
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
            {steps
              ? itemDone
                ? 'Your changes are live'
                : 'Publishing this item'
              : directPreparing
                ? 'Publishing this item'
                : pending
                  ? operation?.status === 'live'
                    ? 'Your changes are on the website'
                    : 'Website update'
                  : 'Review your changes'}
          </h1>
          <p className="text-muted-foreground">
            {steps
              ? 'You can leave this page. Each step is kept, so a retry never publishes anything twice.'
              : directPreparing
                ? 'Checking the saved version before publication.'
                : pending
                  ? 'Publication status is confirmed against the public website.'
                  : 'Check what will change. Other drafts stay private.'}
          </p>
        </div>
      </header>
      <PublicationSteps step={pending || steps ? 3 : 2} />
      {(error || recoveryError) && (
        <div role="alert" className="publication-issues">
          <CircleAlert aria-hidden="true" />
          <p>{recoveryError || error}</p>
        </div>
      )}
      {stale && !pending && !steps && (
        <div className="publication-issues">
          <p>Review needs to be refreshed before publishing.</p>
          <Button variant="outline" disabled={busy} onClick={() => void loadReview()}>
            <RefreshCw aria-hidden="true" />
            Review latest changes
          </Button>
        </div>
      )}
      {busy && !review && !pending && (
        <div role="status" className="publication-loading">
          {directPreparing ? (
            <span>Checking the saved version…</span>
          ) : (
            <>
              <span>Loading saved changes…</span>
              <Skeleton className="h-48 w-full" />
            </>
          )}
        </div>
      )}
      {review && !reviewHasChanges && !busy && !pending && !commerce && (
        <div role="status" className="publication-issues">
          <p>No publishable differences remain. Return to selection.</p>
        </div>
      )}
      {commerce && review && !plan.length && commerce.shop !== 'ready_to_sell' && !busy && !pending && !steps && (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle>Everything is live</EmptyTitle>
            <EmptyDescription>This item has no saved changes or price draft waiting to publish.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {steps ? (
        <div className="publication-result grid gap-4" role="status">
          <ItemPublishProgress steps={steps} busy={busy} onRetry={() => void publishItem()} />
          {steps.some((state) => state.step === 'content' && state.status === 'failed') && (
            <Button variant="outline" disabled={busy} onClick={() => reviewAgain()}>
              <RefreshCw aria-hidden="true" />
              Review changes again
            </Button>
          )}
          {itemPolling.paused && (
            <Button variant="outline" disabled={itemPolling.checking} onClick={() => void itemPolling.check()}>
              <RefreshCw aria-hidden="true" />
              Check status
            </Button>
          )}
          {itemDone && review && (
            <a href={review.publicUrl} target="_blank" rel="noreferrer">
              View website
              <ArrowRight className="-rotate-45" aria-hidden="true" />
            </a>
          )}
          <Button variant="outline" disabled={busy} onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            Back to editing
          </Button>
        </div>
      ) : pending ? (
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
                  <ArrowRight className="-rotate-45" aria-hidden="true" />
                </a>
              )}
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft aria-hidden="true" />
                {individual ? 'Back to editing' : 'Back to changes'}
              </Button>
            </>
          ) : operation?.status === 'failed' ? (
            <Button disabled={busy} onClick={() => reviewAgain(pending.records)}>
              <RefreshCw aria-hidden="true" />
              Review changes again
            </Button>
          ) : (
            <>
              <p>
                You can leave this page. This request is retained so an interrupted connection will not create a second
                update.
              </p>
              <Button variant="outline" disabled={busy || polling.checking} onClick={() => void polling.check()}>
                <RefreshCw aria-hidden="true" />
                Check status
              </Button>
              {!operation && (
                <Button disabled={busy} onClick={() => void publish()}>
                  <RefreshCw aria-hidden="true" />
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
            {commerce && (plan.length > 0 || commerce.shop === 'ready_to_sell') && (
              <ItemChangeRows
                commerce={commerce}
                contentChanged={reviewHasChanges}
                putOnSale={putOnSale}
                onPutOnSale={setPutOnSale}
                disabled={busy}
              />
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
      {!pending && !steps && (
        <footer className="publication-action-bar">
          <div>
            <strong>
              {review
                ? commerce
                  ? changeCount
                    ? `${changeCount} ${changeCount === 1 ? 'change' : 'changes'}`
                    : 'No changes to publish'
                  : reviewHasChanges
                    ? `${review.entries.length} ${review.entries.length === 1 ? 'change' : 'changes'} selected`
                    : 'No changes to publish'
                : 'Review changes'}
            </strong>
            <p className="text-sm text-muted-foreground">
              {commerce
                ? `${review ? `${review.environment.toUpperCase()} website and shop` : 'Saved drafts stay private'} · Stock is not part of publishing.`
                : `${
                    review && !reviewHasChanges
                      ? 'Select a saved change before publishing.'
                      : review
                        ? `${review.environment.toUpperCase()} website`
                        : 'Saved drafts stay private'
                  } · Price and stock stay unchanged.`}
            </p>
            {commerce?.requiresLiveConfirmation && (plan.length > 0 || commerce.shop === 'ready_to_sell') && (
              <div className="mt-2 flex items-center gap-3 text-sm">
                <Checkbox
                  id={confirmId}
                  className="size-5"
                  checked={liveConfirmed}
                  disabled={busy}
                  onCheckedChange={(checked) => setLiveConfirmed(checked === true)}
                />
                <label htmlFor={confirmId}>I checked these changes for the live shop</label>
              </div>
            )}
          </div>
          <div className="publication-actions">
            <Button variant="outline" disabled={busy} onClick={onBack}>
              <ArrowLeft aria-hidden="true" />
              {individual ? 'Back to editing' : 'Back to selection'}
            </Button>
            <Button
              disabled={
                busy ||
                (commerce ? commerceBlocked : Boolean(blocked)) ||
                Boolean(recoveryError) ||
                ((!commerce || reviewHasChanges) && !previewReady && !previewFailed && (wide || tab === 'preview'))
              }
              onClick={() => void (commerce ? publishItem() : publish())}
            >
              <CheckCircle2 aria-hidden="true" />
              {busy
                ? 'Checking…'
                : (!commerce || reviewHasChanges) && !previewReady
                  ? 'Publish without preview'
                  : commerce
                    ? `Publish ${changeCount === 1 ? 'change' : `${changeCount} changes`}`
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
