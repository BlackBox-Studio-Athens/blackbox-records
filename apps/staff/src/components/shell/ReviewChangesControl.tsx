import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { EditorialList } from '../../lib/backend/editorial-api';
import { getInternalStockApiBaseUrl } from '../../lib/backend/internal-stock-api';
import { Button } from '../ui/button';

export default function ReviewChangesControl() {
  const base = getInternalStockApiBaseUrl();
  const [status, setStatus] = useState<'checking' | 'empty' | 'ready' | 'unavailable'>('checking');
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const request = ++sequence;
      setStatus('checking');
      try {
        const { editorialRequest } = await import('../../lib/backend/editorial-api');
        let cursor: string | undefined;
        do {
          const params = new URLSearchParams({ view: 'changes', limit: '1' });
          if (cursor) params.set('cursor', cursor);
          const page = await editorialRequest<EditorialList<unknown>>(base, `blackbox/workspace?${params}`);
          if (!active || request !== sequence) return;
          if (page.items.length) return setStatus('ready');
          cursor = page.nextCursor;
        } while (cursor);
        if (active && request === sequence) setStatus('empty');
      } catch {
        if (active && request === sequence) setStatus('unavailable');
      }
    }
    void refresh();
    const changed = () => void refresh();
    window.addEventListener('staff:editorial-change', changed);
    return () => {
      active = false;
      window.removeEventListener('staff:editorial-change', changed);
    };
  }, [base]);

  if (status !== 'ready')
    return (
      <Button
        variant="outline"
        className="staff-review-link shadow-none"
        disabled
        aria-label={
          status === 'empty'
            ? 'No changes to review'
            : status === 'checking'
              ? 'Checking changes'
              : 'Review unavailable'
        }
      >
        <ClipboardCheck aria-hidden="true" />
        <span>Review changes</span>
      </Button>
    );
  return (
    <Button asChild className="staff-review-link">
      <a
        href="/review/"
        aria-label="Review changes"
        aria-current={window.location.pathname.startsWith('/review/') ? 'page' : undefined}
        onClick={(event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          if (!window.dispatchEvent(new Event('staff:review-changes', { cancelable: true }))) event.preventDefault();
        }}
      >
        <ClipboardCheck aria-hidden="true" />
        <span>Review changes</span>
      </a>
    </Button>
  );
}
