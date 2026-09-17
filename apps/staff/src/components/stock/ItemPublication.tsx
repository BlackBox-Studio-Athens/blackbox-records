import { useEffect, useState } from 'react';
import { usePublicationPolling } from '../content/PublicationStatus';
import { useStaffRead } from '../../lib/staff-query';
import { Button } from '../ui/button';
import {
  createInternalStockApi,
  InternalStockApiError,
  type CatalogItemPublishCommand,
  type CatalogItemPublishDetail,
} from '../../lib/backend/internal-stock-api';

export default function ItemPublication({ variantId, backendBaseUrl }: { variantId: string; backendBaseUrl: string }) {
  const api = createInternalStockApi({ backendBaseUrl });
  const [readAttempt, setReadAttempt] = useState(0);
  const [readFailed, setReadFailed] = useState(false);
  const [detail, setDetail] = useState<CatalogItemPublishDetail | null>(null);
  const [pending, setPending] = useState<CatalogItemPublishCommand | null>(null);
  const [message, setMessage] = useState('Loading publication…');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
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
        setPending(current.pending ?? (saved ? (JSON.parse(saved) as CatalogItemPublishCommand) : null));
        setMessage(
          current.availability === 'published'
            ? 'Item is published.'
            : 'Ready to publish after you review the content.',
        );
      })
      .catch(() => {
        if (active) {
          setReadFailed(true);
          setMessage('Publication could not be checked. Retry to keep working here.');
        }
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
        setMessage('On the website.');
      }
    } catch {
      setReadFailed(true);
      setMessage('Update not confirmed. Check status to try again.');
    }
  }
  const polling = usePublicationPolling(!failed && !needsReview ? (pending?.operationId ?? '') : '', checkStatus);
  useStaffRead(['item-publication', backendBaseUrl, variantId], checkStatus, { enabled: !busy && !pending });

  async function publish() {
    if (busy || needsReview || !detail) return;
    setBusy(true);
    try {
      const command = pending ?? {
        operationId: crypto.randomUUID(),
        expectedRevision: detail.expectedRevision,
        cmsRevision: detail.cmsRevision,
        confirmLivePublication: confirmed,
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
        setMessage('Item published. Price and stock are unchanged.');
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
    <section aria-labelledby="item-publication-heading" className="grid gap-4 border border-border bg-card p-5">
      <h2 id="item-publication-heading" className="font-display text-3xl uppercase">
        Publication
      </h2>
      <p className="text-sm text-muted-foreground">
        Publish the saved title, description and artwork. The current price and stock stay unchanged.
      </p>
      {detail && (
        <a
          className="underline min-h-11 inline-flex items-center"
          href={`/content/?collection=${detail.collection}&id=${encodeURIComponent(detail.cmsSourceId)}`}
        >
          Review {detail.title}
        </a>
      )}
      {detail?.requiresLiveConfirmation && !pending && (
        <label className="flex items-center gap-3 min-h-11">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          Publish this item to the live shop
        </label>
      )}
      <p role="status">{polling.paused ? 'Update not confirmed' : message}</p>
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
        disabled={busy || needsReview || !detail || (!pending && detail.requiresLiveConfirmation && !confirmed)}
        onClick={() => void publish()}
      >
        {busy ? 'Publishing…' : failed ? 'Retry publication' : pending ? 'Check publication' : 'Publish item'}
      </Button>
    </section>
  );
}
