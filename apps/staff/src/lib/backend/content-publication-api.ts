import { EditorialApiError } from './editorial-api';

export type ContentPublication = {
  id: string;
  status: 'pending' | 'live' | 'failed';
  requestedAt: number;
  failureReason?: string;
};
export type PublicationRequest = { id: string; requestedRevision: string };

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
