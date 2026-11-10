import { useEffect, useState } from 'react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../../lib/backend/editorial-api';

/**
 * The first 50 records of a collection, for summaries and "used before" suggestions.
 * shortcut: one page only; page through when a collection grows past 50 records.
 * Pass null to skip loading.
 */
export function useCollectionRecords(base: string, collection: string | null): EditorialRecord[] {
  const [records, setRecords] = useState<EditorialRecord[]>([]);
  useEffect(() => {
    if (!collection) return;
    let current = true;
    void editorialRequest<EditorialList<EditorialRecord>>(
      base,
      `blackbox/workspace?collection=${collection}&limit=50`,
    ).then(
      (page) => current && setRecords(page.items),
      // Suggestions and names are a convenience; the editor works without them.
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [base, collection]);
  return records;
}
