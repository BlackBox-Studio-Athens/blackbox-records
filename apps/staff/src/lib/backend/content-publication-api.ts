import { EditorialApiError } from './editorial-api';

export type ContentPublication = {
  id: string;
  status: 'pending' | 'live' | 'failed';
  requestedAt: number;
  failureReason?: string;
  stage?: string;
};
export type PublicationRequest = { id: string; requestedRevision: string };

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

async function request<T>(base: string, body?: PublicationRequest): Promise<T> {
  const response = await fetch(`${base}/_emdash/api/blackbox/publications`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'X-EmDash-Request': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  if (!response.ok)
    throw new EditorialApiError(
      response.status,
      response.status === 409
        ? 'This publication conflicts with a newer change. Load the saved version before publishing again.'
        : 'Publication could not be confirmed. Check status or retry the request. The public site may still be unchanged.',
    );
  return response.json() as Promise<T>;
}

export const readContentPublications = (base: string) => request<{ items: ContentPublication[] }>(base);
export const requestContentPublication = (base: string, body: PublicationRequest) =>
  request<ContentPublication>(base, body);
