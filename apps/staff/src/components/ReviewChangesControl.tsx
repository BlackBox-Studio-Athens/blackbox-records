import { ClipboardCheck } from 'lucide-react';
import { Button } from './ui/button';

export default function ReviewChangesControl({ className, current }: { className: string; current?: boolean }) {
  return (
    <Button asChild className={className}>
      <a
        href="/review/"
        aria-label="Review changes"
        aria-current={current ? 'page' : undefined}
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
