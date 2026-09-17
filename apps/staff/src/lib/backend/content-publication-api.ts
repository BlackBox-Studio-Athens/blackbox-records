import { EditorialApiError } from './editorial-api';

export type ContentPublication = {
  id: string;
  status: 'pending' | 'live' | 'failed';
  requestedAt: number;
  failureReason?: string;
  stage?: string;
};

export type SelectedPublicationRecord = { collection: string; recordId: string; expectedRevision: string };
export type SelectedPublicationRequest =
  { id: string; records: SelectedPublicationRecord[] } | ({ id: string } & SelectedPublicationRecord);
export async function publishSavedContent(
  base: string,
  input: SelectedPublicationRequest,
): Promise<ContentPublication> {
  const response = await fetch(`${base}/_emdash/api/blackbox/content-publications`, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'X-EmDash-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok)
    throw new EditorialApiError(
      response.status,
      response.status === 409
        ? 'Load the saved version before publishing again.'
        : 'Publication could not be confirmed. Check status or retry.',
    );
  return response.json() as Promise<ContentPublication>;
}

export async function readContentPublications(base: string): Promise<{ items: ContentPublication[] }> {
  const response = await fetch(`${base}/_emdash/api/blackbox/publications`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'X-EmDash-Request': '1' },
  });
  if (!response.ok)
    throw new EditorialApiError(
      response.status,
      response.status === 409
        ? 'This publication conflicts with a newer change. Load the saved version before publishing again.'
        : 'Publication could not be confirmed. Check status or retry the request. The public site may still be unchanged.',
    );
  return response.json() as Promise<{ items: ContentPublication[] }>;
}
