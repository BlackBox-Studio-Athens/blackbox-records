import { useEffect, useRef, useState } from 'react';
import { usePublicationPolling } from '../content/PublicationStatus';
import { useStaffRead } from '../../lib/staff-query';
import { Button } from '../ui/button';
import {
  createInternalStockApi,
  InternalStockApiError,
  type CatalogItemPublishCommand,
  type CatalogItemPublishDetail,
} from '../../lib/backend/internal-stock-api';

export default function ItemPublication({
  variantId,
  backendBaseUrl,
  intent,
}: {
  variantId: string;
  backendBaseUrl: string;
  intent?: 'publish';
}) {
  const api = createInternalStockApi({ backendBaseUrl });
  const [readAttempt, setReadAttempt] = useState(0);
  const [readFailed, setReadFailed] = useState(false);
  const [detail, setDetail] = useState<CatalogItemPublishDetail | null>(null);
  const [pending, setPending] = useState<CatalogItemPublishCommand | null>(null);
  const [message, setMessage] = useState('Loading shop publication…');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [autoPublishPending, setAutoPublishPending] = useState(intent === 'publish');
  const autoPublishStarted = useRef(intent !== 'publish');
  const storageKey = `blackbox-item-publication:${backendBaseUrl}:${variantId}`;
  useEffect(() => {
    let active = true;
    void api
      .readPublication(variantId)
      .then((current) => {
        if (!active) return;
        setReadFailed(false);
        setDetail(current);
        setFailed(current.publicationStatus === 'failed');
        setNeedsReview(current.operationStatus === 'needs_review');
        const saved = localStorage.getItem(storageKey);
        const retained = current.pending ?? (saved ? (JSON.parse(saved) as CatalogItemPublishCommand) : null);
        setPending(retained);
        setMessage('');
        if (!autoPublishStarted.current) {
          autoPublishStarted.current = true;
          setAutoPublishPending(false);
          if (!retained && current.operationStatus !== 'needs_review' && current.publicationStatus !== 'failed')
            void publish(current, true, null);
        }
      })
      .catch(() => {
        if (!active) return;
        autoPublishStarted.current = true;
        setAutoPublishPending(false);
        setReadFailed(true);
        setMessage('Shop publication could not be checked. Retry before assuming a change is live.');
      });
    return () => {
      active = false;
    };
  }, [variantId, backendBaseUrl, readAttempt]);

  async function checkStatus() {
    if (busy) return;
    try {
      const current = await api.readPublication(variantId);
      if (detail?.cmsRevision !== current.cmsRevision) setConfirmed(false);
      setDetail(current);
      setReadFailed(false);
      setFailed(current.publicationStatus === 'failed');
      setNeedsReview(current.operationStatus === 'needs_review');
      if (current.pending) {
        setPending(current.pending);
        setMessage(
          current.operationStatus === 'needs_review'
            ? 'Publication needs an administrator review. Your operation has been retained.'
            : current.publicationStatus === 'failed'
              ? 'The website update failed. Retry publication to use the approved content.'
              : 'Updating website…',
        );
      } else if (pending && current.availability === 'published') {
        localStorage.removeItem(storageKey);
        setPending(null);
        setConfirmed(false);
        setMessage('');
      }
    } catch {
      setReadFailed(true);
      setMessage('Shop update not confirmed. Check status to try again.');
    }
  }
  const polling = usePublicationPolling(!failed && !needsReview ? (pending?.operationId ?? '') : '', checkStatus);
  useStaffRead(['item-publication', backendBaseUrl, variantId], checkStatus, { enabled: !busy && !pending });

  async function publish(current = detail, explicitIntent = false, retained = pending) {
    if (busy || needsReview || !current) return;
    setBusy(true);
    try {
      const command = retained ?? {
        operationId: crypto.randomUUID(),
        expectedRevision: current.expectedRevision,
        cmsRevision: current.cmsRevision,
        confirmLivePublication: explicitIntent || confirmed,
        retryPublication: false,
      };
      localStorage.setItem(storageKey, JSON.stringify(command));
      setPending(command);
      const result = await api.publishItem(variantId, { ...command, retryPublication: failed });
      setFailed(result.publicationStatus === 'failed');
      if (result.status === 'completed') {
        localStorage.removeItem(storageKey);
        setPending(null);
        setConfirmed(false);
        setDetail(await api.readPublication(variantId));
        setMessage('');
      } else if (result.status === 'needs_review') {
        setNeedsReview(true);
        setMessage('Publication needs an administrator review. Your operation has been retained.');
      } else
        setMessage(
          result.publicationStatus === 'failed'
            ? 'The website update failed. Retry publication to try again with the approved content.'
            : 'Publication is in progress. You can close this page and check again later.',
        );
    } catch (error) {
      if (error instanceof InternalStockApiError && error.status === 409) {
        localStorage.removeItem(storageKey);
        setPending(null);
        setDetail(await api.readPublication(variantId));
        setMessage('The item or saved content changed. Review it before publishing again.');
      } else setMessage('Publication was not confirmed. Check again to resume the same operation.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="item-publication-heading" className="grid gap-2 border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id="item-publication-heading" className="text-lg font-semibold">
          Shop publication
        </h2>
        {detail && (
          <p className="text-sm" role="status">
            Shop status:{' '}
            {detail.availability === 'published'
              ? 'Published'
              : detail.availability === 'retired'
                ? 'Retired'
                : 'Not published'}
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Publish saved title, description and artwork. Price and stock are separate.
      </p>
      {detail?.requiresLiveConfirmation && !pending && !autoPublishPending && !busy && (
        <label className="flex items-center gap-3 min-h-11">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          Confirm publication in the live shop
        </label>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {detail && (
          <a
            className="underline min-h-11 inline-flex items-center"
            href={`/content/?collection=${detail.collection}&id=${encodeURIComponent(detail.cmsSourceId)}`}
          >
            Review {detail.title}
          </a>
        )}
        {polling.paused && (
          <Button variant="outline" disabled={polling.checking} onClick={() => void polling.check()}>
            Check status
          </Button>
        )}
        {readFailed && (
          <Button variant="outline" onClick={() => setReadAttempt((attempt) => attempt + 1)}>
            Retry publication details
          </Button>
        )}
        <Button
          className="min-h-11"
          disabled={
            busy ||
            needsReview ||
            !detail ||
            (!pending && !autoPublishPending && detail.requiresLiveConfirmation && !confirmed)
          }
          onClick={() => void publish()}
        >
          {busy ? 'Publishing…' : failed ? 'Retry publication' : pending ? 'Check publication' : 'Publish item to shop'}
        </Button>
      </div>
      {(polling.paused || message) && <p role="status">{polling.paused ? 'Update not confirmed' : message}</p>}
    </section>
  );
}
