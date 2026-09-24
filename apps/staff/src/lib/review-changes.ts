import { editorialRequest, type EditorialList, type EditorialRecord } from './backend/editorial-api';
import { refreshStaffQuery } from './staff-query';

export const reviewChangesKey = (base: string) => ['review-changes-presence', base] as const;

export async function readReviewChangesPresence(base: string): Promise<boolean> {
  let cursor: string | undefined;
  do {
    const params = new URLSearchParams({ view: 'changes', scope: 'all', limit: '25' });
    if (cursor) params.set('cursor', cursor);
    const page = await editorialRequest<EditorialList<EditorialRecord>>(base, `blackbox/workspace?${params}`);
    if (page.items.length) return true;
    cursor = page.nextCursor;
  } while (cursor);
  return false;
}

export function refreshReviewChangesPresence(base: string) {
  return refreshStaffQuery(reviewChangesKey(base), () => readReviewChangesPresence(base));
}
