import { ClipboardCheck } from 'lucide-react';
import { useSharedStaffRead } from '../lib/staff-query';
import { readReviewChangesPresence, reviewChangesKey } from '../lib/review-changes';
import { Button } from './ui/button';

export default function ReviewChangesControl({
  base,
  className,
  current,
}: {
  base: string;
  className: string;
  current?: boolean;
}) {
  const state = useSharedStaffRead(reviewChangesKey(base), () => readReviewChangesPresence(base));
  if (state.fetching || state.status === 'pending')
    return (
      <Button disabled className={className}>
        <ClipboardCheck aria-hidden="true" />
        Checking changes…
      </Button>
    );
  if (state.status === 'success' && !state.data)
    return (
      <Button disabled className={className}>
        <ClipboardCheck aria-hidden="true" />
        No changes to review
      </Button>
    );
  return (
    <>
      <Button asChild className={className}>
        <a href="/review/" aria-current={current ? 'page' : undefined}>
          <ClipboardCheck aria-hidden="true" />
          Review changes
        </a>
      </Button>
      {state.status === 'error' && (
        <div role="alert" className="text-sm">
          <p>Change status could not be checked.</p>
          <Button variant="outline" onClick={() => void state.retry().catch(() => {})}>
            Retry check
          </Button>
        </div>
      )}
    </>
  );
}
