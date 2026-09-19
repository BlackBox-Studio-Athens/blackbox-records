import { EditorialApiError } from './editorial-api';
import { extractSafeProblemDetail } from './problem-details';
import type { PublicationRecord, PublicationReview, PublicationReviewInput } from '@blackbox/content-model';

export type ContentPublication = {
  id: string;
  status: 'pending' | 'live' | 'failed';
  requestedAt: number;
  failureReason?: string;
  stage?: string;
  actorEmail?: string;
  environment?: string;
  entries?: { collection: string; recordId: string; title: string }[];
};

export type SelectedPublicationRecord = PublicationRecord;
export type SelectedPublicationRequest =
  | { id: string; records: SelectedPublicationRecord[]; baseline?: string }
  | ({ id: string } & SelectedPublicationRecord);

function publicationRequest(base: string, path: string, body?: object, signal?: AbortSignal) {
  return fetch(`${base}/_emdash/api/blackbox/${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: signal ?? null,
    headers: { 'X-EmDash-Request': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
}

export async function readPublicationReview(
  base: string,
  input: PublicationReviewInput,
  signal?: AbortSignal,
): Promise<PublicationReview> {
  const response = await publicationRequest(base, 'publication-review', input, signal);
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new EditorialApiError(response.status, result?.error ?? 'Review could not load. Retry.');
  }
  return response.json();
}
export async function readPublicationStatus(base: string, id: string): Promise<ContentPublication | null> {
  const response = await publicationRequest(base, `publications/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Update not confirmed. Check status before trying again.');
  return response.json();
}
export async function readPublicationHistory(
  base: string,
  params: URLSearchParams,
): Promise<{ items: ContentPublication[]; nextCursor?: string }> {
  const response = await publicationRequest(base, `publications/history?${params}`);
  if (!response.ok) throw new Error('Publication history could not load. Retry.');
  return response.json();
}
export function publicationStage(item: ContentPublication) {
  if (item.status === 'live') return 'On the website';
  if (item.status === 'failed') return 'Publication failed';
  return (
    {
      queued: 'Preparing',
      preparing: 'Preparing',
      verifying: 'Checking website',
      confirming: 'Confirming publication',
      retrying: 'Retrying publication',
    }[item.stage ?? ''] ?? 'Publishing'
  );
}
export async function publishSavedContent(
  base: string,
  input: SelectedPublicationRequest,
): Promise<ContentPublication> {
  const response = await publicationRequest(base, 'content-publications', input);
  if (!response.ok) {
    const detail = extractSafeProblemDetail(await response.json().catch(() => null), '');
    throw new EditorialApiError(
      response.status,
      detail ||
        (response.status === 409
          ? 'Load the saved version before publishing again.'
          : 'Publication could not be confirmed. Check status or retry.'),
    );
  }
  return response.json() as Promise<ContentPublication>;
}

export async function readContentPublications(base: string): Promise<{ items: ContentPublication[] }> {
  const response = await publicationRequest(base, 'publications');
  if (!response.ok) {
    const detail = extractSafeProblemDetail(await response.json().catch(() => null), '');
    throw new EditorialApiError(
      response.status,
      detail ||
        (response.status === 409
          ? 'This publication conflicts with a newer change. Load the saved version before publishing again.'
          : 'Publication could not be confirmed. Check status or retry the request. The public site may still be unchanged.'),
    );
  }
  return response.json() as Promise<{ items: ContentPublication[] }>;
}
