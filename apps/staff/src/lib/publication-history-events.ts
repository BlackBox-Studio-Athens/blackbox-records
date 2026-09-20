export type PublicationHistoryFilter = {
  collection?: string;
  recordId?: string;
};

export const publicationHistoryEvent = 'staff:open-publication-history';

export function requestPublicationHistory(filter: PublicationHistoryFilter = {}) {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent<PublicationHistoryFilter>(publicationHistoryEvent, { detail: filter }));
}
